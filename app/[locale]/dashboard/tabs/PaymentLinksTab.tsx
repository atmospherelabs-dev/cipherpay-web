'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { api, type PaymentLink, type Product } from '@/lib/api';
import { CopyButton } from '@/components/CopyButton';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/contexts/ToastContext';
import { currencySymbol } from '@/lib/currency';
import type { TabAction } from '../DashboardClient';

interface PaymentLinksTabProps {
  products: Product[];
  checkoutOrigin: string;
  initialAction?: TabAction;
  clearAction?: () => void;
}

type LinkView = 'payment' | 'donation';

export const PaymentLinksTab = memo(function PaymentLinksTab({
  products, checkoutOrigin, initialAction, clearAction,
}: PaymentLinksTabProps) {
  const { showToast } = useToast();
  const locale = useLocale();
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<LinkView>('payment');

  useEffect(() => {
    if (initialAction === 'create-link') {
      setShowCreate(true);
      clearAction?.();
    }
    if (initialAction === 'create-donation-link') {
      setView('donation');
      setShowCreate(true);
      clearAction?.();
    }
  }, [initialAction, clearAction]);

  const loadLinks = useCallback(async () => {
    try {
      const data = await api.listPaymentLinks();
      setLinks(data);
    } catch {
      showToast('Failed to load links', true);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  const paymentLinks = links.filter(l => l.mode !== 'donation');
  const donationLinks = links.filter(l => l.mode === 'donation');
  const filtered = view === 'payment' ? paymentLinks : donationLinks;

  // Payment link create form state
  const [selectedPriceId, setSelectedPriceId] = useState('');
  const [linkName, setLinkName] = useState('');
  const [successUrl, setSuccessUrl] = useState('');
  const [creating, setCreating] = useState(false);

  // Donation link create/edit form state
  const [donName, setDonName] = useState('');
  const [donMission, setDonMission] = useState('');
  const [donThankYou, setDonThankYou] = useState('');
  const [donCurrency, setDonCurrency] = useState('USD');
  const [donSuggested, setDonSuggested] = useState('10, 25, 50, 100');
  const [donCampaignName, setDonCampaignName] = useState('');
  const [donCampaignGoal, setDonCampaignGoal] = useState('');
  const [donContactEmail, setDonContactEmail] = useState('');
  const [donWebsiteUrl, setDonWebsiteUrl] = useState('');
  const [donCoverImage, setDonCoverImage] = useState('');
  const [donCoverPosition, setDonCoverPosition] = useState('center top');
  const [donSocialShare, setDonSocialShare] = useState('');
  const [editingLink, setEditingLink] = useState<PaymentLink | null>(null);

  const allPrices = products
    .filter(p => p.active && p.prices?.length)
    .flatMap(p => (p.prices || []).filter(pr => pr.active).map(pr => ({
      priceId: pr.id,
      label: `${p.name} — ${pr.unit_amount} ${pr.currency}`,
      productName: p.name,
    })));

  const handleCreatePaymentLink = async () => {
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

  const handleCreateDonationLink = async () => {
    if (!donName.trim()) return;
    setCreating(true);
    try {
      const suggestedAmounts = donSuggested
        .split(',')
        .map(s => Math.round(parseFloat(s.trim()) * 100))
        .filter(n => !isNaN(n) && n > 0);

      await api.createDonationLink({
        name: donName.trim(),
        mission: donMission.trim() || undefined,
        thank_you: donThankYou.trim() || undefined,
        currency: donCurrency,
        suggested_amounts: suggestedAmounts.length > 0 ? suggestedAmounts : undefined,
        campaign_name: donCampaignName.trim() || undefined,
        campaign_goal: donCampaignGoal ? Math.round(parseFloat(donCampaignGoal) * 100) : undefined,
        contact_email: donContactEmail.trim() || undefined,
        website_url: donWebsiteUrl.trim() || undefined,
        cover_image_url: donCoverImage.trim() || undefined,
        cover_image_position: donCoverPosition || undefined,
        social_share_text: donSocialShare.trim() || undefined,
      });
      showToast('Donation link created');
      setShowCreate(false);
      setEditingLink(null);
      resetDonationForm();
      loadLinks();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create donation link', true);
    } finally {
      setCreating(false);
    }
  };

  const resetDonationForm = () => {
    setDonName('');
    setDonMission('');
    setDonThankYou('');
    setDonCurrency('USD');
    setDonSuggested('10, 25, 50, 100');
    setDonCampaignName('');
    setDonCampaignGoal('');
    setDonContactEmail('');
    setDonWebsiteUrl('');
    setDonCoverImage('');
    setDonCoverPosition('center top');
    setDonSocialShare('');
  };

  const handleEditDonation = (link: PaymentLink) => {
    const dc = link.donation_config;
    setEditingLink(link);
    setDonName(link.name || '');
    setDonMission(dc?.mission || '');
    setDonThankYou(dc?.thank_you || '');
    setDonCurrency(dc?.currency || 'USD');
    setDonSuggested(
      dc?.suggested_amounts
        ? dc.suggested_amounts.map(a => (a / 100).toString()).join(', ')
        : '10, 25, 50, 100'
    );
    setDonCampaignName(dc?.campaign_name || '');
    setDonCampaignGoal(dc?.campaign_goal ? (dc.campaign_goal / 100).toString() : '');
    setDonContactEmail(dc?.contact_email || '');
    setDonWebsiteUrl(dc?.website_url || '');
    setDonCoverImage(dc?.cover_image_url || '');
    setDonCoverPosition(dc?.cover_image_position || 'center top');
    setDonSocialShare(dc?.social_share_text || '');
    setShowCreate(true);
  };

  const handleUpdateDonationLink = async () => {
    if (!editingLink || !donName.trim()) return;
    setCreating(true);
    try {
      const suggestedAmounts = donSuggested
        .split(',')
        .map(s => Math.round(parseFloat(s.trim()) * 100))
        .filter(n => !isNaN(n) && n > 0);

      await api.updatePaymentLink(editingLink.id, {
        name: donName.trim(),
        donation_config: {
          mission: donMission.trim() || undefined,
          thank_you: donThankYou.trim() || undefined,
          currency: donCurrency,
          suggested_amounts: suggestedAmounts.length > 0 ? suggestedAmounts : undefined,
          campaign_name: donCampaignName.trim() || undefined,
          campaign_goal: donCampaignGoal ? Math.round(parseFloat(donCampaignGoal) * 100) : undefined,
          contact_email: donContactEmail.trim() || undefined,
          website_url: donWebsiteUrl.trim() || undefined,
          cover_image_url: donCoverImage.trim() || undefined,
          cover_image_position: donCoverPosition || undefined,
          social_share_text: donSocialShare.trim() || undefined,
        },
      });
      showToast('Donation link updated');
      setShowCreate(false);
      setEditingLink(null);
      resetDonationForm();
      loadLinks();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to update donation link', true);
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
    if (!confirm(`Delete this ${link.mode} link permanently?`)) return;
    try {
      await api.deletePaymentLink(link.id);
      showToast('Link deleted');
      loadLinks();
    } catch {
      showToast('Failed to delete link', true);
    }
  };

  const getLinkUrl = (link: PaymentLink) =>
    link.mode === 'donation'
      ? `${checkoutOrigin}/${locale}/donate/${link.slug}`
      : `${checkoutOrigin}/link/${link.slug}`;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={20} />
      </div>
    );
  }

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', fontSize: 11, fontWeight: 600, border: '1px solid',
    borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s',
    borderColor: active ? 'var(--cp-accent-blue, #5B9CF6)' : 'rgba(255,255,255,0.08)',
    background: active ? 'rgba(91,156,246,0.1)' : 'transparent',
    color: active ? 'var(--cp-accent-blue, #5B9CF6)' : 'var(--cp-text-muted)',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => { setView('payment'); setShowCreate(false); }} style={toggleStyle(view === 'payment')}>
            Payment Links
          </button>
          <button onClick={() => { setView('donation'); setShowCreate(false); }} style={toggleStyle(view === 'donation')}>
            Donation Links
          </button>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showCreate) {
              setShowCreate(false);
              setEditingLink(null);
              resetDonationForm();
            } else {
              setShowCreate(true);
            }
          }}
          style={{ fontSize: 11 }}
        >
          {showCreate ? 'Cancel' : view === 'donation' ? '+ New Donation Link' : '+ New Link'}
        </button>
      </div>

      {/* Create form — Payment */}
      {showCreate && view === 'payment' && (
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
              <input type="text" value={linkName} onChange={e => setLinkName(e.target.value)}
                placeholder="e.g. Premium API Access" className="input" style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                SUCCESS URL (optional)
              </label>
              <input type="url" value={successUrl} onChange={e => setSuccessUrl(e.target.value)}
                placeholder="https://yoursite.com/thanks" className="input" style={{ width: '100%' }} />
              <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 3 }}>
                Redirect after successful payment
              </div>
            </div>

            <button className="btn btn-primary" disabled={!selectedPriceId || creating}
              onClick={handleCreatePaymentLink}
              style={{ alignSelf: 'flex-start', fontSize: 11, marginTop: 4 }}>
              {creating ? <Spinner size={12} /> : 'Create Link'}
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit form — Donation */}
      {showCreate && view === 'donation' && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              {editingLink
                ? `Edit: ${editingLink.name || 'Untitled'}`
                : 'Create Donation Link'}
            </span>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* — Identity — */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                ORGANIZATION NAME *
              </label>
              <input type="text" value={donName} onChange={e => setDonName(e.target.value)}
                placeholder="e.g. Electronic Frontier Foundation" className="input" style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                CAMPAIGN NAME
              </label>
              <input type="text" value={donCampaignName} onChange={e => setDonCampaignName(e.target.value)}
                placeholder="2026 Legal Defense Fund" className="input" style={{ width: '100%' }} />
            </div>

            {/* — Visual — */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                  COVER IMAGE URL
                </label>
                <input type="url" value={donCoverImage} onChange={e => setDonCoverImage(e.target.value)}
                  placeholder="https://i.imgur.com/abc123.jpg" className="input" style={{ width: '100%' }} />
                <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 3 }}>
                  Direct image URL (HTTPS). Right-click image → Copy Image Address.
                </div>
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                  FOCUS
                </label>
                <select value={donCoverPosition} onChange={e => setDonCoverPosition(e.target.value)}
                  className="input" style={{ width: '100%' }}>
                  <option value="center top">Top</option>
                  <option value="center center">Center</option>
                  <option value="center bottom">Bottom</option>
                </select>
              </div>
            </div>

            {donCoverImage.trim() && (
              <div style={{
                borderRadius: 6, overflow: 'hidden', height: 140,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={donCoverImage.trim()}
                  alt="Cover preview"
                  referrerPolicy="no-referrer"
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: donCoverPosition,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                MISSION STATEMENT
              </label>
              <textarea value={donMission} onChange={e => setDonMission(e.target.value)}
                placeholder="Defending digital rights worldwide" className="input"
                rows={2} style={{ width: '100%', resize: 'vertical' }} />
            </div>

            {/* — Fundraising — */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                  CAMPAIGN GOAL ({donCurrency})
                </label>
                <input type="number" value={donCampaignGoal} onChange={e => setDonCampaignGoal(e.target.value)}
                  placeholder="10000" className="input" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                  CURRENCY {editingLink && <span style={{ color: 'var(--cp-text-dim)' }}>(locked)</span>}
                </label>
                <select value={donCurrency} onChange={e => setDonCurrency(e.target.value)}
                  className="input" style={{ width: '100%' }} disabled={!!editingLink}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                SUGGESTED AMOUNTS
              </label>
              <input type="text" value={donSuggested} onChange={e => setDonSuggested(e.target.value)}
                placeholder="10, 25, 50, 100" className="input" style={{ width: '100%' }} />
              <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 3 }}>
                Comma-separated, in {donCurrency}
              </div>
            </div>

            {/* — Post-donation — */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                THANK YOU MESSAGE
              </label>
              <textarea value={donThankYou} onChange={e => setDonThankYou(e.target.value)}
                placeholder="Thank you for supporting privacy." className="input"
                rows={2} style={{ width: '100%', resize: 'vertical' }} />
              <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 3 }}>
                Shown to donors after payment is confirmed
              </div>
            </div>

            {/* — Contact & links — */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                  CONTACT EMAIL
                </label>
                <input type="email" value={donContactEmail} onChange={e => setDonContactEmail(e.target.value)}
                  placeholder="donations@example.org" className="input" style={{ width: '100%' }} />
                <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 3 }}>
                  For tax receipt requests
                </div>
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                  WEBSITE URL
                </label>
                <input type="url" value={donWebsiteUrl} onChange={e => setDonWebsiteUrl(e.target.value)}
                  placeholder="https://example.org" className="input" style={{ width: '100%' }} />
              </div>
            </div>

            {/* — Sharing — */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>
                SOCIAL SHARE TEXT
              </label>
              <input type="text" value={donSocialShare} onChange={e => setDonSocialShare(e.target.value)}
                placeholder="Help us defend digital rights — donate with Zcash" className="input" style={{ width: '100%' }} />
              <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 3 }}>
                Pre-filled text when donors share the link
              </div>
            </div>

            <button className="btn btn-primary" disabled={!donName.trim() || creating}
              onClick={editingLink ? handleUpdateDonationLink : handleCreateDonationLink}
              style={{ alignSelf: 'flex-start', fontSize: 11, marginTop: 4 }}>
              {creating ? <Spinner size={12} /> : editingLink ? 'Save Changes' : 'Create Donation Link'}
            </button>
          </div>
        </div>
      )}

      {/* Links list */}
      {filtered.length === 0 ? (
        <div className="panel">
          <div className="panel-body" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 13, color: 'var(--cp-text-muted)', marginBottom: 8 }}>
              {view === 'donation' ? 'No donation links yet' : 'No payment links yet'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>
              {view === 'donation'
                ? 'Create a donation link to accept shielded Zcash donations.'
                : 'Create a link to share a checkout URL for any product.'}
            </div>
          </div>
        </div>
      ) : (
        filtered.map(link => {
          const price = view === 'payment'
            ? products
                .flatMap(p => (p.prices || []).map(pr => ({ ...pr, productName: p.name })))
                .find(p => p.id === link.price_id)
            : null;
          const url = getLinkUrl(link);
          const dc = link.donation_config;
          const sym = dc ? currencySymbol(dc.currency) : '$';

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
                  {link.mode === 'donation' && (
                    <span style={{
                      fontSize: 8, padding: '2px 6px', borderRadius: 3,
                      background: 'rgba(255,255,255,0.05)', color: 'var(--cp-text-muted)',
                      fontWeight: 600, letterSpacing: 0.5,
                    }}>
                      DONATION
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {link.mode === 'donation' && (
                    <button className="btn" onClick={() => handleEditDonation(link)}
                      style={{ fontSize: 9, padding: '3px 8px' }}>
                      Edit
                    </button>
                  )}
                  <button className="btn" onClick={() => handleToggle(link)}
                    style={{ fontSize: 9, padding: '3px 8px' }}>
                    {link.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn" onClick={() => handleDelete(link)}
                    style={{ fontSize: 9, padding: '3px 8px', color: 'var(--cp-red, #ef4444)' }}>
                    Delete
                  </button>
                </div>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{
                    fontSize: 10, color: 'var(--cp-cyan)',
                    background: 'rgba(86, 212, 200, 0.06)',
                    padding: '4px 8px', borderRadius: 4, flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {url}
                  </code>
                  <CopyButton text={url} label="" />
                </div>

                <div style={{ display: 'flex', gap: 20, fontSize: 10, color: 'var(--cp-text-muted)', flexWrap: 'wrap' }}>
                  {price && (
                    <span>{price.productName} — {price.unit_amount} {price.currency}</span>
                  )}
                  {link.mode === 'donation' && dc?.campaign_goal && (
                    <span>{sym}{(link.total_raised / 100).toLocaleString()} / {sym}{(dc.campaign_goal / 100).toLocaleString()} raised</span>
                  )}
                  {link.mode === 'donation' && !dc?.campaign_goal && link.total_raised > 0 && (
                    <span>{sym}{(link.total_raised / 100).toLocaleString()} raised</span>
                  )}
                  <span>
                    {link.mode === 'donation'
                      ? `${link.total_confirmed ?? 0} donation${(link.total_confirmed ?? 0) !== 1 ? 's' : ''}`
                      : `${link.total_created} invoice${link.total_created !== 1 ? 's' : ''}`
                    }
                  </span>
                  {link.success_url && (
                    <span style={{ color: 'var(--cp-text-dim)' }}>
                      Redirects to {(() => { try { return new URL(link.success_url).hostname; } catch { return link.success_url; } })()}
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
