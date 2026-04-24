export function resolveUrl(href: string, base: string): string | null {
  try {
    if (!href) return null
    const t = href.trim()
    if (t.startsWith('mailto:') || t.startsWith('tel:') || t.startsWith('javascript:') || t.startsWith('#') || t.startsWith('data:')) return null
    return new URL(t, base).href
  } catch { return null }
}

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    u.hash = ''
    u.pathname = u.pathname.replace(/\/$/, '') || '/'
    return u.href
  } catch { return url }
}

export function isInternal(url: string, rootUrl: string): boolean {
  try {
    return new URL(url).hostname.replace(/^www\./, '') === new URL(rootUrl).hostname.replace(/^www\./, '')
  } catch { return false }
}

export function isCrawlable(url: string): boolean {
  try {
    const ext = new URL(url).pathname.split('.').pop()?.toLowerCase()
    const skip = ['jpg','jpeg','png','gif','svg','webp','pdf','zip','doc','docx','xls','xlsx','mp4','mp3','css','js','woff','woff2','ttf','ico']
    return !ext || !skip.includes(ext)
  } catch { return false }
}

export function getRootUrl(url: string): string {
  const u = new URL(url)
  return `${u.protocol}//${u.host}`
}
