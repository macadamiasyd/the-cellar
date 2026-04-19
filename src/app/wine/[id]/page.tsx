import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import WineDetail from '@/components/WineDetail'

export const revalidate = 0

export default async function WineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: wine, error } = await supabase.from('wines').select('*').eq('id', id).single()
  if (error || !wine) notFound()
  return <WineDetail wine={wine} />
}
