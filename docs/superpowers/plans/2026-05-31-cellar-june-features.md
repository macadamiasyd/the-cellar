# Cellar June 2026 Feature Updates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Six targeted improvements: URL-persisted filters, sortable Name column, image upload fix, crop tool, Drink bottle action, and stricter AI enrichment.

**Architecture:** All changes are isolated to existing components and routes. No new pages. New components (`ImageCropper`, `DrinkModal`, `LastBottleModal`) are created and imported where needed. State management stays client-side (React state + URL params for filters).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase, Anthropic SDK, `react-easy-crop` (new dep for Task 4).

---

## File Map

| File | Tasks | Change |
|---|---|---|
| `src/components/WineTable.tsx` | 1, 2, 5 | URL filter sync, Name sort, Drink quick-action |
| `src/app/page.tsx` | 1 | Pass `searchParams` to WineTable |
| `src/components/ImageUpload.tsx` | 3, 4 | Remove `capture`, open cropper |
| `src/lib/cropImage.ts` | 4 | Create — canvas crop utility |
| `src/components/ImageCropper.tsx` | 4 | Create — crop modal |
| `src/app/api/ai/lookup/route.ts` | 6 | New prompt + web search tool |
| `src/lib/types.ts` | 6 | Extend `AILookupResponse` |
| `src/components/WineDetail.tsx` | 5, 6 | Drink button, enrichment UI |
| `src/components/DrinkModal.tsx` | 5 | Create — drink confirmation modal |
| `src/components/LastBottleModal.tsx` | 5 | Create — last bottle follow-up modal |

---

## Task 1: Persist Filter State in URL

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/WineTable.tsx`

### Background
`WineTable` currently holds all filter state in `useState`. When a user navigates to `/wine/[id]` and back, Next.js may restore the client component tree — but if it doesn't, all filter state is lost. Persisting to URL query params makes this bulletproof and also makes filtered views shareable.

The approach: make WineTable accept initial filter values as props (derived from `searchParams` in the server page), initialize `useState` from those props, and call `router.replace()` on every filter change.

`page.tsx` is a server component that receives `searchParams` as a prop (Next.js App Router convention).

- [ ] **Step 1: Update `page.tsx` to read `searchParams` and pass to WineTable**

Replace the entire contents of `src/app/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import WineTable from '@/components/WineTable'

export const revalidate = 0

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

export default async function CellarPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: wines, error } = await supabase
    .from('wines')
    .select('*')
    .eq('is_wishlist', false)
    .gt('quantity', 0)
    .order('vintage', { ascending: false })

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center" style={{ color: 'var(--muted)' }}>
        <p className="font-medium">Could not load cellar. Check your Supabase credentials in .env.local</p>
        <p className="text-sm mt-2">{error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--wine)' }}>The Cellar</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
          {wines.length} wines · {wines.reduce((s, w) => s + w.quantity, 0)} bottles ·{' '}
          AUD ${wines.reduce((s, w) => s + ((w.price ?? 0) * w.quantity), 0).toLocaleString()}
        </p>
      </div>
      <WineTable wines={wines} initialParams={params} />
    </div>
  )
}
```

- [ ] **Step 2: Update `WineTable` Props interface and add `initialParams`**

At the top of `src/components/WineTable.tsx`, change the `Props` interface and add the import for `useCallback`:

```typescript
'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Wine } from '@/lib/types'
import { getDrinkStatus } from '@/lib/types'
import RatingStars from './RatingStars'
import DrinkWindowBadge from './DrinkWindowBadge'
import WineImage from './WineImage'

type SortKey = 'vintage' | 'producer' | 'name' | 'grape' | 'region' | 'rating' | 'drink_by' | 'price' | 'quantity'

