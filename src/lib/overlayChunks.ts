/**
 * Dynamic imports for the cart drawer and sign-in sheet, shared so the same chunk is used whether it is preloaded
 * (hover, touch or keyboard focus on the cart or sign-in button) or loaded because the visitor opened it.
 */
export const importCartDrawer = () => import('@/components/CartDrawer')
export const importAuthSheet = () => import('@/components/AuthSheet')

export function preloadCartDrawer() {
  void importCartDrawer()
}

export function preloadAuthSheet() {
  void importAuthSheet()
}
