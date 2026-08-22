import { redirect } from 'next/navigation'

/** Keep /wishlist working — account shell lives at /account/wishlist. */
export default function WishlistRedirectPage() {
  redirect('/account/wishlist')
}
