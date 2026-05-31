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

Return ONLY a JSON object as your final message. Use null for any field where you cannot provide specific-to-this-wine information:
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

  // After tool use, the final text block holds the JSON. Find the last text block.
  const textBlocks = message.content.filter(b => b.type === 'text')
  const text = textBlocks.length ? (textBlocks[textBlocks.length - 1] as { text: string }).text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })

  try {
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
