'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Wine } from '@/lib/types'
import { getDrinkStatus } from '@/lib/types'
import RatingStars from './RatingStars'
import DrinkWindowBadge from './DrinkWindowBadge'
import WineImage from './WineImage'

type SortKey = 'vintage' | 'producer' | 'grape' | 'region' | 'rating' | 'drink_by' | 'price' | 'quantity'

interface Props {
  wines: Wine[]
  isWishlist?: boolean
}

const WINE_TYPES = ['Red', 'White', 'Sparkling', 'Rosé', 'Fortified', 'Dessert', 'Orange']
const DRINK_WINDOWS = ['now', 'soon', 'cellaring', 'past']
const STORAGE_OPTIONS = ['Refrigerator', 'Home', 'Storage']

function normalizeStorage(s: string | null | undefined): string {
  if (!s) return ''
  const l = s.toLowerCase()
  if (l.includes('refrig') || l.includes('refigerator')) return 'Refrigerator'
  if (l.includes('home')) return 'Home'
  if (l.includes('storage')) return 'Storage'
  return s.replace(/\s*x\s*\d+/gi, '').trim()
}

export default function WineTable({ wines, isWishlist = false }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [grapeFilter, setGrapeFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [windowFilter, setWindowFilter] = useState('')
  const [storageFilter, setStorageFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('vintage')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const countries = useMemo(() => [...new Set(wines.map(w => w.country).filter(Boolean))].sort() as string[], [wines])
  const regions = useMemo(() => [...new Set(wines.map(w => w.region).filter(Boolean))].sort() as string[], [wines])

  const filtered = useMemo(() => {
    let list = wines
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(w =>
        [w.producer, w.name, w.grape, w.region, w.country, w.vintage?.toString()]
          .some(v => v?.toLowerCase().includes(q))
      )
    }
    if (typeFilter) list = list.filter(w => w.type === typeFilter)
    if (countryFilter) list = list.filter(w => w.country === countryFilter)
    if (regionFilter) list = list.filter(w => w.region === regionFilter)
    if (grapeFilter) list = list.filter(w => w.grape?.toLowerCase().includes(grapeFilter.toLowerCase()))
    if (ratingFilter) list = list.filter(w => w.rating === parseInt(ratingFilter))
    if (windowFilter) list = list.filter(w => getDrinkStatus(w) === windowFilter)
    if (storageFilter) list = list.filter(w => normalizeStorage(w.storage_location) === storageFilter)

    return [...list].sort((a, b) => {
      const av = a[sortKey] ?? (typeof a[sortKey] === 'number' ? -Infinity : '')
      const bv = b[sortKey] ?? (typeof b[sortKey] === 'number' ? -Infinity : '')
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [wines, search, typeFilter, countryFilter, regionFilter, grapeFilter, ratingFilter, windowFilter, storageFilter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortBtn({ col, label }: { col: SortKey; label: string }) {
    return (
      <button onClick={() => toggleSort(col)} className="flex items-center gap-1 hover:opacity-70 transition-opacity">
        {label}
        {sortKey === col && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    )
  }

  const totalBottles = filtered.reduce((s, w) => s + w.quantity, 0)
  const totalValue = filtered.reduce((s, w) => s + ((w.price ?? 0) * w.quantity), 0)

  return (
    <div>
      {/* Filters bar */}
      <div className="sticky top-14 z-40 px-4 py-3 shadow-sm" style={{ background: 'var(--parchment)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="search"
              placeholder="Search producer, name, grape, region…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-48 px-3 py-1.5 rounded border text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}
            />
            <button
              onClick={() => setFiltersOpen(o => !o)}
              className="px-3 py-1.5 rounded border text-sm font-medium transition-colors"
              style={{ borderColor: 'var(--border)', background: filtersOpen ? 'var(--wine)' : 'var(--cream)', color: filtersOpen ? 'var(--cream)' : 'var(--ink)' }}
            >
              Filters {filtersOpen ? '▲' : '▼'}
            </button>
            <span className="text-sm ml-auto" style={{ color: 'var(--muted)' }}>
              {filtered.length} wines · {totalBottles} bottles · AUD ${totalValue.toLocaleString()}
            </span>
          </div>
          {filtersOpen && (
            <div className="flex gap-2 flex-wrap mt-2">
              {[
                { val: typeFilter, set: setTypeFilter, opts: WINE_TYPES, label: 'Type' },
                { val: countryFilter, set: setCountryFilter, opts: countries, label: 'Country' },
                { val: regionFilter, set: setRegionFilter, opts: regions, label: 'Region' },
                { val: ratingFilter, set: setRatingFilter, opts: ['5','4','3','2','1'], label: 'Rating' },
                { val: windowFilter, set: setWindowFilter, opts: DRINK_WINDOWS, label: 'Window' },
                { val: storageFilter, set: setStorageFilter, opts: STORAGE_OPTIONS, label: 'Storage' },
              ].map(f => (
                <select
                  key={f.label}
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  className="px-2 py-1.5 rounded border text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: f.val ? 'var(--wine)' : 'var(--muted)' }}
                >
                  <option value="">{f.label}</option>
                  {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
              <input
                placeholder="Grape…"
                value={grapeFilter}
                onChange={e => setGrapeFilter(e.target.value)}
                className="px-2 py-1.5 rounded border text-sm w-28"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}
              />
              {(typeFilter || countryFilter || regionFilter || grapeFilter || ratingFilter || windowFilter || storageFilter) && (
                <button
                  onClick={() => { setTypeFilter(''); setCountryFilter(''); setRegionFilter(''); setGrapeFilter(''); setRatingFilter(''); setWindowFilter(''); setStorageFilter('') }}
                  className="px-2 py-1.5 rounded text-sm underline"
                  style={{ color: 'var(--wine)' }}
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop table */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="hidden lg:block rounded-lg overflow-hidden shadow-sm" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--wine)', color: 'var(--cream)' }}>
                <th className="px-2 py-2 w-14 hidden sm:table-cell" />
                {[
                  { col: 'vintage' as SortKey, label: 'Vintage' },
                  { col: 'producer' as SortKey, label: 'Producer' },
                ].map(h => (
                  <th key={h.col} className="text-left px-3 py-2 font-semibold">
                    <SortBtn col={h.col} label={h.label} />
                  </th>
                ))}
                <th className="text-left px-3 py-2 font-semibold">Name</th>
                <th className="text-left px-3 py-2 font-semibold"><SortBtn col="grape" label="Grape" /></th>
                <th className="text-left px-3 py-2 font-semibold"><SortBtn col="region" label="Region" /></th>
                <th className="text-left px-3 py-2 font-semibold"><SortBtn col="rating" label="Rating" /></th>
                <th className="text-left px-3 py-2 font-semibold"><SortBtn col="drink_by" label="Drink Window" /></th>
                <th className="text-right px-3 py-2 font-semibold"><SortBtn col="price" label="Value" /></th>
                <th className="text-right px-3 py-2 font-semibold"><SortBtn col="quantity" label="Qty" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((wine, i) => (
                <tr
                  key={wine.id}
                  onClick={() => router.push(`/wine/${wine.id}`)}
                  className="cursor-pointer transition-colors"
                  style={{ background: i % 2 === 0 ? 'var(--cream)' : 'var(--parchment)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e8dfc8')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'var(--cream)' : 'var(--parchment)')}
                >
                  <td className="px-2 py-1 hidden sm:table-cell">
                    <WineImage src={wine.label_image_url} alt={wine.producer} wineType={wine.type} width={36} height={48} className="rounded" />
                  </td>
                  <td className="px-3 py-2 font-mono font-medium" style={{ color: 'var(--wine)' }}>{wine.vintage}</td>
                  <td className="px-3 py-2 font-medium">{wine.producer}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--muted)' }}>{wine.name}</td>
                  <td className="px-3 py-2">{wine.grape}</td>
                  <td className="px-3 py-2">{wine.region}{wine.country && wine.country !== 'Australia' ? `, ${wine.country}` : ''}</td>
                  <td className="px-3 py-2"><RatingStars rating={wine.rating} /></td>
                  <td className="px-3 py-2"><DrinkWindowBadge wine={wine} /></td>
                  <td className="px-3 py-2 text-right font-mono">{wine.price ? `$${wine.price.toLocaleString()}` : '—'}</td>
                  <td className="px-3 py-2 text-right font-mono font-medium" style={{ color: wine.quantity > 1 ? 'var(--wine)' : undefined }}>{wine.quantity}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-12 text-center" style={{ color: 'var(--muted)' }}>No wines match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden grid gap-3 sm:grid-cols-2">
          {filtered.map(wine => (
            <div
              key={wine.id}
              onClick={() => router.push(`/wine/${wine.id}`)}
              className="rounded-lg p-4 cursor-pointer shadow-sm transition-shadow hover:shadow-md"
              style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-mono font-medium text-sm" style={{ color: 'var(--wine)' }}>{wine.vintage}</span>
                <RatingStars rating={wine.rating} />
              </div>
              <div className="font-semibold">{wine.producer}</div>
              {wine.name && <div className="text-sm" style={{ color: 'var(--muted)' }}>{wine.name}</div>}
              {wine.grape && <div className="text-sm mt-1">{wine.grape}</div>}
              {wine.region && <div className="text-sm" style={{ color: 'var(--muted)' }}>{wine.region}</div>}
              <div className="flex justify-between items-center mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <DrinkWindowBadge wine={wine} />
                <div className="text-sm font-mono">
                  {wine.price ? `$${wine.price}` : ''} · {wine.quantity} btl
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
