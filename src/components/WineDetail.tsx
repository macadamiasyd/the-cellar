'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Wine, AILookupResponse } from '@/lib/types'
import RatingStars from './RatingStars'
import DrinkWindowBadge from './DrinkWindowBadge'
import ImageUpload from './ImageUpload'
import DrinkModal from './DrinkModal'
import LastBottleModal from './LastBottleModal'

const WINE_TYPES = ['Red', 'White', 'Sparkling', 'Rosé', 'Fortified', 'Dessert', 'Orange']

const ENRICHABLE_FIELDS = ['grape', 'region', 'country', 'type', 'abv', 'drink_from', 'drink_by', 'tasting_notes', 'general_notes', 'food_pairings', 'score'] as const

function Field({ label, value, edit, onChange, textarea = false, type = 'text' }: {
  label: string
  value: string | number | null | undefined
  edit: boolean
  onChange: (v: string) => void
  textarea?: boolean
  type?: string
}) {
  if (!edit) {
    return (
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted)' }}>{label}</dt>
        <dd className={value ? '' : 'opacity-40'} style={{ color: 'var(--ink)' }}>
          {value ?? '—'}
        </dd>
      </div>
    )
  }
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide mb-0.5 block" style={{ color: 'var(--muted)' }}>{label}</label>
      {textarea ? (
        <textarea
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full px-2 py-1 rounded border text-sm resize-none"
          style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className="w-full px-2 py-1 rounded border text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}
        />
      )}
    </div>
  )
}

