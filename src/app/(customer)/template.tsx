/**
 * Re-mounts on every navigation. It used to fade each page in with an opacity animation, but content that is first
 * painted at opacity 0 is never counted by Chrome as the page's Largest Contentful Paint, so the browser (and
 * PageSpeed) saw the hero or the first product photo only when something else appeared later. No wrapper animation now.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
