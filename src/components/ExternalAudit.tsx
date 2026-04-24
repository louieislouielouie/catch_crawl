'use client'

import { useMemo } from 'react'
import { PageData, LinkData } from '@/lib/types'
import AuditTable, { Column } from './AuditTable'

interface Props { pages: PageData[] }

interface ExtRow {
  sourceUrl: string
  href: string
  anchorText: string
  isNoFollow: boolean
  statusCode?: number
  domain: string
}

export default function ExternalAudit({ pages }: Props) {
  const rows = useMemo<ExtRow[]>(() => {
    const result: ExtRow[] = []
    for (const page of pages) {
      for (const link of page.externalLinks) {
        let domain = ''
        try { domain = new URL(link.href).hostname } catch {}
        result.push({
          sourceUrl: page.url,
          href: link.href,
          anchorText: link.anchorText,
          isNoFollow: link.isNoFollow,
          statusCode: link.statusCode,
          domain,
        })
      }
    }
    return result
  }, [pages])

  const columns: Column<ExtRow>[] = [
    {
      key: 'sourceUrl', label: 'Source Page', width: 240, sortable: true,
      render: r => (
        <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--text2)', textDecoration: 'none', fontFamily: 'IBM Plex Mono', fontSize: 11 }}
          title={r.sourceUrl}>
          {r.sourceUrl.replace(/^https?:\/\//, '').slice(0, 45)}{r.sourceUrl.length > 45 ? '…' : ''}
        </a>
      )
    },
    {
      key: 'href', label: 'External URL', width: 280, sortable: true,
      render: r => (
        <a href={r.href} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'IBM Plex Mono', fontSize: 11 }}
          title={r.href}>
          {r.href.slice(0, 60)}{r.href.length > 60 ? '…' : ''}
        </a>
      )
    },
    {
      key: 'domain', label: 'Domain', width: 160, sortable: true,
      render: r => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--text2)' }}>{r.domain}</span>
    },
    {
      key: 'anchorText', label: 'Anchor Text', width: 160,
      render: r => r.anchorText
        ? <span style={{ fontSize: 12, color: 'var(--text)' }}>{r.anchorText.slice(0, 40)}{r.anchorText.length > 40 ? '…' : ''}</span>
        : <span style={{ color: 'var(--text3)', fontSize: 12 }}>No anchor</span>
    },
    {
      key: 'isNoFollow', label: 'Follow', width: 90,
      render: r => r.isNoFollow
        ? <span className="badge badge-gray">nofollow</span>
        : <span className="badge badge-blue">follow</span>
    },
    {
      key: 'statusCode', label: 'Status', width: 90, sortable: true,
      render: r => {
        if (r.statusCode === undefined) return <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>
        const color = r.statusCode === 200 ? 'green' : r.statusCode >= 400 ? 'red' : r.statusCode >= 300 ? 'orange' : 'gray'
        return <span className={`badge badge-${color}`}>{r.statusCode || 'Error'}</span>
      }
    },
  ]

  const filters = [
    { label: 'Broken (4xx/5xx)', fn: (r: ExtRow) => !!(r.statusCode && r.statusCode >= 400) },
    { label: 'Redirects', fn: (r: ExtRow) => !!(r.statusCode && r.statusCode >= 300 && r.statusCode < 400) },
    { label: 'NoFollow', fn: (r: ExtRow) => r.isNoFollow },
    { label: 'Follow', fn: (r: ExtRow) => !r.isNoFollow },
    { label: 'Unchecked', fn: (r: ExtRow) => r.statusCode === undefined },
  ]

  // Domain summary
  const domainCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of rows) counts.set(r.domain, (counts.get(r.domain) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [rows])

  return (
    <div className="fade-in">
      {/* Top domains */}
      {domainCounts.length > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Top linked domains
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {domainCounts.map(([domain, count]) => (
              <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 4, padding: '4px 10px' }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--text)' }}>{domain}</span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'var(--text3)' }}>×{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <AuditTable
        data={rows}
        columns={columns}
        filters={filters}
        searchFn={(r, q) => r.href.toLowerCase().includes(q) || r.domain.toLowerCase().includes(q) || r.anchorText.toLowerCase().includes(q)}
        rowKey={r => `${r.sourceUrl}::${r.href}`}
      />
    </div>
  )
}
