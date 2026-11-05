const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

test('server checkout reaches protected staging with a relative browser API URL and fails closed', async () => {
  const file = path.resolve(__dirname, '../lib/server-api.ts');
  const m = new Module(file, module);
  m.filename = file;
  m.paths = module.paths;
  m.require = name => name === 'server-only' ? {} : module.require(name);
  m._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, file);
  const requests = [];
  const server = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({ url: req.url, headers: req.headers, method: req.method, body });
    if (req.url.endsWith('/redirect')) {
      res.writeHead(302, { Location: '/api/unexpected' }); res.end(); return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ invoice_id: 'staging-test-invoice' }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const keys = ['STAGING_MODE', 'STAGING_API_URL', 'STAGING_API_KEY', 'CIPHERPAY_API_URL', 'NEXT_PUBLIC_API_URL'];
  const old = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  try {
    Object.assign(process.env, {
      STAGING_MODE: 'true', STAGING_API_URL: `${base}/staging`, STAGING_API_KEY: 'test-proxy-key',
      CIPHERPAY_API_URL: `${base}/production`, NEXT_PUBLIC_API_URL: '/api/staging',
    });
    const response = await m.exports.serverApiFetch('/api/payment-links/test/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Checkout-Key': 'checkout-key' }, body: '{}',
    });
    assert.equal((await response.json()).invoice_id, 'staging-test-invoice');
    assert.equal(requests[0].url, '/staging/api/payment-links/test/checkout');
    assert.equal(requests[0].method, 'POST');
    assert.equal(requests[0].body, '{}');
    assert.equal(requests[0].headers['x-staging-key'], 'test-proxy-key');
    assert.equal(requests[0].headers['x-checkout-key'], 'checkout-key');
    await assert.rejects(() => m.exports.serverApiFetch('/api/redirect'));
    assert.equal(requests.length, 2, 'redirect must not forward staging credentials');
    delete process.env.STAGING_API_KEY;
    assert.throws(() => m.exports.serverApiFetch('/api/health'), /not configured/);
    process.env.STAGING_API_KEY = 'test-proxy-key';
    delete process.env.STAGING_API_URL;
    assert.throws(() => m.exports.serverApiFetch('/api/health'), /not configured/);
    assert.equal(requests.length, 2, 'missing staging config must not fall back to production');
    process.env.STAGING_MODE = 'false';
    await m.exports.serverApiFetch('/api/health');
    assert.equal(requests[2].url, '/production/api/health');
    assert.equal(requests[2].headers['x-staging-key'], undefined);
  } finally {
    for (const key of keys) old[key] === undefined ? delete process.env[key] : process.env[key] = old[key];
    await new Promise(resolve => server.close(resolve));
  }
});
