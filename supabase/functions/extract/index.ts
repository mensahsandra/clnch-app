import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, errorResponse, jsonResponse, callClaude } from "../_shared/ai-provider.ts";
import { scrapeUrl } from "../_shared/web-intelligence.ts";

interface ExtractionRequest {
  url: string;
  contextHints?: {
    description?: string;
    categoryHints?: string[];
  };
}

interface StructuredOpportunity {
  title: string;
  organization: string;
  category: string;
  requirements: string[];
  deadline?: string;
  deadline_text?: string;
  location?: string;
  description: string;
  award_value?: string;
  eligibility_regions?: string[];
  application_url?: string;
}

const EXTRACTION_SCHEMA_PROMPT = `You are an expert opportunity extractor. Analyze the provided webpage content and extract a structured opportunity object.

Return a JSON object with these fields:
{
  "title": "Full title of the opportunity",
  "organization": "Name of the issuing organisation, company, or institution",
  "category": "One of: fellowship, grant, accelerator, job, conference, internship, events",
  "requirements": ["List of every eligibility requirement and application step you can find"],
  "deadline": "Exact application deadline in YYYY-MM-DD format if found, otherwise empty string",
  "deadline_text": "Raw deadline text as it appears on the page",
  "location": "Physical location or 'Remote' or 'Global'",
  "description": "A concise 2-3 sentence summary of the opportunity",
  "award_value": "Funding amount, stipend, or benefit value if mentioned, otherwise empty string",
  "eligibility_regions": ["Countries or regions eligible to apply"],
  "application_url": "Direct URL to the application form if different from the page URL"
}

Rules:
- Infer the category from the page content, NOT from the URL.
- For requirements: list every eligibility criterion and application step you can find.
- For deadline: look for "apply by", "deadline", "closes", "due date", "last date". Extract exact date AND raw text.
- If the page is NOT an opportunity (e.g. a news article, a general info page), set title to the page title and category to "events" with an empty requirements array.
- Return ONLY the JSON, no other text.`;

Deno.serve(async (req: Request) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  if (req.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }

  try {
    const body: ExtractionRequest = await req.json();

    if (!body.url) {
      return errorResponse(400, "URL is required");
    }

    try {
      new URL(body.url);
    } catch {
      return errorResponse(400, "Invalid URL format");
    }

    // Step 1: Scrape the page with Firecrawl
    let scraped;
    try {
      scraped = await scrapeUrl(body.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message.includes("FIRECRAWL_API_KEY")) {
        return errorResponse(503, "Web extraction is not configured. FIRECRAWL_API_KEY must be set as a Supabase edge function secret.");
      }
      return errorResponse(502, `Failed to retrieve page content: ${message}`);
    }

    if (!scraped.markdown || scraped.markdown.trim().length < 50) {
      return errorResponse(422, "The page returned no usable content. It may be behind a login wall, require JavaScript, or be empty.");
    }

    // Step 2: Use Claude to interpret the page content
    const contextClues = body.contextHints?.description
      ? `\n\nAdditional context from user: "${body.contextHints.description}"`
      : "";

    const categoryHint = body.contextHints?.categoryHints?.length
      ? `\n\nUser suggests it may be: ${body.contextHints.categoryHints.join(", ")} — but infer from the page content first.`
      : "";

    const pageMetadata = [
      scraped.metadata.title ? `Page title: ${scraped.metadata.title}` : "",
      scraped.metadata.description ? `Page description: ${scraped.metadata.description}` : "",
      scraped.metadata.ogSiteName ? `Site name: ${scraped.metadata.ogSiteName}` : "",
    ].filter(Boolean).join("\n");

    const result = await callClaude({
      system: EXTRACTION_SCHEMA_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze this webpage and extract the opportunity.\n\nURL: ${body.url}\n${pageMetadata}\n\n=== PAGE CONTENT ===\n${scraped.markdown.slice(0, 24000)}${contextClues}${categoryHint}`,
        },
      ],
      maxTokens: 1200,
    });

    // Parse the JSON from Claude's response
    const jsonMatch = result.text.trim().match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return errorResponse(500, "AI extraction did not return valid JSON");
    }

    const structured = JSON.parse(jsonMatch[0]) as StructuredOpportunity;

    // Build the response
    const response = {
      title: structured.title || scraped.metadata.title || "Untitled Opportunity",
      organization: structured.organization || scraped.metadata.ogSiteName || new URL(body.url).hostname.replace("www.", ""),
      category: structured.category || "fellowship",
      requirements: Array.isArray(structured.requirements) ? structured.requirements : [],
      deadline: structured.deadline || structured.deadline_text || undefined,
      deadline_text: structured.deadline_text || undefined,
      location: structured.location || undefined,
      description: structured.description || scraped.metadata.description || "",
      award_value: structured.award_value || undefined,
      eligibility_regions: structured.eligibility_regions || [],
      application_url: structured.application_url || undefined,
      link: body.url,
      page_content: scraped.markdown.slice(0, 16000),
      source: "firecrawl",
    };

    return jsonResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("ANTHROPIC_API_KEY")) {
      return errorResponse(503, "AI extraction is not configured. ANTHROPIC_API_KEY must be set as a Supabase edge function secret.");
    }
    console.error("Extract error:", error);
    return errorResponse(500, `Extraction failed: ${message}`);
  }
});
