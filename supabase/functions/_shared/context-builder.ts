import { callClaude, type ClaudeMessage } from "./ai-provider.ts";

export interface OpportunityContext {
  title?: string;
  org?: string;
  category?: string;
  deadline?: string;
  requirements?: string[];
  description?: string;
  location?: string;
  link?: string;
}

export interface UserProfileContext {
  fullName?: string;
  preferredName?: string;
  background?: string;
  roleType?: string;
  goals?: string;
  opportunityTypes?: string[];
}

export interface VoiceProfileContext {
  toneSchema?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export function buildOpportunityContext(opp: OpportunityContext): string {
  const parts: string[] = [];
  if (opp.title) parts.push(`Title: ${opp.title}`);
  if (opp.org) parts.push(`Organization: ${opp.org}`);
  if (opp.category) parts.push(`Category: ${opp.category}`);
  if (opp.deadline) parts.push(`Deadline: ${opp.deadline}`);
  if (opp.location) parts.push(`Location: ${opp.location}`);
  if (opp.link) parts.push(`Source URL: ${opp.link}`);
  if (opp.requirements?.length) {
    parts.push(`Requirements:\n${opp.requirements.map((r) => `  - ${r}`).join("\n")}`);
  }
  if (opp.description) parts.push(`Description: ${opp.description}`);
  return parts.join("\n");
}

export function buildUserProfileContext(profile: UserProfileContext): string {
  const parts: string[] = [];
  if (profile.preferredName || profile.fullName) {
    parts.push(`Name: ${profile.preferredName || profile.fullName}`);
  }
  if (profile.background) parts.push(`Background: ${profile.background}`);
  if (profile.roleType) parts.push(`Role: ${profile.roleType}`);
  if (profile.goals) parts.push(`Goals: ${profile.goals}`);
  if (profile.opportunityTypes?.length) {
    parts.push(`Interested in: ${profile.opportunityTypes.join(", ")}`);
  }
  return parts.join("\n");
}

export function buildVoiceProfileContext(voice: VoiceProfileContext): string {
  if (!voice.toneSchema) return "";
  return `Voice Profile (writing style guide — match this in all written content you produce):\n${voice.toneSchema}`;
}

export interface AssistantSystemPromptOptions {
  opportunity: OpportunityContext;
  userProfile?: UserProfileContext;
  voiceProfile?: VoiceProfileContext;
  pageContent?: string;
}

export function buildAssistantSystemPrompt(opts: AssistantSystemPromptOptions): string {
  const sections: string[] = [];

  sections.push(
    "You are CLNCH, an AI opportunity coach that helps users understand, assess, and apply for opportunities. " +
    "You explain complex opportunity details in simple, clear language. " +
    "You give practical, actionable advice tailored to the user's background and goals. " +
    "When you help with written content (personal statements, cover letters), you match the user's voice profile exactly."
  );

  sections.push("=== OPPORTUNITY CONTEXT ===\n" + buildOpportunityContext(opts.opportunity));

  if (opts.userProfile) {
    const profileText = buildUserProfileContext(opts.userProfile);
    if (profileText) {
      sections.push("=== USER PROFILE ===\n" + profileText);
    }
  }

  if (opts.voiceProfile) {
    const voiceText = buildVoiceProfileContext(opts.voiceProfile);
    if (voiceText) {
      sections.push("=== VOICE PROFILE ===\n" + voiceText);
    }
  }

  if (opts.pageContent) {
    const truncated = opts.pageContent.slice(0, 12000);
    sections.push("=== PAGE CONTENT (from the source URL) ===\n" + truncated);
  }

  sections.push(
    "=== INSTRUCTIONS ===\n" +
    "1. Answer questions using the opportunity context and page content above.\n" +
    "2. If the user asks about eligibility, assess fit transparently — say what matches and what doesn't.\n" +
    "3. When helping with written content, produce polished text that matches the voice profile.\n" +
    "4. Keep responses concise and actionable. Use markdown for structure.\n" +
    "5. If you don't know something from the available context, say so rather than guessing."
  );

  return sections.join("\n\n");
}

export interface AssessmentSystemPromptOptions {
  opportunity: OpportunityContext;
  userProfile?: UserProfileContext;
}

export function buildAssessmentSystemPrompt(opts: AssessmentSystemPromptOptions): string {
  const sections: string[] = [];

  sections.push(
    "You are CLNCH's eligibility assessment engine. " +
    "You compare an opportunity's requirements against a user's profile and produce a transparent fit assessment. " +
    "You must be honest — do not inflate the rating. If the user doesn't meet a requirement, say so clearly."
  );

  sections.push("=== OPPORTUNITY ===\n" + buildOpportunityContext(opts.opportunity));

  if (opts.userProfile) {
    const profileText = buildUserProfileContext(opts.userProfile);
    if (profileText) {
      sections.push("=== USER PROFILE ===\n" + profileText);
    }
  }

  sections.push(
    "=== INSTRUCTIONS ===\n" +
    "Assess the user's fit for this opportunity. Return a JSON object with this exact structure:\n" +
    "{\n" +
    '  "fit_rating": "strong" | "moderate" | "weak",\n' +
    '  "summary": "1-2 sentence overall assessment",\n' +
    '  "matching_criteria": ["list of requirements the user clearly meets"],\n' +
    '  "missing_criteria": ["list of requirements the user does not meet or that are unclear"],\n' +
    '  "recommendations": ["actionable steps to strengthen the application"]\n' +
    "}\n" +
    "Return ONLY the JSON, no other text."
  );

  return sections.join("\n\n");
}

export async function callAssistant(
  systemPrompt: string,
  conversation: ConversationMessage[],
  maxTokens?: number
): Promise<string> {
  const messages: ClaudeMessage[] = conversation.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const result = await callClaude({
    system: systemPrompt,
    messages,
    maxTokens: maxTokens ?? 1024,
  });

  return result.text;
}

export interface AssessmentResult {
  fit_rating: "strong" | "moderate" | "weak";
  summary: string;
  matching_criteria: string[];
  missing_criteria: string[];
  recommendations: string[];
}

export async function callAssessment(
  systemPrompt: string,
  maxTokens?: number
): Promise<AssessmentResult> {
  const result = await callClaude({
    system: systemPrompt,
    messages: [{ role: "user", content: "Assess my fit for this opportunity." }],
    maxTokens: maxTokens ?? 800,
  });

  const text = result.text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Assessment did not return valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as AssessmentResult;
  return parsed;
}
