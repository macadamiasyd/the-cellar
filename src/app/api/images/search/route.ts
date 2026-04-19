import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_CSE_API_KEY
  const cx = process.env.GOOGLE_CSE_CX

  if (!apiKey || !cx) {
    return NextResponse.json({ url: null, reason: 'Google CSE not configured' }, { status: 200 })
  }

  const { producer, name, vintage, wine_id } = await req.json()
  if (!producer || !vintage) {
    return NextResponse.json({ error: 'producer and vintage are required' }, { status: 400 })
  }

  const query = [vintage, producer, name, 'wine bottle'].filter(Boolean).join(' ')
  const searchUrl = new URL('https://www.googleapis.com/customsearch/v1')
  searchUrl.searchParams.set('key', apiKey)
  searchUrl.searchParams.set('cx', cx)
  searchUrl.searchParams.set('q', query)
  searchUrl.searchParams.set('searchType', 'image')
  searchUrl.searchParams.set('imgSize', 'medium')
  searchUrl.searchParams.set('num', '5')

  const res = await fetch(searchUrl.toString())
  if (!res.ok) {
    return NextResponse.json({ url: null, reason: 'Search API error' }, { status: 200 })
  }

  const data = await res.json()
  const items: Array<{ link: string; image: { width: number; height: number } }> = data.items ?? []

  // Prefer portrait images (height > width) at least 200px wide
  const best =
    items.find(i => i.image.height > i.image.width && i.image.width >= 200) ??
    items.find(i => i.image.width >= 200) ??
    items[0]

  if (!best) {
    return NextResponse.json({ url: null, reason: 'No results' }, { status: 200 })
  }

  const imageUrl = best.link

  // Only update if wine_id provided and no user upload/scan exists
  if (wine_id) {
    const supabase = createServiceClient()
    const { data: wine } = await supabase
      .from('wines')
      .select('image_source')
      .eq('id', wine_id)
      .single()

    if (!wine || wine.image_source === 'upload' || wine.image_source === 'scan') {
      return NextResponse.json({ url: imageUrl, image_source: 'auto', skipped: true })
    }

    await supabase
      .from('wines')
      .update({ label_image_url: imageUrl, image_source: 'auto' })
      .eq('id', wine_id)
  }

  return NextResponse.json({ url: imageUrl, image_source: 'auto' })
}
