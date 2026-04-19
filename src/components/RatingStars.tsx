export default function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return <span style={{ color: 'var(--muted)' }}>—</span>
  return (
    <span aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? 'star-filled' : 'star-empty'}>★</span>
      ))}
    </span>
  )
}
