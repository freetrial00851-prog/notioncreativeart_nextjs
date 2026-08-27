'use client'

import { EmailVerifyBanner } from '@/components/EmailVerifyBanner'
import { CompleteAccountBanner } from '@/components/CompleteAccountBanner'

/**
 * Sitewide account nudges — email verification first (higher priority), then billing address.
 * Both can show at once, stacked below the header.
 */
export function GlobalAccountBanners() {
  return (
    <>
      <EmailVerifyBanner variant="global" />
      <CompleteAccountBanner />
    </>
  )
}
