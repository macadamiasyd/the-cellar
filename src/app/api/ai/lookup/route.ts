import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { producer, vintage, name } = await req.json()

  if (!producer || !vintage) {
    return NextResponse.json({ error: 'producer and vintage are required' }, { status: 400 })
  }

  const wineDesc = [vintage, producer, name].filter(Boolean).join(' ')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: `You are a wine database assistant. Given the following wine details, provide accurate information to complete the wine's profile.
Return ONLY a JSON object with these fields (use null for unknown):
{ "grape": string|null, "region": string|null, "country": string|null, "type": string|null, "abv": number|null, "drink_from": number|null, "drink_by": number|null, "tasting_notes": string|null, "general_notes": string|null, "food_pairings": string|null, "score": string|null, "confidence": "high"|"medium"|"low" }
Be specific and accurate. Use your knowledge of wine vintages, regions, and producers.
For drink windows, provide realistic year ranges based on the wine style and vintage.
For tasting notes, provide 2-3 sentences describing the wine's character.
For food pairings, suggest 3-5 specific dishes or food categories.
If you don't recognise the wine, return nulls and set confidence to "low".`,
    messages: [{ role: 'user', content: wineDesc }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })

  try {
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
