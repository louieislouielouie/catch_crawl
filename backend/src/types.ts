export interface PageData {
  url: string
  statusCode: number
  redirectUrl?: string
  redirectChain: string[]

  // Meta
  title: string
  titleLength: number
  metaDescription: string
  metaDescriptionLength: number
  metaRobots: string
  canonicalUrl: string

  // OG
  ogTitle: string
  ogDescription: string
  ogImage: string

  // Headings
  h1: string[]
  h2: string[]
  h3: string[]

  // Content
  wordCount: number

  // Links
  internalLinks: LinkData[]
  externalLinks: LinkData[]

  // Technical
  loadTimeMs: number
  inSitemap: boolean
  isIndexable: boolean
  contentType: string

  // Issues (computed)
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

export interface CrawlJob {
  id: string
  rootUrl: string
  startedAt: string
  completedAt?: string
  status: 'queued' | 'crawling' | 'checking_externals' | 'complete' | 'error'
  errorMessage?: string
  pages: PageData[]
  queue: string[]
  visited: string[]
  sitemapUrls: string[]
  maxPages: number
}

export interface CrawlStatus {
  id: string
  rootUrl: string
  status: CrawlJob['status']
  crawled: number
  queued: number
  total: number
  startedAt: string
  completedAt?: string
  errorMessage?: string
}
