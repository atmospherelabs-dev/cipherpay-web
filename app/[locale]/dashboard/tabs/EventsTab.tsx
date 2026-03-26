'use client';

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { api, type EventSummary, type EventTierStat, type LumaEventEntry } from '@/lib/api';
import { CopyButton } from '@/components/CopyButton';
import { Spinner } from '@/components/Spinner';
import { SUPPORTED_CURRENCIES, currencySymbol } from '@/lib/currency';
import { useToast } from '@/contexts/ToastContext';
import type { TabAction } from '../DashboardClient';

interface EventsTabProps {
  events: EventSummary[];
  loadingEvents: boolean;
  reloadEvents: () => Promise<void>;
  checkoutOrigin: string;
  hasLumaKey?: boolean;
  isTestnet?: boolean;
  initialAction?: TabAction;
  clearAction?: () => void;
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

function DateTimePicker({ value, onChange, label }: {
  value: string; onChange: (v: string) => void; label?: string;
}) {
  const dateVal = value ? value.substring(0, 10) : '';
  const timeVal = value && value.length > 10 ? value.substring(11, 16) : '';

  const handleDateChange = (d: string) => {
    if (!d) { onChange(''); return; }
    onChange(d + 'T' + (timeVal || '19:00'));
  };
  const handleTimeChange = (t: string) => {
    if (!dateVal) return;
    onChange(dateVal + 'T' + (t || '19:00'));
  };

  return (
    <div>
      {label && <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 6 }}>
        <input className="input" type="date" value={dateVal} onChange={(e) => handleDateChange(e.target.value)} />
        <input className="input" type="time" value={timeVal} onChange={(e) => handleTimeChange(e.target.value)} disabled={!dateVal}
          style={{ opacity: dateVal ? 1 : 0.4 }}
        />
      </div>
    </div>
  );
}

function SoldDisplay({ sold, capacity, t }: { sold: number; capacity: number | null; t: (key: string, values?: Record<string, string | number>) => string }) {
  if (capacity != null) {
    return <>{t('soldOf', { sold, total: capacity })}</>;
  }
  return <>{sold}</>;
}

