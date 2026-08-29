'use client'

import { useEffect } from 'react'

const SITE_NAME = 'Notion Creative Art'
import { CANONICAL_SITE_URL } from '@/lib/env'

const SITE_URL = CANONICAL_SITE_URL
const DEFAULT_OG_IMAGE = `${SITE_URL}/favicon.svg`

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(url: string) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

/**
 * Sets document.title + meta description + canonical + Open Graph/Twitter
 * tags for the current page. This is a client-side SPA, so a search engine
 * has to actually execute our JS to see these — Googlebot generally does,
 * but this is genuinely weaker than server-rendered metadata (a real
 * limitation of the current static-hosting architecture, not something
 * fixable without moving to SSR). It's still worth doing: it's strictly
 * better than one static title for the whole site, and it's what makes
 * link previews (WhatsApp/Slack/social) show the right title/image.
 */
export function useMeta(opts: { title: string; description: string; path: string; image?: string; type?: 'website' | 'product' }) {
  useEffect(() => {
    const fullTitle = opts.title === SITE_NAME ? opts.title : `${opts.title} — ${SITE_NAME}`
    const url = `${SITE_URL}${opts.path}`
    const image = opts.image ?? DEFAULT_OG_IMAGE

    document.title = fullTitle
    setMetaTag('name', 'description', opts.description)
    setCanonical(url)

    setMetaTag('property', 'og:title', fullTitle)
    setMetaTag('property', 'og:description', opts.description)
    setMetaTag('property', 'og:url', url)
    setMetaTag('property', 'og:image', image)
    setMetaTag('property', 'og:type', opts.type === 'product' ? 'product' : 'website')
    setMetaTag('property', 'og:site_name', SITE_NAME)

    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', fullTitle)
    setMetaTag('name', 'twitter:description', opts.description)
    setMetaTag('name', 'twitter:image', image)
  }, [opts.title, opts.description, opts.path, opts.image, opts.type])
}
