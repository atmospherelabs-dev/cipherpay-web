'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { api, type Product, type CreateInvoiceResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/config';
import { PinLock } from './PinLock';
import { Catalog } from './Catalog';
import { HandoffScreen } from './HandoffScreen';
import { TipScreen } from './TipScreen';
import { CustomKeypad } from './CustomKeypad';
import { QRCheckout } from './QRCheckout';
import { ReceiptScreen } from './ReceiptScreen';

export type POSScreen = 'pin' | 'catalog' | 'keypad' | 'handoff' | 'tip' | 'qr' | 'receipt';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  currency: string;
  qty: number;
}

export default function POSPage() {
  const t = useTranslations('pos');
  const { merchant } = useAuth();

  const [screen, setScreen] = useState<POSScreen>('pin');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tipAmount, setTipAmount] = useState(0);
  const [invoiceData, setInvoiceData] = useState<CreateInvoiceResponse | null>(null);
  const [invoiceStatus, setInvoiceStatus] = useState<string>('pending');
  const [merchantName, setMerchantName] = useState('');
  const [posAuthenticated, setPosAuthenticated] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const prods = await api.listProducts();
      setProducts(prods.filter(p =>
        p.active === 1 &&
        !(p.prices || []).every(pr => pr.price_type === 'recurring')
      ));
    } catch { /* POS gracefully handles empty catalog */ }
  }, []);

  useEffect(() => {
    if (posAuthenticated) loadProducts();
  }, [posAuthenticated, loadProducts]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (merchant?.name) setMerchantName(merchant.name);
  }, [merchant]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCurrency = cart.length > 0 ? cart[0].currency : 'EUR';

  const handlePinSuccess = () => {
    setPosAuthenticated(true);
    setScreen('catalog');
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setTipAmount(0);
    setScreen('handoff');
  };

  const handleTipDone = async (tip: number) => {
    setTipAmount(tip);
    const total = Math.round((cartTotal + tip) * 100) / 100;
    const summary = cart.map(i => `${i.qty}x ${i.name}`).join(', ');
    try {
      const resp = await api.createInvoice({
        product_name: summary,
        amount: total,
        currency: cartCurrency,
      });
      setInvoiceData(resp);
      setInvoiceStatus('pending');
      setScreen('qr');
    } catch {
      setScreen('catalog');
    }
  };

  const handleCustomAmount = async (amount: number, currency: string, note: string) => {
    setTipAmount(0);
    setCart([{ productId: '__custom', name: note || t('customSale'), price: amount, currency, qty: 1 }]);
    setScreen('handoff');
  };

  const startSSE = useCallback((invoiceId: string) => {
    if (esRef.current) esRef.current.close();
    const es = new EventSource(`${API_URL}/api/invoices/${invoiceId}/stream`, { withCredentials: true });
    esRef.current = es;
    es.addEventListener('status', (event) => {
      try {
        const data = JSON.parse(event.data);
        setInvoiceStatus(data.status);
        if (data.status === 'detected' || data.status === 'confirmed' || data.status === 'expired') {
          es.close();
          if (data.status === 'confirmed' || data.status === 'detected') {
            setTimeout(() => setScreen('receipt'), 800);
          }
        }
      } catch { /* ignore */ }
    });
    es.onerror = () => {};
    return () => { es.close(); esRef.current = null; };
  }, []);

  const handleCancelQR = () => {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    if (invoiceData) {
      api.cancelInvoice(invoiceData.invoice_id).catch(() => {});
    }
    setInvoiceData(null);
    setInvoiceStatus('pending');
    setScreen('catalog');
  };

  const handleNewSale = () => {
    setCart([]);
    setTipAmount(0);
    setInvoiceData(null);
    setInvoiceStatus('pending');
    setScreen('catalog');
  };

  const handleLock = () => {
    setPosAuthenticated(false);
    setScreen('pin');
  };

  return (
    <div className="pos-app">
      {screen === 'pin' && (
        <PinLock
          merchantName={merchantName}
          merchantId={merchant?.id}
          onSuccess={handlePinSuccess}
          onDashboardAuth={merchant ? handlePinSuccess : undefined}
        />
      )}
      {screen === 'catalog' && (
        <Catalog
          products={products}
          cart={cart}
          setCart={setCart}
          onCheckout={handleCheckout}
          onCustomAmount={() => setScreen('keypad')}
          onLock={handleLock}
          merchantName={merchantName}
        />
      )}
      {screen === 'keypad' && (
        <CustomKeypad
          onSubmit={handleCustomAmount}
          onBack={() => setScreen('catalog')}
        />
      )}
      {screen === 'handoff' && (
        <HandoffScreen onReady={() => setScreen('tip')} onCancel={() => setScreen('catalog')} />
      )}
      {screen === 'tip' && (
        <TipScreen
          subtotal={cartTotal}
          currency={cartCurrency}
          onDone={handleTipDone}
          onCancel={() => { setScreen('catalog'); }}
        />
      )}
      {screen === 'qr' && invoiceData && (
        <QRCheckout
          invoice={invoiceData}
          status={invoiceStatus}
          onCancel={handleCancelQR}
          startSSE={startSSE}
          tipAmount={tipAmount}
        />
      )}
      {screen === 'receipt' && invoiceData && (
        <ReceiptScreen
          invoice={invoiceData}
          tipAmount={tipAmount}
          merchantName={merchantName}
          onNewSale={handleNewSale}
        />
      )}
    </div>
  );
}
