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

  const level = dense ? 'Q' : 'H';
  const logoScale = dense ? 0.10 : 0.14;
  const clearScale = dense ? 0.16 : 0.22;

  const logoSize = Math.round(size * logoScale);
  const clearZone = Math.round(size * clearScale);

  return (
    <div style={{ position: 'relative', width: size, height: size }} className={className}>
      <QRCodeSVG
        value={data}
        size={size}
        level={level}
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
