import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { handleOptions, errorResponse, jsonResponse } from "../_shared/ai-provider.ts";
import {
  buildAssessmentSystemPrompt,
  callAssessment,
  type OpportunityContext,
  type UserProfileContext,
  type AssessmentResult,
} from "../_shared/context-builder.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface AssessRequest {
  opportunity: OpportunityContext;
  userId?: string;
}

Deno.serve(async (req: Request) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  if (req.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }

  try {
    const body: AssessRequest = await req.json();

    if (!body.opportunity) {
      return errorResponse(400, "Opportunity context is required");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve user from auth header
    let userId = body.userId;
    const authHeader = req.headers.get("Authorization");
    if (authHeader && !userId) {
      const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data.user?.id ?? undefined;
    }

    let userProfile: UserProfileContext | undefined;

    if (userId) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name, preferred_name, background, role_type, goals, opportunity_types")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile) {
        userProfile = {
          fullName: profile.full_name ?? undefined,
          preferredName: profile.preferred_name ?? undefined,
          background: profile.background ?? undefined,
          roleType: profile.role_type ?? undefined,
          goals: profile.goals ?? undefined,
          opportunityTypes: profile.opportunity_types ?? undefined,
        };
      }
    }

    const systemPrompt = buildAssessmentSystemPrompt({
      opportunity: body.opportunity,
      userProfile,
    });

    const assessment: AssessmentResult = await callAssessment(systemPrompt, 800);

    return jsonResponse({ assessment, source: "claude" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("ANTHROPIC_API_KEY")) {
      return errorResponse(503, "Assessment is not configured. ANTHROPIC_API_KEY must be set as a Supabase edge function secret.");
    }
    console.error("Assess error:", error);
    return errorResponse(500, `Assessment failed: ${message}`);
  }
});