export const EventsTab = memo(function EventsTab({ events, loadingEvents, reloadEvents, checkoutOrigin, hasLumaKey, isTestnet, initialAction, clearAction }: EventsTabProps) {
  const { showToast } = useToast();
  const t = useTranslations('dashboard.events');
  const tc = useTranslations('common');

  const [showAddForm, setShowAddForm] = useState(false);
  const [showLumaImport, setShowLumaImport] = useState(false);
  const [lumaEvents, setLumaEvents] = useState<LumaEventEntry[]>([]);
  const [lumaLoading, setLumaLoading] = useState(false);
  const [lumaImporting, setLumaImporting] = useState<string | null>(null);
  const [lumaSyncing, setLumaSyncing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Scanner state
  const [scanCode, setScanCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ valid: boolean; already_used: boolean; voided: boolean; ticket_status: string } | null>(null);
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('camera');
  const qrReaderRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<unknown>(null);
  const scannerActiveRef = useRef(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [saving, setSaving] = useState(false);

  // Tier data
  const [tiers, setTierData] = useState<EventTierStat[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(false);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  interface TierRow { label: string; currency: string; amount: string; capacity: string }
  const defaultTier = (): TierRow => ({ label: 'General Admission', currency: 'EUR', amount: '', capacity: '' });
  const [createTiers, setCreateTiers] = useState<TierRow[]>([defaultTier()]);

  const updateCreateTier = (i: number, field: keyof TierRow, value: string) => {
    setCreateTiers(prev => prev.map((t, j) => j === i ? { ...t, [field]: value } : t));
  };
  const removeCreateTier = (i: number) => setCreateTiers(prev => prev.filter((_, j) => j !== i));
  const addCreateTier = () => setCreateTiers(prev => [...prev, { label: '', currency: prev[0]?.currency || 'EUR', amount: '', capacity: '' }]);

  const resetForm = () => {
    setTitle(''); setDescription(''); setEventDate(''); setEventLocation('');
    setCreateTiers([defaultTier()]);
  };

  useEffect(() => {
    if (initialAction === 'create-event') {
      setShowAddForm(true);
      setShowLumaImport(false);
      clearAction?.();
    } else if (initialAction === 'import-luma') {
      if (!hasLumaKey) {
        showToast(t('lumaKeyRequired'));
      } else {
        setShowLumaImport(true);
        setShowAddForm(false);
        if (lumaEvents.length === 0) {
          setLumaLoading(true);
          api.listLumaEvents()
            .then(setLumaEvents)
            .catch(() => showToast(t('lumaImportFailed'), true))
            .finally(() => setLumaLoading(false));
        }
      }
      clearAction?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAction]);

  const loadTierData = useCallback(async (eventId: string) => {
    setLoadingTiers(true);
    try {
      const detail = await api.getEvent(eventId);
      setTierData(detail.tiers);
    } catch {
      setTierData([]);
    } finally {
      setLoadingTiers(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadTierData(selectedEvent);
    } else {
      setTierData([]);
      setEditing(false);
    }
  }, [selectedEvent, loadTierData]);

  // Camera scanner lifecycle
  useEffect(() => {
    if (scannerMode !== 'camera' || !selectedEvent) return;
    const event = events.find(e => e.id === selectedEvent);
    if (!event || (event.status !== 'active' && event.status !== 'past')) return;

    let html5QrCode: { start: Function; stop: Function; clear: Function } | null = null;
    let mounted = true;

    const startScanner = async () => {
      if (!qrReaderRef.current || scannerActiveRef.current) return;
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        html5QrCode = scanner;
        scannerActiveRef.current = true;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            if (!mounted) return;
            setScanCode(decodedText);
            try {
              await scanner.stop();
              scannerActiveRef.current = false;
            } catch { /* ignore stop errors */ }
            setScanResult(null);
            setScanning(true);
            try {
              const result = await api.scanTicket(decodedText);
              if (!mounted) return;
              setScanResult(result);
              if (result.valid) {
                showToast(t('toastScanValid'));
                await reloadEvents();
                await loadTierData(selectedEvent!);
              } else if (result.already_used) {
                showToast(t('toastScanUsed'), true);
              } else if (result.voided) {
                showToast(t('toastScanVoided'), true);
              }
            } catch (err) {
              if (mounted) showToast(err instanceof Error ? err.message : t('toastScanFailed'), true);
            } finally {
              if (mounted) setScanning(false);
            }
            // Auto-resume after 2s
            setTimeout(async () => {
              if (!mounted || !qrReaderRef.current || scannerActiveRef.current) return;
              try {
                scannerActiveRef.current = true;
                await scanner.start(
                  { facingMode: 'environment' },
                  { fps: 10, qrbox: { width: 250, height: 250 } },
                  () => {},
                  () => {},
                );
              } catch { scannerActiveRef.current = false; }
            }, 2000);
          },
          () => {},
        );
      } catch {
        // Camera failed (HTTPS required or permission denied)
        if (mounted) setScannerMode('manual');
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (html5QrCode && scannerActiveRef.current) {
        try {
          (html5QrCode as unknown as { stop: () => Promise<void> }).stop().catch(() => {});
        } catch { /* ignore */ }
        scannerActiveRef.current = false;
      }
      scannerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerMode, selectedEvent]);

  const createEvent = async () => {
    if (!title.trim()) {
      showToast(t('toastTitleRequired'), true);
      return;
    }
    if (createTiers.length === 0) {
      showToast(t('toastValidPrice'), true);
      return;
    }

    const prices: Array<{ currency: string; unit_amount: number; label?: string; max_quantity?: number }> = [];
    for (const tier of createTiers) {
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
        if (selectedEvent) await loadTierData(selectedEvent);
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

  const startEditing = (event: EventSummary) => {
    setEditTitle(event.title);
    setEditDescription(event.description || '');
    setEditDate(event.event_date || '');
    setEditLocation(event.event_location || '');
    setEditing(true);
  };

  const saveEdit = async (eventId: string) => {
    setSaving(true);
    try {
      await api.updateEvent(eventId, {
        title: editTitle.trim() || undefined,
        description: editDescription.trim() || undefined,
        event_date: editDate || undefined,
        event_location: editLocation.trim() || undefined,
      });
      setEditing(false);
      await reloadEvents();
      showToast(t('toastUpdated'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('toastFailedUpdate'), true);
    } finally {
      setSaving(false);
    }
  };

  // ─── Detail view ───
  if (selectedEvent) {
    const event = events.find(e => e.id === selectedEvent);
    if (!event) { setSelectedEvent(null); return null; }

    const buyLink = `${checkoutOrigin}/buy/${event.product_id}`;
    const canEdit = event.status === 'active' || event.status === 'draft';

    return (
      <div className="panel">
        <div className="panel-header">
          <button
            onClick={() => { setSelectedEvent(null); setEditing(false); }}
            className="btn btn-small"
            style={{ fontSize: 10 }}
          >
            {t('backToEvents')}
          </button>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {event.luma_event_id && !editing && (
              <button
                onClick={async () => {
                  setLumaSyncing(true);
                  try {
                    const result = await api.syncLumaEvent(event.id);
                    await reloadEvents();
                    if (result.cancelled) {
                      showToast(t('lumaSyncCancelled'));
                      setSelectedEvent(null);
                    } else if (result.past) {
                      showToast(t('lumaSyncPast'));
                      setSelectedEvent(null);
                    } else {
                      await loadTierData(event.id);
                      const parts: string[] = [];
                      if (result.synced && result.synced > 0) parts.push(`${result.synced} updated`);
                      if (result.added && result.added > 0) parts.push(`${result.added} added`);
                      if (result.deactivated && result.deactivated > 0) parts.push(`${result.deactivated} removed`);
                      showToast(parts.length > 0
                        ? t('lumaSynced', { details: parts.join(', ') })
                        : t('lumaSyncUpToDate'));
                    }
                  } catch {
                    showToast(t('lumaSyncFailed'), true);
                  } finally {
                    setLumaSyncing(false);
                  }
                }}
                className="btn btn-small"
                disabled={lumaSyncing}
                style={{ fontSize: 9, color: '#E8C48D', borderColor: 'rgba(232,196,141,0.3)', opacity: lumaSyncing ? 0.5 : 1 }}
              >
                {lumaSyncing ? t('lumaSyncing') : t('lumaSyncButton')}
              </button>
            )}
            {canEdit && !editing && !event.luma_event_id && (
              <button
                onClick={() => startEditing(event)}
                className="btn btn-small"
                style={{ fontSize: 9 }}
              >
                {t('editEvent')}
              </button>
            )}
            {event.status === 'active' && !editing && !event.luma_event_id && (
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
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          {/* Event info (view or edit) */}
          <div style={{ padding: 24, borderBottom: '1px solid var(--cp-border)' }}>
            {editing ? (
              <>
                <div className="form-group">
                  <label className="form-label">{t('titleLabel')}</label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="input" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('descLabel')}</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} className="input" style={{ resize: 'vertical', minHeight: 50 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('dateAndLocation')}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
                    <DateTimePicker value={editDate} onChange={setEditDate} label={t('date')} />
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>{t('location')}</div>
                      <input className="input" placeholder={t('locationPlaceholder')} value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn-primary" onClick={() => saveEdit(event.id)} disabled={saving} style={{ opacity: saving ? 0.5 : 1 }}>
                    {saving ? <Spinner size={12} /> : t('saveChanges')}
                  </button>
                  <button className="btn btn-small" onClick={() => setEditing(false)} style={{ fontSize: 10 }}>
                    {t('discardChanges')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--cp-text)' }}>{event.title}</span>
                  <StatusBadge status={event.status} />
                </div>
                {event.description && (
                  <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
                    {event.description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 8, alignItems: 'center' }}>
                  {event.event_date && <span>{t('date')}: {new Date(event.event_date).toLocaleString()}</span>}
                  {event.event_location && <span>{t('location')}: {event.event_location}</span>}
                  <span>{t('created')}: {new Date(event.created_at).toLocaleDateString()}</span>
                  {event.luma_event_url && (
                    <a
                      href={event.luma_event_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#E8C48D', textDecoration: 'none', fontWeight: 600, letterSpacing: 0.5 }}
                    >
                      {t('viewOnLuma')}
                    </a>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Buy / Share link */}
          {!editing && (
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--cp-border)',
              background: 'rgba(86,212,200,0.04)',
            }}>
              <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
                {t('buyLink')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: 'var(--cp-cyan)',
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {buyLink}
                </span>
                <CopyButton text={buyLink} label={tc('copy')} />
                <a
                  href={buyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 9, letterSpacing: 0.5, color: 'var(--cp-text-dim)',
                    textDecoration: 'none', whiteSpace: 'nowrap',
                  }}
                >
                  {tc('open')} ↗
                </a>
              </div>
            </div>
          )}

          {/* Attendance stats */}
          <div style={{ padding: 24, borderBottom: '1px solid var(--cp-border)' }}>
            <div className="section-label">{t('attendance')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: event.luma_event_id ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div style={{ border: '1px solid var(--cp-border)', borderRadius: 6, padding: '12px 16px' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cp-cyan)' }}>
                  <SoldDisplay sold={event.sold_count} capacity={event.total_capacity} t={t} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 0.5 }}>
                  {event.luma_event_id ? t('registered') : t('sold')}
                </div>
              </div>
              {!event.luma_event_id && (
                <div style={{ border: '1px solid var(--cp-border)', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cp-green)' }}>{event.used_count}</div>
                  <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 0.5 }}>{t('checkedIn')}</div>
                </div>
              )}
            </div>
          </div>

          {/* Tier breakdown */}
          <div style={{ padding: 24, borderBottom: '1px solid var(--cp-border)' }}>
            <div className="section-label">{t('tierBreakdown')}</div>
            {loadingTiers ? (
              <div style={{ padding: 12, textAlign: 'center' }}><Spinner size={16} /></div>
            ) : tiers.length === 0 ? (
              <div style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>—</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tiers.map((tier) => (
                  <div key={tier.price_id} style={{
                    display: 'grid', gridTemplateColumns: event.luma_event_id ? '1fr auto' : '1fr auto auto', gap: 16, alignItems: 'center',
                    border: '1px solid var(--cp-border)', borderRadius: 6, padding: '10px 14px',
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cp-text)' }}>
                        {tier.label || tier.currency}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 2 }}>
                        {currencySymbol(tier.currency)}{tier.unit_amount.toFixed(2)} {tier.currency}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cp-cyan)' }}>
                        <SoldDisplay sold={tier.sold_count} capacity={tier.max_quantity} t={t} />
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 0.5 }}>{t('tierSold')}</div>
                    </div>
                    {!event.luma_event_id && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cp-green)' }}>{tier.used_count}</div>
                        <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 0.5 }}>{t('tierCheckedIn')}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scanner — only for CipherPay-native events (Luma handles its own check-in) */}
          {!event.luma_event_id && (event.status === 'active' || event.status === 'past') && (
            <div style={{ padding: 24, borderBottom: '1px solid var(--cp-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="section-label" style={{ margin: 0 }}>
                  {scannerMode === 'camera' ? t('cameraScanner') : t('scanner')}
                </div>
                <button
                  onClick={() => setScannerMode(scannerMode === 'camera' ? 'manual' : 'camera')}
                  style={{
                    background: 'none', border: 'none', color: 'var(--cp-cyan)',
                    cursor: 'pointer', fontSize: 9, fontFamily: 'inherit', letterSpacing: 0.5,
                  }}
                >
                  {scannerMode === 'camera' ? t('switchToManual') : t('switchToCamera')}
                </button>
              </div>

              {scannerMode === 'camera' ? (
                <div>
                  <div
                    id="qr-reader"
                    ref={qrReaderRef}
                    style={{
                      width: '100%', maxWidth: 400, margin: '0 auto',
                      borderRadius: 8, overflow: 'hidden',
                    }}
                  />
                  {scanning && (
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                      <Spinner size={16} />
                    </div>
                  )}
                </div>
              ) : (
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
              )}

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
            <div className="stat-row">
              <span style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>{t('productId')}</span>
              <CopyButton text={event.product_id} label={event.product_id.substring(0, 8) + '...'} />
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
        <div style={{ display: 'flex', gap: 8 }}>
          {isTestnet && (
            <button
              onClick={() => {
                if (!hasLumaKey) {
                  showToast(t('lumaKeyRequired'));
                  return;
                }
                setShowLumaImport(!showLumaImport);
                if (!showLumaImport && lumaEvents.length === 0) {
                  setLumaLoading(true);
                  api.listLumaEvents()
                    .then(setLumaEvents)
                    .catch(() => showToast(t('lumaImportFailed'), true))
                    .finally(() => setLumaLoading(false));
                }
              }}
              className="btn btn-small"
              style={{ color: '#E8C48D', borderColor: 'rgba(232,196,141,0.3)' }}
            >
              {showLumaImport ? tc('cancel') : t('importFromLuma')}
            </button>
          )}
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-small">
            {showAddForm ? tc('cancel') : t('addEvent')}
          </button>
        </div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
              <DateTimePicker value={eventDate} onChange={setEventDate} label={t('date')} />
              <div>
                <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>{t('location')}</div>
                <input className="input" placeholder={t('locationPlaceholder')} value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
              </div>
            </div>
            <HelperText>{t('dateLocationHelp')}</HelperText>
          </div>
          <div className="form-group">
            <label className="form-label">{t('ticketTier')}</label>
            {createTiers.map((tier, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: i < createTiers.length - 1 ? 8 : 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 100px', gap: 8, flex: 1 }}>
                  <input className="input" placeholder={t('tierLabelPlaceholder')} value={tier.label} onChange={(e) => updateCreateTier(i, 'label', e.target.value)} />
                  <select className="input" value={tier.currency} onChange={(e) => updateCreateTier(i, 'currency', e.target.value)}>
                    {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input className="input" type="number" placeholder={t('amountPlaceholder')} value={tier.amount} onChange={(e) => updateCreateTier(i, 'amount', e.target.value)} step="any" min="0.001" />
                  <input className="input" type="number" placeholder={t('capacityPlaceholder')} value={tier.capacity} onChange={(e) => updateCreateTier(i, 'capacity', e.target.value)} min="1" />
                </div>
                {createTiers.length > 1 && (
                  <button
                    onClick={() => removeCreateTier(i)}
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
              onClick={addCreateTier}
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

      {showLumaImport && (
        <div className="panel-body" style={{ borderBottom: '1px solid var(--cp-border)', padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t('lumaImportTitle')}</div>
          <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 16 }}>{t('lumaImportSubtitle')}</div>
          {lumaLoading ? (
            <div style={{ textAlign: 'center', padding: 24 }}><Spinner size={18} /><div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 8 }}>{t('lumaLoading')}</div></div>
          ) : lumaEvents.length === 0 ? (
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', textAlign: 'center', padding: 16 }}>{t('lumaNoEvents')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {lumaEvents.map((ev) => (
                <div key={ev.api_id} style={{ border: '1px solid var(--cp-border)', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{ev.name}</div>
                      {ev.start_at && (
                        <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginTop: 2 }}>
                          {new Date(ev.start_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                      {ev.ticket_types.length > 0 && (
                        <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 4 }}>
                          {t('lumaTicketTypes')}: {ev.ticket_types.map(tt => tt.name || 'General').join(', ')}
                        </div>
                      )}
                    </div>
                    <button
                      className="btn btn-small"
                      disabled={lumaImporting === ev.api_id}
                      style={{ color: '#E8C48D', borderColor: 'rgba(232,196,141,0.3)', opacity: lumaImporting === ev.api_id ? 0.5 : 1 }}
                      onClick={async () => {
                        setLumaImporting(ev.api_id);
                        try {
                          await api.importLumaEvent(ev.api_id);
                          showToast(t('lumaImported'));
                          setLumaEvents((prev) => prev.filter((e) => e.api_id !== ev.api_id));
                          await reloadEvents();
                        } catch {
                          showToast(t('lumaImportFailed'), true);
                        }
                        setLumaImporting(null);
                      }}
                    >
                      {lumaImporting === ev.api_id ? t('importingLuma') : t('lumaImportButton')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                {event.luma_event_id && (
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.5, color: '#E8C48D', background: 'rgba(232,196,141,0.1)', padding: '2px 7px', borderRadius: 3, border: '1px solid rgba(232,196,141,0.3)' }}>
                    {t('lumaBadge')}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cp-cyan)' }}>
                  <SoldDisplay sold={event.sold_count} capacity={event.total_capacity} t={t} /> {t('soldShort')}
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
