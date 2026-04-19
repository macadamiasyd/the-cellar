'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Wine } from '@/lib/types'
import RatingStars from './RatingStars'
import DrinkWindowBadge from './DrinkWindowBadge'

const WINE_TYPES = ['Red', 'White', 'Sparkling', 'Rosé', 'Fortified', 'Dessert', 'Orange']

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
  const [error, setError] = useState('')

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
      const data = await res.json()
      setWine(w => ({
        ...w,
        grape: w.grape || data.grape,
        region: w.region || data.region,
        country: w.country || data.country,
        type: w.type || data.type,
        abv: w.abv || data.abv,
        drink_from: w.drink_from || data.drink_from,
        drink_by: w.drink_by || data.drink_by,
        tasting_notes: w.tasting_notes || data.tasting_notes,
        general_notes: w.general_notes || data.general_notes,
        food_pairings: w.food_pairings || data.food_pairings,
        score: w.score || data.score,
        ai_enriched: true,
      }))
      setEditing(true)
    } else {
      setError('AI enrichment failed.')
    }
    setEnriching(false)
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

      {/* Label image */}
      {wine.label_image_url && (
        <div className="mb-6">
          <img src={wine.label_image_url} alt="Wine label" className="h-48 object-contain rounded-lg shadow-md" />
        </div>
      )}

      {error && <p className="mb-4 text-sm px-3 py-2 rounded" style={{ background: '#fee2e2', color: '#991b1b' }}>{error}</p>}

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
        <button onClick={enrich} disabled={enriching} className="px-5 py-2 rounded font-medium text-sm" style={{ background: 'var(--parchment)', color: 'var(--wine)', border: '1px solid var(--border)' }}>
          {enriching ? 'Looking up…' : '✨ Enrich with AI'}
        </button>
        <button onClick={deleteWine} disabled={deleting} className="px-5 py-2 rounded font-medium text-sm ml-auto" style={{ background: '#fee2e2', color: '#991b1b' }}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  )
}
