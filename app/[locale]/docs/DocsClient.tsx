'use client';

import { useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { isTestnet } from '@/lib/config';
import {
  type DocSectionId,
  type DocSidebarGroupIcon,
  docsSectionPath,
  getDocSection,
  isDocSectionId,
  visibleDocSections,
  visibleDocSidebarGroups,
} from '@/lib/docs-sections';

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

function DocsGroupIcon({ icon }: { icon: DocSidebarGroupIcon }) {
  const props = {
    width: 13,
    height: 13,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (icon) {
    case 'start':
      return (
        <svg {...props}>
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      );
    case 'guides':
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'reference':
      return (
        <svg {...props}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case 'agents':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 9h.01" />
          <path d="M15 9h.01" />
          <path d="M9 15h6" />
        </svg>
      );
  }
}

function SectionContent({ id, onNavigate }: { id: DocSectionId; onNavigate: (id: DocSectionId) => void }) {
  switch (id) {
    case 'overview':
      return <OverviewSection onNavigate={onNavigate} />;
    case 'quickstart':
      return <QuickstartSection />;
    case 'sandbox':
      return <SandboxSection />;
    case 'shopify':
      return <ShopifySection />;
    case 'woocommerce':
      return <WooCommerceSection />;
    case 'custom':
      return <CustomSection />;
    case 'recipes':
      return <RecipesSection />;
    case 'products':
      return <ProductsSection />;
    case 'payment-links':
      return <PaymentLinksSection />;
    case 'pos':
      return <POSSection />;
    case 'events':
      return <EventsSection />;
    case 'donations':
      return <DonationsSection />;
    case 'webhooks':
      return <WebhooksSection />;
    case 'subscriptions':
      return <SubscriptionsSection />;
    case 'billing':
      return <BillingSection />;
    case 'cash-out':
      return <CashOutSection />;
    case 'api-keys':
      return <ApiKeysSection />;
    case 'api-ref':
      return <ApiRefSection />;
    case 'x402':
      return <X402Section />;
    case 'zipher-cli':
      return <ZipherCliSection />;
    case 'mcp':
      return <MCPSection />;
    default:
      return null;
  }
}

function DocsSidebarNav({
  activeSection,
  onNavigate,
  testnet,
}: {
  activeSection: DocSectionId;
  onNavigate: (id: DocSectionId) => void;
  testnet: boolean;
}) {
  const sections = useMemo(() => visibleDocSections(testnet), [testnet]);
  const groups = useMemo(() => visibleDocSidebarGroups(testnet), [testnet]);

  return (
    <nav className="docs-sidebar-nav" aria-label="Documentation sections">
      {groups.map((group, groupIndex) => (
        <div key={group.label} className="docs-sidebar-group">
          <div className={`docs-sidebar-group-label${groupIndex > 0 ? ' docs-sidebar-group-label--spaced' : ''}`}>
            <span className="docs-sidebar-group-icon">
              <DocsGroupIcon icon={group.icon} />
            </span>
            <span>{group.label}</span>
          </div>
          <ul className="docs-sidebar-list">
            {group.ids.map((id) => {
              const section = sections.find((s) => s.id === id);
              if (!section) return null;
              const isActive = activeSection === section.id;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(section.id)}
                    className={`docs-sidebar-item${isActive ? ' docs-sidebar-item--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {section.shortTitle}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DocsClient({ sectionId }: { sectionId: string }) {
  const router = useRouter();
  const testnet = isTestnet();
  const sections = useMemo(() => visibleDocSections(testnet), [testnet]);

  const activeSection: DocSectionId = isDocSectionId(sectionId) && sections.some((s) => s.id === sectionId)
    ? sectionId
    : 'overview';

  const current = getDocSection(activeSection) ?? sections[0];

  const navigate = (id: DocSectionId) => {
    router.push(docsSectionPath(id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

        {/* Mobile section picker */}
        <div className="docs-sidebar-mobile">
          <label htmlFor="docs-section-select" className="docs-sidebar-mobile-label">
            Section
          </label>
          <select
            id="docs-section-select"
            value={activeSection}
            onChange={(e) => navigate(e.target.value as DocSectionId)}
            className="docs-sidebar-mobile-select"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid-layout docs-layout">
          <aside className="docs-sidebar-desktop">
            <div className="panel docs-sidebar-panel">
              <DocsSidebarNav activeSection={activeSection} onNavigate={navigate} testnet={testnet} />
            </div>
          </aside>

          <div>
            <div className="panel" data-section={current.id}>
              <div className="panel-header">
                <span className="panel-title">{current.title}</span>
              </div>
              <div className="panel-body">
                <SectionContent id={activeSection} onNavigate={navigate} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