export default function WineDetail({ wine: initial }: { wine: Wine }) {
  const router = useRouter()
  const [wine, setWine] = useState<Wine>(initial)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [findingImage, setFindingImage] = useState(false)
  const [error, setError] = useState('')
  const [drinkModalOpen, setDrinkModalOpen] = useState(false)
  const [lastBottleModalOpen, setLastBottleModalOpen] = useState(false)
  const [enrichData, setEnrichData] = useState<AILookupResponse | null>(null)
  const [enrichAccepted, setEnrichAccepted] = useState<Record<string, boolean>>({})

  function set(field: keyof Wine, value: unknown) {
    setWine(w => ({ ...w, [field]: value }))
  }

  async function save() {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/wines/${wine.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wine),
    })
    setSaving(false)
    if (res.ok) {
      const updated = await res.json()
      setWine(updated)
      setEditing(false)
    } else {
      setError('Failed to save. Please try again.')
    }
  }

  async function enrich() {
    setEnriching(true)
    setError('')
    const res = await fetch('/api/ai/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ producer: wine.producer, vintage: wine.vintage, name: wine.name }),
    })
    if (res.ok) {
      const data: AILookupResponse = await res.json()
      setEnrichData(data)
      const accepted: Record<string, boolean> = {}
      for (const f of ENRICHABLE_FIELDS) {
        // Pre-check fields that have a suggested value AND the wine doesn't already have one
        if (data[f] !== null && data[f] !== undefined && !wine[f as keyof Wine]) accepted[f] = true
      }
      setEnrichAccepted(accepted)
    } else {
      setError('AI enrichment failed.')
    }
    setEnriching(false)
  }

  async function applyEnrichment() {
    if (!enrichData) return
    const updates: Record<string, unknown> = { ai_enriched: true }
    for (const f of ENRICHABLE_FIELDS) {
      if (enrichAccepted[f] && enrichData[f] !== null && enrichData[f] !== undefined) {
        updates[f] = enrichData[f]
      }
    }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/wines/${wine.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setSaving(false)
    if (res.ok) {
      const updated = await res.json()
      setWine(updated)
      setEnrichData(null)
      setEnrichAccepted({})
    } else {
      setError('Failed to save enrichment.')
    }
  }

  async function findImage() {
    setFindingImage(true)
    setError('')
    const res = await fetch('/api/images/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ producer: wine.producer, name: wine.name, vintage: wine.vintage, wine_id: wine.id }),
    })
    setFindingImage(false)
    if (res.ok) {
      const data = await res.json()
      if (data.url) setWine(w => ({ ...w, label_image_url: data.url, image_source: 'auto' }))
      else setError('No image found. Try uploading one manually.')
    } else {
      setError('Image search failed.')
    }
  }

  async function deleteWine() {
    if (!confirm(`Delete ${wine.vintage} ${wine.producer}${wine.name ? ' ' + wine.name : ''}? This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/wines/${wine.id}`, { method: 'DELETE' })
    if (res.ok) router.push(wine.is_wishlist ? '/wishlist' : '/')
    else { setError('Delete failed.'); setDeleting(false) }
  }

  async function adjustQty(delta: number) {
    const newQty = Math.max(0, wine.quantity + delta)
    const res = await fetch(`/api/wines/${wine.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty }),
    })
    if (res.ok) setWine(w => ({ ...w, quantity: newQty }))
  }

  async function handleDrink(tastingNote: string) {
    setDrinkModalOpen(false)
    const newQty = wine.quantity - 1
    const today = new Date().toISOString().split('T')[0]
    const body: Record<string, unknown> = { quantity: newQty }
    if (tastingNote) {
      body.tasting_notes = `${wine.tasting_notes ? wine.tasting_notes + '\n\n' : ''}---[${today}] ${tastingNote}`
    }
    const res = await fetch(`/api/wines/${wine.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      setWine(updated)
      if (newQty === 0) setLastBottleModalOpen(true)
    } else {
      setError('Failed to record drink.')
    }
  }

  async function handleLastBottle(action: 'wishlist' | 'keep' | 'remove') {
    if (action === 'wishlist') {
      setLastBottleModalOpen(false)
      const res = await fetch(`/api/wines/${wine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_wishlist: true }),
      })
      if (res.ok) router.push('/wishlist')
      else setError('Failed to add to wishlist.')
    } else if (action === 'remove') {
      if (!confirm('Delete this wine? This cannot be undone.')) return
      setLastBottleModalOpen(false)
      const res = await fetch(`/api/wines/${wine.id}`, { method: 'DELETE' })
      if (res.ok) router.push('/')
      else setError('Delete failed.')
    } else {
      // 'keep' — nothing to do, qty is already 0
      setLastBottleModalOpen(false)
    }
  }

  async function moveToCellar() {
    const qty = parseInt(prompt('How many bottles?', '1') ?? '1')
    if (isNaN(qty) || qty < 1) return
    const res = await fetch(`/api/wines/${wine.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_wishlist: false, quantity: qty }),
    })
    if (res.ok) router.push('/')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="text-sm mb-2 flex items-center gap-1" style={{ color: 'var(--muted)' }}>
            ← Back
          </button>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-mono font-bold" style={{ color: 'var(--wine)' }}>{wine.vintage}</span>
            <h1 className="text-2xl font-bold">{wine.producer}</h1>
          </div>
          {wine.name && <p className="text-lg" style={{ color: 'var(--muted)' }}>{wine.name}</p>}
          <div className="flex items-center gap-4 mt-2">
            <RatingStars rating={wine.rating} />
            <DrinkWindowBadge wine={wine} />
            {wine.ai_enriched && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--parchment)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                AI enriched
              </span>
            )}
          </div>
        </div>
        {/* Qty controls */}
        <div className="flex flex-col items-center gap-2">
          {!wine.is_wishlist ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}>
              <button onClick={() => adjustQty(-1)} className="w-7 h-7 rounded font-bold text-lg leading-none" style={{ background: 'var(--wine)', color: 'var(--cream)' }}>−</button>
              <span className="text-xl font-mono font-bold w-8 text-center" style={{ color: 'var(--wine)' }}>{wine.quantity}</span>
              <button onClick={() => adjustQty(1)} className="w-7 h-7 rounded font-bold text-lg leading-none" style={{ background: 'var(--wine)', color: 'var(--cream)' }}>+</button>
            </div>
          ) : (
            <button onClick={moveToCellar} className="px-4 py-2 rounded text-sm font-medium" style={{ background: 'var(--wine)', color: 'var(--cream)' }}>
              Move to Cellar
            </button>
          )}
          <span className="text-xs" style={{ color: 'var(--muted)' }}>{wine.is_wishlist ? 'wishlist' : 'bottles'}</span>
        </div>
      </div>

      {/* Image section */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <ImageUpload
          wineId={wine.id}
          currentUrl={wine.label_image_url}
          currentSource={wine.image_source}
          wineType={wine.type}
          onUploaded={url => setWine(w => ({ ...w, label_image_url: url, image_source: 'upload' as const }))}
        />
        {!wine.label_image_url && (
          <button
            onClick={findImage}
            disabled={findingImage}
            className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-opacity disabled:opacity-50"
            style={{ background: 'var(--parchment)', border: '1px solid var(--border)', color: 'var(--ink)' }}
          >
            🔍 {findingImage ? 'Searching…' : 'Find Image'}
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm px-3 py-2 rounded" style={{ background: '#fee2e2', color: '#991b1b' }}>{error}</p>}

      {enrichData && (
        <div className="mb-6 rounded-xl p-5" style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">✨ AI Enrichment Results</h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: enrichData.confidence === 'high' ? '#dcfce7' : enrichData.confidence === 'medium' ? '#fef9c3' : '#fee2e2',
                color: enrichData.confidence === 'high' ? '#166534' : enrichData.confidence === 'medium' ? '#854d0e' : '#991b1b',
              }}
            >
              {enrichData.confidence} confidence
            </span>
          </div>
          {enrichData.confidence === 'low' && (
            <p className="text-xs mb-3 px-3 py-2 rounded" style={{ background: '#fee2e2', color: '#991b1b' }}>
              These details are general estimates — verify before saving.
            </p>
          )}
          <div className="space-y-2 mb-4">
            {([
              ['grape', 'Grape'],
              ['region', 'Region'],
              ['country', 'Country'],
              ['type', 'Type'],
              ['abv', 'ABV (%)'],
              ['drink_from', 'Drink From'],
              ['drink_by', 'Drink By'],
              ['tasting_notes', 'Tasting Notes'],
              ['general_notes', 'General Notes'],
              ['food_pairings', 'Food Pairings'],
              ['score', 'Critic Score'],
            ] as [keyof AILookupResponse, string][])
              .filter(([k]) => enrichData[k] !== null && enrichData[k] !== undefined)
              .map(([key, label]) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enrichAccepted[key] ?? false}
                    onChange={e => setEnrichAccepted(p => ({ ...p, [key]: e.target.checked }))}
                    className="mt-0.5"
                    style={{ accentColor: 'var(--wine)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{label}</span>
                    <p className="text-sm mt-0.5 break-words">{String(enrichData[key])}</p>
                    {key === 'tasting_notes' && enrichData.tasting_source && (
                      <p className="text-xs mt-0.5 italic" style={{ color: 'var(--muted)' }}>Source: {enrichData.tasting_source}</p>
                    )}
                  </div>
                </label>
              ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setEnrichData(null); setEnrichAccepted({}) }}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{ background: 'var(--cream)', border: '1px solid var(--border)', color: 'var(--ink)' }}
            >
              Discard
            </button>
            <button
              onClick={applyEnrichment}
              disabled={saving || Object.values(enrichAccepted).every(v => !v)}
              className="px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--wine)', color: 'var(--cream)' }}
            >
              {saving ? 'Saving…' : 'Apply Selected'}
            </button>
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="rounded-xl p-6 mb-6" style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Producer" value={wine.producer} edit={editing} onChange={v => set('producer', v)} />
          <Field label="Vintage" value={wine.vintage} edit={editing} onChange={v => set('vintage', parseInt(v))} type="number" />
          <Field label="Name" value={wine.name} edit={editing} onChange={v => set('name', v)} />
          <Field label="Grape" value={wine.grape} edit={editing} onChange={v => set('grape', v)} />
          <Field label="Region" value={wine.region} edit={editing} onChange={v => set('region', v)} />
          <Field label="Country" value={wine.country} edit={editing} onChange={v => set('country', v)} />
          {editing ? (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-0.5 block" style={{ color: 'var(--muted)' }}>Type</label>
              <select value={wine.type} onChange={e => set('type', e.target.value)} className="w-full px-2 py-1 rounded border text-sm" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
                {WINE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          ) : (
            <Field label="Type" value={wine.type} edit={false} onChange={() => {}} />
          )}
          <Field label="Vineyard" value={wine.vineyard} edit={editing} onChange={v => set('vineyard', v)} />
          <Field label="ABV (%)" value={wine.abv} edit={editing} onChange={v => set('abv', parseFloat(v))} type="number" />
          <Field label="Volume" value={wine.volume} edit={editing} onChange={v => set('volume', v)} />
          <Field label="Drink From" value={wine.drink_from} edit={editing} onChange={v => set('drink_from', parseInt(v))} type="number" />
          <Field label="Drink By" value={wine.drink_by} edit={editing} onChange={v => set('drink_by', parseInt(v))} type="number" />
          {editing ? (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-0.5 block" style={{ color: 'var(--muted)' }}>Rating (1–5)</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => set('rating', wine.rating === n ? null : n)} className="text-xl" style={{ color: (wine.rating ?? 0) >= n ? 'var(--gold)' : 'var(--border)' }}>★</button>
                ))}
              </div>
            </div>
          ) : (
            <Field label="Rating" value={wine.rating ? '★'.repeat(wine.rating) : null} edit={false} onChange={() => {}} />
          )}
          <Field label="Critic Score" value={wine.score} edit={editing} onChange={v => set('score', v)} />
          <Field label="Price (AUD)" value={wine.price} edit={editing} onChange={v => set('price', parseFloat(v))} type="number" />
        </div>
        <div className="grid gap-4 mt-4">
          <Field label="Storage Location" value={wine.storage_location} edit={editing} onChange={v => set('storage_location', v)} />
          <Field label="Purchase Location" value={wine.purchase_location} edit={editing} onChange={v => set('purchase_location', v)} />
          <Field label="Tasting Notes" value={wine.tasting_notes} edit={editing} onChange={v => set('tasting_notes', v)} textarea />
          <Field label="General Notes" value={wine.general_notes} edit={editing} onChange={v => set('general_notes', v)} textarea />
          <Field label="Food Pairings" value={wine.food_pairings} edit={editing} onChange={v => set('food_pairings', v)} textarea />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {editing ? (
          <>
            <button onClick={save} disabled={saving} className="px-5 py-2 rounded font-medium text-sm" style={{ background: 'var(--wine)', color: 'var(--cream)' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={() => { setWine(initial); setEditing(false) }} className="px-5 py-2 rounded font-medium text-sm" style={{ background: 'var(--parchment)', color: 'var(--ink)', border: '1px solid var(--border)' }}>
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="px-5 py-2 rounded font-medium text-sm" style={{ background: 'var(--wine)', color: 'var(--cream)' }}>
            Edit
          </button>
        )}
        {!wine.is_wishlist && (
          <button
            onClick={() => setDrinkModalOpen(true)}
            disabled={wine.quantity === 0}
            className="px-5 py-2 rounded font-medium text-sm disabled:opacity-40"
            style={{ background: 'var(--parchment)', color: 'var(--wine)', border: '1px solid var(--border)' }}
          >
            🍷 Drink
          </button>
        )}
        <button onClick={enrich} disabled={enriching} className="px-5 py-2 rounded font-medium text-sm" style={{ background: 'var(--parchment)', color: 'var(--wine)', border: '1px solid var(--border)' }}>
          {enriching ? 'Looking up…' : '✨ Enrich with AI'}
        </button>
        <button onClick={deleteWine} disabled={deleting} className="px-5 py-2 rounded font-medium text-sm ml-auto" style={{ background: '#fee2e2', color: '#991b1b' }}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>

      {drinkModalOpen && (
        <DrinkModal
          wine={wine}
          onConfirm={handleDrink}
          onCancel={() => setDrinkModalOpen(false)}
        />
      )}
      {lastBottleModalOpen && (
        <LastBottleModal
          wineName={`${wine.vintage} ${wine.producer}${wine.name ? ' ' + wine.name : ''}`}
          onAddToWishlist={() => handleLastBottle('wishlist')}
          onKeepInCellar={() => handleLastBottle('keep')}
          onRemove={() => handleLastBottle('remove')}
        />
      )}
    </div>
  )
}
