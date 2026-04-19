import AISommelier from '@/components/AISommelier'

export default function SommelierPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--wine)' }}>AI Sommelier</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Ask about pairings, drink windows, or your cellar</p>
      </div>
      <AISommelier />
    </div>
  )
}
