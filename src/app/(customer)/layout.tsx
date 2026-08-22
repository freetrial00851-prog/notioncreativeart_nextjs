import { CustomerShell } from '@/components/CustomerShell'

/** Shared layout for all customer-facing pages (header, footer, cart drawer). */
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>
}
