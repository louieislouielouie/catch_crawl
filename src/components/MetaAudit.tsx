'use client'

import { PageData } from '@/lib/types'
import AuditTable, { Column } from './AuditTable'

interface Props { pages: PageData[] }

function StatusBadge({ code }: { code: number }) {
  const color = code === 200 ? 'green' : code >= 400 ? 'red' : code >= 300 ? 'orange' : 'gray'
  return <span className={`badge badge-${color}`}>{code || '—'}</span>
}

function LengthBadge({ len, min, max }: { len: number; min: number; max: number }) {
  if (len === 0) return <span className="badge badge-red">Missing</span>
  if (len > max) return <span className="badge badge-orange">{len} (long)</span>
  if (len < min) return <span className="badge badge-orange">{len} (short)</span>
  return <span className="badge badge-green">{len}</span>
}

export default function MetaAudit({ pages }: Props) {
  const columns: Column<PageData>[] = [
    {
      key: 'url', label: 'URL', width: 260, sortable: true,
      render: p => (
        <a href={p.url} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: 'IBM Plex Mono', fontSize: 12 }}
          title={p.url}>
          {p.url.replace(/^https?:\/\//, '').slice(0, 50)}{p.url.length > 50 ? '…' : ''}
        </a>
      )
    },
    { key: 'statusCode', label: 'Status', width: 80, sortable: true, render: p => <StatusBadge code={p.statusCode} /> },
    {
      key: 'title', label: 'Title', width: 220,
      render: p => p.title
        ? <span title={p.title} style={{ color: 'var(--text)' }}>{p.title.slice(0, 60)}{p.title.length > 60 ? '…' : ''}</span>
        : <span className="badge badge-red">Missing</span>
    },
    { key: 'titleLength', label: 'Title Len', width: 100, sortable: true, render: p => <LengthBadge len={p.titleLength} min={30} max={60} /> },
    {
      key: 'metaDescription', label: 'Description', width: 220,
      render: p => p.metaDescription
        ? <span title={p.metaDescription} style={{ color: 'var(--text)' }}>{p.metaDescription.slice(0, 70)}{p.metaDescription.length > 70 ? '…' : ''}</span>
        : <span className="badge badge-red">Missing</span>
    },
    { key: 'metaDescriptionLength', label: 'Desc Len', width: 100, sortable: true, render: p => <LengthBadge len={p.metaDescriptionLength} min={70} max={160} /> },
    {
      key: 'canonicalUrl', label: 'Canonical', width: 140,
      render: p => p.canonicalUrl
        ? <span className="badge badge-blue" title={p.canonicalUrl}>Set</span>
        : <span style={{ color: 'var(--text3)', fontSize: 12 }}>None</span>
    },
    {
      key: 'metaRobots', label: 'Robots', width: 110,
      render: p => p.metaRobots
        ? <span className={`badge ${p.metaRobots.includes('noindex') ? 'badge-orange' : 'badge-gray'}`}>{p.metaRobots}</span>
        : <span style={{ color: 'var(--text3)', fontSize: 12 }}>index</span>
    },
    {
      key: 'ogTitle', label: 'OG Title', width: 100,
      render: p => p.ogTitle ? <span className="badge badge-green">✓</span> : <span className="badge badge-gray">None</span>
    },
    {
      key: 'ogImage', label: 'OG Image', width: 100,
      render: p => p.ogImage ? <span className="badge badge-green">✓</span> : <span className="badge badge-gray">None</span>
    },
  ]

  const filters = [
    { label: 'Missing title', fn: (p: PageData) => !p.title },
    { label: 'Title too long', fn: (p: PageData) => p.titleLength > 60 },
    { label: 'Missing desc', fn: (p: PageData) => !p.metaDescription },
    { label: 'Desc too long', fn: (p: PageData) => p.metaDescriptionLength > 160 },
    { label: 'Noindex', fn: (p: PageData) => p.metaRobots.includes('noindex') },
    { label: 'No OG', fn: (p: PageData) => !p.ogTitle },
  ]

  return (
    <div className="fade-in">
      <AuditTable
        data={pages}
        columns={columns}
        filters={filters}
        searchFn={(p, q) => p.url.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.metaDescription.toLowerCase().includes(q)}
        rowKey={p => p.url}
      />
    </div>
  )
}
