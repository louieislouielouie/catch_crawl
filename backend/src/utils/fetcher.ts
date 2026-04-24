import fetch from 'node-fetch'

const USER_AGENT = 'SEOAuditor/1.0 (+https://github.com/your-org/seo-auditor)'
const TIMEOUT_MS = 15000

export interface FetchResult {
  html: string
  statusCode: number
  redirectChain: string[]
  contentType: string
  loadTimeMs: number
  error?: string
}

export async function fetchPage(url: string, maxRedirects = 5): Promise<FetchResult> {
  const redirectChain: string[] = []
  let currentUrl = url
  const start = Date.now()

  for (let i = 0; i <= maxRedirects; i++) {
    let response
    try {
      response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        // @ts-ignore
        timeout: TIMEOUT_MS,
      })
    } catch (err: any) {
      return {
        html: '',
        statusCode: 0,
        redirectChain,
        contentType: '',
        loadTimeMs: Date.now() - start,
        error: err.message ?? 'Fetch failed',
      }
    }

    const statusCode = response.status
    const contentType = response.headers.get('content-type') ?? ''

    // Handle redirects manually so we can track the chain
    if (statusCode >= 300 && statusCode < 400) {
      const location = response.headers.get('location')
      if (!location) {
        return { html: '', statusCode, redirectChain, contentType, loadTimeMs: Date.now() - start }
      }
      try {
        const next = new URL(location, currentUrl).href
        redirectChain.push(currentUrl)
        currentUrl = next
        continue
      } catch {
        return { html: '', statusCode, redirectChain, contentType, loadTimeMs: Date.now() - start }
      }
    }

    // Non-HTML (images, PDFs etc)
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return { html: '', statusCode, redirectChain, contentType, loadTimeMs: Date.now() - start }
    }

    let html = ''
    try {
      html = await response.text()
    } catch (err: any) {
      return { html: '', statusCode, redirectChain, contentType, loadTimeMs: Date.now() - start, error: err.message }
    }

    return { html, statusCode, redirectChain, contentType, loadTimeMs: Date.now() - start }
  }

  return {
    html: '',
    statusCode: 0,
    redirectChain,
    contentType: '',
    loadTimeMs: Date.now() - start,
    error: 'Too many redirects',
  }
}

export async function fetchHead(url: string): Promise<{ statusCode: number; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT },
      // @ts-ignore
      timeout: 10000,
    })
    return { statusCode: response.status }
  } catch (err: any) {
    return { statusCode: 0, error: err.message }
  }
}

export async function fetchSitemap(rootUrl: string): Promise<string[]> {
  const candidates = [
    `${rootUrl}/sitemap.xml`,
    `${rootUrl}/sitemap_index.xml`,
    `${rootUrl}/sitemap/sitemap.xml`,
  ]

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        headers: { 'User-Agent': USER_AGENT },
        // @ts-ignore
        timeout: TIMEOUT_MS,
      })
      if (res.ok) {
        const text = await res.text()
        return parseSitemapXml(text)
      }
    } catch {
      // try next
    }
  }
  return []
}

function parseSitemapXml(xml: string): string[] {
  const urls: string[] = []
  // Simple regex-based extraction (avoids xml2js complexity)
  const locRegex = /<loc>(.*?)<\/loc>/gi
  let match
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim()
    // If this is a sitemap index pointing to other sitemaps, skip sub-sitemaps
    if (!url.endsWith('.xml')) {
      urls.push(url)
    }
  }
  return urls
}
