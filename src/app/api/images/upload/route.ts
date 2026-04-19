import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const wineId = form.get('wine_id') as string | null
  const file = form.get('file') as File | null

  if (!wineId || !file) {
    return NextResponse.json({ error: 'wine_id and file are required' }, { status: 400 })
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 5MB' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const path = `${wineId}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('labels')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from('labels').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('wines')
    .update({ label_image_url: publicUrl, image_source: 'upload' })
    .eq('id', wineId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl, image_source: 'upload' })
}
