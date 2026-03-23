'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, type EventSummary } from '@/lib/api';
import { CopyButton } from '@/components/CopyButton';
import { Spinner } from '@/components/Spinner';
import { SUPPORTED_CURRENCIES, currencySymbol } from '@/lib/currency';
import { useToast } from '@/contexts/ToastContext';

interface EventsTabProps {
  events: EventSummary[];
  loadingEvents: boolean;
  reloadEvents: () => Promise<void>;
  checkoutOrigin: string;
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: 'var(--cp-green)',
    draft: 'var(--cp-text-dim)',
    cancelled: 'var(--cp-red)',
    past: 'var(--cp-text-muted)',
  };
  const color = colorMap[status] || 'var(--cp-text-dim)';
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
      color, background: `${color}15`, padding: '2px 7px', borderRadius: 3,
      border: `1px solid ${color}30`,
    }}>
      {status.toUpperCase()}
    </span>
  );
}

function HelperText({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 4, lineHeight: 1.4 }}>
      {children}
    </div>
  );
}

export const EventsTab = memo(function EventsTab({ events, loadingEvents, reloadEvents, checkoutOrigin }: EventsTabProps) {
  const { showToast } = useToast();
  const t = useTranslations('dashboard.events');
  const tc = useTranslations('common');

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Scanner state
  const [scanCode, setScanCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ valid: boolean; already_used: boolean; voided: boolean; ticket_status: string } | null>(null);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  interface TierRow { label: string; currency: string; amount: string; capacity: string }
  const defaultTier = (): TierRow => ({ label: 'General Admission', currency: 'EUR', amount: '', capacity: '' });
  const [tiers, setTiers] = useState<TierRow[]>([defaultTier()]);

  const updateTier = (i: number, field: keyof TierRow, value: string) => {
    setTiers(prev => prev.map((t, j) => j === i ? { ...t, [field]: value } : t));
  };
  const removeTier = (i: number) => setTiers(prev => prev.filter((_, j) => j !== i));
  const addTier = () => setTiers(prev => [...prev, { label: '', currency: prev[0]?.currency || 'EUR', amount: '', capacity: '' }]);

  const resetForm = () => {
    setTitle(''); setDescription(''); setEventDate(''); setEventLocation('');
    setTiers([defaultTier()]);
  };

  const createEvent = async () => {
    if (!title.trim()) {
      showToast(t('toastTitleRequired'), true);
      return;
    }
    if (tiers.length === 0) {
      showToast(t('toastValidPrice'), true);
      return;
    }

    const prices: Array<{ currency: string; unit_amount: number; label?: string; max_quantity?: number }> = [];
    for (const tier of tiers) {
      const unitAmount = parseFloat(tier.amount);
      if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
        showToast(t('toastValidPrice'), true);
        return;
      }
      const maxQ = tier.capacity.trim() ? parseInt(tier.capacity, 10) : undefined;
      if (maxQ !== undefined && (!Number.isFinite(maxQ) || maxQ <= 0)) {
        showToast(t('toastValidCapacity'), true);
        return;
      }
      prices.push({
        currency: tier.currency,
        unit_amount: unitAmount,
        label: tier.label.trim() || undefined,
        max_quantity: maxQ,
      });
    }

    setCreating(true);
    try {
      await api.createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate || undefined,
        event_location: eventLocation.trim() || undefined,
        prices,
      });
      resetForm();
      setShowAddForm(false);
      await reloadEvents();
      showToast(t('toastCreated'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('toastFailed'), true);
    } finally {
      setCreating(false);
    }
  };

  const handleScan = async () => {
    const code = scanCode.trim();
    if (!code) return;
    setScanning(true);
    setScanResult(null);
    try {
      const result = await api.scanTicket(code);
      setScanResult(result);
      if (result.valid) {
        showToast(t('toastScanValid'));
        await reloadEvents();
      } else if (result.already_used) {
        showToast(t('toastScanUsed'), true);
      } else if (result.voided) {
        showToast(t('toastScanVoided'), true);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('toastScanFailed'), true);
    } finally {
      setScanning(false);
    }
  };

  const cancelEvent = async (id: string) => {
    try {
      await api.archiveEvent(id);
      await reloadEvents();
      showToast(t('toastCancelled'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('toastFailedCancel'), true);
    }
  };

  // ─── Detail view ───
  if (selectedEvent) {
    const event = events.find(e => e.id === selectedEvent);
    if (!event) { setSelectedEvent(null); return null; }

    const buyLink = `${checkoutOrigin}/buy/${event.product_id}`;

    return (
      <div className="panel">
        <div className="panel-header">
          <button
            onClick={() => setSelectedEvent(null)}
            className="btn btn-small"
            style={{ fontSize: 10 }}
          >
            {t('backToEvents')}
          </button>
          {event.status === 'active' && (
            <button
              onClick={() => { cancelEvent(event.id); setSelectedEvent(null); }}
              style={{
                background: 'none', border: 'none', color: 'var(--cp-red)',
                cursor: 'pointer', fontSize: 9, fontFamily: 'inherit',
                letterSpacing: 1, padding: 0, opacity: 0.7,
              }}
            >
              {t('cancelEvent')}
            </button>
          )}
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          {/* Event info */}
          <div style={{ padding: 24, borderBottom: '1px solid var(--cp-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--cp-text)' }}>{event.title}</span>
              <StatusBadge status={event.status} />
            </div>
            {event.description && (
              <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
                {event.description}
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 8 }}>
              {event.event_date && <span>{t('date')}: {new Date(event.event_date).toLocaleString()}</span>}
              {event.event_location && <span>{t('location')}: {event.event_location}</span>}
              <span>{t('created')}: {new Date(event.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Attendance stats */}
          <div style={{ padding: 24, borderBottom: '1px solid var(--cp-border)' }}>
            <div className="section-label">{t('attendance')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ border: '1px solid var(--cp-border)', borderRadius: 6, padding: '12px 16px' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cp-cyan)' }}>{event.sold_count}</div>
                <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 0.5 }}>{t('sold')}</div>
              </div>
              <div style={{ border: '1px solid var(--cp-border)', borderRadius: 6, padding: '12px 16px' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cp-green)' }}>{event.used_count}</div>
                <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 0.5 }}>{t('checkedIn')}</div>
              </div>
            </div>
          </div>

          {/* Scanner */}
          {(event.status === 'active' || event.status === 'past') && (
            <div style={{ padding: 24, borderBottom: '1px solid var(--cp-border)' }}>
              <div className="section-label">{t('scanner')}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  placeholder={t('scanPlaceholder')}
                  value={scanCode}
                  onChange={(e) => { setScanCode(e.target.value); setScanResult(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleScan(); }}
                  style={{ flex: 1, fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11 }}
                />
                <button className="btn-primary" onClick={handleScan} disabled={scanning || !scanCode.trim()} style={{ opacity: scanning ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                  {scanning ? t('scanning') : t('scanButton')}
                </button>
              </div>
              {scanResult && (
                <div style={{
                  marginTop: 10, padding: '10px 14px', borderRadius: 6,
                  border: `1px solid ${scanResult.valid ? 'var(--cp-green)' : scanResult.voided ? 'var(--cp-red)' : 'var(--cp-yellow)'}`,
                  background: scanResult.valid ? 'rgba(34,197,94,0.06)' : scanResult.voided ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: scanResult.valid ? 'var(--cp-green)' : scanResult.voided ? 'var(--cp-red)' : 'var(--cp-yellow)' }}>
                    {scanResult.valid ? t('scanResultValid') : scanResult.voided ? t('scanResultVoided') : t('scanResultUsed')}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 2 }}>
                    {t('ticketStatus')}: {scanResult.ticket_status.toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details */}
          <div style={{ padding: 24, borderBottom: '1px solid var(--cp-border)' }}>
            <div className="section-label">{t('details')}</div>
            <div className="stat-row" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>{t('eventId')}</span>
              <CopyButton text={event.id} label={event.id.substring(0, 8) + '...'} />
            </div>
            <div className="stat-row" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>{t('productId')}</span>
              <CopyButton text={event.product_id} label={event.product_id.substring(0, 8) + '...'} />
            </div>
            <div className="stat-row">
              <span style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>{t('buyLink')}</span>
              <CopyButton text={buyLink} label={buyLink.replace(/^https?:\/\//, '').substring(0, 30) + '...'} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── List view ───
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{t('title')}</span>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-small">
          {showAddForm ? tc('cancel') : t('addEvent')}
        </button>
      </div>
      <div className="panel-subtitle">
        {t('subtitle')}
      </div>

      {showAddForm && (
        <div className="panel-body" style={{ borderBottom: '1px solid var(--cp-border)' }}>
          <div className="form-group">
            <label className="form-label">{t('titleLabel')}</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('titlePlaceholder')} className="input" />
            <HelperText>{t('titleHelp')}</HelperText>
          </div>
          <div className="form-group">
            <label className="form-label">{t('descLabel')}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('descPlaceholder')} rows={2} className="input" style={{ resize: 'vertical', minHeight: 50 }} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('dateAndLocation')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input className="input" type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              <input className="input" placeholder={t('locationPlaceholder')} value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
            </div>
            <HelperText>{t('dateLocationHelp')}</HelperText>
          </div>
          <div className="form-group">
            <label className="form-label">{t('ticketTier')}</label>
            {tiers.map((tier, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: i < tiers.length - 1 ? 8 : 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 100px', gap: 8, flex: 1 }}>
                  <input className="input" placeholder={t('tierLabelPlaceholder')} value={tier.label} onChange={(e) => updateTier(i, 'label', e.target.value)} />
                  <select className="input" value={tier.currency} onChange={(e) => updateTier(i, 'currency', e.target.value)}>
                    {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input className="input" type="number" placeholder={t('amountPlaceholder')} value={tier.amount} onChange={(e) => updateTier(i, 'amount', e.target.value)} step="any" min="0.001" />
                  <input className="input" type="number" placeholder={t('capacityPlaceholder')} value={tier.capacity} onChange={(e) => updateTier(i, 'capacity', e.target.value)} min="1" />
                </div>
                {tiers.length > 1 && (
                  <button
                    onClick={() => removeTier(i)}
                    style={{
                      background: 'none', border: 'none', color: 'var(--cp-text-dim)',
                      cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                      padding: '0 4px', opacity: 0.5, transition: 'opacity 0.15s', flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--cp-red)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--cp-text-dim)'; }}
                    title={tc('remove')}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <HelperText>{t('ticketTierHelp')}</HelperText>
          </div>
          <div className="form-group" style={{ paddingTop: 0 }}>
            <button
              onClick={addTier}
              style={{
                background: 'none', border: 'none', color: 'var(--cp-cyan)',
                cursor: 'pointer', fontSize: 10, fontFamily: 'inherit',
                letterSpacing: 0.5, padding: 0,
              }}
            >
              {t('addTier')}
            </button>
            <HelperText>{t('addTierHelp')}</HelperText>
          </div>
          <button onClick={createEvent} disabled={creating} className="btn-primary" style={{ width: '100%', opacity: creating ? 0.5 : 1 }}>
            {creating ? t('creating') : t('addEvent')}
          </button>
        </div>
      )}

      {loadingEvents ? (
        <div className="empty-state">
          <Spinner />
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="icon">&#9783;</div>
          <div>{t('noEvents')}</div>
        </div>
      ) : (
        events.map((event) => (
          <div
            key={event.id}
            className="invoice-card"
            onClick={() => setSelectedEvent(event.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="invoice-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="invoice-id">{event.title}</span>
                <StatusBadge status={event.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cp-cyan)' }}>
                  {event.sold_count} {t('soldShort')}
                </span>
                {event.used_count > 0 && (
                  <span style={{ fontSize: 10, color: 'var(--cp-green)' }}>
                    {event.used_count} {t('inShort')}
                  </span>
                )}
              </div>
            </div>
            <div className="invoice-meta">
              {event.event_date && (
                <span style={{ color: 'var(--cp-text-dim)' }}>
                  {new Date(event.event_date).toLocaleDateString()}
                </span>
              )}
              {event.event_location && (
                <>
                  <span style={{ color: 'var(--cp-text-dim)', opacity: 0.4 }}>·</span>
                  <span style={{ color: 'var(--cp-text-dim)' }}>{event.event_location}</span>
                </>
              )}
              {!event.event_date && !event.event_location && (
                <span style={{ color: 'var(--cp-text-dim)' }}>
                  {new Date(event.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
});
