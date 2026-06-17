/**
 * Normalize a URL for opportunity matching (strip query/hash, trailing slash, lowercase host).
 * @param {string} url
 */
export function normalizeUrl(url) {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    const path = parsed.pathname.replace(/\/+$/, '') || '';
    return `${parsed.origin}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase().split(/[?#]/)[0].replace(/\/+$/, '');
  }
}

/**
 * @param {string} pageUrl
 * @param {string} storedLink
 */
export function urlsMatch(pageUrl, storedLink) {
  if (!pageUrl || !storedLink) return false;

  const a = normalizeUrl(pageUrl);
  const b = normalizeUrl(storedLink);

  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  try {
    const page = new URL(pageUrl);
    const stored = new URL(storedLink);
    return page.hostname === stored.hostname && page.pathname.startsWith(stored.pathname.slice(0, 20));
  } catch {
    return false;
  }
}

/**
 * Extract plain text from coached assistant markdown-ish content.
 * @param {string} content
 */
export function extractRefinedDraft(content) {
  if (!content) return '';

  const refinedMatch = content.match(/\*\*Refined Draft:\*\*\s*\n\n([\s\S]*?)(?:\n\nWould you like|\n\nThis version|\n\nHow does|$)/i);
  if (refinedMatch?.[1]) {
    return refinedMatch[1].replace(/^["']|["']$/g, '').trim();
  }

  const quotedMatch = content.match(/"([^"]{40,})"/);
  if (quotedMatch?.[1]) return quotedMatch[1].trim();

  return content.trim();
}