interface Props {
  wines: Wine[]
  isWishlist?: boolean
  initialParams?: Record<string, string>
}
```

(Note: `'name'` is also added to `SortKey` here — this handles Task 2 at the same time.)

- [ ] **Step 3: Initialize filter state from `initialParams` and add URL update helper**

Replace the state declarations inside `WineTable` (lines 32–43 of the original file) with:

```typescript
export default function WineTable({ wines, isWishlist = false, initialParams = {} }: Props) {
  const router = useRouter()
  const [search, setSearchState] = useState(initialParams.search ?? '')
  const [typeFilter, setTypeFilter] = useState(initialParams.type ?? '')
  const [countryFilter, setCountryFilter] = useState(initialParams.country ?? '')
  const [regionFilter, setRegionFilter] = useState(initialParams.region ?? '')
  const [grapeFilter, setGrapeFilter] = useState(initialParams.grape ?? '')
  const [ratingFilter, setRatingFilter] = useState(initialParams.rating ?? '')
  const [windowFilter, setWindowFilter] = useState(initialParams.window ?? '')
  const [storageFilter, setStorageFilter] = useState(initialParams.storage ?? '')
  const [sortKey, setSortKey] = useState<SortKey>((initialParams.sort as SortKey) ?? 'vintage')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>((initialParams.order as 'asc' | 'desc') ?? 'desc')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const updateUrl = useCallback((patch: Record<string, string>) => {
    const p = new URLSearchParams()
    const current: Record<string, string> = {
      search, type: typeFilter, country: countryFilter, region: regionFilter,
      grape: grapeFilter, rating: ratingFilter, window: windowFilter,
      storage: storageFilter, sort: sortKey, order: sortDir,
    }
    const merged = { ...current, ...patch }
    for (const [k, v] of Object.entries(merged)) {
      if (v && !(k === 'sort' && v === 'vintage') && !(k === 'order' && v === 'desc')) {
        p.set(k, v)
      }
    }
    const qs = p.toString()
    router.replace(qs ? `/?${qs}` : '/', { scroll: false })
  }, [search, typeFilter, countryFilter, regionFilter, grapeFilter, ratingFilter, windowFilter, storageFilter, sortKey, sortDir, router])
```

- [ ] **Step 4: Wire filter setters to also update URL**

Add a `setSearch` wrapper and replace the filter onChange handlers. Add this function directly after `updateUrl`:

```typescript
  function setSearch(v: string) {
    setSearchState(v)
    updateUrl({ search: v })
  }
```

Replace the filter panel JSX array (the `[{val: typeFilter, set: setTypeFilter, ...}]` array) with setters that also update the URL. Change each `set` callback:

```typescript
{ val: typeFilter, set: (v: string) => { setTypeFilter(v); updateUrl({ type: v }) }, opts: WINE_TYPES, label: 'Type' },
{ val: countryFilter, set: (v: string) => { setCountryFilter(v); updateUrl({ country: v }) }, opts: countries, label: 'Country' },
{ val: regionFilter, set: (v: string) => { setRegionFilter(v); updateUrl({ region: v }) }, opts: regions, label: 'Region' },
{ val: ratingFilter, set: (v: string) => { setRatingFilter(v); updateUrl({ rating: v }) }, opts: ['5','4','3','2','1'], label: 'Rating' },
{ val: windowFilter, set: (v: string) => { setWindowFilter(v); updateUrl({ window: v }) }, opts: DRINK_WINDOWS, label: 'Window' },
{ val: storageFilter, set: (v: string) => { setStorageFilter(v); updateUrl({ storage: v }) }, opts: STORAGE_OPTIONS, label: 'Storage' },
```

For the grape text input, change `onChange={e => setGrapeFilter(e.target.value)}` to:
```typescript
onChange={e => { setGrapeFilter(e.target.value); updateUrl({ grape: e.target.value }) }}
```

- [ ] **Step 5: Update the Clear button and sort handler to update URL**

Replace the Clear button `onClick`:
```typescript
onClick={() => {
  setTypeFilter(''); setCountryFilter(''); setRegionFilter('')
  setGrapeFilter(''); setRatingFilter(''); setWindowFilter(''); setStorageFilter('')
  router.replace('/', { scroll: false })
}}
```

Update `toggleSort` to also call `router.replace`:
```typescript
function toggleSort(key: SortKey) {
  const newDir = sortKey === key ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc'
  const newKey = key
  setSortKey(newKey)
  setSortDir(newDir)
  updateUrl({ sort: newKey, order: newDir })
}
```

- [ ] **Step 6: Update the sort logic to handle `'name'` (combines with Task 2 — do it now)**

Replace the sort function inside `useMemo` (the `.sort((a, b) => {...})` block):

```typescript
return [...list].sort((a, b) => {
  if (sortKey === 'name') {
    const aEmpty = !a.name?.trim()
    const bEmpty = !b.name?.trim()
    if (aEmpty && !bEmpty) return 1
    if (!aEmpty && bEmpty) return -1
    if (aEmpty && bEmpty) return 0
    return a.name!.localeCompare(b.name!) * (sortDir === 'asc' ? 1 : -1)
  }
  const av = a[sortKey] ?? (typeof a[sortKey] === 'number' ? -Infinity : '')
  const bv = b[sortKey] ?? (typeof b[sortKey] === 'number' ? -Infinity : '')
  if (av < bv) return sortDir === 'asc' ? -1 : 1
  if (av > bv) return sortDir === 'asc' ? 1 : -1
  return 0
})
```

Also add `sortKey` and `sortDir` to the `useMemo` dependency array (already there, just confirm).

- [ ] **Step 7: Make the Name column header a SortBtn**

In the desktop table thead, replace:
```typescript
<th className="text-left px-3 py-2 font-semibold">Name</th>
```
with:
```typescript
<th className="text-left px-3 py-2 font-semibold"><SortBtn col="name" label="Name" /></th>
```

- [ ] **Step 8: Test in browser**

Run `npm run dev` in `the-cellar/`. Navigate to `/`. Apply a search (e.g. "shiraz") and a region filter. Click a wine. Click Back. Confirm the search and region filter are still applied. Clear filters and confirm URL resets to `/`. Click a Name header and confirm sort works with nulls at the end.

- [ ] **Step 9: Commit**

```bash
cd "/Users/joelbaldwin/Macadamia Dropbox/Macadamia Projects/Claude/the-cellar"
git add src/app/page.tsx src/components/WineTable.tsx
git commit -m "feat: persist filter state in URL params, add Name sort column"
```

---

## Task 2: Sort by Name

**Already implemented in Task 1 Steps 2, 6, and 7.** No separate steps needed.

---

## Task 3: Remove `capture` from Image Upload

**Files:**
- Modify: `src/components/ImageUpload.tsx`

- [ ] **Step 1: Remove the `capture` attribute**

In `src/components/ImageUpload.tsx` line 88, change:
```html
<input
  ref={fileRef}
  type="file"
  accept="image/jpeg,image/png,image/webp"
  capture="environment"
  className="hidden"
  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
/>
```
to:
```html
<input
  ref={fileRef}
  type="file"
  accept="image/jpeg,image/png,image/webp"
  className="hidden"
  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
/>
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/joelbaldwin/Macadamia Dropbox/Macadamia Projects/Claude/the-cellar"
git add src/components/ImageUpload.tsx
git commit -m "fix: remove capture attribute from image upload to allow file picker on mobile"
```

---

## Task 4: Image Crop/Zoom Tool

**Files:**
- Create: `src/lib/cropImage.ts`
- Create: `src/components/ImageCropper.tsx`
- Modify: `src/components/ImageUpload.tsx`

- [ ] **Step 1: Install react-easy-crop**

```bash
cd "/Users/joelbaldwin/Macadamia Dropbox/Macadamia Projects/Claude/the-cellar"
npm install react-easy-crop
```

Expected output: package added to `node_modules` and `package.json`.

- [ ] **Step 2: Create the canvas crop utility**

Create `src/lib/cropImage.ts`:

```typescript
interface Area {
  x: number
  y: number
  width: number
  height: number
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = url
  })
}

