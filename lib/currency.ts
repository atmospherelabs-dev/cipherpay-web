import type { Invoice, ZecRates } from '@/lib/api';

const CURRENCY_META: Record<string, { symbol: string; label: string }> = {
  EUR: { symbol: '€', label: 'Euro' },
  USD: { symbol: '$', label: 'US Dollar' },
  BRL: { symbol: 'R$', label: 'Brazilian Real' },
  GBP: { symbol: '£', label: 'British Pound' },
  CAD: { symbol: 'C$', label: 'Canadian Dollar' },
  JPY: { symbol: '¥', label: 'Japanese Yen' },
  MXN: { symbol: 'MX$', label: 'Mexican Peso' },
  ARS: { symbol: 'AR$', label: 'Argentine Peso' },
  NGN: { symbol: '₦', label: 'Nigerian Naira' },
  CHF: { symbol: 'CHF', label: 'Swiss Franc' },
  INR: { symbol: '₹', label: 'Indian Rupee' },
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_META);

export function currencySymbol(cur: string): string {
  return CURRENCY_META[cur]?.symbol || cur;
}

export function currencyLabel(cur: string): string {
  const m = CURRENCY_META[cur];
  return m ? `${m.symbol} ${cur} — ${m.label}` : cur;
}

export function fiatPrice(inv: Invoice, displayCurrency: string): number {
  if (inv.amount != null) return inv.amount;
  if (displayCurrency === 'USD' && inv.price_usd) return inv.price_usd;
  return inv.price_eur;
}

export function fiatStr(inv: Invoice, displayCurrency: string): string {
  const p = fiatPrice(inv, displayCurrency);
  const sym = currencySymbol(displayCurrency);
  return p < 0.01 ? `${sym}${p}` : `${sym}${p.toFixed(2)}`;
}

export function zecToFiat(zec: number, rates: ZecRates | null, displayCurrency: string): number | null {
  if (!rates) return null;
  const key = `zec_${displayCurrency.toLowerCase()}` as keyof ZecRates;
  const rate = (rates[key] as number) || 0;
  return rate > 0 ? zec * rate : null;
}

export function fiatLabel(fiat: number | null, displayCurrency: string): string {
  if (fiat === null) return '';
  const sym = currencySymbol(displayCurrency);
  return ` (~${sym}${fiat < 0.01 ? fiat.toFixed(6) : fiat.toFixed(2)})`;
}
