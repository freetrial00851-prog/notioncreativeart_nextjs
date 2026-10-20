'use client'

import { setAnalyticsSource } from '@/lib/adminAnalytics'
import { mockSource } from '@/lib/adminAnalyticsMock'
import { ProductsAdmin } from '@/views/Admin'
import { AdminImport } from '@/views/AdminImport'
import { AdminOrders } from '@/views/AdminOrders'
import { AdminReviews } from '@/views/AdminReviews'
import { AdminCategories, AdminSubscribers, AdminTrash } from '@/views/AdminCatalog'
import { AdminShell } from '@/views/AdminShell'
import { AdminToday } from '@/views/AdminToday'
import { HomepageAdmin } from '@/views/AdminHomepage'
import { InsightsOverview, InsightsCustomers, InsightsSaved, InsightsProducts, InsightsTraffic, InsightsSetup } from '@/views/AdminInsights'

const PAGES: Record<string, () => React.ReactElement> = {
  overview: () => <InsightsOverview />,
  customers: () => <InsightsCustomers />,
  saved: () => <InsightsSaved />,
  products: () => <InsightsProducts />,
  traffic: () => <InsightsTraffic />,
  setup: () => <InsightsSetup />,
  homepage: () => <HomepageAdmin />,
  listings: () => <ProductsAdmin mode="listings" />,
  orders: () => <AdminOrders />,
  import: () => <AdminImport />,
  reviews: () => <AdminReviews />,
  categories: () => <AdminCategories />,
  subscribers: () => <AdminSubscribers />,
  trash: () => <AdminTrash />,
  today: () => <AdminToday name="Sufyan" />,
}

/** Dev-only (404 in production): admin analytics pages with sample data, no login needed. */
export function DevAdminPreview({ page }: { page: string }) {
  setAnalyticsSource(mockSource)
  const render = PAGES[page] ?? PAGES.overview
  return (
    <AdminShell pendingReviews={3} email="owner@example.com" name="Sufyan" onSignOut={() => {}}>
      {render()}
    </AdminShell>
  )
}
