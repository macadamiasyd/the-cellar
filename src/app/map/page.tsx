import { createClient } from '@/lib/supabase/server'
import MapView from '@/components/MapView'

export const revalidate = 0

export default async function MapPage() {
  const supabase = await createClient()
  const { data: wines, error } = await supabase
    .from('wines')
    .select('*')
    .eq('is_wishlist', false)
    .gt('quantity', 0)

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center" style={{ color: 'var(--muted)' }}>
        <p className="font-medium">Could not load map.</p>
        <p className="text-sm mt-2">{error.message}</p>
      </div>
    )
  }

  return <MapView wines={wines ?? []} />
}
