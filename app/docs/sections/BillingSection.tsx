'use client';

import { Code, Callout, SectionDivider, Paragraph, SectionTitle, Strong, Expandable } from '../components/DocComponents';

export default function BillingSection() {
  return (
    <>
      <Paragraph>
        CipherPay uses a transparent, usage-based billing model. There are no monthly subscriptions or upfront costs.
        You only pay when you make money — a small percentage fee on each confirmed payment.
      </Paragraph>

      <SectionTitle>How billing works</SectionTitle>
      <Paragraph>
        Here is the billing flow, step by step:
      </Paragraph>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 20 }}>
        <Strong>1. Fees accrue as you receive payments.</Strong> Each time an invoice is confirmed, a fee is recorded in your ledger
        (a small percentage of the invoice amount in ZEC).<br /><br />
        <Strong>2. Fees accumulate over a billing cycle.</Strong> Instead of charging you per transaction, CipherPay groups fees
        into billing cycles (7 days for new merchants, 30 days for established ones).<br /><br />
        <Strong>3. At the end of the cycle, you settle.</Strong> When a billing cycle ends, you&apos;ll see the outstanding balance
        in your dashboard under the Billing tab. You can pay it anytime during the grace period.<br /><br />
        <Strong>4. You pay the fee in ZEC.</Strong> Click &quot;Settle&quot; in your dashboard to create a settlement invoice.
        Pay it the same way you&apos;d pay any CipherPay invoice — scan the QR code with your wallet.
      </div>

      <Callout type="info">
        The fee rate is displayed in your dashboard billing section. It applies to the ZEC amount of each confirmed invoice.
      </Callout>

      <SectionDivider />

      <SectionTitle>Billing cycle timeline</SectionTitle>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>PHASE</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>STATUS</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>WHAT HAPPENS</th>
            </tr>
          </thead>
          <tbody>
            {[
              { phase: 'Active cycle', status: 'OPEN', desc: 'Fees accumulate as invoices are confirmed. Your service is fully functional.' },
              { phase: 'End of cycle', status: 'INVOICED', desc: 'A settlement invoice is generated. Grace period starts. You can pay anytime.' },
              { phase: 'Grace period expires', status: 'PAST DUE', desc: 'You can still use the service, but a reminder appears in your dashboard.' },
              { phase: 'Extended overdue', status: 'SUSPENDED', desc: 'Invoice creation is temporarily blocked until the balance is settled.' },
            ].map(row => (
              <tr key={row.phase} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text)' }}>{row.phase}</td>
                <td style={{ padding: '8px 12px' }}><Code>{row.status}</Code></td>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionDivider />

      <Expandable title="Trust tiers">
        <Paragraph>
          As you use CipherPay and pay your bills on time, your trust tier improves.
          Higher tiers get longer billing cycles and more generous grace periods.
        </Paragraph>
        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>TIER</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>BILLING CYCLE</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>GRACE PERIOD</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>HOW TO REACH</th>
              </tr>
            </thead>
            <tbody>
              {[
                { tier: 'New', cycle: '7 days', grace: '3 days', how: 'Default for all new accounts' },
                { tier: 'Standard', cycle: '30 days', grace: '7 days', how: '3+ consecutive on-time payments' },
                { tier: 'Trusted', cycle: '30 days', grace: '14 days', how: 'Continued on-time payments, no late history in 90 days' },
              ].map(row => (
                <tr key={row.tier} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--cp-text)', fontWeight: 600 }}>{row.tier}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.cycle}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.grace}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Expandable>

      <SectionDivider />

      <SectionTitle>Settling your balance</SectionTitle>
      <Paragraph>
        To pay your outstanding fees:
      </Paragraph>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 16 }}>
        1. Go to your dashboard → <Strong>Billing</Strong> tab<br />
        2. You&apos;ll see your current balance and fee history<br />
        3. Click <Strong>Settle</Strong> to create a settlement invoice<br />
        4. Pay it like any CipherPay invoice — scan the QR code with your wallet<br />
        5. Once confirmed, your billing status resets and a new cycle begins
      </div>

      <Callout type="tip">
        You can settle your balance at any time — you don&apos;t have to wait for the cycle to end.
        Early payment doesn&apos;t change your billing cycle schedule, but it keeps your balance low.
      </Callout>

      <Callout type="info">
        CipherPay is open-source. If you self-host your own instance, billing is optional — fees are only enabled
        when the server operator configures a fee address and rate. Without these, CipherPay is completely free to use.
      </Callout>
    </>
  );
}
