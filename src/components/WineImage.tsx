'use client'

import { useState } from 'react'
import WineImagePlaceholder from './WineImagePlaceholder'

interface Props {
  src: string | null | undefined
  alt: string
  wineType?: string | null
  width?: number
  height?: number
  className?: string
  wineId?: string
}

export default function WineImage({ src, alt, wineType, width = 48, height = 64, className = '', wineId }: Props) {
  const [broken, setBroken] = useState(false)

  async function handleError() {
    setBroken(true)
    // If auto-fetched image broke, clear it from the DB so a fresh fetch can be attempted
    if (wineId) {
      try {
        const res = await fetch(`/api/wines/${wineId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label_image_url: null, image_source: null }),
        })
        // Only clear if it was auto-sourced — check via HEAD or trust the component caller
        if (!res.ok) { /* silent */ }
      } catch { /* silent */ }
    }
  }

  if (!src || broken) {
    return (
      <WineImagePlaceholder type={wineType} width={width} height={height} className={className} />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`object-cover rounded ${className}`}
      style={{ width, height, objectFit: 'cover' }}
      onError={handleError}
    />
  )
}
