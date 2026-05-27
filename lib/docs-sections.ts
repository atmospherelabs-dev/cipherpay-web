export const DOC_SECTIONS = [
  { id: 'overview', title: 'Overview', shortTitle: 'Overview' },
  { id: 'quickstart', title: 'Quickstart', shortTitle: 'Quickstart' },
  { id: 'sandbox', title: 'Sandbox & Testing', shortTitle: 'Sandbox' },
  { id: 'shopify', title: 'Shopify', shortTitle: 'Shopify' },
  { id: 'woocommerce', title: 'WooCommerce', shortTitle: 'WooCommerce' },
  { id: 'custom', title: 'Custom Integration', shortTitle: 'Custom API' },
  { id: 'recipes', title: 'Examples', shortTitle: 'Examples' },
  { id: 'products', title: 'Product Pages', shortTitle: 'Products' },
  { id: 'payment-links', title: 'Payment Links', shortTitle: 'Payment Links' },
  { id: 'pos', title: 'In-Person POS', shortTitle: 'POS' },
  { id: 'events', title: 'Events & Tickets', shortTitle: 'Events' },
  { id: 'donations', title: 'Donations', shortTitle: 'Donations' },
  { id: 'cash-out', title: 'Cash Out (ZEC → Fiat)', shortTitle: 'Cash Out' },
  { id: 'webhooks', title: 'Webhooks', shortTitle: 'Webhooks' },
  { id: 'subscriptions', title: 'Subscriptions', shortTitle: 'Subscriptions' },
  { id: 'billing', title: 'Billing & Fees', shortTitle: 'Billing' },
  { id: 'api-keys', title: 'API Keys', shortTitle: 'API Keys' },
  { id: 'api-ref', title: 'API Reference', shortTitle: 'API Reference' },
  { id: 'x402', title: 'Agentic Payments', shortTitle: 'x402 / Agents' },
  { id: 'zipher-cli', title: 'Zipher CLI', shortTitle: 'Zipher CLI' },
  { id: 'mcp', title: 'MCP Server', shortTitle: 'MCP Server' },
] as const;

export type DocSectionId = (typeof DOC_SECTIONS)[number]['id'];

export const DOC_SIDEBAR_GROUPS = [
  {
    label: 'Getting Started',
    icon: 'start' as const,
    ids: ['overview', 'quickstart', 'sandbox'] as DocSectionId[],
  },
  {
    label: 'Guides',
    icon: 'guides' as const,
    ids: [
      'shopify',
      'woocommerce',
      'custom',
      'recipes',
      'products',
      'payment-links',
      'pos',
      'events',
      'donations',
      'cash-out',
    ] as DocSectionId[],
  },
  {
    label: 'Reference',
    icon: 'reference' as const,
    ids: ['webhooks', 'subscriptions', 'billing', 'api-keys', 'api-ref'] as DocSectionId[],
  },
  {
    label: 'AI & Agents',
    icon: 'agents' as const,
    ids: ['x402', 'zipher-cli', 'mcp'] as DocSectionId[],
  },
] as const;

export type DocSidebarGroupIcon = (typeof DOC_SIDEBAR_GROUPS)[number]['icon'];

const SECTION_IDS = new Set<string>(DOC_SECTIONS.map((s) => s.id));

export function isDocSectionId(id: string): id is DocSectionId {
  return SECTION_IDS.has(id);
}

export function getDocSection(id: string) {
  return DOC_SECTIONS.find((s) => s.id === id);
}

/** Path for a docs section (overview → /docs). */
export function docsSectionPath(sectionId: DocSectionId | string): '/docs' | `/docs/${string}` {
  if (sectionId === 'overview') return '/docs';
  return `/docs/${sectionId}`;
}

export function hiddenDocSectionIds(testnet: boolean): DocSectionId[] {
  return testnet ? [] : ['events'];
}

export function visibleDocSections(testnet: boolean) {
  const hidden = new Set(hiddenDocSectionIds(testnet));
  return DOC_SECTIONS.filter((s) => !hidden.has(s.id));
}

export function visibleDocSidebarGroups(testnet: boolean) {
  const hidden = new Set(hiddenDocSectionIds(testnet));
  return DOC_SIDEBAR_GROUPS.map((group) => ({
    ...group,
    ids: group.ids.filter((id) => !hidden.has(id)),
  })).filter((group) => group.ids.length > 0);
}
