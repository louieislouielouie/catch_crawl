'use client'

import { useMemo } from 'react'
import { PageData } from '@/lib/types'
import AuditTable, { Column } from './AuditTable'

interface Props {
  pages: PageData[]
  sitemapUrls: string[]
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    u.hash = ''
    const path = u.pathname.replace(/\/$/, '') || '/'
    u.pathname = path
    return u.href
  } catch { return url }
}

export default function SitemapAudit({ pages, sitemapUrls }: Props) {
  // Merge crawled pages with sitemap-only URLs
  const rows = useMemo(() => {
    const crawledMap = new Map(pages.map(p => [normalizeUrl(p.url), p]))

    // Pages in sitemap but not crawled
    const sitemapOnlyUrls = sitemapUrls.filter(u => !crawledMap.has(normalizeUrl(u)))

    const sitemapOnlyRows = sitemapOnlyUrls.map(url => ({
      url,
      statusCode: -1, // unknown
      inSitemap: true,
      isCrawled: false,
      isIndexable: false,
      canonicalUrl: '',
      redirectChain: [],
      issues: [],
    }))

    const crawledRows = pages.map(p => ({
      url: p.url,
      statusCode: p.statusCode,
      inSitemap: p.inSitemap,
      isCrawled: true,
      isIndexable: p.isIndexable,
      canonicalUrl: p.canonicalUrl,
      redirectChain: p.redirectChain,
      issues: p.issues,
    }))

    return [...crawledRows, ...sitemapOnlyRows]
  }, [pages, sitemapUrls])

  type Row = typeof rows[0]

  const columns: Column<Row>[] = [
    {
      key: 'url', label: 'URL', width: 300, sortable: true,
      render: r => (
        <a href={r.url} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'IBM Plex Mono', fontSize: 12 }}
          title={r.url}>
          {r.url.replace(/^https?:\/\//, '').slice(0, 60)}{r.url.length > 60 ? '…' : ''}
        </a>
      )
    },
    {
      key: 'inSitemap', label: 'In Sitemap', width: 110,
      render: r => r.inSitemap
        ? <span className="badge badge-green">Yes</span>
        : <span className="badge badge-orange">No</span>
    },
    {
      key: 'isCrawled', label: 'Crawled', width: 100,
      render: r => r.isCrawled
        ? <span className="badge badge-green">Yes</span>
        : <span className="badge badge-gray">No</span>
    },
    {
      key: 'statusCode', label: 'Status', width: 90, sortable: true,
      render: r => {
        if (r.statusCode === -1) return <span style={{ color: 'var(--text3)', fontSize: 12 }}>Unknown</span>
        const color = r.statusCode === 200 ? 'green' : r.statusCode >= 400 ? 'red' : r.statusCode >= 300 ? 'orange' : 'gray'
        return <span className={`badge badge-${color}`}>{r.statusCode || '?'}</span>
      }
    },
    {
      key: 'isIndexable', label: 'Indexable', width: 100,
      render: r => r.isIndexable
        ? <span className="badge badge-green">Yes</span>
        : <span className="badge badge-gray">No</span>
    },
    {
      key: 'canonicalUrl', label: 'Canonical', width: 120,
      render: r => r.canonicalUrl
        ? <span className="badge badge-blue" title={r.canonicalUrl}>Set</span>
        : <span style={{ color: 'var(--text3)', fontSize: 12 }}>None</span>
    },
    {
      key: 'redirectChain', label: 'Redirect Chain', width: 140,
      render: r => {
        if (!r.redirectChain || r.redirectChain.length === 0) return <span style={{ color: 'var(--text3)', fontSize: 12 }}>None</span>
        return <span className="badge badge-orange">{r.redirectChain.length} hop{r.redirectChain.length > 1 ? 's' : ''}</span>
      }
    },
    {
      key: 'issues', label: 'Issues', width: 80,
      render: r => {
        const errors = r.issues.filter(i => i.type === 'error').length
        const warnings = r.issues.filter(i => i.type === 'warning').length
        if (errors > 0) return <span className="badge badge-red">{r.issues.length}</span>
        if (warnings > 0) return <span className="badge badge-orange">{r.issues.length}</span>
        if (r.issues.length > 0) return <span className="badge badge-blue">{r.issues.length}</span>
        return <span className="badge badge-green">0</span>
      }
    },
  ]

  const filters = [
    { label: 'In sitemap', fn: (r: Row) => r.inSitemap },
    { label: 'Missing from sitemap', fn: (r: Row) => !r.inSitemap && r.isIndexable },
    { label: 'Sitemap only (not crawled)', fn: (r: Row) => r.inSitemap && !r.isCrawled },
    { label: 'Redirected in sitemap', fn: (r: Row) => r.inSitemap && r.redirectChain.length > 0 },
    { label: 'Noindex in sitemap', fn: (r: Row) => r.inSitemap && !r.isIndexable },
  ]

  return (
    <div className="fade-in">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Sitemap URLs', value: sitemapUrls.length, color: 'var(--accent)' },
          { label: 'Crawled pages', value: pages.length, color: 'var(--text)' },
          { label: 'In sitemap', value: pages.filter(p => p.inSitemap).length, color: 'var(--green)' },
          { label: 'Missing from sitemap', value: pages.filter(p => !p.inSitemap && p.isIndexable).length, color: 'var(--orange)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <AuditTable
        data={rows}
        columns={columns}
        filters={filters}
        searchFn={(r, q) => r.url.toLowerCase().includes(q)}
        rowKey={r => r.url}
      />
    </div>
  )
}
