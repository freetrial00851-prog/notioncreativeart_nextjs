'use client'

import { setAnalyticsSource } from '@/lib/adminAnalytics'
import { mockSource } from '@/lib/adminAnalyticsMock'
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
