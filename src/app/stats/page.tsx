import { createClient } from '@/lib/supabase/server'
import StatsView from '@/components/StatsView'

export const revalidate = 0

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: wines } = await supabase
    .from('wines')
    .select('*')
    .eq('is_wishlist', false)
    .gt('quantity', 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--wine)' }}>Collection Stats</h1>
      <StatsView wines={wines ?? []} />
    </div>
  )
}
