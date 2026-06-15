import type { Wine } from '@/lib/types'
import { AUSTRALIAN_REGIONS } from '@/data/wine-regions'
import { resolveRegionCoords } from './region-matcher'

// Coordinate keys that belong to Australian regions, used to classify a wine
// by where it actually resolved rather than its (often blank) country field.
const AUSTRALIAN_COORD_KEYS = new Set(
  Object.values(AUSTRALIAN_REGIONS).map(c => `${c.lat},${c.lng}`)
)

export interface WineSummary {
  id: string
  vintage: number
  producer: string
  name: string
  grape: string
  quantity: number
  rating: number | null
}

export interface MapRegion {
  name: string           // display name (first segment, normalised)
  lat: number
  lng: number
  bottleCount: number    // total bottles at this location
  wineCount: number      // distinct wine entries
  wines: WineSummary[]   // wines at this region, for the panel
  country: string
  isAustralian: boolean
}

/**
 * Group wines by resolved region coordinates. Wines that resolve to the same
 * lat/lng are merged into one MapRegion. Wines whose region can't be resolved
 * are dropped (reported via the `unresolved` list so the UI can surface them).
 */
export function aggregateWinesByRegion(wines: Wine[]): {
  australian: MapRegion[]
  international: MapRegion[]
  unresolved: Wine[]
} {
  const regionMap = new Map<string, MapRegion>()
  const unresolved: Wine[] = []

  for (const wine of wines) {
    const coords = resolveRegionCoords(wine.region, wine.country)
    if (!coords) {
      unresolved.push(wine)
      continue
    }

    const key = `${coords.lat},${coords.lng}`
    const summary: WineSummary = {
      id: wine.id,
      vintage: wine.vintage,
      producer: wine.producer,
      name: wine.name || '',
      grape: wine.grape || '',
      quantity: wine.quantity,
      rating: wine.rating,
    }

    const existing = regionMap.get(key)
    if (existing) {
      existing.bottleCount += wine.quantity
      existing.wineCount += 1
      existing.wines.push(summary)
    } else {
      const displayName = (wine.region || '').split(/\s*(?:,|\/|&|–|—|\band\b)\s*/i)[0].replace(/\s+/g, ' ').trim() || 'Unknown'
      const isAustralian = AUSTRALIAN_COORD_KEYS.has(key)
      regionMap.set(key, {
        name: displayName,
        lat: coords.lat,
        lng: coords.lng,
        bottleCount: wine.quantity,
        wineCount: 1,
        wines: [summary],
        country: wine.country || (isAustralian ? 'Australia' : ''),
        isAustralian,
      })
    }
  }

  // Sort each region's wines by rating (desc), then vintage (desc) for the panel
  for (const region of regionMap.values()) {
    region.wines.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.vintage - a.vintage)
  }

  const all = Array.from(regionMap.values())
  return {
    australian: all.filter(r => r.isAustralian),
    international: all.filter(r => !r.isAustralian),
    unresolved,
  }
}
