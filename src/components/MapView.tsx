'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { Wine } from '@/lib/types'
import { aggregateWinesByRegion, type MapRegion } from '@/lib/map-data'
import MapRegionPanel from './MapRegionPanel'

const WineMap = dynamic(() => import('./WineMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center" style={{ color: 'var(--muted)' }}>
      Loading map…
    </div>
  ),
})

type View = 'australia' | 'world'

export default function MapView({ wines }: { wines: Wine[] }) {
  const [view, setView] = useState<View>('australia')
  const [selected, setSelected] = useState<MapRegion | null>(null)
  const { australian, international, unresolved } = useMemo(() => aggregateWinesByRegion(wines), [wines])

  const regions = useMemo(
    () => (view === 'australia' ? australian : [...australian, ...international]),
    [view, australian, international]
  )
  const center: [number, number] = view === 'australia' ? [-28.5, 135.0] : [20, 0]
  const zoom = view === 'australia' ? 5 : 2

  return (
    <div className="relative" style={{ height: 'calc(100vh - 3.5rem)' }}>
      {/* View toggle */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex rounded-lg overflow-hidden shadow-md"
        style={{ border: '1px solid var(--border)' }}
      >
        {(['australia', 'world'] as View[]).map(v => (
          <button
            key={v}
            onClick={() => { setView(v); setSelected(null) }}
            className="px-5 py-1.5 text-sm font-medium capitalize transition-colors"
            style={{
              background: view === v ? 'var(--wine)' : 'var(--cream)',
              color: view === v ? 'var(--cream)' : 'var(--ink)',
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {unresolved.length > 0 && (
        <div
          className="absolute bottom-6 left-3 z-[1000] text-xs px-2 py-1 rounded shadow"
          style={{ background: 'var(--cream)', color: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          {unresolved.length} wine{unresolved.length === 1 ? '' : 's'} without a mappable region
        </div>
      )}

      <WineMap key={view} regions={regions} center={center} zoom={zoom} onRegionClick={setSelected} />
      <MapRegionPanel region={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
