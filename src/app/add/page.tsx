import AddWineForm from '@/components/AddWineForm'

export default function AddPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--wine)' }}>Add Wine</h1>
      <AddWineForm />
    </div>
  )
}
