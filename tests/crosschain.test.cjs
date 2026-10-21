const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
function load(file, overrides = {}) {
  const filename = path.resolve(__dirname, '..', file);
  const m = new Module(filename, module);
  m.filename = filename;
  m.paths = module.paths;
  const defaultRequire = m.require.bind(m);
  m.require = name => Object.hasOwn(overrides, name) ? overrides[name] : defaultRequire(name);
  m._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText, filename);
  return m.exports;
}
const { formatCryptoUnits, canSend } = load('lib/crosschain.ts');
const { tokenPaymentInstructions } = load('lib/solana-payment.ts');
const { PublicKey } = require('@solana/web3.js');
test('payment units preserve all integer precision', () => {
  assert.equal(formatCryptoUnits('1000000000000000001',18),'1.000000000000000001');
  assert.equal(formatCryptoUnits('25345678',6),'25.345678');
  assert.equal(formatCryptoUnits('10000000',8),'0.1');
  assert.equal(formatCryptoUnits('10000000000000000000',18),'10');
  assert.throws(() => formatCryptoUnits('1e18',18));
});
test('only a fresh, unfunded, unexpired payment can prompt the wallet', () => {
  const now = Date.now();
  const attempt = {state:'PENDING_DEPOSIT',quote:{depositAddress:'address',deadline:new Date(now+60000).toISOString()}};
  assert.equal(canSend(attempt,now),true);
  for (const patch of [{sendStarted:true},{stale:true},{state:'SUCCESS'},{state:'PROCESSING'},{state:'INCOMPLETE_DEPOSIT'},{state:'FAILED'}]) assert.equal(canSend({...attempt,...patch},now),false);
  assert.equal(canSend(attempt,now+60001),false);
  assert.equal(canSend({...attempt,quote:{...attempt.quote,depositMemo:'required'}},now),false);
});
test('SPL transfer checks decimals and uses exact u64 amount, with idempotent ATA creation', () => {
  const from = new PublicKey('11111111111111111111111111111111');
  const to = new PublicKey('Vote111111111111111111111111111111111111111');
  const mint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  const [create, transfer] = tokenPaymentInstructions(from,to,mint,1234567890123n,6);
  assert.equal(create.data.toString('hex'),'01');
  assert.equal(transfer.data[0],12);
  assert.equal(transfer.data.readBigUInt64LE(1),1234567890123n);
  assert.equal(transfer.data[9],6);
  assert.ok(create.keys[2].pubkey.equals(to));
  assert.ok(create.keys[1].pubkey.equals(transfer.keys[2].pubkey));
  assert.ok(transfer.keys[1].pubkey.equals(mint));
  assert.ok(transfer.keys[3].isSigner && transfer.keys[3].pubkey.equals(from));
  assert.throws(()=>tokenPaymentInstructions(from,to,mint,2n**64n,6));
});

test('human-readable estimates never replace precise payment instructions', () => {
  const { formatQuoteSummary } = load('lib/crosschain.ts');
  assert.equal(formatQuoteSummary('25344344',6,'USDC'),'≈ 25.34');
  assert.equal(formatQuoteSummary('25345678',6,'USDT'),'≈ 25.35');
  assert.equal(formatQuoteSummary('25000000',6,'USDC'),'25.00');
  assert.equal(formatQuoteSummary('8236598000000000',18,'ETH'),'≈ 0.008237');
  assert.equal(formatQuoteSummary('12345',8,'BTC'),'≈ 0.0001235');
  assert.equal(formatQuoteSummary('1',18,'ETH'),'0.000000000000000001');
  assert.equal(formatQuoteSummary('999999',6,'USDC'),'≈ 1.00');
  assert.equal(formatCryptoUnits('25344344',6),'25.344344');
});

