import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_SETUP_URL = process.env.SHOPIFY_SETUP_API_URL || 'https://connect.cipherpay.app';

function isValidJobId(jobId: string): boolean {
  return /^[a-f0-9-]{36}$/i.test(jobId);
}

function verifyStatusToken(jobId: string, token: string): boolean {
  const secret = process.env.SHOPIFY_STATUS_TOKEN_SECRET || process.env.SHOPIFY_SETUP_ADMIN_TOKEN;
  if (!secret) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [tokenJobId, exp, signature] = parts;
  if (tokenJobId !== jobId) return false;
  if (!/^\d+$/.test(exp) || Number(exp) < Math.floor(Date.now() / 1000)) return false;

  const payload = `${tokenJobId}.${exp}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const adminToken = process.env.SHOPIFY_SETUP_ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: 'Shopify setup is not configured' }, { status: 503 });
  }

  const { jobId } = await params;
  if (!isValidJobId(jobId)) {
    return NextResponse.json({ error: 'Invalid job id' }, { status: 400 });
  }

  const body = await req.json().catch(() => null) as { status_token?: string } | null;
  const statusToken = body?.status_token || '';
  if (!verifyStatusToken(jobId, statusToken)) {
    return NextResponse.json({ error: 'Invalid status token' }, { status: 401 });
  }

  const statusRes = await fetch(`${SHOPIFY_SETUP_URL}/api/admin/shopify/deploy-jobs/${jobId}`, {
    headers: { 'x-admin-token': adminToken },
  });
  const statusBody = await statusRes.json().catch(() => ({ error: 'Deploy status request failed' }));

  return NextResponse.json(statusBody, { status: statusRes.status });
}
