import type { GuideIconName } from '@/lib/guideMeta'

const PATHS: Record<GuideIconName, React.ReactNode> = {
  flag: <path d="M5 21V4m0 0h12l-2.5 4L17 12H5" />,
  yarn: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M4.5 9c5 .5 9 4 10.5 10M3.2 14c4 .4 7 2.6 8.8 7M8.5 3.6c4 1 7.500 3.700 9.500 8.400" />
    </>
  ),
  hook: <path d="M18.500 3 7 20.500M18.500 3c2 0 3 1.800 1.800 3.300S17 7.300 17 6.200" />,
  bear: (
    <>
      <circle cx="12" cy="13.500" r="6.500" />
      <circle cx="6.500" cy="6.800" r="2.300" />
      <circle cx="17.500" cy="6.800" r="2.300" />
      <path d="M9.800 12.500h.01M14.200 12.500h.01M10.500 16c.9.700 2.100.7 3 0" />
    </>
  ),
  sparkle: <path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800L12 3zM19 16l.8 2.200L22 19l-2.200.8L19 22l-.8-2.200L16 19l2.200-.8L19 16z" />,
}

/** Small line icon for a guide section. Decorative: the section name always sits next to it. */
export function GuideIcon({ name, size = 20, className = '' }: { name: GuideIconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={className}
    >
      {PATHS[name]}
    </svg>
  )
}
