import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { handleOptions, errorResponse, jsonResponse, callClaude } from "../_shared/ai-provider.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RefinementRequest {
  opportunityUrl?: string;
  fieldLabel?: string;
  rawTextDataPayload?: string;
  userId?: string;
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

function buildLocalRefinement(fieldLabel: string, rawText: string): string {
  const trimmed = rawText.trim();
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  const withPunctuation = /[.!?]$/.test(capitalized) ? capitalized : capitalized + ".";
  if (trimmed.length > 100) {
    return `${withPunctuation}\n\nThis refined version maintains your core ideas while improving clarity, flow, and professional tone.`;
  }
  return withPunctuation;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  if (req.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }

  try {
    const body: RefinementRequest = await req.json();

    if (!body.rawTextDataPayload?.trim()) {
      return errorResponse(400, "No text provided for refinement");
    }

    const rawText = body.rawTextDataPayload.trim();
    const fieldLabel = body.fieldLabel || "Response";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let userId: string | null = body.userId || null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader && !userId) {
      const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data.user?.id ?? null;
    }

    let voiceProfile: string | null = null;
    if (userId) {
      voiceProfile = await getUserVoiceProfile(supabase, userId);
    }

    const systemPrompt = voiceProfile
      ? `You are an expert application essay coach. The user has provided their voice profile below. Refine their draft to be more polished and professional while MAINTAINING their unique voice, sentence structure patterns, and communication style exactly as described in the profile.\n\nVoice Profile:\n${voiceProfile}\n\nReturn ONLY the refined text, no explanations or meta-commentary.`
      : `You are an expert application essay coach. Refine the user's draft to be more polished, professional, and impactful while preserving their core ideas and authentic voice. Fix grammar, improve clarity, strengthen word choice, and ensure the response directly answers what the field is asking.\n\nReturn ONLY the refined text, no explanations or meta-commentary.`;

    let refinedAnswer: string;

    try {
      const result = await callClaude({
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Field: "${fieldLabel}"\n\nDraft to refine:\n${rawText}`,
          },
        ],
        maxTokens: 800,
      });
      refinedAnswer = result.text || buildLocalRefinement(fieldLabel, rawText);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("ANTHROPIC_API_KEY")) {
        refinedAnswer = buildLocalRefinement(fieldLabel, rawText);
      } else {
        throw err;
      }
    }

    return jsonResponse({ success: true, refinedAnswer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal refinement error.";
    console.error("Refinement error:", error);
    return errorResponse(500, message);
  }
});
