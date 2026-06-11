export interface ReelLocation {
  lat: number
  lng: number
  label: string
}

export interface Reel {
  id: string // uuid
  shortcode: string // parsed from the IG url, used for dedupe
  url: string // canonical https://www.instagram.com/reel/<shortcode>/
  title?: string
  caption?: string // best-effort text the share sheet passed along
  note?: string
  tagIds: string[]
  listIds: string[]
  location?: ReelLocation
  createdAt: number
  updatedAt: number
}

export interface List {
  id: string
  name: string
  color?: string
  createdAt: number
}

export interface Tag {
  id: string
  name: string // normalized lowercase
}
