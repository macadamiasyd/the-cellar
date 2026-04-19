import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { WineFilters } from '@/lib/types'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const sp = req.nextUrl.searchParams
  const p: WineFilters = {
    search: sp.get('search') ?? undefined,
    type: sp.get('type') ?? undefined,
    country: sp.get('country') ?? undefined,
    region: sp.get('region') ?? undefined,
    grape: sp.get('grape') ?? undefined,
    rating: sp.get('rating') ?? undefined,
    window: sp.get('window') ?? undefined,
    stock: sp.get('stock') ?? undefined,
    wishlist: sp.get('wishlist') ?? undefined,
    sort: (sp.get('sort') as any) ?? undefined,
    order: (sp.get('order') as any) ?? undefined,
  }

  let query = supabase.from('wines').select('*')

  const isWishlist = p.wishlist === 'true'
  query = query.eq('is_wishlist', isWishlist)
  if (!isWishlist) query = query.gt('quantity', 0)

  if (p.type) query = query.eq('type', p.type)
  if (p.country) query = query.eq('country', p.country)
  if (p.region) query = query.eq('region', p.region)
  if (p.grape) query = query.ilike('grape', `%${p.grape}%`)
  if (p.rating) query = query.eq('rating', parseInt(p.rating))
  if (p.search) {
    query = query.or(
      `producer.ilike.%${p.search}%,name.ilike.%${p.search}%,grape.ilike.%${p.search}%,region.ilike.%${p.search}%`
    )
  }

  const sortCol = p.sort ?? 'vintage'
  query = query.order(sortCol, { ascending: p.order !== 'desc' })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { data, error } = await supabase.from('wines').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
