import { NextRequest, NextResponse } from 'next/server'
import { parsePage } from '@/lib/parser'
import { normalizeUrl } from '@/lib/urls'

const USER_AGENT = 'CatchCrawl/1.0 SEO Auditor'
const TIMEOUT = 15000

export const maxDuration = 55 // Vercel max

export async function POST(req: NextRequest) {
  const { url, rootUrl, sitemapUrls = [] } = await req.json()

  if (!url || !rootUrl) {
    return NextResponse.json({ error: 'url and rootUrl required' }, { status: 400 })
  }

  const start = Date.now()
  const redirectChain: string[] = []
  let currentUrl = url
  let html = ''
  let statusCode = 0
  let contentType = ''

  // Manual redirect following
  for (let i = 0; i <= 5; i++) {
    let res: Response
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT)
      res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        },
      })
      clearTimeout(timer)
    } catch (err: any) {
      return NextResponse.json({
        url,
        statusCode: 0,
        redirectChain,
        error: err.message ?? 'Fetch failed',
        internalLinks: [],
        externalLinks: [],
        issues: [{ type: 'error', code: 'UNREACHABLE', message: err.message ?? 'Page unreachable' }],
      })
    }

    statusCode = res.status
    contentType = res.headers.get('content-type') ?? ''

    if (statusCode >= 300 && statusCode < 400) {
      const loc = res.headers.get('location')
      if (!loc) break
      try {
        redirectChain.push(currentUrl)
        currentUrl = new URL(loc, currentUrl).href
        continue
      } catch { break }
    }

    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return NextResponse.json({ url, statusCode, redirectChain, internalLinks: [], externalLinks: [], issues: [] })
    }

    try { html = await res.text() } catch { html = '' }
    break
  }

  if (!html) {
    return NextResponse.json({ url, statusCode, redirectChain, internalLinks: [], externalLinks: [], issues: [] })
  }

  const loadTimeMs = Date.now() - start
  const pageData = parsePage(html, url, rootUrl, statusCode, loadTimeMs, redirectChain, sitemapUrls)

  return NextResponse.json(pageData)
}
