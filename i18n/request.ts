import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }

  const [
    common,
    nav,
    landing,
    checkout,
    buy,
    auth,
    dashboard,
    faq,
    recoverConfirm,
    languageSwitcher,
    donate,
    pos,
    brand,
    campaigns,
  ] = await Promise.all([
    import(`../messages/${locale}/common.json`),
    import(`../messages/${locale}/nav.json`),
    import(`../messages/${locale}/landing.json`),
    import(`../messages/${locale}/checkout.json`),
    import(`../messages/${locale}/buy.json`),
    import(`../messages/${locale}/auth.json`),
    import(`../messages/${locale}/dashboard.json`),
    import(`../messages/${locale}/faq.json`),
    import(`../messages/${locale}/recoverConfirm.json`),
    import(`../messages/${locale}/languageSwitcher.json`),
    import(`../messages/${locale}/donate.json`),
    import(`../messages/${locale}/pos.json`),
    import(`../messages/${locale}/brand.json`),
    import(`../messages/${locale}/campaigns.json`),
  ]);

  return {
    locale,
    messages: {
      common: common.default,
      nav: nav.default,
      landing: landing.default,
      checkout: checkout.default,
      buy: buy.default,
      auth: auth.default,
      dashboard: dashboard.default,
      faq: faq.default,
      recoverConfirm: recoverConfirm.default,
      languageSwitcher: languageSwitcher.default,
      donate: donate.default,
      pos: pos.default,
      brand: brand.default,
      campaigns: campaigns.default,
    },
  };
});
