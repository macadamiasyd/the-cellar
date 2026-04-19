import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import type { ChatMessage } from '@/lib/types'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { message, history = [] }: { message: string; history: ChatMessage[] } = await req.json()

  const supabase = createServiceClient()
  const { data: wines } = await supabase
    .from('wines')
    .select('vintage,producer,name,grape,region,rating,drink_from,drink_by,quantity,price')
    .eq('is_wishlist', false)
    .gt('quantity', 0)
    .order('vintage', { ascending: false })

  const currentYear = new Date().getFullYear()
  type WineRow = { vintage: number; producer: string; name: string | null; grape: string | null; region: string | null; rating: number | null; drink_from: number | null; drink_by: number | null; quantity: number; price: number | null }
  const cellarContext = ((wines ?? []) as WineRow[])
    .map(w => {
      const window = w.drink_from && w.drink_by ? `${w.drink_from}–${w.drink_by}` : '?'
      const rating = w.rating ? `★${w.rating}` : ''
      const price = w.price ? `$${w.price}` : ''
      return `${w.vintage} ${w.producer}${w.name ? ' ' + w.name : ''} | ${w.grape ?? '?'} | ${w.region ?? '?'} | ${rating} | ${window} | ${w.quantity}btl | ${price}`
    })
    .join('\n')

  const systemPrompt = `You are an expert sommelier with deep knowledge of Australian wine and an intimate familiarity with this cellar. Current year: ${currentYear}.

CELLAR INVENTORY (owned wines, qty > 0):
${cellarContext}

Instructions:
- Reference actual wines from the inventory by name (use **bold** for wine names)
- For drink window recommendations, calculate from current year (${currentYear})
- Keep responses focused and practical
- For food pairing and occasion questions, suggest specific wines from the cellar
- If asked about value or pricing, use the prices in the inventory`

  const messages: Anthropic.MessageParam[] = [
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ]

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ reply })
}
