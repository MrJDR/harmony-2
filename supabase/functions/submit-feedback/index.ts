import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  title: string;
  description: string;
  category: string;
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

    // Parse and validate request
    const body: FeedbackRequest = await req.json();
    const { title, description, category } = body;

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

    const validCategories = ["feature", "bug", "improvement", "other"];
    if (!category || !validCategories.includes(category)) {
      return new Response(
        JSON.stringify({ error: "Invalid category" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format description with category tag
    const formattedDetails = `[${category.toUpperCase()}]\n\n${description.trim()}`;

    // Submit to Canny API
    const cannyBoardId = "553c3ef8b8cdcd1501ba1234";
    
    console.log("Submitting feedback to Canny:", { title: title.trim(), category, userName });

    const cannyResponse = await fetch("https://canny.io/api/v1/posts/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: CANNY_API_KEY,
        boardID: cannyBoardId,
        authorEmail: profile?.email || user.email,
        authorName: userName,
        title: title.trim(),
        details: formattedDetails,
      }),
    });

    const cannyResult = await cannyResponse.json();
    
    if (!cannyResponse.ok) {
      console.error("Canny API error:", cannyResult);
      return new Response(
        JSON.stringify({ error: "Failed to submit feedback" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
