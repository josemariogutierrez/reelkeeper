import type { Reel, Tag } from '../types'

/**
 * Case-insensitive substring search over the text we actually have:
 * title, note, location label, caption, and tag names.
 */
export function filterReels(reels: Reel[], query: string, tagsById: Map<string, Tag>): Reel[] {
  const q = query.trim().toLowerCase()
  if (!q) return reels
  const terms = q.split(/\s+/)
  return reels.filter((r) => {
    const hay = [
      r.title,
      r.note,
      r.caption,
      r.location?.label,
      r.url,
      ...r.tagIds.map((id) => tagsById.get(id)?.name),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return terms.every((t) => hay.includes(t))
  })
}
