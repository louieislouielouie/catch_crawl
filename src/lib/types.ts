export interface PageData {
  url: string
  statusCode: number
  redirectChain: string[]
  title: string
  titleLength: number
  metaDescription: string
  metaDescriptionLength: number
  metaRobots: string
  canonicalUrl: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  h1: string[]
  h2: string[]
  h3: string[]
  wordCount: number
  internalLinks: LinkData[]
  externalLinks: LinkData[]
  loadTimeMs: number
  inSitemap: boolean
  isIndexable: boolean
  issues: Issue[]
}

export interface LinkData {
  href: string
  anchorText: string
  isNoFollow: boolean
  statusCode?: number
}

export interface Issue {
  type: 'error' | 'warning' | 'info'
  code: string
  message: string
}
