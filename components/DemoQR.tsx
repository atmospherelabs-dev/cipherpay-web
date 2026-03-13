'use client';

import { QRCode } from './QRCode';

export function DemoQR() {
  return <QRCode data="zcash:u1demo?amount=0.12345678&memo=Q1AtQTFCMkMz" size={72} />;
}