export async function getCroppedImage(
  imageSrc: string,
  cropArea: Area,
  maxSize: number = 1200
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, maxSize / Math.max(cropArea.width, cropArea.height))
  canvas.width = Math.round(cropArea.width * scale)
  canvas.height = Math.round(cropArea.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    cropArea.x, cropArea.y, cropArea.width, cropArea.height,
    0, 0, canvas.width, canvas.height
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas blob failed')),
      'image/jpeg',
      0.85
    )
  })
}
```

- [ ] **Step 3: Create ImageCropper component**

Create `src/components/ImageCropper.tsx`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedImage } from '@/lib/cropImage'

interface Area {
  x: number
  y: number
  width: number
  height: number
}

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

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleCropAndUpload() {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const blob = await getCroppedImage(imageSrc, croppedAreaPixels)
      onCropped(blob, originalFile.name.replace(/\.[^.]+$/, '.jpg'))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.9)' }}
    >
      {/* Crop area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={undefined}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: '#111' },
          }}
        />
      </div>

      {/* Zoom slider */}
      <div className="px-6 py-3" style={{ background: 'rgba(0,0,0,0.8)' }}>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          className="w-full accent-white"
        />
      </div>

      {/* Buttons */}
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
```

- [ ] **Step 4: Update ImageUpload to open cropper after file selection**

