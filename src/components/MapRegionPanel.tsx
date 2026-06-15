'use client'

import Link from 'next/link'
import type { MapRegion } from '@/lib/map-data'

export default function MapRegionPanel({ region, onClose }: { region: MapRegion | null; onClose: () => void }) {
  if (!region) return null

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[1000] bg-black/20" />
      <aside
        className="fixed top-0 right-0 z-[1001] h-full w-full sm:w-96 shadow-2xl flex flex-col"
        style={{ background: 'var(--cream)', borderLeft: '1px solid var(--border)' }}
      >
        <div className="p-4 flex items-start justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--wine)' }}>{region.name}</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {region.bottleCount} bottle{region.bottleCount === 1 ? '' : 's'} across {region.wineCount} wine{region.wineCount === 1 ? '' : 's'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-xl leading-none px-2 hover:opacity-70" style={{ color: 'var(--muted)' }}>
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {region.wines.map(w => (
            <Link key={w.id} href={`/wine/${w.id}`} className="block px-3 py-2 rounded hover:bg-black/5 transition-colors">
              <div className="flex items-center gap-2 flex-wrap">
                {w.rating ? <span style={{ color: 'var(--gold)' }}>{'★'.repeat(w.rating)}</span> : null}
                <span className="font-mono text-sm font-medium" style={{ color: 'var(--wine)' }}>{w.vintage}</span>
                <span className="font-medium text-sm">{w.producer}</span>
              </div>
              <div className="text-sm pl-0.5" style={{ color: 'var(--muted)' }}>
                {w.name ? `${w.name} · ` : ''}{w.grape}{w.quantity ? ` — qty: ${w.quantity}` : ''}
              </div>
            </Link>
          ))}
        </div>

        <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Use search (substring) rather than the exact region filter so blends
              and aliases that resolved to this marker are all included. */}
          <Link
            href={`/?search=${encodeURIComponent(region.name)}`}
            className="block text-center py-2 rounded font-medium text-sm"
            style={{ background: 'var(--wine)', color: 'var(--cream)' }}
          >
            View in Cellar →
          </Link>
        </div>
      </aside>
    </>
  )
}
