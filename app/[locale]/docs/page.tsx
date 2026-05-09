'use client';

import { useState, useMemo } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SidebarGroup } from './components/DocComponents';
import { isTestnet } from '@/lib/config';

import OverviewSection from './sections/OverviewSection';
import QuickstartSection from './sections/QuickstartSection';
import SandboxSection from './sections/SandboxSection';
import ShopifySection from './sections/ShopifySection';
import WooCommerceSection from './sections/WooCommerceSection';
import CustomSection from './sections/CustomSection';
import ProductsSection from './sections/ProductsSection';
import POSSection from './sections/POSSection';
import WebhooksSection from './sections/WebhooksSection';
import SubscriptionsSection from './sections/SubscriptionsSection';
import BillingSection from './sections/BillingSection';
import ApiRefSection from './sections/ApiRefSection';
import X402Section from './sections/X402Section';
import EventsSection from './sections/EventsSection';
import MCPSection from './sections/MCPSection';
import ZipherCliSection from './sections/ZipherCliSection';
import DonationsSection from './sections/DonationsSection';
import PaymentLinksSection from './sections/PaymentLinksSection';
import CashOutSection from './sections/CashOutSection';
import ApiKeysSection from './sections/ApiKeysSection';
import RecipesSection from './sections/RecipesSection';

const SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'quickstart', title: 'Quickstart' },
  { id: 'sandbox', title: 'Sandbox & Testing' },
  { id: 'shopify', title: 'Shopify' },
  { id: 'woocommerce', title: 'WooCommerce' },
  { id: 'custom', title: 'Custom Integration' },
  { id: 'recipes', title: 'Examples' },
  { id: 'products', title: 'Product Pages' },
  { id: 'payment-links', title: 'Payment Links' },
  { id: 'pos', title: 'In-Person POS' },
  { id: 'events', title: 'Events & Tickets' },
  { id: 'donations', title: 'Donations' },
  { id: 'webhooks', title: 'Webhooks' },
  { id: 'subscriptions', title: 'Subscriptions' },
  { id: 'billing', title: 'Billing & Fees' },
  { id: 'cash-out', title: 'Cash Out (ZEC → Fiat)' },
  { id: 'api-keys', title: 'API Keys' },
  { id: 'api-ref', title: 'API Reference' },
  { id: 'x402', title: 'Agentic Payments' },
  { id: 'zipher-cli', title: 'Zipher CLI' },
  { id: 'mcp', title: 'MCP Server' },
] as const;

const SIDEBAR_GROUPS = [
  { label: 'Getting Started', ids: ['overview', 'quickstart', 'sandbox'] },
  { label: 'Guides', ids: ['shopify', 'woocommerce', 'custom', 'recipes', 'products', 'payment-links', 'pos', 'events', 'donations'] },
  { label: 'Reference', ids: ['webhooks', 'subscriptions', 'billing', 'cash-out', 'api-keys', 'api-ref'] },
  { label: 'AI & Agents', ids: ['x402', 'zipher-cli', 'mcp'] },
];

function SectionContent({ id, onNavigate }: { id: string; onNavigate: (id: string) => void }) {
  switch (id) {
    case 'overview': return <OverviewSection onNavigate={onNavigate} />;
    case 'quickstart': return <QuickstartSection />;
    case 'sandbox': return <SandboxSection />;
    case 'shopify': return <ShopifySection />;
    case 'woocommerce': return <WooCommerceSection />;
    case 'custom': return <CustomSection />;
    case 'recipes': return <RecipesSection />;
    case 'products': return <ProductsSection />;
    case 'payment-links': return <PaymentLinksSection />;
    case 'pos': return <POSSection />;
    case 'events': return <EventsSection />;
    case 'donations': return <DonationsSection />;
    case 'webhooks': return <WebhooksSection />;
    case 'subscriptions': return <SubscriptionsSection />;
    case 'billing': return <BillingSection />;
    case 'cash-out': return <CashOutSection />;
    case 'api-keys': return <ApiKeysSection />;
    case 'api-ref': return <ApiRefSection />;
    case 'x402': return <X402Section />;
    case 'zipher-cli': return <ZipherCliSection />;
    case 'mcp': return <MCPSection />;
    default: return null;
  }
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const testnet = isTestnet();
  const hiddenIds = testnet ? [] : ['events'];
  const sections = useMemo(() => SECTIONS.filter(s => !hiddenIds.includes(s.id)), [testnet]);
  const groups = useMemo(() => SIDEBAR_GROUPS.map(g => ({ ...g, ids: g.ids.filter(id => !hiddenIds.includes(id)) })).filter(g => g.ids.length > 0), [testnet]);

  const current = sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      <SiteHeader label="DOCS" />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--cp-text)', margin: 0 }}>
            <span style={{ color: 'var(--cp-cyan)' }}>Documentation</span>
          </h1>
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginTop: 4 }}>
            Accept shielded Zcash payments. Non-custodial. Set up in minutes.
          </p>
        </div>

        <div className="grid-layout">
          {/* Sidebar */}
          <div>
            <div className="panel" style={{ position: 'sticky', top: 24 }}>
              {groups.map((group) => (
                <div key={group.label}>
                  <SidebarGroup label={group.label} />
                  {group.ids.map((id) => {
                    const section = sections.find((s) => s.id === id);
                    if (!section) return null;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 16px',
                          fontSize: 11,
                          fontFamily: 'inherit',
                          letterSpacing: 0.5,
                          cursor: 'pointer',
                          border: 'none',
                          borderBottom: '1px solid var(--cp-border)',
                          background: activeSection === section.id ? 'rgba(6,182,212,0.08)' : 'transparent',
                          color: activeSection === section.id ? 'var(--cp-cyan)' : 'var(--cp-text-muted)',
                          fontWeight: activeSection === section.id ? 600 : 400,
                          transition: 'all 0.15s',
                        }}
                      >
                        {section.title.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="panel" data-section={current.id}>
              <div className="panel-header">
                <span className="panel-title">{current.title}</span>
              </div>
              <div className="panel-body">
                <SectionContent id={current.id} onNavigate={setActiveSection} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
