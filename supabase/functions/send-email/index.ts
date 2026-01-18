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
    const { to, subject, body, from, isInviteEmail }: SendEmailRequest = await req.json();

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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
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
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ error: "Failed to send email. Please try again." }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Email sent successfully to:", to, "by user:", user.id);

    return new Response(JSON.stringify({ success: true, data }), {
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
