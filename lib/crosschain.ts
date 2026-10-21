export interface CryptoAsset {
  assetId: string;
  symbol: string;
  blockchain: string;
  decimals: number;
  contractAddress?: string | null;
}

export interface CryptoQuote {
  asset: CryptoAsset;
  amountIn: string;
  amountOut: string;
  timeEstimate?: number;
  depositAddress?: string;
  depositMemo?: string | null;
  deadline?: string;
  refundAddress: string;
}

export interface CryptoAttempt {
  enabled?: boolean;
  asset?: CryptoAsset | null;
  canManage?: boolean;
  state: string;
  quote?: CryptoQuote | null;
  stale?: boolean;
  sendStarted?: boolean;
  sentTxid?: string | null;
  settlementVerified?: boolean;
}

export const NETWORK_NAMES: Record<string, string> = {
  base: 'Base', eth: 'Ethereum', arb: 'Arbitrum', sol: 'Solana', btc: 'Bitcoin', tron: 'TRON',
};

// No floating point conversion, including for 18-decimal ETH deposits.
export function formatCryptoUnits(raw: string, decimals: number): string {
  if (!/^\d+$/.test(raw) || !Number.isInteger(decimals) || decimals < 0 || decimals > 18) throw new Error('Invalid amount');
  if (decimals === 0) return raw;
  const padded = raw.padStart(decimals + 1, '0');
  return `${padded.slice(0, -decimals)}.${padded.slice(-decimals)}`.replace(/\.?0+$/, '');
}

// Display only. Transfers, QR instructions and clipboard values must always use
// the original integer quote. Keep small BTC/ETH amounts meaningful, not "0.00".
export function formatQuoteSummary(raw: string, decimals: number, symbol: string): string {
  const exact = formatCryptoUnits(raw, decimals);
  const [whole, fraction = ''] = exact.split('.');
  const stablecoin = symbol === 'USDC' || symbol === 'USDT';
  const places = Math.min(decimals, stablecoin ? 2
    : whole === '0' ? Math.max(0, fraction.search(/[1-9]/)) + 4 : Math.max(0, 4 - whole.length));
  const factor = BigInt(10) ** BigInt(decimals - places);
  const units = BigInt(raw);
  const rounded = (units + factor / BigInt(2)) / factor;
  let label = formatCryptoUnits(rounded.toString(), places);
  if (stablecoin && places > 0) {
    const [integer, decimal = ''] = label.split('.');
    label = `${integer}.${decimal.padEnd(places, '0')}`;
  }
  return `${rounded * factor === units ? '' : '≈ '}${label}`;
}

export function canSend(attempt: CryptoAttempt, now = Date.now()): boolean {
  return attempt.canManage !== false && attempt.state === 'PENDING_DEPOSIT' && !attempt.sendStarted && !attempt.stale && !!attempt.quote?.depositAddress
    && !attempt.quote.depositMemo && Date.parse(attempt.quote.deadline || '') > now;
}

export interface CryptoEligibility {
  enabled?: boolean;
  state: 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';
  routes: { assetId: string; state: 'AVAILABLE' | 'BELOW_MINIMUM' | 'UNKNOWN'; minimumOutputZatoshis?: string; minimumSwapUsd?: string }[];
  hasUnknown: boolean;
}

export function routeIsAvailable(eligibility: CryptoEligibility | null, assetId: string): boolean {
  return eligibility?.routes.some(route => route.assetId === assetId && route.state === 'AVAILABLE') ?? false;
}

// Provider progress is informational; only the invoice scanner accepts payment.
export function paymentProgress(attempt: CryptoAttempt): number {
  if (attempt.state === 'SUCCESS') return 2;
  if (['KNOWN_DEPOSIT_TX', 'PROCESSING'].includes(attempt.state)) return 1;
  return 0;
}

// Only a verified settlement ties this saved swap to the ZEC payment received.
export function receiptPaymentAsset(attempt: CryptoAttempt): CryptoAsset | null {
  if (attempt.state !== 'SUCCESS' || attempt.settlementVerified !== true) return null;
  const asset = attempt.quote?.asset || attempt.asset;
  return asset && typeof asset.symbol === 'string' && /^[A-Z0-9]{1,12}$/.test(asset.symbol)
    && typeof asset.blockchain === 'string' && Object.hasOwn(NETWORK_NAMES, asset.blockchain)
    ? asset : null;
}
