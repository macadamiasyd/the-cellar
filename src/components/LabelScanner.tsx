'use client'

import { useRef, useState } from 'react'

interface Props {
  onExtracted: (data: Record<string, unknown>) => void
}

export default function LabelScanner({ onExtracted }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setError('')
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) { setError('Image must be under 10MB'); return }

    const reader = new FileReader()
    reader.onload = async e => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      setScanning(true)

      // Strip data URL prefix to get base64
      const base64 = dataUrl.split(',')[1]
      const mediaType = file.type || 'image/jpeg'

      const res = await fetch('/api/ai/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      })
      setScanning(false)
      if (res.ok) {
        const data = await res.json()
        onExtracted(data)
      } else {
        setError('Could not read label. Try a clearer photo.')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
        style={{ borderColor: 'var(--border)', background: 'var(--parchment)' }}
        onClick={() => fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onDragOver={e => e.preventDefault()}
      >
        {preview ? (
          <img src={preview} alt="Label preview" className="max-h-48 mx-auto object-contain rounded" />
        ) : (
          <div style={{ color: 'var(--muted)' }}>
            <div className="text-4xl mb-2">📷</div>
            <p className="font-medium">Take a photo or upload a wine label</p>
            <p className="text-sm mt-1">JPEG, PNG, WebP · max 10MB</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>
      {scanning && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--wine)' }}>
          <span className="animate-spin">⏳</span> Reading label with AI…
        </div>
      )}
      {error && <p className="text-sm" style={{ color: '#991b1b' }}>{error}</p>}
    </div>
  )
}
