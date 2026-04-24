import * as cheerio from 'cheerio'
import { PageData, LinkData, Issue } from './types'
import { resolveUrl, isInternal, normalizeUrl } from './urls'

export function parsePage(
  html: string,
  url: string,
  rootUrl: string,
  statusCode: number,
  loadTimeMs: number,
  redirectChain: string[],
  sitemapUrls: string[]
): PageData {
  const $ = cheerio.load(html)
  const issues: Issue[] = []

  const title = $('title').first().text().trim()
  const titleLength = title.length
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() ?? ''
  const metaDescriptionLength = metaDescription.length
  const metaRobots = $('meta[name="robots"]').attr('content')?.toLowerCase().trim() ?? ''
  const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() ?? ''
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() ?? ''
  const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() ?? ''
  const ogImage = $('meta[property="og:image"]').attr('content')?.trim() ?? ''

  const h1: string[] = [], h2: string[] = [], h3: string[] = []
  $('h1').each((_, el) => { const t = $(el).text().trim(); if (t) h1.push(t) })
  $('h2').each((_, el) => { const t = $(el).text().trim(); if (t) h2.push(t) })
  $('h3').each((_, el) => { const t = $(el).text().trim(); if (t) h3.push(t) })

  $('script, style, nav, header, footer').remove()
  const wordCount = $('body').text().replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length

  const internalLinks: LinkData[] = [], externalLinks: LinkData[] = []
  const seen = new Set<string>()
  $('a[href]').each((_, el) => {
    const resolved = resolveUrl($(el).attr('href') ?? '', url)
    if (!resolved) return
    const norm = normalizeUrl(resolved)
    if (seen.has(norm)) return
    seen.add(norm)
    const link: LinkData = {
      href: norm,
      anchorText: $(el).text().trim(),
      isNoFollow: ($(el).attr('rel') ?? '').toLowerCase().includes('nofollow'),
    }
    if (isInternal(norm, rootUrl)) internalLinks.push(link)
    else externalLinks.push(link)
  })

  const isIndexable = statusCode === 200 && !metaRobots.includes('noindex') && !metaRobots.includes('none') && (!canonicalUrl || normalizeUrl(canonicalUrl) === normalizeUrl(url))
  const inSitemap = sitemapUrls.some(s => normalizeUrl(s) === normalizeUrl(url))

  // Issues
  if (!title) issues.push({ type: 'error', code: 'MISSING_TITLE', message: 'Missing title tag' })
  else if (titleLength > 60) issues.push({ type: 'warning', code: 'LONG_TITLE', message: `Title too long (${titleLength} chars)` })
  else if (titleLength < 30) issues.push({ type: 'warning', code: 'SHORT_TITLE', message: `Title too short (${titleLength} chars)` })

  if (!metaDescription) issues.push({ type: 'warning', code: 'MISSING_DESC', message: 'Missing meta description' })
  else if (metaDescriptionLength > 160) issues.push({ type: 'warning', code: 'LONG_DESC', message: `Description too long (${metaDescriptionLength} chars)` })
  else if (metaDescriptionLength < 70) issues.push({ type: 'info', code: 'SHORT_DESC', message: `Description short (${metaDescriptionLength} chars)` })

  if (h1.length === 0) issues.push({ type: 'warning', code: 'MISSING_H1', message: 'No H1 tag found' })
  else if (h1.length > 1) issues.push({ type: 'warning', code: 'MULTIPLE_H1', message: `${h1.length} H1 tags found` })

  if (metaRobots.includes('noindex')) issues.push({ type: 'info', code: 'NOINDEX', message: 'Page is noindex' })
  if (canonicalUrl && normalizeUrl(canonicalUrl) !== normalizeUrl(url)) issues.push({ type: 'info', code: 'CANONICAL_DIFF', message: `Canonical points elsewhere` })
  if (wordCount > 0 && wordCount < 300) issues.push({ type: 'warning', code: 'THIN_CONTENT', message: `Thin content (${wordCount} words)` })
  if (redirectChain.length > 1) issues.push({ type: 'warning', code: 'REDIRECT_CHAIN', message: `Redirect chain (${redirectChain.length} hops)` })
  if (statusCode >= 400) issues.push({ type: 'error', code: `HTTP_${statusCode}`, message: `Page returned ${statusCode}` })
  if (!inSitemap && isIndexable) issues.push({ type: 'info', code: 'NOT_IN_SITEMAP', message: 'Not in sitemap' })

  return { url, statusCode, redirectChain, title, titleLength, metaDescription, metaDescriptionLength, metaRobots, canonicalUrl, ogTitle, ogDescription, ogImage, h1, h2, h3, wordCount, internalLinks, externalLinks, loadTimeMs, inSitemap, isIndexable, issues }
}
