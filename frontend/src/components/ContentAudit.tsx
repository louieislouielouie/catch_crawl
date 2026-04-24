'use client'

import { PageData } from '@/lib/types'
import AuditTable, { Column } from './AuditTable'

interface Props { pages: PageData[] }

export default function ContentAudit({ pages }: Props) {
  const columns: Column<PageData>[] = [
    {
      key: 'url', label: 'URL', width: 280, sortable: true,
      render: p => (
        <a href={p.url} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'IBM Plex Mono', fontSize: 12 }}
          title={p.url}>
          {p.url.replace(/^https?:\/\//, '').slice(0, 55)}{p.url.length > 55 ? '…' : ''}
        </a>
      )
    },
    {
      key: 'wordCount', label: 'Words', width: 100, sortable: true,
      render: p => {
        if (p.wordCount === 0) return <span style={{ color: 'var(--text3)' }}>—</span>
        const color = p.wordCount < 300 ? 'var(--orange)' : 'var(--green)'
        return <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color }}>{p.wordCount.toLocaleString()}</span>
      }
    },
    {
      key: 'h1', label: 'H1', width: 200,
      render: p => {
        if (p.h1.length === 0) return <span className="badge badge-red">Missing</span>
        if (p.h1.length > 1) return <span className="badge badge-orange">{p.h1.length} H1s</span>
        return <span style={{ fontSize: 12, color: 'var(--text)' }} title={p.h1[0]}>{p.h1[0].slice(0, 50)}{p.h1[0].length > 50 ? '…' : ''}</span>
      }
    },
    {
      key: 'h2', label: 'H2s', width: 70,
      render: p => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--text2)' }}>{p.h2.length}</span>
    },
    {
      key: 'h3', label: 'H3s', width: 70,
      render: p => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--text2)' }}>{p.h3.length}</span>
    },
    {
      key: 'isIndexable', label: 'Indexable', width: 100,
      render: p => p.isIndexable
        ? <span className="badge badge-green">Yes</span>
        : <span className="badge badge-gray">No</span>
    },
    {
      key: 'inSitemap', label: 'In Sitemap', width: 110,
      render: p => p.inSitemap
        ? <span className="badge badge-green">Yes</span>
        : <span className="badge badge-gray">No</span>
    },
    {
      key: 'loadTimeMs', label: 'Load Time', width: 110, sortable: true,
      render: p => {
        if (!p.loadTimeMs) return <span style={{ color: 'var(--text3)' }}>—</span>
        const color = p.loadTimeMs > 3000 ? 'var(--red)' : p.loadTimeMs > 1500 ? 'var(--orange)' : 'var(--green)'
        return <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color }}>{p.loadTimeMs}ms</span>
      }
    },
    {
      key: 'internalLinks', label: 'Int. Links', width: 100,
      render: p => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--text2)' }}>{p.internalLinks.length}</span>
    },
    {
      key: 'externalLinks', label: 'Ext. Links', width: 100,
      render: p => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--text2)' }}>{p.externalLinks.length}</span>
    },
    {
      key: 'issues', label: 'Issues', width: 80,
      render: p => {
        const errors = p.issues.filter(i => i.type === 'error').length
        const warnings = p.issues.filter(i => i.type === 'warning').length
        if (errors > 0) return <span className="badge badge-red">{p.issues.length}</span>
        if (warnings > 0) return <span className="badge badge-orange">{p.issues.length}</span>
        if (p.issues.length > 0) return <span className="badge badge-blue">{p.issues.length}</span>
        return <span className="badge badge-green">0</span>
      }
    },
  ]

  const filters = [
    { label: 'Thin content', fn: (p: PageData) => p.wordCount > 0 && p.wordCount < 300 },
    { label: 'No H1', fn: (p: PageData) => p.h1.length === 0 },
    { label: 'Multiple H1', fn: (p: PageData) => p.h1.length > 1 },
    { label: 'Not indexed', fn: (p: PageData) => !p.isIndexable },
    { label: 'Not in sitemap', fn: (p: PageData) => !p.inSitemap && p.isIndexable },
    { label: 'Slow (>2s)', fn: (p: PageData) => p.loadTimeMs > 2000 },
  ]

  return (
    <div className="fade-in">
      <AuditTable
        data={pages}
        columns={columns}
        filters={filters}
        searchFn={(p, q) => p.url.toLowerCase().includes(q) || (p.h1[0] ?? '').toLowerCase().includes(q)}
        rowKey={p => p.url}
      />
    </div>
  )
}
