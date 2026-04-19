export interface Wine {
  id: string
  vintage: number
  producer: string
  name: string | null
  grape: string | null
  region: string | null
  country: string | null
  type: string
  vineyard: string | null
  abv: number | null
  drink_from: number | null
  drink_by: number | null
  rating: number | null
  score: string | null
  tasting_notes: string | null
  general_notes: string | null
  food_pairings: string | null
  storage_location: string | null
  purchase_location: string | null
  quantity: number
  volume: string
  price: number | null
  currency: string
  label_image_url: string | null
  image_source: 'scan' | 'upload' | 'auto' | null
  ai_enriched: boolean
  is_wishlist: boolean
  created_at: string
  updated_at: string
}

export type WineInsert = Omit<Wine, 'id' | 'created_at' | 'updated_at'>
export type WineUpdate = Partial<WineInsert>

export type DrinkStatus = 'now' | 'soon' | 'cellaring' | 'past' | 'unknown'

export function getDrinkStatus(wine: Pick<Wine, 'drink_from' | 'drink_by'>): DrinkStatus {
  const year = new Date().getFullYear()
  const { drink_from, drink_by } = wine
  if (!drink_from && !drink_by) return 'unknown'
  if (drink_by && drink_by < year) return 'past'
  if (drink_from && drink_from > year + 2) return 'cellaring'
  if (drink_from && drink_from > year) return 'soon'
  return 'now'
}

export interface AILookupResponse {
  grape: string | null
  region: string | null
  country: string | null
  type: string | null
  abv: number | null
  drink_from: number | null
  drink_by: number | null
  tasting_notes: string | null
  general_notes: string | null
  food_pairings: string | null
  score: string | null
  confidence: 'high' | 'medium' | 'low'
}

export interface WineFilters {
  search?: string
  type?: string
  country?: string
  region?: string
  grape?: string
  rating?: string
  window?: string
  stock?: string
  wishlist?: string
  sort?: keyof Wine
  order?: 'asc' | 'desc'
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
