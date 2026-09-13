export interface ScrapeResult {
  markdown: string;
  metadata: {
    title?: string;
    description?: string;
    ogSiteName?: string;
  };
}

export interface WebIntelligenceConfig {
  apiKey: string;
}

export function getFirecrawlConfig(): WebIntelligenceConfig {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not configured. Set it as a Supabase edge function secret to enable web extraction.");
  }
  return { apiKey };
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const config = getFirecrawlConfig();

  const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      onlyMainContent: true,
      formats: ["markdown"],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data.error || data.message || `Firecrawl request failed (${response.status})`;
    throw new Error(`Firecrawl error: ${message}`);
  }

  const payload = data.data ?? data;
  return {
    markdown: payload.markdown ?? "",
    metadata: {
      title: payload.metadata?.title,
      description: payload.metadata?.description,
      ogSiteName: payload.metadata?.ogSiteName,
    },
  };
}
