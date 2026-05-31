'use client'

import { useState } from 'react'
import type { Wine } from '@/lib/types'

interface Props {
  wine: Wine
  onConfirm: (tastingNote: string) => void
  onCancel: () => void
}

export default function DrinkModal({ wine, onConfirm, onCancel }: Props) {
  const [note, setNote] = useState('')

  const title = `${wine.vintage} ${wine.producer}${wine.name ? ' ' + wine.name : ''}`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
        <div className="text-2xl mb-1">🍷</div>
        <h2 className="text-lg font-bold mb-1">Drinking a bottle</h2>
        <p className="text-sm mb-1 font-medium">{title}</p>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          Quantity: {wine.quantity} → {wine.quantity - 1}
        </p>
        <textarea
          placeholder="Tasting note (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border text-sm resize-none mb-4"
          style={{ borderColor: 'var(--border)', background: 'var(--parchment)' }}
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--parchment)', border: '1px solid var(--border)', color: 'var(--ink)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note.trim())}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--wine)', color: 'var(--cream)' }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