Replace the full contents of `src/components/ImageUpload.tsx`:

```typescript
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

  function handleCropped(blob: Blob, filename: string) {
    closeCropper()
    uploadBlob(blob, filename)
  }

  function handleSkip(file: File) {
    closeCropper()
    uploadBlob(file, file.name)
  }

  function closeCropper() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    setPendingFile(null)
    if (fileRef.current) fileRef.current.value = ''
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
```

- [ ] **Step 5: Test in browser**

Start dev server. Go to any wine detail page. Click "Upload Image". Select a photo. Confirm the crop overlay appears. Pinch/scroll to zoom, drag to pan. Click "Crop & Upload". Confirm the image uploads and appears on the page. Reload and confirm it persisted. Also test "Skip Crop" and "Cancel".

- [ ] **Step 6: Commit**

```bash
cd "/Users/joelbaldwin/Macadamia Dropbox/Macadamia Projects/Claude/the-cellar"
git add src/lib/cropImage.ts src/components/ImageCropper.tsx src/components/ImageUpload.tsx package.json package-lock.json
git commit -m "feat: add image crop/zoom tool before upload, remove mobile capture restriction"
```

---

## Task 5: Drink Bottle Action

**Files:**
- Create: `src/components/DrinkModal.tsx`
- Create: `src/components/LastBottleModal.tsx`
- Modify: `src/components/WineDetail.tsx`
- Modify: `src/components/WineTable.tsx`

### Background
`WineDetail.tsx` already has `adjustQty(delta)` which PATCHes the quantity. We're building on top of that. The PATCH endpoint (`/api/wines/[id]`) already accepts any field — no API changes needed. Appending to `tasting_notes` happens in the client before PATCHing.

Hard-delete is already implemented in `deleteWine()` in `WineDetail.tsx`. `LastBottleModal` will duplicate that logic for the "Remove" option.

- [ ] **Step 1: Create DrinkModal**

Create `src/components/DrinkModal.tsx`:

```typescript
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
```

- [ ] **Step 2: Create LastBottleModal**

Create `src/components/LastBottleModal.tsx`:

```typescript
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
```

- [ ] **Step 3: Add Drink button and modal logic to WineDetail**

In `src/components/WineDetail.tsx`, add the imports at the top (after existing imports):

```typescript
import DrinkModal from './DrinkModal'
import LastBottleModal from './LastBottleModal'
```

Add state for the modals (inside `WineDetail`, after the existing `useState` calls):

```typescript
const [drinkModalOpen, setDrinkModalOpen] = useState(false)
const [lastBottleModalOpen, setLastBottleModalOpen] = useState(false)
```

Add the `handleDrink` function (after the existing `adjustQty` function):