test('staging access fails closed and supports dashboard bearer auth through its secure cookie', async () => {
  const { NextRequest } = require('next/server');
  const { stagingAccess, STAGING_COOKIE } = load('lib/staging-auth.ts');
  const previous = process.env.STAGING_PASSWORD;
  const request = headers => new NextRequest('https://cipherpay-staging.vercel.app/api/staging/api/health', {headers});
  try {
    delete process.env.STAGING_PASSWORD;
    assert.equal((await stagingAccess(request({}))).configured,false);
    process.env.STAGING_PASSWORD='short';
    assert.equal((await stagingAccess(request({}))).authorized,false);
    process.env.STAGING_PASSWORD='test-only-random-looking-password-123456789';
    assert.equal((await stagingAccess(request({}))).authorized,false);
    assert.equal((await stagingAccess(request({authorization:'Basic broken'}))).authorized,false);
    const valid = await stagingAccess(request({authorization:'Basic '+Buffer.from('cipherpay:'+process.env.STAGING_PASSWORD).toString('base64')}));
    assert.equal(valid.authorized,true);
    assert.equal((await stagingAccess(request({authorization:'Bearer merchant-token',cookie:STAGING_COOKIE+'='+valid.session}))).authorized,true);
    process.env.STAGING_PASSWORD='rotated-test-password-123456789123456789';
    assert.equal((await stagingAccess(request({cookie:STAGING_COOKIE+'='+valid.session}))).authorized,false);
  } finally {
    if (previous === undefined) delete process.env.STAGING_PASSWORD;
    else process.env.STAGING_PASSWORD=previous;
  }
});

test('wallet/manual entry requires a confirmed eligible route, not a failed check', () => {
  const { routeIsAvailable } = load('lib/crosschain.ts');
  const mixed = {state:'AVAILABLE',hasUnknown:true,routes:[{assetId:'base',state:'BELOW_MINIMUM',minimumOutputZatoshis:'100000'},{assetId:'sol',state:'AVAILABLE'},{assetId:'btc',state:'UNKNOWN'}]};
  assert.equal(routeIsAvailable(null,'base'),false);
  assert.equal(routeIsAvailable(mixed,'base'),false);
  assert.equal(routeIsAvailable(mixed,'sol'),true);
  assert.equal(routeIsAvailable(mixed,'btc'),false);
  assert.equal(routeIsAvailable(mixed,'missing'),false);
});

test('invoice amounts retain their stored currency regardless of dashboard preference', () => {
  const {fiatStr, fiatPrice, invoiceRateLabel}=load('lib/currency.ts');
  const usd={amount:5,currency:'USD',price_eur:4.4403838916,price_usd:5};
  assert.equal(fiatStr(usd,'EUR'),'$5.00');
  assert.equal(invoiceRateLabel({...usd,zec_rate_at_creation:1328.5}), '1 ZEC = $1328.50 USD');
  assert.equal(fiatPrice(usd,'EUR'),5);
  assert.equal(fiatStr({...usd,amount:12,currency:'GBP'},'EUR'),'£12.00');
  assert.equal(fiatStr({...usd,amount:null,currency:null},'EUR'),'€4.44');
  assert.equal(fiatStr({...usd,amount:null,currency:null},'USD'),'$5.00');
});
test('provider progress never represents acceptance of a ZEC invoice', () => {
  const {paymentProgress}=load('lib/crosschain.ts');
  assert.equal(paymentProgress({state:'PENDING_DEPOSIT',sendStarted:true}),0);
  assert.equal(paymentProgress({state:'KNOWN_DEPOSIT_TX'}),1);
  assert.equal(paymentProgress({state:'PROCESSING'}),1);
  assert.equal(paymentProgress({state:'SUCCESS'}),2);
});

test('receipt source requires a verified saved-swap settlement, not provider progress or wallet requests', () => {
  const { receiptPaymentAsset } = load('lib/crosschain.ts');
  const asset = {assetId:'base-usdc',symbol:'USDC',blockchain:'base',decimals:6};
  const quote = {asset};
  for (const state of ['NONE','CREATING','PENDING_DEPOSIT','NEEDS_REVIEW','FAILED','REFUNDED','KNOWN_DEPOSIT_TX','PROCESSING','SUCCESS']) {
    for (const settlementVerified of [undefined, false]) {
      assert.equal(receiptPaymentAsset({state,quote,sendStarted:true,sentTxid:'source-tx',settlementVerified}),null);
    }
    if (state !== 'SUCCESS') assert.equal(receiptPaymentAsset({state,quote,settlementVerified:true}),null);
  }
  assert.deepEqual(receiptPaymentAsset({state:'SUCCESS',quote,settlementVerified:true}),asset);
  assert.equal(receiptPaymentAsset({state:'SUCCESS',settlementVerified:true}),null);
  assert.equal(receiptPaymentAsset({state:'SUCCESS',settlementVerified:true,quote:{asset:{...asset,blockchain:'unsupported'}}}),null);
});

