'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  activeAnnouncementMessages,
  normalizeAnnouncements,
  shouldShowAnnouncementBar,
  type AnnouncementsContent,
} from '@/lib/types'

/** DESIGN_SPEC §1 — default copy when CMS announcements are empty / disabled. */
const DEFAULT_BY_BREAKPOINT = {
  mobile: 'Instant PDF · Free patterns, no account →',
  tablet: 'Instant PDF download on every pattern · Free patterns, no account needed →',
  desktop: 'Instant PDF download on every pattern · Free patterns available, no account needed →',
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
      className="w-full bg-navy px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.13em] text-white"
      role="status"
      style={
        useCms && announcement
          ? { background: announcement.bg_color, color: announcement.text_color }
          : undefined
      }
    >
      {cmsText ? (
        <p key={messageIndex} className="max-w-site mx-auto truncate leading-none animate-[fadeIn_0.4s_ease-out]">
          {cmsText}
        </p>
      ) : (
        <>
          <Link href="/free-crochet-patterns" className="block hover:underline underline-offset-2">
            <p className="md:hidden max-w-site mx-auto truncate leading-none">{DEFAULT_BY_BREAKPOINT.mobile}</p>
            <p className="hidden md:block lg:hidden max-w-site mx-auto truncate leading-none">
              {DEFAULT_BY_BREAKPOINT.tablet}
            </p>
            <p className="hidden lg:block max-w-site mx-auto truncate leading-none">{DEFAULT_BY_BREAKPOINT.desktop}</p>
          </Link>
        </>
      )}
    </div>
  )
}
