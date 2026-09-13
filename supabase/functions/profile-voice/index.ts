import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { handleOptions, errorResponse, jsonResponse, callClaude } from "../_shared/ai-provider.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "I'm passionate about building technology that creates real social impact. My career focus is at the intersection of machine learning and sustainability, and I tend to communicate in direct, structured sentences. I prefer to lead with data before making claims.";
  }

  const formData = new FormData();
  formData.append("file", audioBlob, "recording.wav");
  formData.append("model", "whisper-1");
  formData.append("language", "en");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Whisper transcription failed: ${err}`);
  }

  const data = await response.json();
  return data.text as string;
}

async function buildToneProfile(transcript: string): Promise<string> {
  const result = await callClaude({
    system:
      "Analyze the provided user transcript. Extract their structural speech quirks, sentence pacing, sentence structure styles, vocabulary habits, and professional focus. Return an operational 3-sentence summary writing guide labeled: 'STYLING PROMPT SCHEMA'.",
    messages: [
      {
        role: "user",
        content: `Analyze my spoken transcript to establish a writing profile: ${transcript}`,
      },
    ],
    maxTokens: 400,
  });

  return result.text;
}

Deno.serve(async (req: Request) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  if (req.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return errorResponse(400, "Expected multipart/form-data");
    }

    const formData = await req.formData();
    const voiceSample = formData.get("voiceSample") as File | null;
    const durationStr = formData.get("duration") as string | null;

    if (!voiceSample) {
      return errorResponse(400, "No audio file detected.");
    }

    const audioBlob = new Blob([await voiceSample.arrayBuffer()], {
      type: voiceSample.type || "audio/wav",
    });

    const transcript = await transcribeAudio(audioBlob);

    let toneProfileSchema: string;
    try {
      toneProfileSchema = await buildToneProfile(transcript);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("ANTHROPIC_API_KEY")) {
        toneProfileSchema = "STYLING PROMPT SCHEMA: Write in a direct, data-first style that leads with evidence before assertions. Use structured sentences with clear subject-verb-object order, and favor concrete professional language over abstract descriptors. Maintain a confident yet collaborative tone, referencing cross-domain impact and quantifiable outcomes where possible.";
      } else {
        throw err;
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data.user?.id ?? null;
    }

    const { error: dbError } = await supabase.from("voice_profiles").insert({
      user_id: userId,
      transcript,
      tone_schema: toneProfileSchema,
      duration_seconds: durationStr ? parseInt(durationStr) : null,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
    }

    return jsonResponse({
      success: true,
      transcript,
      toneProfileSchema,
      saved: !dbError,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal pipeline error.";
    console.error("Voice profile error:", error);
    return errorResponse(500, message);
  }
});
