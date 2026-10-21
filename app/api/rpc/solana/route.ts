import { NextRequest, NextResponse } from 'next/server';

// Read-only RPC requests needed to construct a wallet-signed payment. Signing
// and broadcasting stay in the wallet. The upstream URL is never client input.
const METHODS = new Set(['getLatestBlockhash', 'getAccountInfo']);
export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('origin') !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }
    const text = await request.text();
    if (text.length > 4096) return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    const body = JSON.parse(text);
    if (Array.isArray(body) || !METHODS.has(body.method)) {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 400 });
    }
    const upstream = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const response = await fetch(upstream, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: body.id, method: body.method, params: body.params }),
      signal: AbortSignal.timeout(10000), cache: 'no-store', redirect: 'error',
    });
    if (!response.ok) throw new Error('RPC unavailable');
    return NextResponse.json(await response.json(), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ jsonrpc: '2.0', error: { code: -32603, message: 'Solana network temporarily unavailable' }, id: null }, { status: 502 });
  }
}
