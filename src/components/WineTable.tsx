'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Wine } from '@/lib/types'
import { getDrinkStatus } from '@/lib/types'
import RatingStars from './RatingStars'
import DrinkWindowBadge from './DrinkWindowBadge'
import WineImage from './WineImage'
import DrinkModal from './DrinkModal'

type SortKey = 'vintage' | 'producer' | 'name' | 'grape' | 'region' | 'rating' | 'drink_by' | 'price' | 'quantity'

interface Props {
  wines: Wine[]
  isWishlist?: boolean
  initialParams?: Record<string, string>
}

const WINE_TYPES = ['Red', 'White', 'Sparkling', 'Rosé', 'Fortified', 'Dessert', 'Orange']
const DRINK_WINDOWS = ['now', 'soon', 'cellaring', 'past']
const STORAGE_OPTIONS = ['Refrigerator', 'Home', 'Storage']
const SORT_KEYS = ['vintage', 'producer', 'name', 'grape', 'region', 'rating', 'drink_by', 'price', 'quantity'] as const

function normalizeStorage(s: string | null | undefined): string {
  if (!s) return ''
  const l = s.toLowerCase()
  if (l.includes('refrig') || l.includes('refigerator')) return 'Refrigerator'
  if (l.includes('home')) return 'Home'
  if (l.includes('storage')) return 'Storage'
  return s.replace(/\s*x\s*\d+/gi, '').trim()
}

