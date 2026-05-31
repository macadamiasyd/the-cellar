'use client'

interface Props {
  wineName: string
  onAddToWishlist: () => void
  onKeepInCellar: () => void
  onRemove: () => void
}

export default function LastBottleModal({ wineName, onAddToWishlist, onKeepInCellar, onRemove }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
        <h2 className="text-lg font-bold mb-1">Last bottle finished!</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>{wineName}</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onAddToWishlist}
            className="w-full py-3 rounded-lg text-left px-4 transition-colors"
            style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}
          >
            <div className="font-medium text-sm">Add to Wishlist</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Remember to buy more</div>
          </button>
          <button
            type="button"
            onClick={onKeepInCellar}
            className="w-full py-3 rounded-lg text-left px-4 transition-colors"
            style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}
          >
            <div className="font-medium text-sm">Keep in Cellar</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Stay at qty 0 — historical record</div>
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="w-full py-3 rounded-lg text-left px-4 transition-colors"
            style={{ background: '#fee2e2', border: '1px solid #fca5a5' }}
          >
            <div className="font-medium text-sm" style={{ color: '#991b1b' }}>Remove</div>
            <div className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>Delete from database</div>
          </button>
        </div>
      </div>
    </div>
  )
}
