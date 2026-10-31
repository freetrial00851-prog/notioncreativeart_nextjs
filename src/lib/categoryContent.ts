import type { GuideBlock } from '@/lib/guides'
import { amigurumiContent } from '@/content/categories/amigurumi'
import { noSewAmigurumiContent } from '@/content/categories/no-sew-amigurumi'
import { wearablesContent } from '@/content/categories/wearables'
import { accessoriesContent } from '@/content/categories/accessories'
import { babyKidsContent } from '@/content/categories/baby-kids'
import { bundlesContent } from '@/content/categories/bundles'
import { holidayContent } from '@/content/categories/holiday'
import { homeDecorContent } from '@/content/categories/home-decor'
import { kitchenStorageContent } from '@/content/categories/kitchen-storage'
import { seasonalContent } from '@/content/categories/seasonal'
import { toolsGuidesContent } from '@/content/categories/tools-guides'

/** Long-form text shown under the pattern grid on a category page. Same block format as the guides. */
export type CategoryContent = {
  slug: string
  body: GuideBlock[]
  /** Visible questions at the end (no FAQ markup: Google no longer shows it for shops). */
  faq?: { q: string; a: string }[]
}

const CONTENT: CategoryContent[] = [
  amigurumiContent,
  noSewAmigurumiContent,
  wearablesContent,
  accessoriesContent,
  babyKidsContent,
  bundlesContent,
  holidayContent,
  homeDecorContent,
  kitchenStorageContent,
  seasonalContent,
  toolsGuidesContent,
]

export function getCategoryContent(slug: string): CategoryContent | undefined {
  return CONTENT.find((c) => c.slug === slug)
}
