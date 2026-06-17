import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (!OPENAI_API_KEY) {
    // Simulation fallback when no API key is configured
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
  if (!ANTHROPIC_API_KEY) {
    // Simulation fallback
    return "STYLING PROMPT SCHEMA: Write in a direct, data-first style that leads with evidence before assertions. Use structured sentences with clear subject-verb-object order, and favor concrete professional language over abstract descriptors. Maintain a confident yet collaborative tone, referencing cross-domain impact and quantifiable outcomes where possible.";
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 400,
      system:
        "Analyze the provided user transcript. Extract their structural speech quirks, sentence pacing, sentence structure styles, vocabulary habits, and professional focus. Return an operational 3-sentence summary writing guide labeled: 'STYLING PROMPT SCHEMA'.",
      messages: [
        {
          role: "user",
          content: `Analyze my spoken transcript to establish a writing profile: ${transcript}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude tone profiling failed: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({ success: false, error: "Expected multipart/form-data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const voiceSample = formData.get("voiceSample") as File | null;
    const durationStr = formData.get("duration") as string | null;

    if (!voiceSample) {
      return new Response(
        JSON.stringify({ success: false, error: "No audio file detected." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBlob = new Blob([await voiceSample.arrayBuffer()], {
      type: voiceSample.type || "audio/wav",
    });

    // 1. Transcribe via Whisper (or simulation)
    const transcript = await transcribeAudio(audioBlob);

    // 2. Build tone profile via Claude (or simulation)
    const toneProfileSchema = await buildToneProfile(transcript);

    // 3. Persist to Supabase — use service role to bypass RLS for anon inserts
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
      // Non-fatal — still return the profile
    }

    return new Response(
      JSON.stringify({
        success: true,
        transcript,
        toneProfileSchema,
        saved: !dbError,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal pipeline error.";
    console.error("Voice profile error:", error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
