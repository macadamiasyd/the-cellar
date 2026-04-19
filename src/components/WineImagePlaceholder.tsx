const TINTS: Record<string, string> = {
  Red:       '#6B1A2A',
  White:     '#C4B078',
  Rosé:      '#D4899B',
  Sparkling: '#B8B8B8',
  Fortified: '#8B4513',
  Dessert:   '#C4B078',
  Orange:    '#C87941',
}

export default function WineImagePlaceholder({
  type = 'Red',
  width = 48,
  height = 64,
  className = '',
}: {
  type?: string | null
  width?: number
  height?: number
  className?: string
}) {
  const fill = TINTS[type ?? 'Red'] ?? TINTS.Red

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Bottle body */}
      <rect x="14" y="28" width="20" height="30" rx="4" fill={fill} opacity="0.15" />
      <rect x="14" y="28" width="20" height="30" rx="4" stroke={fill} strokeWidth="1.5" fill="none" />
      {/* Shoulder */}
      <path d="M14 28 Q14 20 18 18 L18 14 L30 14 L30 18 Q34 20 34 28" stroke={fill} strokeWidth="1.5" fill={fill} fillOpacity="0.08" />
      {/* Neck */}
      <rect x="18" y="8" width="12" height="8" rx="2" fill={fill} fillOpacity="0.12" stroke={fill} strokeWidth="1.5" />
      {/* Cork */}
      <rect x="20" y="5" width="8" height="5" rx="1.5" fill={fill} opacity="0.5" />
      {/* Label */}
      <rect x="17" y="34" width="14" height="16" rx="2" fill="white" fillOpacity="0.6" stroke={fill} strokeWidth="0.75" strokeOpacity="0.4" />
    </svg>
  )
}
