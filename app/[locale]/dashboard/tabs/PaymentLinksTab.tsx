'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { api, type PaymentLink, type Product } from '@/lib/api';
import { CopyButton } from '@/components/CopyButton';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/contexts/ToastContext';
import type { TabAction } from '../DashboardClient';

interface PaymentLinksTabProps {
  products: Product[];
  checkoutOrigin: string;
  initialAction?: TabAction;
  clearAction?: () => void;
}

export const PaymentLinksTab = memo(function PaymentLinksTab({
  products, checkoutOrigin, initialAction, clearAction,
}: PaymentLinksTabProps) {
  const { showToast } = useToast();
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (initialAction === 'create-link') {
      setShowCreate(true);
      clearAction?.();
    }
  }, [initialAction, clearAction]);

  const loadLinks = useCallback(async () => {
    try {
      const data = await api.listPaymentLinks();
      setLinks(data);
    } catch {
      showToast('Failed to load payment links', true);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  // Create form state
  const [selectedPriceId, setSelectedPriceId] = useState('');
  const [linkName, setLinkName] = useState('');
  const [successUrl, setSuccessUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const allPrices = products
    .filter(p => p.active && p.prices?.length)
    .flatMap(p => (p.prices || []).filter(pr => pr.active).map(pr => ({
      priceId: pr.id,
      label: `${p.name} — ${pr.unit_amount} ${pr.currency}`,
      productName: p.name,
    })));

  const handleCreate = async () => {
    if (!selectedPriceId) return;
    setCreating(true);
    try {
      await api.createPaymentLink({
        price_id: selectedPriceId,
        name: linkName || undefined,
        success_url: successUrl || undefined,
      });
      showToast('Payment link created');
      setShowCreate(false);
      setSelectedPriceId('');
      setLinkName('');
      setSuccessUrl('');
      loadLinks();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create link', true);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (link: PaymentLink) => {
    try {
      await api.updatePaymentLink(link.id, { active: !link.active });
      showToast(link.active ? 'Link deactivated' : 'Link activated');
      loadLinks();
    } catch {
      showToast('Failed to update link', true);
    }
  };

  const handleDelete = async (link: PaymentLink) => {
    if (!confirm('Delete this payment link permanently?')) return;
    try {
      await api.deletePaymentLink(link.id);
      showToast('Link deleted');
      loadLinks();
    } catch {
      showToast('Failed to delete link', true);
    }
  };

  const getLinkUrl = (slug: string) => `${checkoutOrigin}/link/${slug}`;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={20} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cp-text)', margin: 0 }}>
            Payment Links
          </h2>
          <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 4 }}>
            Shareable URLs that auto-create invoices. No code required.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(!showCreate)}
          style={{ fontSize: 11 }}
        >
          {showCreate ? 'Cancel' : '+ New Link'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Create Payment Link</span>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                PRICE *
              </label>
              <select
                value={selectedPriceId}
                onChange={e => setSelectedPriceId(e.target.value)}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="">Select a product &amp; price...</option>
                {allPrices.map(p => (
                  <option key={p.priceId} value={p.priceId}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                NAME (optional)
              </label>
              <input
                type="text"
                value={linkName}
                onChange={e => setLinkName(e.target.value)}
                placeholder="e.g. Premium API Access"
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                SUCCESS URL (optional)
              </label>
              <input
                type="url"
                value={successUrl}
                onChange={e => setSuccessUrl(e.target.value)}
                placeholder="https://yoursite.com/thanks"
                className="input"
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 3 }}>
                Redirect after successful payment
              </div>
            </div>

            <button
              className="btn btn-primary"
              disabled={!selectedPriceId || creating}
              onClick={handleCreate}
              style={{ alignSelf: 'flex-start', fontSize: 11, marginTop: 4 }}
            >
              {creating ? <Spinner size={12} /> : 'Create Link'}
            </button>
          </div>
        </div>
      )}

      {/* Links list */}
      {links.length === 0 ? (
        <div className="panel">
          <div className="panel-body" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 13, color: 'var(--cp-text-muted)', marginBottom: 8 }}>
              No payment links yet
            </div>
            <div style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>
              Create a link to share a checkout URL for any product.
            </div>
          </div>
        </div>
      ) : (
        links.map(link => {
          const price = products
            .flatMap(p => (p.prices || []).map(pr => ({ ...pr, productName: p.name })))
            .find(p => p.id === link.price_id);
          const url = getLinkUrl(link.slug);

          return (
            <div key={link.id} className="panel">
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="panel-title" style={{ fontSize: 12 }}>
                    {link.name || 'Untitled Link'}
                  </span>
                  <span
                    className={`status-badge ${link.active ? 'status-confirmed' : 'status-expired'}`}
                    style={{ fontSize: 8 }}
                  >
                    {link.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn"
                    onClick={() => handleToggle(link)}
                    style={{ fontSize: 9, padding: '3px 8px' }}
                  >
                    {link.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="btn"
                    onClick={() => handleDelete(link)}
                    style={{ fontSize: 9, padding: '3px 8px', color: 'var(--cp-red, #ef4444)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* URL row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{
                    fontSize: 10,
                    color: 'var(--cp-cyan)',
                    background: 'rgba(86, 212, 200, 0.06)',
                    padding: '4px 8px',
                    borderRadius: 4,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {url}
                  </code>
                  <CopyButton text={url} label="" />
                </div>

                {/* Details row */}
                <div style={{ display: 'flex', gap: 20, fontSize: 10, color: 'var(--cp-text-muted)' }}>
                  {price && (
                    <span>
                      {price.productName} — {price.unit_amount} {price.currency}
                    </span>
                  )}
                  <span>
                    {link.total_created} invoice{link.total_created !== 1 ? 's' : ''} created
                  </span>
                  {link.success_url && (
                    <span style={{ color: 'var(--cp-text-dim)' }}>
                      Redirects to {new URL(link.success_url).hostname}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
});
