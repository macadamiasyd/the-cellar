'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LabelScanner from './LabelScanner'

const WINE_TYPES = ['Red', 'White', 'Sparkling', 'Rosé', 'Fortified', 'Dessert', 'Orange']

interface WineFields {
  vintage: string
  producer: string
  name: string
  grape: string
  region: string
  country: string
  type: string
  vineyard: string
  abv: string
  drink_from: string
  drink_by: string
  rating: string
  score: string
  tasting_notes: string
  general_notes: string
  food_pairings: string
  storage_location: string
  purchase_location: string
  quantity: string
  volume: string
  price: string
  currency: string
}

const empty: WineFields = {
  vintage: '', producer: '', name: '', grape: '', region: '', country: '', type: 'Red',
  vineyard: '', abv: '', drink_from: '', drink_by: '', rating: '', score: '',
  tasting_notes: '', general_notes: '', food_pairings: '', storage_location: '',
  purchase_location: '', quantity: '1', volume: '750mL', price: '', currency: 'AUD',
}

export default function AddWineForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'manual' | 'scan'>('manual')
  const [isWishlist, setIsWishlist] = useState(false)
  const [fields, setFields] = useState<WineFields>(empty)
  const [looking, setLooking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiConfidence, setAiConfidence] = useState<string | null>(null)
  const [error, setError] = useState('')

  function set(k: keyof WineFields, v: string) {
    setFields(f => ({ ...f, [k]: v }))
  }

  async function lookUp() {
    if (!fields.producer || !fields.vintage) {
      setError('Producer and vintage are required to look up.')
      return
    }
    setLooking(true)
    setError('')
    const res = await fetch('/api/ai/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ producer: fields.producer, vintage: fields.vintage, name: fields.name }),
    })
    setLooking(false)
    if (res.ok) {
      const data = await res.json()
      setAiConfidence(data.confidence)
      setFields(f => ({
        ...f,
        grape: f.grape || data.grape || '',
        region: f.region || data.region || '',
        country: f.country || data.country || '',
        type: f.type !== 'Red' ? f.type : (data.type || 'Red'),
        abv: f.abv || (data.abv?.toString() ?? ''),
        drink_from: f.drink_from || (data.drink_from?.toString() ?? ''),
        drink_by: f.drink_by || (data.drink_by?.toString() ?? ''),
        tasting_notes: f.tasting_notes || data.tasting_notes || '',
        general_notes: f.general_notes || data.general_notes || '',
        food_pairings: f.food_pairings || data.food_pairings || '',
        score: f.score || data.score || '',
      }))
    } else {
      setError('AI lookup failed. Fill in fields manually.')
    }
  }

  function handleScanned(data: Record<string, unknown>) {
    setFields(f => ({
      ...f,
      producer: (data.producer as string) || f.producer,
      vintage: data.vintage?.toString() || f.vintage,
      name: (data.name as string) || f.name,
      grape: (data.grape as string) || f.grape,
      region: (data.region as string) || f.region,
      country: (data.country as string) || f.country,
      type: (data.type as string) || f.type,
      abv: data.abv?.toString() || f.abv,
      drink_from: data.drink_from?.toString() || f.drink_from,
      drink_by: data.drink_by?.toString() || f.drink_by,
      tasting_notes: (data.tasting_notes as string) || f.tasting_notes,
      food_pairings: (data.food_pairings as string) || f.food_pairings,
    }))
    setMode('manual')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!fields.producer || !fields.vintage) { setError('Producer and vintage are required.'); return }
    setSaving(true)
    setError('')
    const body = {
      vintage: parseInt(fields.vintage),
      producer: fields.producer,
      name: fields.name || null,
      grape: fields.grape || null,
      region: fields.region || null,
      country: fields.country || null,
      type: fields.type || 'Red',
      vineyard: fields.vineyard || null,
      abv: fields.abv ? parseFloat(fields.abv) : null,
      drink_from: fields.drink_from ? parseInt(fields.drink_from) : null,
      drink_by: fields.drink_by ? parseInt(fields.drink_by) : null,
      rating: fields.rating ? parseInt(fields.rating) : null,
      score: fields.score || null,
      tasting_notes: fields.tasting_notes || null,
      general_notes: fields.general_notes || null,
      food_pairings: fields.food_pairings || null,
      storage_location: fields.storage_location || null,
      purchase_location: fields.purchase_location || null,
      quantity: parseInt(fields.quantity) || 1,
      volume: fields.volume || '750mL',
      price: fields.price ? parseFloat(fields.price) : null,
      currency: fields.currency || 'AUD',
      is_wishlist: isWishlist,
      ai_enriched: !!aiConfidence,
    }
    const res = await fetch('/api/wines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      const wine = await res.json()
      router.push(`/wine/${wine.id}`)
    } else {
      setError('Failed to save wine.')
    }
  }

  const inp = "w-full px-3 py-2 rounded-lg border text-sm"
  const inpStyle = { borderColor: 'var(--border)', background: 'var(--cream)' }
  const lbl = "block text-xs font-semibold uppercase tracking-wide mb-1"
  const lblStyle = { color: 'var(--muted)' }

  return (
    <div>
      {/* Mode / Wishlist toggle */}
      <div className="flex gap-3 mb-6">
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {(['manual', 'scan'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} className="px-4 py-2 text-sm font-medium capitalize"
              style={{ background: mode === m ? 'var(--wine)' : 'var(--cream)', color: mode === m ? 'var(--cream)' : 'var(--ink)' }}>
              {m === 'scan' ? '📷 Scan Label' : '✏️ Manual'}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg overflow-hidden border ml-auto" style={{ borderColor: 'var(--border)' }}>
          {[false, true].map(w => (
            <button key={String(w)} onClick={() => setIsWishlist(w)} className="px-4 py-2 text-sm font-medium"
              style={{ background: isWishlist === w ? 'var(--wine)' : 'var(--cream)', color: isWishlist === w ? 'var(--cream)' : 'var(--ink)' }}>
              {w ? '💫 Wishlist' : '🍷 Cellar'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'scan' && (
        <div className="mb-6">
          <LabelScanner onExtracted={handleScanned} />
        </div>
      )}

      {error && <p className="mb-4 text-sm px-3 py-2 rounded" style={{ background: '#fee2e2', color: '#991b1b' }}>{error}</p>}
      {aiConfidence && (
        <p className="mb-4 text-sm px-3 py-2 rounded" style={{ background: 'var(--parchment)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
          ✨ AI filled in fields below (confidence: {aiConfidence}). Review before saving.
        </p>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Required</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl} style={lblStyle}>Producer *</label>
              <input value={fields.producer} onChange={e => set('producer', e.target.value)} className={inp} style={inpStyle} required />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Vintage *</label>
              <input type="number" value={fields.vintage} onChange={e => set('vintage', e.target.value)} className={inp} style={inpStyle} required placeholder="e.g. 2021" />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl} style={lblStyle}>Name (optional, improves AI lookup)</label>
              <input value={fields.name} onChange={e => set('name', e.target.value)} className={inp} style={inpStyle} placeholder="e.g. Bin 389, Diana Madeline" />
            </div>
          </div>
          <button type="button" onClick={lookUp} disabled={looking} className="mt-3 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ background: 'var(--wine)', color: 'var(--cream)' }}>
            {looking ? '⏳ Looking up…' : '✨ Look Up with AI'}
          </button>
        </div>

        {/* Wine details */}
        <div className="rounded-xl p-4" style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Wine Details</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl} style={lblStyle}>Grape</label>
              <input value={fields.grape} onChange={e => set('grape', e.target.value)} className={inp} style={inpStyle} />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Type</label>
              <select value={fields.type} onChange={e => set('type', e.target.value)} className={inp} style={inpStyle}>
                {WINE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Region</label>
              <input value={fields.region} onChange={e => set('region', e.target.value)} className={inp} style={inpStyle} />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Country</label>
              <input value={fields.country} onChange={e => set('country', e.target.value)} className={inp} style={inpStyle} />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Vineyard</label>
              <input value={fields.vineyard} onChange={e => set('vineyard', e.target.value)} className={inp} style={inpStyle} />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>ABV (%)</label>
              <input type="number" step="0.1" value={fields.abv} onChange={e => set('abv', e.target.value)} className={inp} style={inpStyle} />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Drink From</label>
              <input type="number" value={fields.drink_from} onChange={e => set('drink_from', e.target.value)} className={inp} style={inpStyle} />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Drink By</label>
              <input type="number" value={fields.drink_by} onChange={e => set('drink_by', e.target.value)} className={inp} style={inpStyle} />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Rating (1–5)</label>
              <div className="flex gap-2 mt-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => set('rating', fields.rating === String(n) ? '' : String(n))} className="text-2xl"
                    style={{ color: parseInt(fields.rating) >= n ? 'var(--gold)' : 'var(--border)' }}>★</button>
                ))}
              </div>
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Critic Score</label>
              <input value={fields.score} onChange={e => set('score', e.target.value)} className={inp} style={inpStyle} placeholder="e.g. 97 Halliday" />
            </div>
          </div>
          <div className="grid gap-3 mt-3">
            <div>
              <label className={lbl} style={lblStyle}>Tasting Notes</label>
              <textarea value={fields.tasting_notes} onChange={e => set('tasting_notes', e.target.value)} className={inp} style={inpStyle} rows={3} />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Food Pairings</label>
              <textarea value={fields.food_pairings} onChange={e => set('food_pairings', e.target.value)} className={inp} style={inpStyle} rows={2} />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>General Notes</label>
              <textarea value={fields.general_notes} onChange={e => set('general_notes', e.target.value)} className={inp} style={inpStyle} rows={2} />
            </div>
          </div>
        </div>

        {/* Collection details */}
        <div className="rounded-xl p-4" style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Collection Details</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl} style={lblStyle}>Quantity</label>
              <input type="number" value={fields.quantity} onChange={e => set('quantity', e.target.value)} className={inp} style={inpStyle} min="0" />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Volume</label>
              <input value={fields.volume} onChange={e => set('volume', e.target.value)} className={inp} style={inpStyle} placeholder="750mL" />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Price (AUD)</label>
              <input type="number" step="0.01" value={fields.price} onChange={e => set('price', e.target.value)} className={inp} style={inpStyle} />
            </div>
            <div>
              <label className={lbl} style={lblStyle}>Storage Location</label>
              <input value={fields.storage_location} onChange={e => set('storage_location', e.target.value)} className={inp} style={inpStyle} placeholder="e.g. Refrigerator x 1" />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl} style={lblStyle}>Purchase Location</label>
              <input value={fields.purchase_location} onChange={e => set('purchase_location', e.target.value)} className={inp} style={inpStyle} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full py-3 rounded-xl font-semibold text-base"
          style={{ background: 'var(--wine)', color: 'var(--cream)' }}>
          {saving ? 'Saving…' : `Add to ${isWishlist ? 'Wishlist' : 'Cellar'}`}
        </button>
      </form>
    </div>
  )
}
