import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.CIPHERPAY_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.cipherpay.app';
const SHOPIFY_SETUP_URL = process.env.SHOPIFY_SETUP_API_URL || 'https://connect.cipherpay.app';

function isValidShop(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}

function isValidClientId(clientId: string): boolean {
  return /^[a-zA-Z0-9_-]{8,128}$/.test(clientId);
}

function signStatusToken(jobId: string): string {
  const secret = process.env.SHOPIFY_STATUS_TOKEN_SECRET || process.env.SHOPIFY_SETUP_ADMIN_TOKEN;
  if (!secret) {
    throw new Error('SHOPIFY_STATUS_TOKEN_SECRET or SHOPIFY_SETUP_ADMIN_TOKEN is required');
  }

  const exp = Math.floor(Date.now() / 1000) + 30 * 60;
  const payload = `${jobId}.${exp}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

async function createDashboardSession(token: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    throw new Error('Invalid dashboard token');
  }

  const cookie = res.headers.get('set-cookie');
  if (!cookie) {
    throw new Error('Could not create dashboard session');
  }

  return cookie;
}

async function createRestrictedShopifyKey(cookie: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/merchants/me/keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      type: 'restricted',
      label: `Shopify ${new Date().toISOString().slice(0, 10)}`,
    }),
  });

  const body = await res.json().catch(() => ({ error: 'Could not create Shopify API key' }));
  if (!res.ok) {
    throw new Error(body.error || 'Could not create Shopify API key');
  }

  return body.key;
}

async function regenerateWebhookSecret(cookie: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/merchants/me/regenerate-webhook-secret`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });

  const body = await res.json().catch(() => ({ error: 'Could not create webhook secret' }));
  if (!res.ok) {
    throw new Error(body.error || 'Could not create webhook secret');
  }

  return body.webhook_secret;
}

async function setWebhookUrl(cookie: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/merchants/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      webhook_url: `${SHOPIFY_SETUP_URL}/api/webhook/cipherpay`,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Could not set webhook URL' }));
    throw new Error(body.error || 'Could not set webhook URL');
  }
}

export async function POST(req: NextRequest) {
  const adminToken = process.env.SHOPIFY_SETUP_ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: 'Shopify setup is not configured' }, { status: 503 });
  }

  const body = await req.json().catch(() => null) as {
    dashboard_token?: string;
    client_id?: string;
    client_secret?: string;
    shop_domain?: string;
    app_name?: string;
    app_automation_token?: string;
  } | null;

  const dashboardToken = body?.dashboard_token?.trim() || '';
  const clientId = body?.client_id?.trim() || '';
  const clientSecret = body?.client_secret?.trim() || '';
  const shopDomain = body?.shop_domain?.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '') || '';
  const appAutomationToken = body?.app_automation_token?.trim() || '';
  const appName = body?.app_name?.trim() || 'CipherPay';

  if (!dashboardToken.startsWith('cpay_dash_')) {
    return NextResponse.json({ error: 'A valid dashboard token is required' }, { status: 401 });
  }
  if (!isValidClientId(clientId)) {
    return NextResponse.json({ error: 'Invalid Shopify Client ID' }, { status: 400 });
  }
  if (clientSecret.length < 16) {
    return NextResponse.json({ error: 'Invalid Shopify Client Secret' }, { status: 400 });
  }
  if (!isValidShop(shopDomain)) {
    return NextResponse.json({ error: 'Use the permanent .myshopify.com store domain' }, { status: 400 });
  }
  if (!appAutomationToken.startsWith('atkn_')) {
    return NextResponse.json({ error: 'Invalid Shopify app automation token' }, { status: 400 });
  }

  let sessionCookie = '';
  let cipherPayApiKey = '';
  let cipherPayWebhookSecret = '';

  try {
    sessionCookie = await createDashboardSession(dashboardToken);
    cipherPayApiKey = await createRestrictedShopifyKey(sessionCookie);
    cipherPayWebhookSecret = await regenerateWebhookSecret(sessionCookie);
    await setWebhookUrl(sessionCookie);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not prepare CipherPay Shopify credentials' },
      { status: 400 }
    );
  }

  const setupRes = await fetch(`${SHOPIFY_SETUP_URL}/api/admin/shopify/apps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': adminToken,
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      shop_domain: shopDomain,
      app_name: appName,
      app_automation_token: appAutomationToken,
      cipherpay_api_key: cipherPayApiKey,
      cipherpay_api_url: API_URL,
      cipherpay_webhook_secret: cipherPayWebhookSecret,
    }),
  });

  const setupBody = await setupRes.json().catch(() => ({ error: 'Shopify setup request failed' }));
  if (!setupRes.ok) {
    return NextResponse.json(setupBody, { status: setupRes.status });
  }

  const jobId = setupBody.deploy_job?.id;
  return NextResponse.json({
    ...setupBody,
    status_token: jobId ? signStatusToken(jobId) : null,
    cipherpay_configured: true,
  });
}