```typescript
async function handleDrink(tastingNote: string) {
  setDrinkModalOpen(false)
  const newQty = wine.quantity - 1
  const today = new Date().toISOString().split('T')[0]
  const appendedNotes = tastingNote
    ? `${wine.tasting_notes ? wine.tasting_notes + '\n\n' : ''}---[${today}] ${tastingNote}`
    : wine.tasting_notes

  const body: Record<string, unknown> = { quantity: newQty }
  if (tastingNote) body.tasting_notes = appendedNotes

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
  setLastBottleModalOpen(false)
  if (action === 'wishlist') {
    const res = await fetch(`/api/wines/${wine.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_wishlist: true }),
    })
    if (res.ok) router.push('/wishlist')
  } else if (action === 'remove') {
    if (!confirm('Delete this wine? This cannot be undone.')) return
    const res = await fetch(`/api/wines/${wine.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/')
    else setError('Delete failed.')
  }
  // 'keep' — nothing to do, qty is already 0
}
```

Add the Drink button to the Actions section (the `<div className="flex flex-wrap gap-3">` block). Add it between the Edit/Save buttons and the Enrich button:

```typescript
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
```

Add the modals just before the closing `</div>` of the component return:

```typescript
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
```

- [ ] **Step 4: Add Drink quick-action to WineTable rows**

In `src/components/WineTable.tsx`, add a state and handler at the top of the component:

```typescript
const [drinkingWine, setDrinkingWine] = useState<Wine | null>(null)
```

Add the import:
```typescript
import DrinkModal from './DrinkModal'
```

Add the `handleTableDrink` function:
```typescript
async function handleTableDrink(wine: Wine, tastingNote: string) {
  setDrinkingWine(null)
  const newQty = wine.quantity - 1
  const today = new Date().toISOString().split('T')[0]
  const body: Record<string, unknown> = { quantity: newQty }
  if (tastingNote) {
    body.tasting_notes = `${wine.tasting_notes ? wine.tasting_notes + '\n\n' : ''}---[${today}] ${tastingNote}`
  }
  await fetch(`/api/wines/${wine.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  // Reload page to reflect qty change
  router.refresh()
}
```

In the desktop table, add a drink icon button column header after the Qty column:
```typescript
<th className="w-8 px-2 py-2" />
```

In each table row, add a drink cell after the qty cell:
```typescript
<td className="px-2 py-1 text-center">
  {wine.quantity > 0 && !isWishlist && (
    <button
      onClick={e => { e.stopPropagation(); setDrinkingWine(wine) }}
      title="Drink a bottle"
      className="text-base opacity-40 hover:opacity-100 transition-opacity"
    >
      🍷
    </button>
  )}
</td>
```

Add the DrinkModal at the bottom of the WineTable return (before closing `</div>`):
```typescript
{drinkingWine && (
  <DrinkModal
    wine={drinkingWine}
    onConfirm={(note) => handleTableDrink(drinkingWine, note)}
    onCancel={() => setDrinkingWine(null)}
  />
)}
```

- [ ] **Step 5: Test**

Dev server running. Go to a wine with qty ≥ 2. Click the Drink button. Enter a tasting note. Click Confirm. Verify qty decremented. Go to the wine with qty = 1. Click Drink, Confirm. Verify LastBottleModal appears. Test "Add to Wishlist" → check `/wishlist`. Test "Remove" → check wine is gone. Test "Keep in Cellar" → wine stays at qty 0. Test Drink icon in the table row. Verify `router.refresh()` updates the qty without full reload.

- [ ] **Step 6: Commit**

```bash
cd "/Users/joelbaldwin/Macadamia Dropbox/Macadamia Projects/Claude/the-cellar"
git add src/components/DrinkModal.tsx src/components/LastBottleModal.tsx src/components/WineDetail.tsx src/components/WineTable.tsx
git commit -m "feat: add Drink bottle action with tasting note and last-bottle follow-up"
```

---

## Task 6: AI Enrichment — Reduce Generic Results

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/app/api/ai/lookup/route.ts`
- Modify: `src/components/WineDetail.tsx`

### Background
Current enrichment in `WineDetail.enrich()` applies all returned fields only if the wine doesn't already have a value (e.g. `grape: w.grape || data.grape`). We're adding: per-field accept/reject checkboxes, a confidence badge, and a source attribution.

The API now needs to return `tasting_source`. The web search tool (`web_search_20250305`) lets Claude look up current reviews.

**Important:** The Anthropic SDK tool format for web search is `{ type: 'web_search_20250305', name: 'web_search' }`. This is a built-in tool, not a custom function — Claude will call it automatically when it needs to search.

- [ ] **Step 1: Extend `AILookupResponse` in types.ts**

In `src/lib/types.ts`, replace the `AILookupResponse` interface:

```typescript
export interface AILookupResponse {
  grape: string | null
  region: string | null
  country: string | null
  type: string | null
  abv: number | null
  drink_from: number | null
  drink_by: number | null
  tasting_notes: string | null
  tasting_source: string | null
  general_notes: string | null
  food_pairings: string | null
  score: string | null
  confidence: 'high' | 'medium' | 'low'
}
```

- [ ] **Step 2: Update the lookup API — new prompt and web search**

Replace the full contents of `src/app/api/ai/lookup/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a wine database assistant providing SPECIFIC information about individual wines.

CRITICAL RULES:
- Only provide information you are confident applies to THIS EXACT wine and vintage.
- If you are not sure about a specific detail for this vintage, return null for that field — do NOT fill it with generic information about the producer or grape variety.
- Tasting notes must describe THIS wine specifically (e.g. from published reviews of this vintage), not generic varietal descriptions. If you don't have specific tasting notes for this vintage, return null.
- Drink windows must reflect THIS vintage's ageing potential, not a generic range for the variety.
- ABV must be for THIS vintage specifically. If uncertain, return null.
- Scores must include the source (e.g. "96 — James Halliday" or "94 — Wine Advocate"). If you don't have a specific score, return null.
- Food pairings can be more general (based on grape/style) as these are less vintage-specific.
- Use the web_search tool to look up current reviews, scores, and tasting notes for the specific wine and vintage before responding.

Return ONLY a JSON object. Use null for any field where you cannot provide specific-to-this-wine information:
{
  "grape": string|null,
  "region": string|null,
  "country": string|null,
  "type": string|null,
  "abv": number|null,
  "drink_from": number|null,
  "drink_by": number|null,
  "tasting_notes": string|null,
  "tasting_source": string|null,
  "general_notes": string|null,
  "food_pairings": string|null,
  "score": string|null,
  "confidence": "high"|"medium"|"low"
}

confidence: "high" = found specific review/data for this vintage; "medium" = strong knowledge of this wine but no specific review found; "low" = mostly inferred from producer/variety only.
tasting_source: where the tasting note came from (e.g. "James Halliday, 2024 Wine Companion"), or null.`

export async function POST(req: NextRequest) {
  const { producer, vintage, name } = await req.json()

  if (!producer || !vintage) {
    return NextResponse.json({ error: 'producer and vintage are required' }, { status: 400 })
  }

  const wineDesc = [vintage, producer, name].filter(Boolean).join(' ')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: wineDesc }],
  })

  // Extract the final text block (after any tool use)
  const textBlock = message.content.findLast(b => b.type === 'text')
  const text = textBlock?.type === 'text' ? textBlock.text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })

  try {
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Add per-field accept/reject UI and confidence indicator to WineDetail**

This is the largest UI change. In `WineDetail.tsx`, we need enrichment state that tracks which fields were suggested and which are accepted.

Add new state after the existing state declarations:

```typescript
const [enrichData, setEnrichData] = useState<(typeof import('@/lib/types').AILookupResponse) | null>(null)
const [enrichAccepted, setEnrichAccepted] = useState<Record<string, boolean>>({})
```

Since TypeScript import expressions don't work like that in state, use the actual type import. Add to imports at top:
```typescript
import type { Wine, AILookupResponse } from '@/lib/types'
```

Replace the state declarations with:
```typescript
const [enrichData, setEnrichData] = useState<AILookupResponse | null>(null)
const [enrichAccepted, setEnrichAccepted] = useState<Record<string, boolean>>({})
```

Replace the `enrich()` function:

```typescript
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
    // Pre-accept all non-null fields that the wine doesn't already have
    const accepted: Record<string, boolean> = {}
    const enrichableFields = ['grape', 'region', 'country', 'type', 'abv', 'drink_from', 'drink_by', 'tasting_notes', 'general_notes', 'food_pairings', 'score'] as const
    for (const f of enrichableFields) {
      if (data[f] !== null && !wine[f as keyof Wine]) accepted[f] = true
      else if (data[f] !== null) accepted[f] = false // has value, don't auto-accept
    }
    setEnrichAccepted(accepted)
  } else {
    setError('AI enrichment failed.')
  }
  setEnriching(false)
}
```

Add an `applyEnrichment()` function:

```typescript
async function applyEnrichment() {
  if (!enrichData) return
  const updates: Partial<Wine> = { ai_enriched: true }
  const enrichableFields = ['grape', 'region', 'country', 'type', 'abv', 'drink_from', 'drink_by', 'tasting_notes', 'general_notes', 'food_pairings', 'score'] as const
  for (const f of enrichableFields) {
    if (enrichAccepted[f] && enrichData[f] !== null) {
      (updates as Record<string, unknown>)[f] = enrichData[f]
    }
  }
  setSaving(true)
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
```

Add the enrichment results panel — insert this JSX block after the `{error && ...}` block and before the fields section:

```typescript
{enrichData && (
  <div className="mb-6 rounded-xl p-5" style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}>
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-sm">✨ AI Enrichment Results</h3>
      <div className="flex items-center gap-2">
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
      ] as [keyof AILookupResponse, string][]).filter(([k]) => enrichData[k] !== null && k !== 'tasting_source' && k !== 'confidence').map(([key, label]) => (
        <label key={key} className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enrichAccepted[key] ?? false}
            onChange={e => setEnrichAccepted(p => ({ ...p, [key]: e.target.checked }))}
            className="mt-0.5 accent-current"
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
```

- [ ] **Step 4: Test enrichment**

Dev server running. Go to a wine detail page. Click "Enrich with AI". Wait for results (web search takes a few seconds). Verify the confidence badge appears. Verify per-field checkboxes show with suggested values. Uncheck one field. Click "Apply Selected". Confirm only checked fields were saved. Test "Discard". Test on a lesser-known wine — verify confidence is "low" and the warning banner appears.

- [ ] **Step 5: Commit**

```bash
cd "/Users/joelbaldwin/Macadamia Dropbox/Macadamia Projects/Claude/the-cellar"
git add src/lib/types.ts src/app/api/ai/lookup/route.ts src/components/WineDetail.tsx
git commit -m "feat: improve AI enrichment with web search, per-field accept/reject, confidence indicator"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task | Status |
|---|---|---|
| Filter state in URL params | 1 | ✅ Steps 1–5 |
| Router.replace with scroll:false | 1 | ✅ Step 3 |
| Clear button resets URL | 1 | ✅ Step 5 |
| Sort by Name, nulls last | 2 / 1 | ✅ Step 6 of Task 1 |
| Name sortable header | 2 / 1 | ✅ Step 7 of Task 1 |
| Remove `capture` attribute | 3 | ✅ Step 1 |
| react-easy-crop install | 4 | ✅ Step 1 |
| Crop modal after file select | 4 | ✅ Steps 3–4 |
| Pinch/scroll zoom, drag pan | 4 | ✅ Built into Cropper component |
| Free aspect ratio | 4 | ✅ `aspect={undefined}` |
| Skip link | 4 | ✅ "Skip Crop" button |
| Canvas JPEG export 0.85 | 4 | ✅ cropImage.ts |
| Max 1200px resize | 4 | ✅ getCroppedImage(imageSrc, area, 1200) |
| Updated AI system prompt | 6 | ✅ Step 2 |
| Web search tool on lookup | 6 | ✅ Step 2 |
| tasting_source field | 6 | ✅ Steps 1–2 |
| confidence field | 6 | ✅ Already existed, now stricter |
| Low-confidence warning banner | 6 | ✅ Step 3 |
| Source attribution on tasting notes | 6 | ✅ Step 3 |
| Per-field accept/reject checkboxes | 6 | ✅ Step 3 |
| Drink button on detail page | 5 | ✅ Step 3 |
| DrinkModal with qty change | 5 | ✅ Step 1 |
| Optional tasting note | 5 | ✅ Step 1 |
| Appended note format with date | 5 | ✅ `---[date] note` |
| Qty hits 0 → LastBottleModal | 5 | ✅ Step 3 |
| Add to Wishlist option | 5 | ✅ Step 2, 3 |
| Keep in Cellar option | 5 | ✅ Step 2, 3 |
| Remove option with confirmation | 5 | ✅ Step 2, 3 |
| Drink icon in table rows (qty > 0) | 5 | ✅ Step 4 |
| Disable Drink btn if qty = 0 | 5 | ✅ Step 3 (`disabled={wine.quantity === 0}`) |

**Placeholder scan:** No TBDs, TODOs, or vague "add validation" phrases found.

**Type consistency:**
- `AILookupResponse.tasting_source` defined in types.ts (Step 1) and used in WineDetail (Step 3) ✅
- `DrinkModal` takes `Wine` type — consistent with lib/types.ts ✅
- `handleTableDrink` in WineTable and `handleDrink` in WineDetail both use `---[date]` format ✅
- `SortKey` extended with `'name'` in Step 2 of Task 1, used in sort logic Step 6 ✅
