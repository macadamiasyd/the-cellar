'use client'

import { useState, useCallback } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { getCroppedImage } from '@/lib/cropImage'

interface Props {
  imageSrc: string
  originalFile: File
  onCropped: (blob: Blob, filename: string) => void
  onSkip: (file: File) => void
  onCancel: () => void
}

export default function ImageCropper({ imageSrc, originalFile, onCropped, onSkip, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleCropAndUpload() {
    if (!croppedAreaPixels) return
    setProcessing(true)
    setError('')
    try {
      const blob = await getCroppedImage(imageSrc, croppedAreaPixels)
      onCropped(blob, originalFile.name.replace(/\.[^.]+$/, '.jpg'))
    } catch {
      setError('Could not process image. Try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.9)' }}
    >
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={3 / 4}
          minZoom={0.4}
          restrictPosition={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: '#111' },
          }}
        />
      </div>

      <div className="px-6 py-3" style={{ background: 'rgba(0,0,0,0.8)' }}>
        <input
          type="range"
          min={0.4}
          max={3}
          step={0.05}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: 'var(--wine)' }}
        />
      </div>

      {error && (
        <div className="px-4 pt-2" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <p className="text-xs" style={{ color: '#fca5a5' }}>{error}</p>
        </div>
      )}
      <div className="flex gap-3 px-4 pb-6 pt-2" style={{ background: 'rgba(0,0,0,0.8)' }}>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-lg text-sm font-medium"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSkip(originalFile)}
          className="flex-1 py-3 rounded-lg text-sm font-medium"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
        >
          Skip Crop
        </button>
        <button
          type="button"
          onClick={handleCropAndUpload}
          disabled={processing}
          className="flex-1 py-3 rounded-lg text-sm font-semibold disabled:opacity-50"
          style={{ background: 'var(--wine)', color: 'var(--cream)' }}
        >
          {processing ? 'Processing…' : 'Crop & Upload'}
        </button>
      </div>
    </div>
  )
}
