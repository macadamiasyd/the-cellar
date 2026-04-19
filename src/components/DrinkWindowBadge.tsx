import { Wine, getDrinkStatus } from '@/lib/types'

export default function DrinkWindowBadge({ wine }: { wine: Pick<Wine, 'drink_from' | 'drink_by'> }) {
  const status = getDrinkStatus(wine)
  const label =
    status === 'now'       ? `${wine.drink_from ?? '?'}–${wine.drink_by ?? '?'}` :
    status === 'soon'      ? `${wine.drink_from ?? '?'}–${wine.drink_by ?? '?'}` :
    status === 'cellaring' ? `${wine.drink_from ?? '?'}–${wine.drink_by ?? '?'}` :
    status === 'past'      ? `${wine.drink_from ?? '?'}–${wine.drink_by ?? '?'}` :
    '—'

  const cls =
    status === 'now'       ? 'drink-now' :
    status === 'soon'      ? 'drink-soon' :
    status === 'cellaring' ? 'drink-cell' :
    status === 'past'      ? 'drink-past' :
    ''

  return <span className={`text-sm font-mono ${cls}`}>{label}</span>
}
