import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  from?: string;
  isInviteEmail?: boolean; // Flag to allow invite emails to bypass restrictions
  attachment?: {
    filename: string;
    content?: string; // base64 encoded content (for small files)
    url?: string; // URL to remote file (preferred for large files)
    contentType: string;
  };
}

// Rate limits
const HOURLY_EMAIL_LIMIT = 20;
const DAILY_EMAIL_LIMIT = 100;
const MAX_URLS_IN_BODY = 5;
const MAX_DUPLICATE_CONTENT_PER_HOUR = 10;

/**
 * Escape HTML entities to prevent XSS in email content
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Extract URLs from text
 */
function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"']+/gi;
  return text.match(urlRegex) || [];
}

/**
 * Simple hash function for content deduplication
 */
async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseClient = createClient(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // ========== AUTHORIZATION ==========
    // Check user has at least 'member' role in their org
    const { data: hasRole, error: roleError } = await supabaseClient.rpc("has_min_org_role", {
      _user_id: user.id,
      _min_role: "member",
    });

    if (roleError || !hasRole) {
      console.error("Authorization failed:", roleError?.message || "User doesn't have required role");
      return new Response(
        JSON.stringify({ error: "You don't have permission to send emails" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // ========== INPUT VALIDATION ==========
    const { to, subject, body, from, isInviteEmail, attachment }: SendEmailRequest = await req.json();

    // Validate required fields
    if (!to || !subject || !body) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    if (!isValidEmail(to)) {
      console.error("Invalid email format:", to);
      return new Response(
        JSON.stringify({ error: "Invalid email address format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate content lengths
    if (subject.length > 255) {
      return new Response(
        JSON.stringify({ error: "Subject must be less than 255 characters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (body.length > 50000) {
      return new Response(
        JSON.stringify({ error: "Message body is too long (max 50,000 characters)" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // ========== URL LIMIT CHECK ==========
    // Prevent spam/phishing by limiting URLs in email body
    const urls = extractUrls(body);
    if (urls.length > MAX_URLS_IN_BODY) {
      console.warn("Too many URLs in email body:", urls.length, "from user:", user.id);
      return new Response(
        JSON.stringify({ error: `Too many links in message (max ${MAX_URLS_IN_BODY})` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the user's org_id
    const { data: userOrgId } = await supabaseAdmin.rpc("get_user_org_id", {
      _user_id: user.id,
    });

    // ========== RECIPIENT ALLOWLIST CHECK ==========
    // Only allow sending to contacts in the user's organization (unless it's an invite email)
    if (!isInviteEmail && userOrgId) {
      const { data: isKnownContact } = await supabaseAdmin
        .from("contacts")
        .select("id")
        .eq("email", to.toLowerCase())
        .eq("org_id", userOrgId)
        .maybeSingle();

      // Also check if recipient is a profile in the same org
      const { data: isOrgMember } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", to.toLowerCase())
        .eq("org_id", userOrgId)
        .maybeSingle();

      if (!isKnownContact && !isOrgMember) {
        console.warn("Blocked email to unknown recipient:", to, "from user:", user.id);
        return new Response(
          JSON.stringify({ 
            error: "You can only send emails to contacts or members in your organization" 
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // ========== CHECK IF RECIPIENT IS A PENDING INVITE ==========
    // Block emails to pending invitees unless it's an invite email
    if (!isInviteEmail && userOrgId) {
      // Check if recipient has a pending invite in the same org
      const { data: pendingInvite } = await supabaseAdmin
        .from("org_invites")
        .select("id")
        .eq("org_id", userOrgId)
        .eq("email", to.toLowerCase())
        .is("accepted_at", null)
        .maybeSingle();

      if (pendingInvite) {
        console.warn("Blocked email to pending invite:", to);
        return new Response(
          JSON.stringify({ 
            error: "Cannot send emails to this recipient until they have accepted their organization invite" 
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // ========== RATE LIMITING (HOURLY) ==========
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count: hourlyCount, error: hourlyCountError } = await supabaseClient
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .gte("created_at", oneHourAgo);

    if (hourlyCountError) {
      console.error("Hourly rate limit check error:", hourlyCountError.message);
    } else if (hourlyCount !== null && hourlyCount >= HOURLY_EMAIL_LIMIT) {
      console.warn("Hourly rate limit exceeded for user:", user.id, "count:", hourlyCount);
      return new Response(
        JSON.stringify({ error: `You've reached your hourly email limit (${HOURLY_EMAIL_LIMIT}). Please try again later.` }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // ========== RATE LIMITING (DAILY) ==========
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const { count: dailyCount, error: dailyCountError } = await supabaseClient
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .gte("created_at", oneDayAgo);

    if (dailyCountError) {
      console.error("Daily rate limit check error:", dailyCountError.message);
    } else if (dailyCount !== null && dailyCount >= DAILY_EMAIL_LIMIT) {
      console.warn("Daily rate limit exceeded for user:", user.id, "count:", dailyCount);
      return new Response(
        JSON.stringify({ error: `You've reached your daily email limit (${DAILY_EMAIL_LIMIT}). Please try again tomorrow.` }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // ========== DUPLICATE CONTENT DETECTION ==========
    // Prevent spam by detecting repeated content sent to multiple recipients
    const contentHash = await hashContent(subject + body);
    
    // Check for duplicate content in the last hour using subject similarity
    // Note: We check by subject since we don't have a content_hash column
    const { count: duplicateCount, error: duplicateError } = await supabaseClient
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .eq("subject", subject)
      .gte("created_at", oneHourAgo);

    if (!duplicateError && duplicateCount !== null && duplicateCount >= MAX_DUPLICATE_CONTENT_PER_HOUR) {
      console.warn("Duplicate content detected for user:", user.id, "subject:", subject, "count:", duplicateCount);
      return new Response(
        JSON.stringify({ error: "You've sent too many emails with similar content. Please wait before sending again." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // ========== SEND EMAIL ==========
    console.log("Sending email to:", to, "from user:", user.id, "content_hash:", contentHash.substring(0, 8));

    // Escape HTML in body to prevent XSS
    const escapedBody = escapeHtml(body).replace(/\n/g, "<br>");
    const escapedSubject = escapeHtml(subject);

    // Build email payload
    const emailPayload: any = {
      from: from || "Accord <do_not_reply@beinaccord.com>",
      to: [to],
      subject: escapedSubject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
${escapedBody}
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #888; font-size: 12px;">
            Sent via Accord
          </p>
        </div>
      `,
    };

    // Add attachment if provided
    if (attachment) {
      console.log("Adding attachment:", {
        filename: attachment.filename,
        hasContent: !!attachment.content,
        hasUrl: !!attachment.url,
        contentType: attachment.contentType,
      });
      
      // Always fetch and convert to base64 for reliability
      // Resend's 'path' parameter can be unreliable with some URLs
      if (attachment.url) {
        console.log("=== ATTACHMENT PROCESSING START ===");
        console.log("URL provided:", attachment.url);
        console.log("Filename:", attachment.filename);
        console.log("Content type:", attachment.contentType);
        console.log("Fetching file and converting to base64 (most reliable method)...");
        
        try {
          const fileResponse = await fetch(attachment.url, {
            method: 'GET',
            headers: {
              'Accept': 'application/pdf, */*',
            },
          });
          
          console.log("Fetch response status:", fileResponse.status);
          console.log("Fetch response headers:", Object.fromEntries(fileResponse.headers.entries()));
          
          if (!fileResponse.ok) {
            const errorText = await fileResponse.text().catch(() => 'Could not read error body');
            console.error("Fetch failed, response body:", errorText.substring(0, 500));
            throw new Error(`Failed to fetch file: ${fileResponse.status} ${fileResponse.statusText}`);
          }
          
          const contentType = fileResponse.headers.get('content-type');
          const contentLength = fileResponse.headers.get('content-length');
          console.log("File content-type:", contentType);
          console.log("File content-length:", contentLength);
          
          const fileArrayBuffer = await fileResponse.arrayBuffer();
          const fileBuffer = new Uint8Array(fileArrayBuffer);
          
          console.log("File fetched successfully, size:", fileBuffer.length, "bytes");
          console.log("First 20 bytes (hex):", Array.from(fileBuffer.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
          
          // Verify it's a PDF (starts with %PDF)
          const pdfHeader = String.fromCharCode(...fileBuffer.slice(0, 4));
          if (pdfHeader !== '%PDF') {
            console.warn("⚠️ WARNING: File doesn't appear to be a PDF. Header:", pdfHeader);
          } else {
            console.log("✓ Confirmed PDF file (starts with %PDF)");
          }
          
          // Convert Uint8Array to base64 - use chunked approach for large files
          console.log("Converting to base64...");
          let base64Content = '';
          const chunkSize = 0x8000; // 32KB chunks
          const totalChunks = Math.ceil(fileBuffer.length / chunkSize);
          console.log("Total chunks to process:", totalChunks);
          
          for (let i = 0; i < fileBuffer.length; i += chunkSize) {
            const chunk = fileBuffer.subarray(i, Math.min(i + chunkSize, fileBuffer.length));
            // Convert chunk to string safely
            let chunkString = '';
            for (let j = 0; j < chunk.length; j++) {
              chunkString += String.fromCharCode(chunk[j]);
            }
            base64Content += btoa(chunkString);
            
            const chunkNum = Math.floor(i / chunkSize) + 1;
            if (chunkNum % 10 === 0 || chunkNum === totalChunks) {
              console.log(`Base64 conversion progress: ${Math.round((i / fileBuffer.length) * 100)}% (${chunkNum}/${totalChunks} chunks)`);
            }
          }
          
          console.log("File converted to base64, length:", base64Content.length, "chars");
          console.log("Base64 size (estimated binary):", (base64Content.length * 3 / 4 / 1024 / 1024).toFixed(2), "MB");
          console.log("Base64 sample (first 50 chars):", base64Content.substring(0, 50));
          console.log("Base64 sample (last 50 chars):", base64Content.substring(base64Content.length - 50));
          
          // Verify it's valid base64
          const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
          if (!base64Regex.test(base64Content)) {
            console.error("❌ Invalid base64 encoding detected!");
            throw new Error("Invalid base64 encoding generated");
          }
          console.log("✓ Base64 validation passed");
          
          // Create attachment object with base64 content (Resend requires this format)
          emailPayload.attachments = [
            {
              filename: attachment.filename,
              content: base64Content, // Resend expects base64 string
            },
          ];
          console.log("✓ Attachment added to email payload");
          console.log("Attachment details:", {
            filename: emailPayload.attachments[0].filename,
            hasContent: !!emailPayload.attachments[0].content,
            contentLength: emailPayload.attachments[0].content.length,
          });
          console.log("=== ATTACHMENT PROCESSING COMPLETE ===");
        } catch (fetchError) {
          console.error("=== ATTACHMENT PROCESSING FAILED ===");
          console.error("Error details:", fetchError);
          console.error("Error message:", fetchError instanceof Error ? fetchError.message : String(fetchError));
          console.error("Error stack:", fetchError instanceof Error ? fetchError.stack : 'N/A');
          throw new Error(`Failed to process attachment: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        }
      } else if (attachment.content) {
        // Strip data URL prefix if present (e.g., "data:application/pdf;base64,")
        let base64Content = attachment.content;
        if (base64Content.includes(',')) {
          base64Content = base64Content.split(',')[1];
          console.log("Stripped data URL prefix from base64 content");
        }
        
        const contentLength = base64Content.length;
        const sizeInMB = (contentLength * 3 / 4 / 1024 / 1024).toFixed(2); // Base64 is ~33% larger than binary
        
        console.log("Using base64 attachment, encoded size:", contentLength, "chars, estimated binary size:", sizeInMB, "MB");
        
        // Resend has a 25MB limit per email (for the entire email including attachments)
        const estimatedBinarySize = contentLength * 3 / 4;
        if (estimatedBinarySize > 20 * 1024 * 1024) {
          console.warn("Attachment is large:", sizeInMB, "MB. Resend limit is 25MB total email size.");
        }
        
        // Verify base64 content is valid
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(base64Content)) {
          console.error("Invalid base64 format detected");
          return new Response(
            JSON.stringify({ error: "Invalid attachment format" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
        
        emailPayload.attachments = [
          {
            filename: attachment.filename,
            content: base64Content, // Resend expects base64 string (without data URL prefix)
          },
        ];
        console.log("Base64 attachment added to email payload");
      } else {
        console.error("Attachment provided but no content or URL!");
        return new Response(
          JSON.stringify({ error: "Attachment must have either content or url" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      console.log("Attachment added to email payload, attachment count:", emailPayload.attachments.length);
    } else {
      console.log("No attachment provided");
    }

    // Log payload structure (without full base64 content for readability)
    const payloadForLogging = { ...emailPayload };
    if (payloadForLogging.attachments) {
      payloadForLogging.attachments = payloadForLogging.attachments.map((att: any) => ({
        filename: att.filename,
        hasContent: !!att.content,
        hasPath: !!att.path,
        contentLength: att.content ? att.content.length : 0,
        contentPreview: att.content ? att.content.substring(0, 50) + '...' : 'N/A',
      }));
    }
    
    const payloadString = JSON.stringify(emailPayload);
    const payloadSizeMB = (payloadString.length / 1024 / 1024).toFixed(2);
    console.log("=== RESEND API REQUEST ===");
    console.log("Email payload structure:", JSON.stringify(payloadForLogging, null, 2));
    console.log("Email payload size:", payloadSizeMB, "MB");
    console.log("Payload has attachments:", emailPayload.attachments ? emailPayload.attachments.length : 0);
    
    // Verify attachment structure matches Resend format
    if (emailPayload.attachments && emailPayload.attachments.length > 0) {
      const att = emailPayload.attachments[0];
      console.log("Attachment structure check:", {
        isArray: Array.isArray(emailPayload.attachments),
        hasFilename: !!att.filename,
        hasContent: !!att.content,
        hasPath: !!att.path,
        contentIsString: typeof att.content === 'string',
        filenameType: typeof att.filename,
      });
      
      // Resend requires: { filename: string, content: string } OR { filename: string, path: string }
      if (!att.filename || (!att.content && !att.path)) {
        console.error("❌ Invalid attachment structure! Resend requires filename and either content or path");
        throw new Error("Invalid attachment structure");
      }
    }
    
    // Check if payload is too large (Supabase Edge Functions have a ~6MB limit)
    if (payloadString.length > 5 * 1024 * 1024) {
      console.warn("⚠️ Payload is very large, may cause issues:", payloadSizeMB, "MB");
    }

    console.log("Sending request to Resend API...");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: payloadString,
    });

    console.log("Resend API response status:", res.status, res.statusText);
    console.log("Resend API response headers:", Object.fromEntries(res.headers.entries()));
    
    const data = await res.json();
    console.log("Resend API response body:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      console.error("=== RESEND API ERROR ===");
      console.error("Status:", res.status);
      console.error("Response:", data);
      console.error("Email payload had attachments:", emailPayload.attachments ? emailPayload.attachments.length : 0);
      console.error("Request payload size:", payloadString.length, "bytes");
      return new Response(
        JSON.stringify({ error: "Failed to send email. Please try again.", details: data }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("=== RESEND API SUCCESS ===");
    console.log("Email sent successfully to:", to, "by user:", user.id);
    console.log("Resend email ID:", data.id);
    console.log("Email included attachments:", emailPayload.attachments ? emailPayload.attachments.length : 0);
    
    // Detailed attachment verification
    if (emailPayload.attachments && emailPayload.attachments.length > 0) {
      const att = emailPayload.attachments[0];
      console.log("✓ Attachment metadata sent to Resend:", {
        filename: att.filename,
        hasContent: !!att.content,
        hasPath: !!att.path,
        contentLength: att.content ? (att.content as string).length : 0,
        contentType: attachment?.contentType,
      });
      
      // Check Resend response for attachment confirmation
      if (data && typeof data === 'object') {
        console.log("Resend response keys:", Object.keys(data));
        if (data.attachments) {
          console.log("✓ Resend confirmed attachments in response:", data.attachments);
        } else {
          console.warn("⚠️ Resend response does not include 'attachments' field");
        }
      }
    } else {
      console.warn("⚠️ WARNING: No attachments in email payload!");
    }

    // Return response with attachment info for debugging
    const responseData = {
      success: true,
      data,
      attachmentInfo: emailPayload.attachments ? {
        count: emailPayload.attachments.length,
        filename: emailPayload.attachments[0]?.filename,
        hasContent: !!emailPayload.attachments[0]?.content,
        hasPath: !!emailPayload.attachments[0]?.path,
        contentLength: emailPayload.attachments[0]?.content ? (emailPayload.attachments[0].content as string).length : 0,
        method: emailPayload.attachments[0]?.path ? 'path' : 'content',
      } : null,
      payloadInfo: {
        hadAttachments: !!emailPayload.attachments,
        attachmentCount: emailPayload.attachments ? emailPayload.attachments.length : 0,
      },
    };
    
    console.log("=== RETURNING RESPONSE ===");
    console.log("Response data:", JSON.stringify(responseData, null, 2));
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred while sending the email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
