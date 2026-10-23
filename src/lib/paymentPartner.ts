export type PaymentProviderName = 'lemonsqueezy' | 'paddle'

/** Names and policy links of the merchant of record, for the legal pages. */
export function paymentPartner(provider: PaymentProviderName) {
  if (provider === 'paddle') {
    return {
      name: 'Paddle',
      entity: 'Paddle.com Market Limited',
      termsUrl: 'https://www.paddle.com/legal/checkout-buyer-terms',
      termsLabel: "Paddle's Checkout Buyer Terms",
      privacyUrl: 'https://www.paddle.com/legal/privacy',
    }
  }
  return {
    name: 'Lemon Squeezy',
    entity: 'Lemon Squeezy',
    termsUrl: 'https://www.lemonsqueezy.com/buyer-terms',
    termsLabel: "Lemon Squeezy's Buyer Terms",
    privacyUrl: 'https://www.lemonsqueezy.com/privacy',
  }
}
