export function resolveUrl(href: string, base: string): string | null {
  try {
    if (!href) return null
    const trimmed = href.trim()
    if (
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:') ||
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('data:')
    ) return null
    return new URL(trimmed, base).href
  } catch {
    return null
  }
}

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    u.hash = ''
    // Remove trailing slash unless root
    const path = u.pathname.replace(/\/$/, '') || '/'
    u.pathname = path
    return u.href
  } catch {
    return url
  }
}

export function isInternal(url: string, rootUrl: string): boolean {
  try {
    const urlHost = new URL(url).hostname.replace(/^www\./, '')
    const rootHost = new URL(rootUrl).hostname.replace(/^www\./, '')
    return urlHost === rootHost
  } catch {
    return false
  }
}

export function isCrawlable(url: string): boolean {
  try {
    const u = new URL(url)
    // Skip common non-page extensions
    const ext = u.pathname.split('.').pop()?.toLowerCase()
    const skip = ['jpg','jpeg','png','gif','svg','webp','pdf','zip','doc','docx','xls','xlsx','mp4','mp3','css','js','woff','woff2','ttf','ico']
    if (ext && skip.includes(ext)) return false
    return true
  } catch {
    return false
  }
}

export function getRootUrl(url: string): string {
  const u = new URL(url)
  return `${u.protocol}//${u.host}`
}
