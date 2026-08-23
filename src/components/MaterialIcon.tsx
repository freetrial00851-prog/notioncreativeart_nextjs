export function MaterialIcon({
  name,
  size = 20,
  color,
  filled = false,
  className = '',
  style,
}: {
  name: string
  size?: number
  color?: string
  filled?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        width: size,
        height: size,
        color,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        ...style,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}
