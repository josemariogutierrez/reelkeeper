// Parse & normalize Instagram reel/post URLs.
// IG shares to "Other" hand us a URL (sometimes wrapped in caption text).

const SHORTCODE_RE = /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i

export interface ParsedShare {
  url: string
  shortcode: string
}

/** Pull the first instagram URL out of an arbitrary share payload (url/text/title). */
export function extractInstagramUrl(...candidates: (string | null | undefined)[]): string | null {
  for (const c of candidates) {
    if (!c) continue
    // a candidate may be plain text containing the url somewhere
    const urlMatch = c.match(/https?:\/\/[^\s]+/g)
    const haystack = urlMatch ? urlMatch : [c]
    for (const h of haystack) {
      if (SHORTCODE_RE.test(h)) return h
    }
  }
  return null
}

export function parseShare(raw: string | null | undefined): ParsedShare | null {
  if (!raw) return null
  const found = extractInstagramUrl(raw)
  const target = found || raw
  const m = target.match(SHORTCODE_RE)
  if (!m) return null
  const shortcode = m[1]
  return {
    shortcode,
    url: `https://www.instagram.com/reel/${shortcode}/`,
  }
}

/** Permalink form Instagram's embed.js expects. */
export function embedUrl(shortcode: string): string {
  return `https://www.instagram.com/reel/${shortcode}/`
}
