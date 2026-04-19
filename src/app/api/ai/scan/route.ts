import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { imageBase64, mediaType = 'image/jpeg' } = body

  if (!imageBase64) {
    return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 })
  }

  // Stage 1: Vision extraction
  const visionMsg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: 'You are a wine label reader. Extract wine details from this label image. Return ONLY a JSON object: { "producer": string|null, "vintage": number|null, "name": string|null, "grape": string|null, "region": string|null, "country": string|null }. Use null for any field you cannot determine from the label.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
              data: imageBase64,
            },
          },
          { type: 'text', text: 'Extract the wine details from this label.' },
        ],
      },
    ],
  })

  const text = visionMsg.content[0].type === 'text' ? visionMsg.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Could not read label' }, { status: 500 })

  let extracted: Record<string, unknown>
  try {
    extracted = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'Failed to parse label data' }, { status: 500 })
  }

  // Stage 2: Enrich via lookup
  if (extracted.producer && extracted.vintage) {
    const enrichRes = await fetch(new URL('/api/ai/lookup', req.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producer: extracted.producer,
        vintage: extracted.vintage,
        name: extracted.name,
      }),
    })
    if (enrichRes.ok) {
      const enriched = await enrichRes.json()
      return NextResponse.json({ ...enriched, ...extracted })
    }
  }

  return NextResponse.json(extracted)
}
