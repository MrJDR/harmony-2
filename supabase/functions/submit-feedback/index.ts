import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Board IDs for different feedback types
const BOARD_IDS = {
  feedback: "553c3ef8b8cdcd1501ba1234",
  // bug board ID is resolved dynamically from slug to avoid misconfiguration
  bug: "",
};

const BOARD_SLUGS = {
  bug: "bug-reports",
};

async function listBoards(apiKey: string): Promise<any[] | null> {
  const params = new URLSearchParams();
  params.append("apiKey", apiKey);

  const resp = await fetch("https://canny.io/api/v1/boards/list", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const text = await resp.text();
  try {
    const json = JSON.parse(text);
    // common shape: { boards: [...] }
    return Array.isArray(json?.boards) ? json.boards : null;
  } catch {
    console.error("Canny boards/list non-JSON response:", text.substring(0, 300));
    return null;
  }
}

async function resolveBoardId(apiKey: string, type: "feedback" | "bug"): Promise<string | null> {
  // prefer static ID when present
  const staticId = BOARD_IDS[type];
  if (staticId) return staticId;

  const slug = (BOARD_SLUGS as any)[type];
  if (!slug) return null;

  const boards = await listBoards(apiKey);
  if (!boards) return null;

  const normalize = (s: string) => (s || "").trim().toLowerCase();
  const slugNorm = normalize(slug);

  // boards/list doesn't include a slug field; we derive it from the board's url.
  const match = boards.find((b: any) => {
    const url = typeof b?.url === "string" ? b.url : "";
    const urlNorm = normalize(url);
    const urlSlug = normalize(url.split("/").filter(Boolean).pop() || "");
    return urlNorm.includes(`/${slugNorm}`) || urlSlug === slugNorm;
  });

  const id = match?.id;
  if (!id) {
    console.error(
      "Could not resolve board id for slug:",
      slug,
      "boards:",
      boards.map((b: any) => ({ id: b?.id, url: b?.url, name: b?.name }))
    );
    return null;
  }

  console.log("Resolved board id:", { type, slug, id });
  return id;
}

interface FeedbackRequest {
  title: string;
  description: string;
  type: "feedback" | "bug";
}

// Helper function to create or retrieve a Canny user
async function getOrCreateCannyUser(apiKey: string, email: string, name: string): Promise<string | null> {
  try {
    // Use create_or_update which handles both creation and retrieval
    const params = new URLSearchParams();
    params.append("apiKey", apiKey);
    params.append("email", email);
    params.append("name", name);

    console.log("Creating/updating Canny user:", { email, name });

    const response = await fetch("https://canny.io/api/v1/users/create_or_update", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const responseText = await response.text();
    console.log("Canny user response:", responseText);

    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse Canny response as JSON:", responseText.substring(0, 200));
      return null;
    }

    if (result.id) {
      console.log("Canny user ID:", result.id);
      return result.id;
    }

    console.error("No user ID in Canny response:", result);
    return null;
  } catch (error) {
    console.error("Error in getOrCreateCannyUser:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CANNY_API_KEY = Deno.env.get("CANNY_API_KEY");
    if (!CANNY_API_KEY) {
      console.error("CANNY_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Feedback service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .single();

    const userName = profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.email || user.email || "Anonymous";

    const userEmail = profile?.email || user.email || "";

    // Parse and validate request
    const body: FeedbackRequest = await req.json();
    const { title, description, type = "feedback" } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (title.length > 100) {
      return new Response(
        JSON.stringify({ error: "Title must be 100 characters or less" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (description.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Description must be 5000 characters or less" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the correct board ID based on type
    const boardId = await resolveBoardId(CANNY_API_KEY, type);
    if (!boardId) {
      return new Response(
        JSON.stringify({ error: "Feedback board is not configured correctly" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Submitting to Canny:", { title: title.trim(), type, boardId, userName, userEmail });

    // Step 1: Get or create the Canny user
    const cannyUserId = await getOrCreateCannyUser(CANNY_API_KEY, userEmail, userName);
    
    if (!cannyUserId) {
      return new Response(
        JSON.stringify({ error: "Failed to create user in feedback system" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Create the post with the user's Canny ID
    const postParams = new URLSearchParams();
    postParams.append("apiKey", CANNY_API_KEY);
    postParams.append("boardID", boardId);
    postParams.append("authorID", cannyUserId);
    postParams.append("title", title.trim());
    postParams.append("details", description.trim());

    const cannyResponse = await fetch("https://canny.io/api/v1/posts/create", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: postParams.toString(),
    });

    const cannyText = await cannyResponse.text();
    let cannyResult: any = null;
    try {
      cannyResult = JSON.parse(cannyText);
    } catch {
      console.error("Canny posts/create non-JSON response:", cannyText.substring(0, 300));
      return new Response(
        JSON.stringify({ error: "Canny returned an unexpected response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!cannyResponse.ok || cannyResult?.error) {
      console.error("Canny API error:", cannyResult);
      const msg = typeof cannyResult?.error === "string" ? cannyResult.error : "Failed to submit";
      // Surface the real upstream error to help fix config issues like invalid board IDs.
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Feedback submitted successfully:", cannyResult);

    return new Response(
      JSON.stringify({ success: true, postId: cannyResult.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
