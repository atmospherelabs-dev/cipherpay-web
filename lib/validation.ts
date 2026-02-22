export function validateEmail(email: string): string | null {
  if (email.length > 254) return 'Email is too long (max 254 characters)';
  const parts = email.split('@');
  if (parts.length !== 2) return 'Email must contain @';
  const [local, domain] = parts;
  if (!local || local.length > 64) return 'Invalid email local part';
  if (!domain || !domain.includes('.')) return 'Invalid email domain';
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..'))
    return 'Invalid email domain';
  return null;
}

export function validateWebhookUrl(url: string): string | null {
  if (url.length > 2000) return 'URL is too long (max 2000 characters)';
  if (!url.startsWith('https://') && !url.startsWith('http://'))
    return 'URL must start with https:// or http://';
  try {
    const parsed = new URL(url);
    if (!parsed.hostname) return 'URL is missing a hostname';
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal'))
      return 'Internal addresses are not allowed';
    if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(host))
      return 'Private IP addresses are not allowed';
  } catch {
    return 'Invalid URL format';
  }
  return null;
}

export function validateZcashAddress(addr: string): string | null {
  if (addr.length > 500) return 'Address is too long';
  const prefixes = ['u1', 'utest1', 'zs1', 'ztestsapling', 't1', 't3'];
  if (!prefixes.some((p) => addr.startsWith(p)))
    return 'Must be a valid Zcash address (u1, utest1, zs1, t1, or t3)';
  return null;
}

export function validateLength(value: string, max: number, fieldName: string): string | null {
  if (value.length > max) return `${fieldName} is too long (max ${max} characters)`;
  return null;
}
