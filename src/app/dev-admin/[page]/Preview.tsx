'use client'

import { setAnalyticsSource } from '@/lib/adminAnalytics'
import { mockSource } from '@/lib/adminAnalyticsMock'
import { InsightsOverview, InsightsCustomers, InsightsSaved, InsightsProducts, InsightsTraffic, InsightsSetup } from '@/views/AdminInsights'

const PAGES: Record<string, () => React.ReactElement> = {
  overview: () => <InsightsOverview />,
  customers: () => <InsightsCustomers />,
  saved: () => <InsightsSaved />,
  products: () => <InsightsProducts />,
  traffic: () => <InsightsTraffic />,
  setup: () => <InsightsSetup />,
}

/** Dev-only (404 in production): admin analytics pages with sample data, no login needed. */
export function DevAdminPreview({ page }: { page: string }) {
  setAnalyticsSource(mockSource)
  const render = PAGES[page] ?? PAGES.overview
  return <div className="min-h-screen bg-[#f9f8f6] page-gutter py-6">{render()}</div>
}