test('public invoice views cannot prompt a cross-chain send', () => {
  const attempt={state:'PENDING_DEPOSIT',canManage:false,quote:{depositAddress:'address',deadline:new Date(Date.now()+60000).toISOString()}};
  assert.equal(canSend(attempt),false);
  assert.equal(canSend({...attempt,canManage:true}),true);
});
test('checkout capabilities stay in URL fragments and invoice-scoped storage', () => {
  const store=new Map();
  global.window={location:{hash:'#checkout='+'a'.repeat(64)}};
  global.sessionStorage={setItem:(k,v)=>store.set(k,v),getItem:k=>store.get(k)||null};
  try {
    const {checkoutToken,checkoutPath}=load('lib/checkout-access.ts');
    assert.equal(checkoutToken('one'),'a'.repeat(64));
    assert.equal(checkoutPath('one'),'/pay/one#checkout='+'a'.repeat(64));
    global.window.location.hash='';
    assert.equal(checkoutToken('one'),'a'.repeat(64));
    assert.equal(checkoutToken('two'),null);
    global.window.location.hash='#checkout=malformed';
    assert.equal(checkoutToken('two'),null);
  } finally {delete global.window;delete global.sessionStorage;}
});


test('public payment summaries preserve token identity without funding or refund details', () => {
  const {receiptPaymentAsset, canSend}=load('lib/crosschain.ts');
  const asset={assetId:'base-usdc',symbol:'USDC',blockchain:'base',decimals:6};
  const publicPayment={state:'SUCCESS',canManage:false,asset,settlementVerified:true};
  assert.deepEqual(receiptPaymentAsset(publicPayment),asset);
  assert.equal(canSend(publicPayment),false);
});

test('NEAR-handled fees show no verification warning or unverified received amount in every locale', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { createTranslator } = require('use-intl/core');
  const asset = {assetId:'base-usdc',symbol:'USDC',blockchain:'base',decimals:6};
  for (const locale of ['en','es','pt','ar']) {
    const messages = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'messages', locale, 'dashboard.json'), 'utf8'));
    const t = createTranslator({locale, messages, namespace:'billing'});
    const { CrosschainBilling } = load('app/[locale]/dashboard/tabs/CrosschainBilling.tsx', {
      'next-intl': {useTranslations: () => t},
      '@/lib/crosschain': load('lib/crosschain.ts'),
      '@/components/PaymentAssetSelector': {AssetIcon: () => null}
    });
    const summary = {enabled:true,total_bps:145,cipherpay_bps:125,collected_count:0,provider_handled_count:1,pending_count:0,assets:[],recent:[{invoice_id:'handled',reference:'CP-HANDLED',state:'provider_handled',received_units:'68780',asset,created_at:''}]};
    const rendered = renderToStaticMarkup(React.createElement(CrosschainBilling, {summary}));
    assert.ok(rendered.includes(t('crosschainHandled')), locale);
    assert.ok(rendered.includes(t('crosschainHandledCount', {count:1})), locale);
    assert.ok(rendered.includes(t('crosschainHandledExplanation')), locale);
    assert.ok(!rendered.includes(t('crosschainVerifying')), locale);
    assert.ok(!rendered.includes(t('crosschainPaid')), locale);
    assert.ok(!rendered.includes('role="status"'), locale);
    assert.ok(!rendered.includes('0.06878'), locale);
    const verified = {...summary,collected_count:1,assets:[{asset,received_units:'69581',count:1}],recent:[...summary.recent,{invoice_id:'verified',reference:'CP-VERIFIED',state:'collected',received_units:'69581',asset,created_at:''}]};
    const verifiedRendered = renderToStaticMarkup(React.createElement(CrosschainBilling, {summary:verified}));
    assert.ok(verifiedRendered.includes('0.069581 USDC'), locale);
    assert.ok(verifiedRendered.includes(t('crosschainPaid')), locale);
    assert.ok(!verifiedRendered.includes('0.06878'), locale);
    const pending = {...summary,provider_handled_count:undefined,pending_count:1,recent:[{...summary.recent[0],state:'pending',received_units:null}]};
    const pendingRendered = renderToStaticMarkup(React.createElement(CrosschainBilling, {summary:pending}));
    assert.ok(pendingRendered.includes(t('crosschainVerifying')), locale);
    assert.ok(pendingRendered.includes('role="status"'), locale);
    assert.ok(!pendingRendered.includes(t('crosschainHandledExplanation')), locale);
  }
});
