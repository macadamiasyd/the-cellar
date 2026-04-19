import { createClient } from '@/lib/supabase/server'
import WineTable from '@/components/WineTable'

export const revalidate = 0

export default async function CellarPage() {
  const supabase = await createClient()
  const { data: wines, error } = await supabase
    .from('wines')
    .select('*')
    .eq('is_wishlist', false)
    .gt('quantity', 0)
    .order('vintage', { ascending: false })

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center" style={{ color: 'var(--muted)' }}>
        <p className="font-medium">Could not load cellar. Check your Supabase credentials in .env.local</p>
        <p className="text-sm mt-2">{error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--wine)' }}>The Cellar</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
          {wines.length} wines · {wines.reduce((s, w) => s + w.quantity, 0)} bottles ·{' '}
          AUD ${wines.reduce((s, w) => s + ((w.price ?? 0) * w.quantity), 0).toLocaleString()}
        </p>
      </div>
      <WineTable wines={wines} />
    </div>
  )
}
