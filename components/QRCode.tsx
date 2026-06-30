'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from '@/contexts/ThemeContext';

interface QRCodeProps {
  data: string;
  size?: number;
  className?: string;
  /**
   * For long payloads (Zcash URIs): smaller logo, lower error correction,
   * larger clear zone ratio to keep QR scannable on mid-range cameras.
   */
  dense?: boolean;
}

export function QRCode({ data, size = 240, className = '', dense = false }: QRCodeProps) {
  const { mounted } = useTheme();

  if (!mounted || !data) return null;

  if (dense) {
    // Dense mode: no center logo, low error correction — maximizes module size
    // for long Zcash URIs so low-end cameras can scan reliably.
    return (
      <div style={{ position: 'relative', width: size, height: size }} className={className}>
        <QRCodeSVG
          value={data}
          size={size}
          level="L"
          marginSize={2}
          bgColor="#ffffff"
          fgColor="#0f172a"
        />
      </div>
    );
  }

  const logoSize = Math.round(size * 0.14);
  const clearZone = Math.round(size * 0.22);

  return (
    <div style={{ position: 'relative', width: size, height: size }} className={className}>
      <QRCodeSVG
        value={data}
        size={size}
        level="H"
        marginSize={2}
        bgColor="#ffffff"
        fgColor="#0f172a"
        imageSettings={{
          src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          height: clearZone,
          width: clearZone,
          excavate: true,
        }}
      />
      <img
        src="/logo-mark.png"
        alt=""
        width={logoSize}
        height={Math.round(logoSize * 1.4)}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'block',
        }}
      />
    </div>
  );
}
