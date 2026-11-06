'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { api, type MerchantInfo, type ShopifyDeployStatus } from '@/lib/api';
import { CopyButton } from '@/components/CopyButton';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/contexts/ToastContext';

const CONNECT_URL = 'https://connect.cipherpay.app';
const REDIRECT_URL = `${CONNECT_URL}/api/auth/callback`;
const SCOPES = 'read_orders,write_orders';
const DEV_DASHBOARD_URL = 'https://dev.shopify.com/dashboard';
const PARTNER_DASHBOARD_URL = 'https://partners.shopify.com';
const PAYMENT_METHOD_NAME = 'Pay with Zcash (ZEC)';

type DeployState = 'idle' | ShopifyDeployStatus['status'];

const SHOP_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
const CLIENT_ID_PATTERN = /^[a-zA-Z0-9_-]{8,128}$/;

function normalizeShop(value: string): string {
  return value.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase();
}

const STEPS = [
  'Create the Shopify app',
  'Allow network access',
  'Create a service account',
  'Connect to CipherPay',
  'Install and test',
] as const;

export function ShopifySetup({ merchant }: { merchant: MerchantInfo }) {
  const { showToast } = useToast();
  const isAlreadyConfigured = !!merchant.webhook_url?.includes('connect.cipherpay.app');
  const [showWizard, setShowWizard] = useState(!isAlreadyConfigured);
  const [step, setStep] = useState(0);

  const [shopDomain, setShopDomain] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [automationToken, setAutomationToken] = useState('');
  const [dashboardToken, setDashboardToken] = useState('');
  const [appName, setAppName] = useState('CipherPay');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [deployJobId, setDeployJobId] = useState<string | null>(null);
  const [statusToken, setStatusToken] = useState<string | null>(null);
  const [deployState, setDeployState] = useState<DeployState>('idle');
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployInfo, setDeployInfo] = useState<Pick<ShopifyDeployStatus, 'error_code' | 'version'> | null>(null);

  useEffect(() => {
    if (!deployJobId || !statusToken || (deployState !== 'queued' && deployState !== 'processing')) return;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      try {
        const status = await api.getShopifyDeployStatus(deployJobId, statusToken);
        if (cancelled) return;
        setDeployState(status.status);
        setDeployError(status.error);
        setDeployInfo({ error_code: status.error_code ?? null, version: status.version ?? null });
        if (status.status === 'deployed') showToast('CipherPay block is live in your Shopify app.');
        if (status.status === 'action_required') showToast('Almost there: Shopify needs one more step.', true);
        if (status.status === 'failed') showToast('Shopify deployment failed. See details below.', true);
      } catch (err) {
        if (!cancelled) setDeployError(err instanceof Error ? err.message : 'Could not check deploy status');
      }
    }, 4000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [deployJobId, statusToken, deployState, showToast]);

  const shop = normalizeShop(shopDomain);
  const errors = {
    shop: !shop ? 'Required' : SHOP_PATTERN.test(shop) ? null : 'Use the permanent domain ending in .myshopify.com',
    clientId: !clientId.trim() ? 'Required' : CLIENT_ID_PATTERN.test(clientId.trim()) ? null : 'This doesn’t look like a Shopify Client ID',
    clientSecret: !clientSecret.trim() ? 'Required' : clientSecret.trim().length < 16 ? 'Too short to be a Client Secret' : null,
    automationToken: !automationToken.trim() ? 'Required' : /\s/.test(automationToken.trim()) ? 'Remove spaces or line breaks' : null,
    dashboardToken: !dashboardToken.trim() ? 'Required' : dashboardToken.trim().startsWith('cpay_dash_') ? null : 'Starts with cpay_dash_',
  };
  const formValid = Object.values(errors).every((e) => !e);

  const submit = async () => {
    setTouched(true);
    if (!formValid) return;
    setSubmitting(true);
    setDeployError(null);
    setDeployInfo(null);
    try {
      const response = await api.setupShopify({
        dashboard_token: dashboardToken.trim(),
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        shop_domain: shop,
        app_name: appName.trim() || 'CipherPay',
        app_automation_token: automationToken.trim(),
      });
      setDeployJobId(response.deploy_job?.id || null);
      setStatusToken(response.status_token);
      setDeployState(response.deploy_job?.status || 'idle');
      setClientSecret('');
      setAutomationToken('');
      setDashboardToken('');
      setStep(4);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Shopify setup failed', true);
    } finally {
      setSubmitting(false);
    }
  };

  const badge = deployState !== 'idle' ? deployState : isAlreadyConfigured ? 'deployed' : 'idle';

  return (
    <div>
      <div className="settings-card-label" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>Shopify</span>
        <StatusBadge state={badge} />
      </div>

      {!showWizard ? (
        <ConnectedSummary merchant={merchant} onReconfigure={() => { setShowWizard(true); setStep(0); }} />
      ) : (
        <>
          <p className="settings-help" style={{ marginBottom: 14 }}>
            Accept Zcash on Shopify in about 10 minutes. You create a private Shopify app that you own; CipherPay
            deploys the checkout button to it. Customers choose <strong>{PAYMENT_METHOD_NAME}</strong> at checkout
            and pay from the order confirmation page.
          </p>

          <ol className="shopify-steps">
            {STEPS.map((title, index) => (
              <Step
                key={title}
                index={index}
                title={title}
                active={step === index}
                done={step > index}
                onOpen={() => setStep(index)}
              >
                {index === 0 && (
                  <>
                    <p>
                      Open the <ExtLink href={DEV_DASHBOARD_URL}>Shopify Dev Dashboard</ExtLink>, choose{' '}
                      <strong>Apps → Create app</strong>, and fill in:
                    </p>
                    <ValueRow label="App name" value="CipherPay" />
                    <ValueRow label="App URL" value={CONNECT_URL} hint="Temporary. CipherPay sets the final URL when it deploys." />
                    <ValueRow label="Embed app in Shopify admin" value="Unchecked" copy={false} />
                    <ValueRow label="Allowed redirection URL" value={REDIRECT_URL} />
                    <ValueRow label="Scopes" value={SCOPES} />
                    <p>Click <strong>Create app</strong>, then <strong>Release</strong>.</p>
                    <NextButton onClick={() => setStep(1)}>I created the app</NextButton>
                  </>
                )}

                {index === 1 && (
                  <>
                    <Callout tone="warn">
                      Required. Without it, Shopify keeps the CipherPay button unpublished and customers see nothing
                      after checkout.
                    </Callout>
                    <p>
                      This setting is in the <ExtLink href={PARTNER_DASHBOARD_URL}>Partner Dashboard</ExtLink>, not
                      the Dev Dashboard:
                    </p>
                    <ul className="shopify-list">
                      <li>Open <strong>Apps</strong> and select the app you just created.</li>
                      <li>Open <strong>API access requests</strong>.</li>
                      <li>
                        Under <em>Allow network access in checkout and account UI extensions</em>, click{' '}
                        <strong>Allow network access</strong>. It is approved immediately.
                      </li>
                    </ul>
                    <NextButton onClick={() => setStep(2)}>Network access is allowed</NextButton>
                  </>
                )}

                {index === 2 && (
                  <>
                    <p>CipherPay uses a service account once to deploy the checkout button. It isn&apos;t stored.</p>
                    <ul className="shopify-list">
                      <li>In the Dev Dashboard, open your app → <strong>Settings</strong> → <strong>App CLI automation token</strong> → <strong>Manage</strong>.</li>
                      <li>Click <strong>Add service account</strong>. Any name and expiration work.</li>
                      <li>Under Permissions, check <strong>App development</strong> and select <strong>this app</strong>.</li>
                      <li>Save and copy the token. It is shown only once.</li>
                    </ul>
                    <NextButton onClick={() => setStep(3)}>I have the token</NextButton>
                  </>
                )}

                {index === 3 && (
                  <>
                    <div className="shopify-form">
                      <Field
                        label="Store domain"
                        hint="Shopify admin → Settings → Domains. Use the one ending in .myshopify.com."
                        error={touched ? errors.shop : null}
                      >
                        <input className="input" value={shopDomain} onChange={(e) => setShopDomain(e.target.value)}
                          placeholder="your-store.myshopify.com" autoComplete="off" spellCheck={false} />
                      </Field>
                      <Field
                        label="Client ID"
                        hint="Dev Dashboard → your app → Settings → Credentials."
                        error={touched ? errors.clientId : null}
                      >
                        <input className="input" value={clientId} onChange={(e) => setClientId(e.target.value)}
                          placeholder="Shopify Client ID" autoComplete="off" spellCheck={false} />
                      </Field>
                      <Field
                        label="Client Secret"
                        hint="Same page as the Client ID. It must come from the same app, or the install will fail."
                        error={touched ? errors.clientSecret : null}
                      >
                        <input className="input" type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)}
                          placeholder="Shopify Client Secret" autoComplete="off" />
                      </Field>
                      <Field label="Service account token" hint="From step 3." error={touched ? errors.automationToken : null}>
                        <input className="input" type="password" value={automationToken} onChange={(e) => setAutomationToken(e.target.value)}
                          placeholder="Shopify service account token" autoComplete="off" />
                      </Field>
                      <Field
                        label="CipherPay dashboard token"
                        hint="Confirms it's you. Used to create a dedicated, restricted API key for Shopify."
                        error={touched ? errors.dashboardToken : null}
                      >
                        <input className="input" type="password" value={dashboardToken} onChange={(e) => setDashboardToken(e.target.value)}
                          placeholder="cpay_dash_…" autoComplete="off" />
                      </Field>
                      <Field label="App name" hint="Shown to you in Shopify. Optional.">
                        <input className="input" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="CipherPay" />
                      </Field>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                      <button className="btn" disabled={submitting || (touched && !formValid)} onClick={submit}
                        style={{ opacity: submitting ? 0.6 : 1 }}>
                        {submitting ? <Spinner size={12} /> : 'Connect and deploy'}
                      </button>
                      {isAlreadyConfigured && (
                        <button className="btn btn-small btn-cancel" onClick={() => setShowWizard(false)} style={{ fontSize: 9 }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </>
                )}

                {index === 4 && (
                  <DeployPanel
                    state={deployState}
                    error={deployError}
                    info={deployInfo}
                    shop={shop}
                    onRetry={() => setStep(3)}
                  />
                )}
              </Step>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

export function DeployPanel({ state, error, info, shop, onRetry }: {
  state: DeployState;
  error: string | null;
  info: Pick<ShopifyDeployStatus, 'error_code' | 'version'> | null;
  shop: string;
  onRetry: () => void;
}) {
  if (state === 'idle') {
    return <p>Finish step 4 first. Your deploy status will appear here.</p>;
  }

  if (state === 'queued' || state === 'processing') {
    return (
      <div className="shopify-status">
        <Spinner size={12} />
        <span>
          Deploying the CipherPay button to your Shopify app. This usually takes about a minute; keep this page open.
        </span>
      </div>
    );
  }

  if (state === 'failed') {
    return (
      <>
        <Callout tone="error">The deploy didn&apos;t finish. Nothing was published to your store.</Callout>
        {error && <pre className="shopify-error">{error}</pre>}
        <p>Check that the service account has <strong>App development</strong> access to this app, then try again.</p>
        <NextButton onClick={onRetry}>Back to step 4</NextButton>
      </>
    );
  }

  if (state === 'action_required') {
    const versionName = info?.version?.name;
    const versionUrl = info?.version?.url;
    return (
      <>
        {info?.error_code === 'network_access_required' ? (
          <Callout tone="warn">
            Shopify created {versionName ? <strong>{versionName}</strong> : 'a new version'} but won&apos;t publish it
            until network access is allowed. The button isn&apos;t live yet.
          </Callout>
        ) : (
          <Callout tone="warn">
            Shopify created {versionName ? <strong>{versionName}</strong> : 'a new version'} but didn&apos;t release it.
          </Callout>
        )}
        {error && <pre className="shopify-error">{error}</pre>}
        <ul className="shopify-list">
          {info?.error_code === 'network_access_required' && (
            <li>
              Finish step 2: <ExtLink href={PARTNER_DASHBOARD_URL}>Partner Dashboard</ExtLink> → Apps → your app → API
              access requests → <strong>Allow network access</strong>.
            </li>
          )}
          <li>
            Open {versionUrl ? <ExtLink href={versionUrl}>{versionName || 'the new version'}</ExtLink> : <>your app → <strong>Versions</strong> → the newest version</>}{' '}
            in the Dev Dashboard and click <strong>Release</strong>.
          </li>
          <li>Then install the app and add the block:</li>
        </ul>
        <InstallChecklist shop={shop} />
      </>
    );
  }

  return (
    <>
      <Callout tone="ok">Deployed. Your CipherPay credentials are saved for {shop || 'your store'}.</Callout>
      <InstallChecklist shop={shop} />
    </>
  );
}

function InstallChecklist({ shop }: { shop: string }) {
  const adminBase = shop.endsWith('.myshopify.com') ? `https://${shop}/admin` : null;
  return (
    <ul className="shopify-list shopify-list--numbered">
      <li>
        <strong>Install the app.</strong> Dev Dashboard → your app → <strong>Distribution</strong> → Custom distribution →
        enter {shop ? <code>{shop}</code> : 'your store domain'} → Generate link. Open the link and click{' '}
        <strong>Install</strong>. You should land on a CipherPay page that says <em>Connected</em>.
      </li>
      <li>
        <strong>Add the payment method.</strong>{' '}
        {adminBase ? <ExtLink href={`${adminBase}/settings/payments`}>Settings → Payments</ExtLink> : 'Settings → Payments'} →
        Manual payment methods → Create custom payment method named <code>{PAYMENT_METHOD_NAME}</code>{' '}
        <CopyButton text={PAYMENT_METHOD_NAME} label="" />
      </li>
      <li>
        <strong>Add the button.</strong>{' '}
        {adminBase ? <ExtLink href={`${adminBase}/settings/checkout`}>Settings → Checkout</ExtLink> : 'Settings → Checkout'} →
        Customize → switch to the <strong>Thank you</strong> page → Add block → <strong>CipherPay Checkout</strong> → Save. The
        editor shows a CipherPay placeholder.
      </li>
      <li>
        <strong>Place a test order</strong> with {PAYMENT_METHOD_NAME}. The thank-you page shows{' '}
        <strong>Pay with CipherPay</strong>, and the invoice appears in your CipherPay dashboard.
      </li>
    </ul>
  );
}

function ConnectedSummary({ merchant, onReconfigure }: { merchant: MerchantInfo; onReconfigure: () => void }) {
  return (
    <div>
      <Callout tone="ok">
        Connected. Shopify invoices use a restricted API key and send events to{' '}
        <code>{merchant.webhook_url}</code>.
      </Callout>
      <details className="shopify-details">
        <summary>Customers don&apos;t see the Pay with CipherPay button?</summary>
        <ul className="shopify-list">
          <li>
            Allow network access: <ExtLink href={PARTNER_DASHBOARD_URL}>Partner Dashboard</ExtLink> → Apps → your app →
            API access requests → <strong>Allow network access</strong>.
          </li>
          <li>Release the newest version: Dev Dashboard → your app → Versions → newest → <strong>Release</strong>.</li>
          <li>Check the <strong>CipherPay Checkout</strong> block is on the Thank you page in the checkout editor and saved.</li>
          <li>The order must use the <code>{PAYMENT_METHOD_NAME}</code> payment method.</li>
        </ul>
      </details>
      <button type="button" className="btn btn-small" onClick={onReconfigure} style={{ marginTop: 10 }}>
        Reconfigure
      </button>
    </div>
  );
}

function Step({ index, title, active, done, onOpen, children }: {
  index: number; title: string; active: boolean; done: boolean; onOpen: () => void; children: ReactNode;
}) {
  return (
    <li className={`shopify-step${active ? ' is-active' : ''}${done ? ' is-done' : ''}`}>
      <button type="button" className="shopify-step-header" onClick={onOpen} aria-expanded={active}>
        <span className="shopify-step-marker" aria-hidden="true">{done ? '✓' : index + 1}</span>
        <span className="shopify-step-title">{title}</span>
      </button>
      {active && <div className="shopify-step-body">{children}</div>}
    </li>
  );
}

function StatusBadge({ state }: { state: DeployState }) {
  const map: Record<DeployState, { label: string; color: string }> = {
    idle: { label: 'not configured', color: 'var(--cp-text-dim)' },
    queued: { label: 'queued', color: 'var(--cp-yellow)' },
    processing: { label: 'deploying', color: 'var(--cp-yellow)' },
    deployed: { label: 'connected', color: 'var(--cp-green)' },
    action_required: { label: 'action needed', color: 'var(--cp-orange)' },
    failed: { label: 'failed', color: 'var(--cp-red)' },
  };
  const { label, color } = map[state];
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, letterSpacing: 0.5, color,
      background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 3,
    }}>
      {label}
    </span>
  );
}

function Callout({ tone, children }: { tone: 'ok' | 'warn' | 'error'; children: ReactNode }) {
  return <div className={`shopify-callout shopify-callout--${tone}`} role={tone === 'error' ? 'alert' : undefined}>{children}</div>;
}

function ValueRow({ label, value, hint, copy = true }: { label: string; value: string; hint?: string; copy?: boolean }) {
  return (
    <div className="shopify-value-row">
      <span className="shopify-value-label">{label}</span>
      <span className="shopify-value">
        <code>{value}</code>
        {copy && <CopyButton text={value} label="" />}
      </span>
      {hint && <span className="shopify-value-hint">{hint}</span>}
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <label className={`shopify-field${error ? ' has-error' : ''}`}>
      <span className="shopify-field-label">{label}</span>
      {children}
      {error ? <span className="shopify-field-error">{error}</span> : hint && <span className="shopify-field-hint">{hint}</span>}
    </label>
  );
}

function NextButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="btn btn-small" onClick={onClick} style={{ marginTop: 10 }}>
      {children} →
    </button>
  );
}

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="shopify-link">{children} ↗</a>;
}
