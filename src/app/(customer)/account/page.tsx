import { redirect } from 'next/navigation'

/** Account home redirects to Orders — there is no dashboard. */
export default function AccountPage() {
  redirect('/account/orders')
}
