import { AUSTRALIAN_REGIONS, INTERNATIONAL_REGIONS, RegionCoord } from '@/data/wine-regions'

const ALL_REGIONS: Record<string, RegionCoord> = { ...AUSTRALIAN_REGIONS, ...INTERNATIONAL_REGIONS }

const COUNTRY_CENTROIDS: Record<string, RegionCoord> = {
  'France':        { lat: 46.60, lng: 2.35 },
  'Italy':         { lat: 42.50, lng: 12.50 },
  'Chile':         { lat: -33.45, lng: -70.65 },
  'Argentina':     { lat: -34.60, lng: -58.38 },
  'United States': { lat: 38.50, lng: -122.27 },
  'Portugal':      { lat: 38.72, lng: -9.14 },
  'Lebanon':       { lat: 33.85, lng: 35.86 },
  'Denmark':       { lat: 55.68, lng: 12.57 },
  'Spain':         { lat: 40.42, lng: -3.70 },
  'New Zealand':   { lat: -41.00, lng: 173.00 },
  'South Africa':  { lat: -33.93, lng: 18.86 },
  'Germany':       { lat: 50.00, lng: 8.00 },
}

/**
 * Resolve a wine's region string to coordinates.
 *
 * Handles, in priority order:
 * - Exact matches ("Clare Valley")
 * - Whitespace-normalised matches ("Eden  Valley" → "Eden Valley")
 * - Multi-region blends split on , / & – — "and" and "%" markers
 *   ("Langhorne Creek/Barossa/McLaren Vale", "62% Langhorne Creek – 30% McLaren Vale")
 * - Aliases ("Barossa" → Barossa Valley, "Douro" → Douro Valley)
 * - Substring matches (either direction, length-guarded)
 * - Country centroid fallback for known countries
 */
export function resolveRegionCoords(
  region: string | null | undefined,
  country: string | null | undefined
): RegionCoord | null {
  const normalised = (region ?? '').replace(/\s+/g, ' ').trim()

  if (normalised) {
    // 1. Exact match on the whole string
    if (ALL_REGIONS[normalised]) return ALL_REGIONS[normalised]

    // 2. Split blends on common delimiters and try each segment
    const parts = normalised
      .split(/\s*(?:,|\/|&|–|—|\band\b)\s*/i)
      .map(s => s.replace(/\d+\s*%?/g, '').replace(/[''’]/g, '').trim())
      .filter(Boolean)

    for (const part of parts) {
      if (ALL_REGIONS[part]) return ALL_REGIONS[part]
    }

    // 3. Substring match, either direction, on segments (length-guarded to avoid noise)
    for (const part of parts) {
      const lp = part.toLowerCase()
      if (lp.length < 4) continue
      for (const [name, coords] of Object.entries(ALL_REGIONS)) {
        const ln = name.toLowerCase()
        if (lp.includes(ln) || ln.includes(lp)) return coords
      }
    }

    // 4. Substring match against the whole normalised string.
    // Guard short keys (e.g. "Robe", "Alba") to avoid false positives like
    // "Calabria" matching "Alba".
    const lwhole = normalised.toLowerCase()
    for (const [name, coords] of Object.entries(ALL_REGIONS)) {
      if (name.length < 5) continue
      if (lwhole.includes(name.toLowerCase())) return coords
    }
  }

  // 5. Country centroid fallback
  const c = (country ?? '').trim()
  if (c && COUNTRY_CENTROIDS[c]) return COUNTRY_CENTROIDS[c]

  return null
}
