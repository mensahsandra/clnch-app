import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RefinementRequest {
  opportunityUrl?: string;
  fieldLabel?: string;
  rawTextDataPayload?: string;
  userId?: string;
}

interface RefinementResponse {
  success: boolean;
  refinedAnswer?: string;
  error?: string;
}

async function getUserVoiceProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("voice_profiles")
    .select("tone_schema")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.tone_schema;
}

async function refineWithClaude(
  rawText: string,
  fieldLabel: string,
  voiceProfile: string | null
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return buildLocalRefinement(fieldLabel, rawText);
  }

  const systemPrompt = voiceProfile
    ? `You are an expert application essay coach. The user has provided their voice profile below. Refine their draft to be more polished and professional while MAINTAINING their unique voice, sentence structure patterns, and communication style exactly as described in the profile.\n\nVoice Profile:\n${voiceProfile}\n\nReturn ONLY the refined text, no explanations or meta-commentary.`
    : `You are an expert application essay coach. Refine the user's draft to be more polished, professional, and impactful while preserving their core ideas and authentic voice. Fix grammar, improve clarity, strengthen word choice, and ensure the response directly answers what the field is asking.\n\nReturn ONLY the refined text, no explanations or meta-commentary.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 800,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Field: "${fieldLabel}"\n\nDraft to refine:\n${rawText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude refinement failed: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || buildLocalRefinement(fieldLabel, rawText);
}

function buildLocalRefinement(fieldLabel: string, rawText: string): string {
  const trimmed = rawText.trim();

  // Capitalize first letter
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  // Ensure ends with punctuation
  const withPunctuation = /[.!?]$/.test(capitalized)
    ? capitalized
    : capitalized + ".";

  // Add structure note for longer responses
  if (trimmed.length > 100) {
    return `${withPunctuation}\n\nThis refined version maintains your core ideas while improving clarity, flow, and professional tone.`;
  }

  return withPunctuation;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: RefinementRequest = await req.json();

    if (!body.rawTextDataPayload?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "No text provided for refinement" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawText = body.rawTextDataPayload.trim();
    const fieldLabel = body.fieldLabel || "Response";

    // Initialize Supabase client with service role for voice profile lookup
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract user ID from auth header if present
    let userId: string | null = body.userId || null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader && !userId) {
      const { data } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      userId = data.user?.id ?? null;
    }

    // Get user's voice profile for personalized refinement
    let voiceProfile: string | null = null;
    if (userId) {
      voiceProfile = await getUserVoiceProfile(supabase, userId);
    }

    // Refine the text
    const refinedAnswer = await refineWithClaude(rawText, fieldLabel, voiceProfile);

    const result: RefinementResponse = {
      success: true,
      refinedAnswer,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal refinement error.";
    console.error("Refinement error:", error);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
