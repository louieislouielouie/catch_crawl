import { v4 as uuidv4 } from 'uuid'
import { CrawlJob } from './types'
import { fetchPage, fetchHead, fetchSitemap } from './utils/fetcher'
import { parsePage } from './utils/parser'
import { normalizeUrl, isInternal, isCrawlable, getRootUrl } from './utils/urls'

// In-memory store (swap for Redis/DB in production)
export const jobs = new Map<string, CrawlJob>()

export async function startCrawl(inputUrl: string, maxPages = 500): Promise<string> {
  const id = uuidv4()
  let rootUrl: string
  try {
    const u = new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`)
    rootUrl = `${u.protocol}//${u.host}`
  } catch {
    throw new Error('Invalid URL')
  }

  const job: CrawlJob = {
    id,
    rootUrl,
    startedAt: new Date().toISOString(),
    status: 'crawling',
    pages: [],
    queue: [normalizeUrl(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`)],
    visited: [],
    sitemapUrls: [],
    maxPages,
  }

  jobs.set(id, job)

  // Run async (don't await — return ID immediately)
  runCrawl(id).catch(err => {
    const j = jobs.get(id)
    if (j) {
      j.status = 'error'
      j.errorMessage = err.message
    }
  })

  return id
}

async function runCrawl(id: string) {
  const job = jobs.get(id)
  if (!job) return

  // Fetch sitemap first
  try {
    job.sitemapUrls = await fetchSitemap(job.rootUrl)
    // Add sitemap URLs to queue
    for (const u of job.sitemapUrls) {
      const norm = normalizeUrl(u)
      if (!job.visited.includes(norm) && !job.queue.includes(norm)) {
        job.queue.push(norm)
      }
    }
  } catch {
    // sitemap is optional
  }

  const CONCURRENCY = 3

  while (job.queue.length > 0 && job.visited.length < job.maxPages) {
    // Pull a batch
    const batch = job.queue.splice(0, CONCURRENCY)

    await Promise.all(batch.map(async (url) => {
      if (job.visited.includes(url)) return
      job.visited.push(url)

      if (!isCrawlable(url)) return

      const result = await fetchPage(url)

      // If this was a redirect, the final URL may differ
      const finalUrl = result.redirectChain.length > 0
        ? result.redirectChain[result.redirectChain.length - 1] ?? url
        : url

      if (result.error && result.statusCode === 0) {
        // Unreachable page — still record it
        job.pages.push({
          url,
          statusCode: 0,
          redirectChain: result.redirectChain,
          title: '',
          titleLength: 0,
          metaDescription: '',
          metaDescriptionLength: 0,
          metaRobots: '',
          canonicalUrl: '',
          ogTitle: '',
          ogDescription: '',
          ogImage: '',
          h1: [],
          h2: [],
          h3: [],
          wordCount: 0,
          internalLinks: [],
          externalLinks: [],
          loadTimeMs: result.loadTimeMs,
          inSitemap: job.sitemapUrls.some(s => normalizeUrl(s) === url),
          isIndexable: false,
          contentType: '',
          issues: [{ type: 'error', code: 'UNREACHABLE', message: result.error ?? 'Page unreachable' }],
        })
        return
      }

      if (!result.html) return // non-HTML resource

      const pageData = parsePage(
        result.html,
        url,
        job.rootUrl,
        result.statusCode,
        result.loadTimeMs,
        result.redirectChain,
        result.contentType,
        job.sitemapUrls
      )

      job.pages.push(pageData)

      // Enqueue discovered internal links
      for (const link of pageData.internalLinks) {
        const norm = normalizeUrl(link.href)
        if (
          isInternal(norm, job.rootUrl) &&
          !job.visited.includes(norm) &&
          !job.queue.includes(norm) &&
          isCrawlable(norm)
        ) {
          job.queue.push(norm)
        }
      }
    }))
  }

  // Check external links
  job.status = 'checking_externals'
  const allExternalLinks = new Map<string, number>() // href -> statusCode

  for (const page of job.pages) {
    for (const link of page.externalLinks) {
      if (!allExternalLinks.has(link.href)) {
        allExternalLinks.set(link.href, -1)
      }
    }
  }

  // Check up to 100 external links (batch with concurrency)
  const externalUrls = Array.from(allExternalLinks.keys()).slice(0, 100)
  const EXT_CONCURRENCY = 5

  for (let i = 0; i < externalUrls.length; i += EXT_CONCURRENCY) {
    const batch = externalUrls.slice(i, i + EXT_CONCURRENCY)
    await Promise.all(batch.map(async (href) => {
      const result = await fetchHead(href)
      allExternalLinks.set(href, result.statusCode)
    }))
  }

  // Write status codes back to page data
  for (const page of job.pages) {
    for (const link of page.externalLinks) {
      const code = allExternalLinks.get(link.href)
      if (code !== undefined) {
        link.statusCode = code
      }
    }
  }

  job.status = 'complete'
  job.completedAt = new Date().toISOString()
}