export default function WineTable({ wines, isWishlist = false, initialParams = {} }: Props) {
  const router = useRouter()
  const [search, setSearchState] = useState(initialParams.search ?? '')
  const [typeFilter, setTypeFilter] = useState(initialParams.type ?? '')
  const [countryFilter, setCountryFilter] = useState(initialParams.country ?? '')
  const [regionFilter, setRegionFilter] = useState(initialParams.region ?? '')
  const [grapeFilter, setGrapeFilter] = useState(initialParams.grape ?? '')
  const [ratingFilter, setRatingFilter] = useState(initialParams.rating ?? '')
  const [windowFilter, setWindowFilter] = useState(initialParams.window ?? '')
  const [storageFilter, setStorageFilter] = useState(initialParams.storage ?? '')
  const [sortKey, setSortKey] = useState<SortKey>(
    (SORT_KEYS as readonly string[]).includes(initialParams.sort ?? '') ? (initialParams.sort as SortKey) : 'vintage'
  )
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialParams.order === 'asc' ? 'asc' : 'desc')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [drinkingWine, setDrinkingWine] = useState<Wine | null>(null)

  const updateUrl = useCallback((patch: Record<string, string>) => {
    const p = new URLSearchParams()
    const current: Record<string, string> = {
      search, type: typeFilter, country: countryFilter, region: regionFilter,
      grape: grapeFilter, rating: ratingFilter, window: windowFilter,
      storage: storageFilter, sort: sortKey, order: sortDir,
    }
    const merged = { ...current, ...patch }
    for (const [k, v] of Object.entries(merged)) {
      if (v && !(k === 'sort' && v === 'vintage') && !(k === 'order' && v === 'desc')) {
        p.set(k, v)
      }
    }
    const qs = p.toString()
    router.replace(qs ? `/?${qs}` : '/', { scroll: false })
  }, [search, typeFilter, countryFilter, regionFilter, grapeFilter, ratingFilter, windowFilter, storageFilter, sortKey, sortDir, router])

  function setSearch(v: string) {
    setSearchState(v)
    updateUrl({ search: v })
  }

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
      if (sortKey === 'name') {
        const aEmpty = !a.name?.trim()
        const bEmpty = !b.name?.trim()
        if (aEmpty && !bEmpty) return 1
        if (!aEmpty && bEmpty) return -1
        if (aEmpty && bEmpty) return 0
        return a.name!.localeCompare(b.name!) * (sortDir === 'asc' ? 1 : -1)
      }
      const av = a[sortKey] ?? (typeof a[sortKey] === 'number' ? -Infinity : '')
      const bv = b[sortKey] ?? (typeof b[sortKey] === 'number' ? -Infinity : '')
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [wines, search, typeFilter, countryFilter, regionFilter, grapeFilter, ratingFilter, windowFilter, storageFilter, sortKey, sortDir])

  async function handleTableDrink(wine: Wine, tastingNote: string) {
    setDrinkingWine(null)
    const newQty = wine.quantity - 1
    const today = new Date().toISOString().split('T')[0]
    const body: Record<string, unknown> = { quantity: newQty }
    if (tastingNote) {
      body.tasting_notes = `${wine.tasting_notes ? wine.tasting_notes + '\n\n' : ''}---[${today}] ${tastingNote}`
    }
    await fetch(`/api/wines/${wine.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    router.refresh()
  }

  function toggleSort(key: SortKey) {
    const newDir = sortKey === key ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc'
    setSortKey(key)
    setSortDir(newDir)
    updateUrl({ sort: key, order: newDir })
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
                { val: typeFilter, set: (v: string) => { setTypeFilter(v); updateUrl({ type: v }) }, opts: WINE_TYPES, label: 'Type' },
                { val: countryFilter, set: (v: string) => { setCountryFilter(v); updateUrl({ country: v }) }, opts: countries, label: 'Country' },
                { val: regionFilter, set: (v: string) => { setRegionFilter(v); updateUrl({ region: v }) }, opts: regions, label: 'Region' },
                { val: ratingFilter, set: (v: string) => { setRatingFilter(v); updateUrl({ rating: v }) }, opts: ['5','4','3','2','1'], label: 'Rating' },
                { val: windowFilter, set: (v: string) => { setWindowFilter(v); updateUrl({ window: v }) }, opts: DRINK_WINDOWS, label: 'Window' },
                { val: storageFilter, set: (v: string) => { setStorageFilter(v); updateUrl({ storage: v }) }, opts: STORAGE_OPTIONS, label: 'Storage' },
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
                onChange={e => { setGrapeFilter(e.target.value); updateUrl({ grape: e.target.value }) }}
                className="px-2 py-1.5 rounded border text-sm w-28"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}
              />
              {(typeFilter || countryFilter || regionFilter || grapeFilter || ratingFilter || windowFilter || storageFilter) && (
                <button
                  onClick={() => {
                    setSearchState(''); setTypeFilter(''); setCountryFilter(''); setRegionFilter('')
                    setGrapeFilter(''); setRatingFilter(''); setWindowFilter(''); setStorageFilter('')
                    setSortKey('vintage'); setSortDir('desc')
                    router.replace('/', { scroll: false })
                  }}
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
                <th className="text-left px-3 py-2 font-semibold"><SortBtn col="name" label="Name" /></th>
                <th className="text-left px-3 py-2 font-semibold"><SortBtn col="grape" label="Grape" /></th>
                <th className="text-left px-3 py-2 font-semibold"><SortBtn col="region" label="Region" /></th>
                <th className="text-left px-3 py-2 font-semibold"><SortBtn col="rating" label="Rating" /></th>
                <th className="text-left px-3 py-2 font-semibold"><SortBtn col="drink_by" label="Drink Window" /></th>
                <th className="text-right px-3 py-2 font-semibold"><SortBtn col="price" label="Value" /></th>
                <th className="text-right px-3 py-2 font-semibold"><SortBtn col="quantity" label="Qty" /></th>
                <th className="w-8 px-2 py-2" />
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
                  <td className="px-2 py-1 text-center">
                    {wine.quantity > 0 && !isWishlist && (
                      <button
                        onClick={e => { e.stopPropagation(); setDrinkingWine(wine) }}
                        title="Drink a bottle"
                        className="text-base opacity-40 hover:opacity-100 transition-opacity"
                      >
                        🍷
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-12 text-center" style={{ color: 'var(--muted)' }}>No wines match your filters.</td></tr>
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

      {drinkingWine && (
        <DrinkModal
          wine={drinkingWine}
          onConfirm={(note) => handleTableDrink(drinkingWine, note)}
          onCancel={() => setDrinkingWine(null)}
        />
      )}
    </div>
  )
}
