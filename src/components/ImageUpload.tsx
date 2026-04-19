'use client'

import { useRef, useState } from 'react'
import WineImage from './WineImage'

interface Props {
  wineId: string
  currentUrl: string | null | undefined
  currentSource: string | null | undefined
  wineType?: string | null
  onUploaded: (url: string) => void
}

async function resizeImage(file: File, maxWidth = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = img.width > maxWidth ? maxWidth / img.width : 1
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas blob failed')), file.type, 0.88)
    }
    img.onerror = reject
    img.src = url
  })
}

export default function ImageUpload({ wineId, currentUrl, currentSource, wineType, onUploaded }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setError('')
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
    if (!ALLOWED.includes(file.type)) { setError('JPEG, PNG or WebP only.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Max 5MB.'); return }

    setUploading(true)
    const resized = await resizeImage(file)
    const form = new FormData()
    form.append('wine_id', wineId)
    form.append('file', resized, file.name)

    const res = await fetch('/api/images/upload', { method: 'POST', body: form })
    setUploading(false)
    if (res.ok) {
      const { url } = await res.json()
      onUploaded(url)
    } else {
      setError('Upload failed. Try again.')
    }
  }

  const hasImage = !!currentUrl
  const label = hasImage ? 'Replace Image' : 'Upload Image'

  return (
    <div className="flex flex-col gap-2">
      {hasImage && (
        <div className="relative inline-block">
          <WineImage src={currentUrl} alt="Wine" wineType={wineType} width={120} height={160} className="rounded-lg shadow" />
          {currentSource && (
            <span className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
              {currentSource}
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium w-fit transition-opacity disabled:opacity-50"
        style={{ background: 'var(--parchment)', border: '1px solid var(--border)', color: 'var(--ink)' }}
      >
        📷 {uploading ? 'Uploading…' : label}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {error && <p className="text-xs" style={{ color: '#991b1b' }}>{error}</p>}
    </div>
  )
}
