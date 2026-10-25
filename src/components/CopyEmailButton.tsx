'use client'

import { useState } from 'react'

/** "Copy email" for people whose device has no mail app set up for mailto: links. */
export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard not available: the address is shown on screen to copy by hand */
    }
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="ml-3 inline-flex min-h-11 items-center rounded-[3px] border-[1.5px] border-primary bg-white px-4 text-[14px] font-semibold text-primary hover:bg-primary-soft"
    >
      {copied ? 'Copied ✓' : 'Copy email'}
    </button>
  )
}
