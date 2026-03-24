function resolveApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.startsWith('testnet.')) {
      return 'https://api.testnet.cipherpay.app';
    }
    if (host.includes('cipherpay.app')) {
      return 'https://api.cipherpay.app';
    }
  }

  return 'http://localhost:3080';
}

export const API_URL = resolveApiUrl();

export function isTestnet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.startsWith('testnet.') || window.location.hostname === 'localhost';
}
