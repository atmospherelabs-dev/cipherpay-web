/**
 * CipherPay Donation Embed
 *
 * Usage:
 *   <script src="https://cipherpay.app/embed.js"
 *           data-campaign="your-slug"
 *           data-locale="en"
 *           data-theme="dark"></script>
 */
(function () {
  'use strict';

  var API = 'https://api.cipherpay.app';
  var WEB = 'https://cipherpay.app';

  var CURRENCIES = {
    USD: '$', EUR: '\u20AC', GBP: '\u00A3', BRL: 'R$',
    CAD: 'CA$', AUD: 'A$', CHF: 'CHF ', NGN: '\u20A6', INR: '\u20B9',
  };

  function sym(c) { return CURRENCIES[c] || c + ' '; }

  function fmtAmount(cents, currency) {
    return sym(currency) + (cents / 100).toLocaleString(undefined, {
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    });
  }

  var DARK = [
    ':host { display: block; font-family: Inter, system-ui, -apple-system, sans-serif; }',
    '.cp-card { background: #0d0d14; color: #e0e0e0; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); max-width: 440px; margin: 0 auto; }',
    '.cp-cover { width: 100%; height: 180px; object-fit: cover; display: block; }',
    '.cp-body { padding: 20px 22px 24px; }',
    '.cp-title { font-size: 20px; font-weight: 700; margin: 0; line-height: 1.3; color: #f0f0f0; }',
    '.cp-byline { font-size: 11px; color: #8a8a9a; margin-top: 6px; }',
    '.cp-byline a { color: #5B9CF6; text-decoration: none; }',
    '.cp-mission { font-size: 13px; color: #8a8a9a; line-height: 1.6; margin: 10px 0 0; }',
    '.cp-progress { margin-top: 18px; }',
    '.cp-progress-labels { display: flex; justify-content: space-between; font-size: 11px; color: #8a8a9a; margin-bottom: 5px; }',
    '.cp-progress-bar { height: 5px; border-radius: 3px; background: rgba(255,255,255,0.06); overflow: hidden; }',
    '.cp-progress-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #5B9CF6, #56D4C8); transition: width 0.5s ease; }',
    '.cp-donate-btn { display: block; width: 100%; margin-top: 20px; padding: 13px 0; border-radius: 8px; border: none; background: linear-gradient(135deg, #5B9CF6, #56D4C8); color: #fff; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; cursor: pointer; transition: opacity 0.2s; text-align: center; text-decoration: none; font-family: inherit; box-sizing: border-box; }',
    '.cp-donate-btn:hover { opacity: 0.9; }',
    '.cp-footer { text-align: center; margin-top: 12px; font-size: 9px; color: #555; }',
    '.cp-footer a { color: #5B9CF6; text-decoration: none; }',
    '.cp-error { text-align: center; padding: 32px 20px; color: #8a8a9a; font-size: 13px; }',
    '.cp-loading { text-align: center; padding: 40px 20px; color: #555; font-size: 12px; }',
  ].join('\n');

  var LIGHT = [
    ':host { display: block; font-family: Inter, system-ui, -apple-system, sans-serif; }',
    '.cp-card { background: #fff; color: #1a1a2e; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5e5; max-width: 440px; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }',
    '.cp-cover { width: 100%; height: 180px; object-fit: cover; display: block; }',
    '.cp-body { padding: 20px 22px 24px; }',
    '.cp-title { font-size: 20px; font-weight: 700; margin: 0; line-height: 1.3; color: #1a1a2e; }',
    '.cp-byline { font-size: 11px; color: #666; margin-top: 6px; }',
    '.cp-byline a { color: #3b7dd8; text-decoration: none; }',
    '.cp-mission { font-size: 13px; color: #666; line-height: 1.6; margin: 10px 0 0; }',
    '.cp-progress { margin-top: 18px; }',
    '.cp-progress-labels { display: flex; justify-content: space-between; font-size: 11px; color: #666; margin-bottom: 5px; }',
    '.cp-progress-bar { height: 5px; border-radius: 3px; background: #eee; overflow: hidden; }',
    '.cp-progress-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #3b7dd8, #2bb5a7); transition: width 0.5s ease; }',
    '.cp-donate-btn { display: block; width: 100%; margin-top: 20px; padding: 13px 0; border-radius: 8px; border: none; background: linear-gradient(135deg, #3b7dd8, #2bb5a7); color: #fff; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; cursor: pointer; transition: opacity 0.2s; text-align: center; text-decoration: none; font-family: inherit; box-sizing: border-box; }',
    '.cp-donate-btn:hover { opacity: 0.9; }',
    '.cp-footer { text-align: center; margin-top: 12px; font-size: 9px; color: #999; }',
    '.cp-footer a { color: #3b7dd8; text-decoration: none; }',
    '.cp-error { text-align: center; padding: 32px 20px; color: #666; font-size: 13px; }',
    '.cp-loading { text-align: center; padding: 40px 20px; color: #999; font-size: 12px; }',
  ].join('\n');

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'style' && typeof attrs[k] === 'object') {
        Object.assign(node.style, attrs[k]);
      } else {
        node.setAttribute(k, attrs[k]);
      }
    });
    if (children) {
      if (typeof children === 'string') node.textContent = children;
      else if (Array.isArray(children)) children.forEach(function (c) { if (c) node.appendChild(c); });
      else node.appendChild(children);
    }
    return node;
  }

  function renderWidget(root, info, slug, locale) {
    root.innerHTML = '';
    var config = info.donation_config || {};
    var currency = config.currency || 'USD';
    var donateUrl = WEB + '/' + locale + '/donate/' + slug;

    var card = el('div', { class: 'cp-card' });

    if (config.cover_image_url) {
      var pos = config.cover_image_position || 'center top';
      card.appendChild(el('img', {
        class: 'cp-cover', src: config.cover_image_url, alt: '',
        referrerpolicy: 'no-referrer', loading: 'lazy',
        style: { objectPosition: pos },
      }));
    }

    var body = el('div', { class: 'cp-body' });

    if (config.campaign_name) {
      body.appendChild(el('h2', { class: 'cp-title' }, config.campaign_name));
    }

    var byline = el('div', { class: 'cp-byline' });
    var orgText = config.campaign_name
      ? 'by ' + (info.name || info.merchant_name)
      : (info.name || info.merchant_name);
    byline.appendChild(el('span', null, orgText));
    if (config.website_url && /^https?:\/\//.test(config.website_url)) {
      byline.appendChild(document.createTextNode(' \u00B7 '));
      byline.appendChild(el('a', {
        href: config.website_url, target: '_blank', rel: 'noopener noreferrer',
      }, config.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')));
    }
    body.appendChild(byline);

    if (config.mission) {
      body.appendChild(el('p', { class: 'cp-mission' }, config.mission));
    }

    if (config.campaign_goal && config.campaign_goal > 0) {
      var pct = Math.min(100, (info.total_raised / config.campaign_goal) * 100);
      var progress = el('div', { class: 'cp-progress' });
      progress.appendChild(el('div', { class: 'cp-progress-labels' }, [
        el('span', null, fmtAmount(info.total_raised, currency) + ' raised'),
        el('span', null, 'Goal: ' + fmtAmount(config.campaign_goal, currency)),
      ]));
      var bar = el('div', { class: 'cp-progress-bar' });
      bar.appendChild(el('div', { class: 'cp-progress-fill', style: { width: pct + '%' } }));
      progress.appendChild(bar);
      body.appendChild(progress);
    }

    body.appendChild(el('a', {
      class: 'cp-donate-btn',
      href: donateUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
    }, 'Donate with Zcash'));

    card.appendChild(body);
    root.appendChild(card);

    root.appendChild(el('div', { class: 'cp-footer' }, [
      document.createTextNode('Powered by '),
      el('a', { href: WEB, target: '_blank', rel: 'noopener noreferrer' }, 'CipherPay'),
    ]));
  }

  function init(script) {
    var campaign = script.getAttribute('data-campaign');
    if (!campaign) {
      console.error('[CipherPay Embed] Missing data-campaign attribute');
      return;
    }

    var locale = script.getAttribute('data-locale') || 'en';
    var theme = script.getAttribute('data-theme') || 'dark';

    var container = document.createElement('div');
    script.parentNode.insertBefore(container, script);

    var shadow = container.attachShadow({ mode: 'open' });
    shadow.appendChild(el('style', null, theme === 'light' ? LIGHT : DARK));

    var wrapper = document.createElement('div');
    wrapper.innerHTML = '<div class="cp-loading">Loading campaign\u2026</div>';
    shadow.appendChild(wrapper);

    fetch(API + '/api/payment-links/' + encodeURIComponent(campaign) + '/info')
      .then(function (r) {
        if (!r.ok) throw new Error(r.status === 404 ? 'Campaign not found' : 'Failed to load campaign');
        return r.json();
      })
      .then(function (info) {
        renderWidget(wrapper, info, campaign, locale);
      })
      .catch(function (err) {
        wrapper.innerHTML = '<div class="cp-error">' + err.message + '</div>';
      });
  }

  if (document.currentScript) {
    init(document.currentScript);
  } else {
    var scripts = document.querySelectorAll('script[data-campaign]');
    if (scripts.length) init(scripts[scripts.length - 1]);
  }
})();
