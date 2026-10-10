import Link from 'next/link'
import { ContactForm } from '@/components/ContactForm'
import { MaterialIcon } from '@/components/MaterialIcon'
import { LIVE_SUPPORT_EMAIL } from '@/lib/contact'

export function Contact({ hideOwnerCopyPlaceholders = false }: { hideOwnerCopyPlaceholders?: boolean }) {
  return (
    <div className="max-w-site mx-auto px-5 md:px-10 lg:px-8 pt-10 md:pt-14 pb-16 md:pb-20">
      <h1 className="font-heading text-[36px] md:text-[48px] leading-[1.1] font-bold text-ink">Contact us</h1>
      <p className="mt-3 max-w-xl text-[16px] md:text-[17px] leading-relaxed text-muted">
        Stuck with a file or a question before buying? Write to us and a real person will reply.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
        <ContactForm />
        <aside className="rounded-[24px] border border-border bg-surface-warm p-6 md:p-8">
          <h2 className="font-heading text-[22px] font-bold text-ink">Other ways to reach us</h2>

          <ul className="mt-6 space-y-5">
            <li className="flex gap-3">
              <MaterialIcon name="mail" size={20} color="var(--color-primary)" className="mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-ink">Email</p>
                {hideOwnerCopyPlaceholders ? (
                  <a
                    href={`mailto:${LIVE_SUPPORT_EMAIL}`}
                    className="text-[15px] font-semibold text-primary underline underline-offset-2 hover:text-primary-hover"
                  >
                    {LIVE_SUPPORT_EMAIL}
                  </a>
                ) : (
                  <span className="text-[15px] font-semibold text-primary">[SUPPORT EMAIL]</span>
                )}
              </div>
            </li>
            <li className="flex gap-3">
              <MaterialIcon name="schedule" size={20} color="var(--color-primary)" className="mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-ink">Reply time</p>
                <p className="text-[15px] leading-relaxed text-muted">
                  {hideOwnerCopyPlaceholders
                    ? 'I typically reply within 1–2 days.'
                    : 'We usually reply within [N] hours, [DAYS].'}
                </p>
              </div>
            </li>
            {!hideOwnerCopyPlaceholders && (
              <li className="flex gap-3">
                <MaterialIcon name="place" size={20} color="var(--color-primary)" className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-ink">Based in</p>
                  <p className="text-[15px] leading-relaxed text-muted">[CITY, COUNTRY]</p>
                </div>
              </li>
            )}
          </ul>

          <div className="mt-6 border-t border-border pt-4 flex flex-col">
            <Link href="/faq" className="inline-flex min-h-11 items-center text-[15px] font-semibold text-primary hover:underline underline-offset-2">
              Read the FAQ
            </Link>
            <Link href="/refund-policy" className="inline-flex min-h-11 items-center text-[15px] font-semibold text-primary hover:underline underline-offset-2">
              Refund policy
            </Link>
            <Link href="/account/downloads" className="inline-flex min-h-11 items-center text-[15px] font-semibold text-primary hover:underline underline-offset-2">
              Go to My downloads
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
