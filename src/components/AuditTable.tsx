'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronUp, ChevronDown } from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  width?: number | string
  render: (row: T) => React.ReactNode
}

interface Props<T> {
  data: T[]
  columns: Column<T>[]
  filters?: { label: string; fn: (row: T) => boolean }[]
  searchFn?: (row: T, query: string) => boolean
  rowKey: (row: T) => string
}

export default function AuditTable<T>({ data, columns, filters, searchFn, rowKey }: Props<T>) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(0)
  }

  const filtered = useMemo(() => {
    let rows = [...data]

    if (activeFilter && filters) {
      const f = filters.find(f => f.label === activeFilter)
      if (f) rows = rows.filter(f.fn)
    }

    if (search && searchFn) {
      rows = rows.filter(r => searchFn(r, search.toLowerCase()))
    }

    if (sortKey) {
      rows.sort((a, b) => {
        const col = columns.find(c => c.key === sortKey)
        if (!col) return 0
        // Simple string sort on rendered text content — works for most columns
        const aVal = String((a as any)[sortKey] ?? '')
        const bVal = String((b as any)[sortKey] ?? '')
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      })
    }

    return rows
  }, [data, activeFilter, search, sortKey, sortDir, filters, searchFn, columns])

  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        {searchFn && (
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input
              className="input"
              style={{ paddingLeft: 30, height: 34, fontSize: 13 }}
              placeholder="Filter results..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
            />
          </div>
        )}

        {filters && filters.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              className={`tab ${activeFilter === null ? 'active' : ''}`}
              onClick={() => { setActiveFilter(null); setPage(0) }}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              All ({data.length})
            </button>
            {filters.map(f => {
              const count = data.filter(f.fn).length
              return (
                <button
                  key={f.label}
                  className={`tab ${activeFilter === f.label ? 'active' : ''}`}
                  onClick={() => { setActiveFilter(activeFilter === f.label ? null : f.label); setPage(0) }}
                  style={{ padding: '4px 10px', fontSize: 12 }}
                >
                  {f.label} ({count})
                </button>
              )
            })}
          </div>
        )}

        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)', fontFamily: 'IBM Plex Mono', flexShrink: 0 }}>
          {filtered.length} rows
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
          <table className="audit-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    style={{ width: col.width, cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--text3)', padding: '32px' }}>
                    No rows match the current filters
                  </td>
                </tr>
              ) : pageData.map(row => (
                <tr key={rowKey(row)}>
                  {columns.map(col => (
                    <td key={col.key}>{col.render(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', marginRight: 8 }}>
              Page {page + 1} of {totalPages}
            </span>
            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              Prev
            </button>
            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
