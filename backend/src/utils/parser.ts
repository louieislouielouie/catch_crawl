import * as cheerio from 'cheerio'
import { PageData, LinkData, Issue } from '../types'
import { resolveUrl, isInternal, normalizeUrl } from './urls'

export function parsePage(
  html: string,
  url: string,
  rootUrl: string,
  statusCode: number,
  loadTimeMs: number,
  redirectChain: string[],
  contentType: string,
  sitemapUrls: string[]
): PageData {
  const $ = cheerio.load(html)
  const issues: Issue[] = []

  // ── Meta ──────────────────────────────────────────────
  const title = $('title').first().text().trim()
  const titleLength = title.length

  const metaDescription = $('meta[name="description"]').attr('content')?.trim() ?? ''
  const metaDescriptionLength = metaDescription.length

  const metaRobots = $('meta[name="robots"]').attr('content')?.toLowerCase().trim() ?? ''
  const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() ?? ''

  // ── OG ───────────────────────────────────────────────
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() ?? ''
  const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() ?? ''
  const ogImage = $('meta[property="og:image"]').attr('content')?.trim() ?? ''

  // ── Headings ─────────────────────────────────────────
  const h1: string[] = []
  const h2: string[] = []
  const h3: string[] = []
  $('h1').each((_, el) => { const t = $(el).text().trim(); if (t) h1.push(t) })
  $('h2').each((_, el) => { const t = $(el).text().trim(); if (t) h2.push(t) })
  $('h3').each((_, el) => { const t = $(el).text().trim(); if (t) h3.push(t) })

  // ── Word count ────────────────────────────────────────
  const $body = $.root().clone()
  $body.find('script, style, nav, header, footer, [role="navigation"]').remove()
  const bodyText = $body.find('body').text().replace(/\s+/g, ' ').trim()
  const wordCount = bodyText ? bodyText.split(' ').filter(Boolean).length : 0

  // ── Links ─────────────────────────────────────────────
  const internalLinks: LinkData[] = []
  const externalLinks: LinkData[] = []
  const seenHrefs = new Set<string>()

  $('a[href]').each((_, el) => {
    const rawHref = $(el).attr('href') ?? ''
    const resolved = resolveUrl(rawHref, url)
    if (!resolved) return
    const normalized = normalizeUrl(resolved)
    if (seenHrefs.has(normalized)) return
    seenHrefs.add(normalized)

    const anchorText = $(el).text().trim()
    const rel = $(el).attr('rel') ?? ''
    const isNoFollow = rel.toLowerCase().includes('nofollow')

    const link: LinkData = { href: normalized, anchorText, isNoFollow }

    if (isInternal(normalized, rootUrl)) {
      internalLinks.push(link)
    } else {
      externalLinks.push(link)
    }
  })

  // ── Indexability ─────────────────────────────────────
  const isIndexable =
    statusCode === 200 &&
    !metaRobots.includes('noindex') &&
    !metaRobots.includes('none') &&
    (canonicalUrl === '' || normalizeUrl(canonicalUrl) === normalizeUrl(url))

  // ── Issues ────────────────────────────────────────────

  // Title issues
  if (!title) {
    issues.push({ type: 'error', code: 'MISSING_TITLE', message: 'Page has no title tag' })
  } else if (titleLength < 30) {
    issues.push({ type: 'warning', code: 'SHORT_TITLE', message: `Title too short (${titleLength} chars, recommended 30–60)` })
  } else if (titleLength > 60) {
    issues.push({ type: 'warning', code: 'LONG_TITLE', message: `Title too long (${titleLength} chars, recommended 30–60)` })
  }

  // Description issues
  if (!metaDescription) {
    issues.push({ type: 'warning', code: 'MISSING_DESCRIPTION', message: 'Page has no meta description' })
  } else if (metaDescriptionLength < 70) {
    issues.push({ type: 'info', code: 'SHORT_DESCRIPTION', message: `Meta description short (${metaDescriptionLength} chars, recommended 70–160)` })
  } else if (metaDescriptionLength > 160) {
    issues.push({ type: 'warning', code: 'LONG_DESCRIPTION', message: `Meta description too long (${metaDescriptionLength} chars, recommended 70–160)` })
  }

  // H1 issues
  if (h1.length === 0) {
    issues.push({ type: 'warning', code: 'MISSING_H1', message: 'Page has no H1 tag' })
  } else if (h1.length > 1) {
    issues.push({ type: 'warning', code: 'MULTIPLE_H1', message: `Page has ${h1.length} H1 tags (should have 1)` })
  }

  // Canonical issues
  if (canonicalUrl && normalizeUrl(canonicalUrl) !== normalizeUrl(url)) {
    issues.push({ type: 'info', code: 'CANONICAL_DIFFERENT', message: `Canonical points to different URL: ${canonicalUrl}` })
  }

  // Noindex
  if (metaRobots.includes('noindex')) {
    issues.push({ type: 'info', code: 'NOINDEX', message: 'Page is marked noindex' })
  }

  // Thin content
  if (wordCount > 0 && wordCount < 300) {
    issues.push({ type: 'warning', code: 'THIN_CONTENT', message: `Low word count (${wordCount} words, recommended 300+)` })
  }

  // Sitemap
  const inSitemap = sitemapUrls.some(s => normalizeUrl(s) === normalizeUrl(url))
  if (!inSitemap && isIndexable) {
    issues.push({ type: 'info', code: 'NOT_IN_SITEMAP', message: 'Indexable page not found in sitemap' })
  }

  // Redirect chain
  if (redirectChain.length > 1) {
    issues.push({ type: 'warning', code: 'REDIRECT_CHAIN', message: `Page has a redirect chain (${redirectChain.length} hops)` })
  }

  // Status errors
  if (statusCode >= 400) {
    issues.push({ type: 'error', code: `HTTP_${statusCode}`, message: `Page returned ${statusCode} status code` })
  }

  return {
    url,
    statusCode,
    redirectChain,
    redirectUrl: redirectChain.length > 0 ? redirectChain[redirectChain.length - 1] : undefined,
    title,
    titleLength,
    metaDescription,
    metaDescriptionLength,
    metaRobots,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage,
    h1,
    h2,
    h3,
    wordCount,
    internalLinks,
    externalLinks,
    loadTimeMs,
    inSitemap,
    isIndexable,
    contentType,
    issues,
  }
}
