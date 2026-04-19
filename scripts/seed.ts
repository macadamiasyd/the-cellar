import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function toInt(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null
  const n = parseInt(val.trim())
  return isNaN(n) ? null : n
}

function toDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null
  const n = parseFloat(val.trim())
  return isNaN(n) ? null : n
}

function toStr(val: string | undefined): string | null {
  if (!val || val.trim() === '') return null
  return val.trim()
}

async function seed() {
  const csvPath = join(__dirname, '../WineData.csv')
  let raw: string
  try {
    raw = readFileSync(csvPath, 'utf-8')
  } catch {
    console.error('WineData.csv not found at:', csvPath)
    console.error('Place WineData.csv in the project root and try again.')
    process.exit(1)
  }

  // Skip the preamble lines before the header row
  const lines = raw.split('\n')
  const headerIdx = lines.findIndex(l => l.startsWith('Vintage,'))
  if (headerIdx === -1) {
    console.error('Could not find CSV header row starting with "Vintage,"')
    process.exit(1)
  }
  const csvData = lines.slice(headerIdx).join('\n')

  const records: Record<string, string>[] = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  })

  const inStock = records.filter(r => {
    const qty = parseInt(r['Quantity'] || '0')
    return !isNaN(qty) && qty > 0
  })

  console.log(`Seeding ${inStock.length} in-stock wines (qty > 0)...`)

  const wines = inStock.map(r => ({
    vintage: toInt(r['Vintage']) ?? new Date().getFullYear(),
    producer: toStr(r['Producer']) ?? 'Unknown',
    name: toStr(r['Name']),
    grape: toStr(r['Grape']),
    region: toStr(r['Region']),
    country: toStr(r['Country']),
    type: toStr(r['Type']) ?? 'Red',
    vineyard: toStr(r['Vineyard']),
    abv: toDecimal(r['ABV (%)']),
    drink_from: toInt(r['Drink from']),
    drink_by: toInt(r['Drink by']),
    rating: toInt(r['Rating']),
    score: toStr(r['Score']),
    tasting_notes: toStr(r['Tasting']),
    general_notes: toStr(r['General']),
    food_pairings: toStr(r['Pairings']),
    storage_location: toStr(r['Storage Location']),
    purchase_location: toStr(r['Purchase Location']),
    quantity: toInt(r['Quantity']) ?? 1,
    volume: toStr(r['Volume']) ?? '750mL',
    price: toDecimal(r['Price']),
    currency: toStr(r['Currency']) ?? 'AUD',
    is_wishlist: false,
    ai_enriched: false,
  }))

  // Insert in batches of 50
  const BATCH = 50
  let inserted = 0
  for (let i = 0; i < wines.length; i += BATCH) {
    const batch = wines.slice(i, i + BATCH)
    const { error } = await supabase.from('wines').insert(batch)
    if (error) {
      console.error(`Batch ${i / BATCH + 1} failed:`, error.message)
    } else {
      inserted += batch.length
      console.log(`Inserted ${inserted}/${wines.length}`)
    }
  }

  console.log(`Done. ${inserted} wines seeded.`)
}

seed().catch(console.error)
