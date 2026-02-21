'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  data: string;
  size?: number;
  className?: string;
  forceLight?: boolean;
}

export function QRCode({ data, size = 240, className = '', forceLight = false }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, mounted } = useTheme();

  useEffect(() => {
    if (!canvasRef.current || !mounted || !data) return;

    const isDark = !forceLight && theme === 'dark';

    QRCodeLib.toCanvas(canvasRef.current, data, {
      width: size,
      margin: 2,
      color: {
        dark: isDark ? '#ffffff' : '#0f172a',
        light: isDark ? '#111118' : '#ffffff',
      },
      errorCorrectionLevel: 'M',
    }).catch((err: unknown) => {
      console.error('QR code generation failed:', err);
    });
  }, [data, size, theme, mounted, forceLight]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={size}
      height={size}
      style={{ display: 'block' }}
    />
  );
}
