// A full checkout link grants payment setup access. Plain invoice links are read-only
// for cross-chain mutations. URL fragments are not sent in referrers or server logs.
export function saveCheckoutAccess(invoiceId: string, token: string) {
  if (typeof window === 'undefined' || !/^[a-f0-9]{64}$/.test(token)) return;
  try { sessionStorage.setItem(`checkout:${invoiceId}`, token); } catch { /* URL remains usable */ }
}
export function checkoutToken(invoiceId: string): string | null {
  if (typeof window === 'undefined') return null;
  const fragment = new URLSearchParams(window.location.hash.slice(1)).get('checkout');
  if (fragment && /^[a-f0-9]{64}$/.test(fragment)) {
    saveCheckoutAccess(invoiceId, fragment);
    return fragment;
  }
  try { return sessionStorage.getItem(`checkout:${invoiceId}`); } catch { return null; }
}
export function checkoutPath(invoiceId: string, token?: string): string {
  const access = token || checkoutToken(invoiceId);
  return `/pay/${invoiceId}${access ? `#checkout=${access}` : ''}`;
}
