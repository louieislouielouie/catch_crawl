export interface PageData {
  url: string
  statusCode: number
  redirectUrl?: string
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
  contentType: string
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

export interface CrawlStatus {
  id: string
  rootUrl: string
  status: 'queued' | 'crawling' | 'checking_externals' | 'complete' | 'error'
  crawled: number
  queued: number
  total: number
  startedAt: string
  completedAt?: string
  errorMessage?: string
}

export interface CrawlResults {
  id: string
  rootUrl: string
  status: string
  startedAt: string
  completedAt?: string
  sitemapUrls: string[]
  pages: PageData[]
}
