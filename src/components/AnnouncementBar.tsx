'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  activeAnnouncementMessages,
  normalizeAnnouncements,
  shouldShowAnnouncementBar,
  type AnnouncementsContent,
} from '@/lib/types'

/** DESIGN_SPEC §1 — default copy when CMS announcements are empty / disabled. */
const DEFAULT_BY_BREAKPOINT = {
  mobile: 'Instant PDF download · 10% off when you join',
  tablet: 'Instant PDF download on every pattern · Join the list, get 10% off',
  desktop: 'Instant PDF download on every pattern · Join the list and get 10% off your next order',
} as const

/**
 * Full-width primary announcement bar — DESIGN_SPEC §3.1.
 * Prefers CMS `site_settings.announcements` when enabled; otherwise design defaults.
 */
export function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<AnnouncementsContent | null>(null)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'announcements')
      .maybeSingle()
      .then(({ data }) => {
        setAnnouncement(normalizeAnnouncements(data?.value))
      })
  }, [])

  const cmsMessages = announcement ? activeAnnouncementMessages(announcement) : []
  const useCms = shouldShowAnnouncementBar(announcement) && cmsMessages.length > 0

  useEffect(() => {
    if (!useCms || cmsMessages.length <= 1) return
    const timer = setInterval(() => setMessageIndex((i) => (i + 1) % cmsMessages.length), 4000)
    return () => clearInterval(timer)
  }, [useCms, cmsMessages.length])

  const cmsText = useCms ? cmsMessages[messageIndex % cmsMessages.length] : null

  return (
    <div
      className="w-full bg-primary text-primary-contrast text-center text-[12px] sm:text-[13px] tracking-[0.02em] py-2.5 px-4"
      role="status"
      style={
        useCms && announcement
          ? { background: announcement.bg_color, color: announcement.text_color }
          : undefined
      }
    >
      {cmsText ? (
        <p key={messageIndex} className="max-w-site mx-auto leading-snug animate-[fadeIn_0.4s_ease-out]">
          {cmsText}
        </p>
      ) : (
        <>
          <p className="md:hidden max-w-site mx-auto leading-snug">{DEFAULT_BY_BREAKPOINT.mobile}</p>
          <p className="hidden md:block lg:hidden max-w-site mx-auto leading-snug">
            {DEFAULT_BY_BREAKPOINT.tablet}
          </p>
          <p className="hidden lg:block max-w-site mx-auto leading-snug">{DEFAULT_BY_BREAKPOINT.desktop}</p>
        </>
      )}
    </div>
  )
}
