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
  isInviteEmail?: boolean; // Flag to allow invite emails to bypass the pending check
}

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

    // ========== CHECK IF RECIPIENT IS A PENDING INVITE ==========
    // Block emails to pending invitees unless it's an invite email
    if (!isInviteEmail) {
      // Use service role to check org_invites (RLS won't allow user to see all invites)
      const supabaseAdmin = createClient(
        SUPABASE_URL!,
        SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get the user's org_id
      const { data: userOrgId } = await supabaseAdmin.rpc("get_user_org_id", {
        _user_id: user.id,
      });

      if (userOrgId) {
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
    }

    // ========== RATE LIMITING ==========
    // Check how many emails the user has sent in the last hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count, error: countError } = await supabaseClient
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .gte("created_at", oneHourAgo);

    if (countError) {
      console.error("Rate limit check error:", countError.message);
    } else if (count !== null && count >= 50) {
      console.warn("Rate limit exceeded for user:", user.id);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // ========== SEND EMAIL ==========
    console.log("Sending email to:", to, "from user:", user.id);

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
        from: from || "Accord <team@accordapp.com>",
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
