/** Re-mounts on every navigation, so each page gently fades in (opacity only). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>
}
