import { createClient } from '@/lib/supabase/server'
import WineTable from '@/components/WineTable'

export const revalidate = 0

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: wines, error } = await supabase
    .from('wines')
    .select('*')
    .eq('is_wishlist', true)
    .order('producer', { ascending: true })

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center" style={{ color: 'var(--muted)' }}>
        <p>Could not load wishlist.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--wine)' }}>Wishlist</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Wines to acquire</p>
      </div>
      <WineTable wines={wines ?? []} isWishlist />
    </div>
  )
}
