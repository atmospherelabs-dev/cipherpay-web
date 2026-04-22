'use client';

import { useLocale } from 'next-intl';
import { useEffect } from 'react';

const RTL_LOCALES = new Set(['ar']);

export function DirectionSetter() {
  const locale = useLocale();

  useEffect(() => {
    const dir = RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
