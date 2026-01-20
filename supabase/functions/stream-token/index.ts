import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Stream.io API configuration
const STREAM_API_KEY = "6un4ed66937t";

interface TokenRequest {
  type: 'chat' | 'video' | 'feed';
  callId?: string; // For video calls
  feedGroup?: string; // For activity feeds
}

// Generate Stream token using HMAC-SHA256
function generateStreamToken(userId: string, apiSecret: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    user_id: userId,
    iat: now,
    exp: now + 3600 * 24, // 24 hours
  }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const signatureInput = `${header}.${payload}`;
  const hmac = createHmac('sha256', apiSecret);
  hmac.update(signatureInput);
  const signature = hmac.digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return `${header}.${payload}.${signature}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', userId)
      .single();

    const userName = profile?.first_name && profile?.last_name 
      ? `${profile.first_name} ${profile.last_name}`
      : userEmail?.split('@')[0] || 'User';

    // Get request body
    const body: TokenRequest = await req.json().catch(() => ({ type: 'chat' }));
    const streamApiSecret = Deno.env.get('STREAM_API_SECRET');
    
    if (!streamApiSecret) {
      console.error('STREAM_API_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Stream API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate Stream token
    const streamToken = generateStreamToken(userId, streamApiSecret);

    console.log(`Generated ${body.type} token for user ${userId}`);

    return new Response(
      JSON.stringify({
        token: streamToken,
        apiKey: STREAM_API_KEY,
        userId: userId,
        userName: userName,
        userImage: profile?.avatar_url || undefined,
        type: body.type,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Stream token error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
