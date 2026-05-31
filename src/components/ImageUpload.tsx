'use client'

import { useRef, useState } from 'react'
import WineImage from './WineImage'
import ImageCropper from './ImageCropper'

interface Props {
  wineId: string
  currentUrl: string | null | undefined
  currentSource: string | null | undefined
  wineType?: string | null
  onUploaded: (url: string) => void
}

export default function ImageUpload({ wineId, currentUrl, currentSource, wineType, onUploaded }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  async function uploadBlob(blob: Blob, filename: string) {
    setUploading(true)
    setError('')
    const form = new FormData()
    form.append('wine_id', wineId)
    form.append('file', blob, filename)
    const res = await fetch('/api/images/upload', { method: 'POST', body: form })
    setUploading(false)
    if (res.ok) {
      const { url } = await res.json()
      onUploaded(url)
    } else {
      setError('Upload failed. Try again.')
    }
  }

  function handleFileSelected(file: File) {
    setError('')
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
    if (!ALLOWED.includes(file.type)) { setError('JPEG, PNG or WebP only.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Max 5MB.'); return }
    const objectUrl = URL.createObjectURL(file)
    setPendingFile(file)
    setCropSrc(objectUrl)
  }

  function closeCropper() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    setPendingFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleCropped(blob: Blob, filename: string) {
    closeCropper()
    uploadBlob(blob, filename)
  }

  function handleSkip(file: File) {
    closeCropper()
    uploadBlob(file, file.name)
  }

  const hasImage = !!currentUrl

  return (
    <>
      {cropSrc && pendingFile && (
        <ImageCropper
          imageSrc={cropSrc}
          originalFile={pendingFile}
          onCropped={handleCropped}
          onSkip={handleSkip}
          onCancel={closeCropper}
        />
      )}
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
          📷 {uploading ? 'Uploading…' : (hasImage ? 'Replace Image' : 'Upload Image')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelected(f) }}
        />
        {error && <p className="text-xs" style={{ color: '#991b1b' }}>{error}</p>}
      </div>
    </>
  )
}
