import { PageData } from './types'

export interface AuditSummary {
  totalPages: number
  indexablePages: number
  errorPages: number      // 4xx/5xx
  redirectPages: number   // 3xx
  okPages: number         // 200

  // Meta
  missingTitles: number
  duplicateTitles: number
  longTitles: number
  shortTitles: number
  missingDescriptions: number
  duplicateDescriptions: number
  longDescriptions: number
  shortDescriptions: number

  // Content
  missingH1: number
  multipleH1: number
  thinContent: number

  // Sitemap
  inSitemap: number
  notInSitemap: number

  // External
  totalExternalLinks: number
  brokenExternalLinks: number
  uniqueExternalDomains: number

  // Issues
  totalErrors: number
  totalWarnings: number
  totalInfos: number
}

export function computeSummary(pages: PageData[]): AuditSummary {
  const titleCounts = new Map<string, number>()
  const descCounts = new Map<string, number>()

  for (const p of pages) {
    if (p.title) titleCounts.set(p.title, (titleCounts.get(p.title) ?? 0) + 1)
    if (p.metaDescription) descCounts.set(p.metaDescription, (descCounts.get(p.metaDescription) ?? 0) + 1)
  }

  const dupTitles = new Set([...titleCounts.entries()].filter(([,c]) => c > 1).map(([t]) => t))
  const dupDescs  = new Set([...descCounts.entries()].filter(([,c]) => c > 1).map(([d]) => d))

  const externalLinks = pages.flatMap(p => p.externalLinks ?? [])
  const uniqueDomains = new Set(externalLinks.map(l => { try { return new URL(l.href).hostname } catch { return '' } }).filter(Boolean))

  let totalErrors = 0, totalWarnings = 0, totalInfos = 0
  for (const p of pages) {
    for (const i of (p.issues ?? [])) {
      if (i.type === 'error') totalErrors++
      else if (i.type === 'warning') totalWarnings++
      else totalInfos++
    }
  }

  return {
    totalPages: pages.length,
    indexablePages: pages.filter(p => p.isIndexable).length,
    errorPages: pages.filter(p => p.statusCode >= 400).length,
    redirectPages: pages.filter(p => p.statusCode >= 300 && p.statusCode < 400).length,
    okPages: pages.filter(p => p.statusCode === 200).length,

    missingTitles: pages.filter(p => !p.title).length,
    duplicateTitles: pages.filter(p => p.title && dupTitles.has(p.title)).length,
    longTitles: pages.filter(p => p.titleLength > 60).length,
    shortTitles: pages.filter(p => p.title && p.titleLength < 30).length,

    missingDescriptions: pages.filter(p => !p.metaDescription).length,
    duplicateDescriptions: pages.filter(p => p.metaDescription && dupDescs.has(p.metaDescription)).length,
    longDescriptions: pages.filter(p => p.metaDescriptionLength > 160).length,
    shortDescriptions: pages.filter(p => p.metaDescription && p.metaDescriptionLength < 70).length,

    missingH1: pages.filter(p => (p.h1 ?? []).length === 0).length,
    multipleH1: pages.filter(p => (p.h1 ?? []).length > 1).length,
    thinContent: pages.filter(p => p.wordCount > 0 && p.wordCount < 300).length,

    inSitemap: pages.filter(p => p.inSitemap).length,
    notInSitemap: pages.filter(p => !p.inSitemap && p.isIndexable).length,

    totalExternalLinks: externalLinks.length,
    brokenExternalLinks: externalLinks.filter(l => l.statusCode && l.statusCode >= 400).length,
    uniqueExternalDomains: uniqueDomains.size,

    totalErrors,
    totalWarnings,
    totalInfos,
  }
}
