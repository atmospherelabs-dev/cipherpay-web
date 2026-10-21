'use client';

// Adapted from CipherSwap useWallet; checkout pins the network and account before sending.

import { useState, useCallback, useEffect } from 'react';
import { parseUnits, type Chain } from 'viem';
import { mainnet, base, arbitrum } from 'viem/chains';

type WalletType = 'evm' | 'solana' | 'bitcoin' | 'tron' | null;

// Solana web3.js's Connection() validates the URL, so we must hand it an
// absolute URL. fetch() accepts relative URLs fine; using the same helper
// for both keeps the path in one place.
function getSolanaRpcUrl(): string {
  if (typeof window === 'undefined') return 'https://api.mainnet-beta.solana.com';
  return `${window.location.origin}/api/rpc/solana`;
}

export interface DetectedWallet {
  type: WalletType;
  name: string;
  icon?: string;
  providerKey: string;
}

interface WalletState {
  connected: boolean;
  address: string | null;
  walletType: WalletType;
  walletName: string | null;
  chainId: number | null;
}

export interface UseWalletReturn extends WalletState {
  /** Resolves true when connected, false when the user dismissed the prompt. */
  connect: (wallet: DetectedWallet) => Promise<boolean>;
  disconnect: () => void;
  prepareSend: (chain: string) => Promise<void>;
  sendTransaction: (to: string, amount: string, decimals: number, contractAddress?: string, chain?: string, beforeSend?: () => Promise<void>) => Promise<string>;
  getWalletsForChain: (chainId: string) => DetectedWallet[];
  allWallets: DetectedWallet[];
  switching: boolean;
}

const EVM_CHAINS: Record<string, Chain> = {
  eth: mainnet, base, arb: arbitrum,
};

// ── EIP-6963 types ──
interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}
interface EIP6963Detail {
  info: EIP6963ProviderInfo;
  provider: any;
}

// Stored EIP-6963 providers (populated by event listener)
let eip6963Providers: EIP6963Detail[] = [];
let eip6963Requested = false;

function requestEIP6963() {
  if (typeof window === 'undefined' || eip6963Requested) return;
  eip6963Requested = true;
  window.addEventListener('eip6963:announceProvider', ((e: CustomEvent<EIP6963Detail>) => {
    const existing = eip6963Providers.find(p => p.info.uuid === e.detail.info.uuid);
    if (!existing) eip6963Providers.push(e.detail);
  }) as EventListener);
  window.dispatchEvent(new Event('eip6963:requestProvider'));
}

function identifyProvider(p: any): string {
  // Check in priority order — Phantom & Rabby both set isMetaMask=true
  if (p.isPhantom) return 'Phantom';
  if (p.isRabby) return 'Rabby';
  if (p.isBraveWallet) return 'Brave Wallet';
  if (p.isCoinbaseWallet) return 'Coinbase Wallet';
  if (p.isTrust) return 'Trust Wallet';
  if (p.isMetaMask) return 'MetaMask';
  return 'Browser Wallet';
}

function getEvmProviders(): { name: string; icon?: string; key: string; provider: any }[] {
  if (typeof window === 'undefined') return [];

  // Prefer EIP-6963 — each wallet announces itself with real name & icon
  if (eip6963Providers.length > 0) {
    return eip6963Providers.map((entry, i) => ({
      name: entry.info.name,
      icon: entry.info.icon,
      key: `eip6963-${entry.info.rdns || entry.info.uuid}`,
      provider: entry.provider,
    }));
  }

  // Legacy fallback: probe window.ethereum
  const results: { name: string; key: string; provider: any }[] = [];
  const seen = new WeakSet();
  const ethereum = (window as any).ethereum;
  if (!ethereum) return results;

  if (ethereum.providers?.length) {
    for (let i = 0; i < ethereum.providers.length; i++) {
      const p = ethereum.providers[i];
      if (seen.has(p)) continue;
      seen.add(p);
      const name = identifyProvider(p);
      results.push({ name, key: `evm-${name.toLowerCase().replace(/\s+/g, '-')}-${i}`, provider: p });
    }
  }

  // Check dedicated injection points for wallets that may not appear in providers[]
  const dedicated: { flag: string; obj: any; name: string }[] = [
    { flag: 'phantom', obj: (window as any).phantom?.ethereum, name: 'Phantom' },
    { flag: 'rabby', obj: ethereum?.isRabby ? ethereum : null, name: 'Rabby' },
  ];

  for (const { obj, name } of dedicated) {
    if (obj && !seen.has(obj)) {
      seen.add(obj);
      results.push({ name, key: `evm-${name.toLowerCase()}-dedicated`, provider: obj });
    }
  }

  // If nothing found from providers[] or dedicated, use the main ethereum object
  if (results.length === 0 && ethereum) {
    const name = identifyProvider(ethereum);
    results.push({ name, key: 'evm-default', provider: ethereum });
  }

  return results;
}

// ── Wallet Standard (Solana) — icon discovery only ──
interface StandardWallet { name: string; icon: string; chains: readonly string[]; features: Record<string, any>; }

let standardWallets: StandardWallet[] = [];
let standardWalletsRequested = false;

function requestStandardWallets() {
  if (typeof window === 'undefined' || standardWalletsRequested) return;
  standardWalletsRequested = true;

  const register = (...wallets: StandardWallet[]) => {
    for (const w of wallets) {
      if (!standardWallets.find(sw => sw.name === w.name)) {
        standardWallets.push(w);
      }
    }
  };

  window.addEventListener('wallet-standard:register-wallet', ((e: CustomEvent) => {
    try {
      if (typeof e.detail === 'function') e.detail(register);
    } catch { /* extension-side error — safe to ignore */ }
  }) as EventListener);

  try {
    window.dispatchEvent(new CustomEvent('wallet-standard:app-ready', { detail: register }));
  } catch { /* extension-side error — safe to ignore */ }
}

const LOCAL_WALLET_ICONS: Record<string, string> = {
  tronlink: '/wallets/tronlink.jpeg',
  solflare: '/wallets/solflare.png',
  unisat: '/wallets/unisat.svg',
  xverse: '/wallets/xverse.png',
  leather: '/wallets/leather.svg',
};

function getIconFromAnySource(name: string): string | undefined {
  // 1. Wallet Standard
  const std = standardWallets.find(sw => sw.name.toLowerCase() === name.toLowerCase());
  if (std?.icon) return std.icon;

  // 2. EIP-6963 (Phantom registers on both EVM and Solana — reuse its EVM icon)
  const eip = eip6963Providers.find(p => p.info.name.toLowerCase().includes(name.toLowerCase()));
  if (eip?.info.icon) return eip.info.icon;

  // 3. Local fallback icons
  const local = LOCAL_WALLET_ICONS[name.toLowerCase()];
  if (local) return local;

  return undefined;
}

function getSolanaProviders(): { name: string; icon?: string; key: string; provider: any }[] {
  if (typeof window === 'undefined') return [];
  const results: { name: string; icon?: string; key: string; provider: any }[] = [];

  const phantom = (window as any).phantom?.solana || (window as any).solana;
  if (phantom?.isPhantom) {
    const icon = getIconFromAnySource('Phantom');
    results.push({ name: 'Phantom', icon, key: 'sol-phantom', provider: phantom });
  }
  const solflare = (window as any).solflare;
  if (solflare?.isSolflare) {
    const icon = getIconFromAnySource('Solflare');
    results.push({ name: 'Solflare', icon, key: 'sol-solflare', provider: solflare });
  }

  return results;
}

function getTronProviders(): { name: string; icon?: string; key: string; provider: any }[] {
  if (typeof window === 'undefined') return [];
  const results: { name: string; icon?: string; key: string; provider: any }[] = [];
  const tronLink = ((window as any).tron || (window as any).tronLink);
  const tronWeb = ((window as any).tron?.tronWeb || (window as any).tronWeb);
  if (tronLink || tronWeb) {
    const icon = getIconFromAnySource('TronLink');
    results.push({ name: 'TronLink', icon, key: 'tron-tronlink', provider: tronLink || tronWeb });
  }
  return results;
}

function getBitcoinProviders(): { name: string; icon?: string; key: string; provider: any }[] {
  if (typeof window === 'undefined') return [];
  const results: { name: string; icon?: string; key: string; provider: any }[] = [];
  const unisat = (window as any).unisat;
  if (unisat) results.push({ name: 'Unisat', icon: (unisat as any).icon || getIconFromAnySource('Unisat'), key: 'btc-unisat', provider: unisat });
  const xverse = (window as any).XverseProviders?.BitcoinProvider;
  if (xverse) results.push({ name: 'Xverse', icon: getIconFromAnySource('Xverse'), key: 'btc-xverse', provider: xverse });
  const leather = (window as any).LeatherProvider;
  if (leather) results.push({ name: 'Leather', icon: getIconFromAnySource('Leather'), key: 'btc-leather', provider: leather });
  return results;
}

function getAllProviders() {
  return {
    evm: getEvmProviders(),
    solana: getSolanaProviders(),
    tron: getTronProviders(),
    bitcoin: getBitcoinProviders(),
  };
}

export function chainToWalletType(chainId: string): WalletType {
  if (['eth', 'base', 'arb', 'pol', 'op', 'avax', 'bnb', 'bsc'].includes(chainId)) return 'evm';
  if (chainId === 'sol') return 'solana';
  if (chainId === 'btc') return 'bitcoin';
  if (['tron', 'trx'].includes(chainId)) return 'tron';
  return null;
}

export function usePaymentWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>({
    connected: false, address: null, walletType: null, walletName: null, chainId: null,
  });
  const [switching, setSwitching] = useState(false);
  const [rawProvider, setRawProvider] = useState<any>(null);
  const [allWallets, setAllWallets] = useState<DetectedWallet[]>([]);

  const detectWallets = useCallback(() => {
    const providers = getAllProviders();
    const wallets: DetectedWallet[] = [];
    for (const p of providers.evm) wallets.push({ type: 'evm', name: p.name, icon: p.icon, providerKey: p.key });
    for (const p of providers.solana) wallets.push({ type: 'solana', name: p.name, icon: p.icon, providerKey: p.key });
    for (const p of providers.tron) wallets.push({ type: 'tron', name: p.name, icon: p.icon, providerKey: p.key });
    for (const p of providers.bitcoin) wallets.push({ type: 'bitcoin', name: p.name, icon: p.icon, providerKey: p.key });
    setAllWallets(wallets);
  }, []);

  useEffect(() => {
    requestEIP6963();
    requestStandardWallets();

    const onAnnounce = () => detectWallets();
    window.addEventListener('eip6963:announceProvider', onAnnounce);
    window.addEventListener('wallet-standard:register-wallet', onAnnounce);

    const t1 = setTimeout(detectWallets, 150);
    const t2 = setTimeout(detectWallets, 600);
    const t3 = setTimeout(detectWallets, 2000);

    return () => {
      window.removeEventListener('eip6963:announceProvider', onAnnounce);
      window.removeEventListener('wallet-standard:register-wallet', onAnnounce);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [detectWallets]);

  const getWalletsForChain = useCallback((chainId: string): DetectedWallet[] => {
    const wType = chainToWalletType(chainId);
    if (!wType) return [];
    return allWallets.filter(w => w.type === wType && (wType !== 'bitcoin' || w.providerKey === 'btc-unisat'));
  }, [allWallets]);

  const connect = useCallback(async (wallet: DetectedWallet): Promise<boolean> => {
    if (!wallet.type) return false;
    setSwitching(true);
    try {
      if (wallet.type === 'evm') {
        const providers = getEvmProviders();
        const match = providers.find(p => p.key === wallet.providerKey);
        if (!match) throw new Error(`${wallet.name} not found. Is the extension enabled?`);

        const accounts = await match.provider.request({ method: 'eth_requestAccounts' });
        const chainId = await match.provider.request({ method: 'eth_chainId' });

        setRawProvider(match.provider);
        setState({
          connected: true,
          address: accounts[0],
          walletType: 'evm',
          walletName: match.name,
          chainId: parseInt(chainId, 16),
        });
      } else if (wallet.type === 'solana') {
        const providers = getSolanaProviders();
        const match = providers.find(p => p.key === wallet.providerKey);
        if (!match) throw new Error(`${wallet.name} not found. Is the extension enabled?`);

        const resp = await match.provider.connect();
        const pubKey = resp?.publicKey ?? match.provider.publicKey;
        if (!pubKey) throw new Error(`${wallet.name}: no public key returned. Is the wallet unlocked?`);
        setRawProvider(match.provider);
        setState({
          connected: true,
          address: pubKey.toString(),
          walletType: 'solana',
          walletName: match.name,
          chainId: null,
        });
      } else if (wallet.type === 'tron') {
        const tronLink = ((window as any).tron || (window as any).tronLink);
        const tronWeb = ((window as any).tron?.tronWeb || (window as any).tronWeb);
        if (!tronLink && !tronWeb) throw new Error('TronLink not found. Is the extension enabled?');

        if (tronLink?.request) {
          await tronLink.request({ method: 'tron_requestAccounts' });
        }
        const tw = ((window as any).tron?.tronWeb || (window as any).tronWeb);
        if (!tw?.defaultAddress?.base58) throw new Error('TronLink: please unlock your wallet');

        setRawProvider(tw);
        setState({
          connected: true,
          address: tw.defaultAddress.base58,
          walletType: 'tron',
          walletName: 'TronLink',
          chainId: null,
        });
      } else if (wallet.type === 'bitcoin') {
        const providers = getBitcoinProviders();
        const match = providers.find(p => p.key === wallet.providerKey);
        if (!match) throw new Error(`${wallet.name} not found. Is the extension enabled?`);

        if (match.key.includes('unisat')) {
          const accounts = await match.provider.requestAccounts();
          setRawProvider(match.provider);
          setState({ connected: true, address: accounts[0], walletType: 'bitcoin', walletName: match.name, chainId: null });
        } else if (match.key.includes('leather')) {
          const res = await match.provider.request('getAddresses');
          const addr = res?.result?.addresses?.find((a: any) => a.type === 'p2wpkh')?.address
            || res?.result?.addresses?.[0]?.address;
          if (!addr) throw new Error('Leather: no address returned');
          setRawProvider(match.provider);
          setState({ connected: true, address: addr, walletType: 'bitcoin', walletName: match.name, chainId: null });
        } else {
          const resp = await match.provider.connect();
          setRawProvider(match.provider);
          setState({ connected: true, address: resp?.address || resp?.addresses?.[0]?.address, walletType: 'bitcoin', walletName: match.name, chainId: null });
        }
      }
      return true;
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      const code = err?.code;
      const userRejected = code === 4001 || code === -32603
        || msg.includes('user rejected') || msg.includes('user denied')
        || msg.includes('user cancelled') || msg.includes('user canceled')
        || msg.includes('rejected the request');
      if (!userRejected) {
        console.error('Wallet connection failed:', err);
        throw err;
      }
      return false;
    } finally {
      setSwitching(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (state.walletType === 'solana' && rawProvider?.disconnect) rawProvider.disconnect();
    setRawProvider(null);
    setState({ connected: false, address: null, walletType: null, walletName: null, chainId: null });
  }, [state.walletType, rawProvider]);

  const prepareSend = useCallback(async (chain: string): Promise<void> => {
    if (!state.connected || !rawProvider) throw new Error('Wallet not connected');
    if (!chain || chainToWalletType(chain) !== state.walletType) throw new Error('Connect a wallet for the selected network');
    if (state.walletType === 'evm') {
      const expected = EVM_CHAINS[chain];
      if (!expected) throw new Error('Unsupported network');
      const current = await rawProvider.request({ method: 'eth_chainId' });
      if (Number.parseInt(current, 16) !== expected.id) {
        await rawProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x' + expected.id.toString(16) }] });
      }
      const actual = await rawProvider.request({ method: 'eth_chainId' });
      const accounts = await rawProvider.request({ method: 'eth_accounts' });
      if (Number.parseInt(actual, 16) !== expected.id || accounts[0]?.toLowerCase() !== state.address?.toLowerCase()) throw new Error('Wallet network or account changed. Reconnect before paying.');
    }
    if (state.walletType === 'solana' && rawProvider.publicKey?.toString() !== state.address) throw new Error('Wallet account changed. Reconnect before paying.');
    if (state.walletType === 'tron') {
      if (rawProvider.defaultAddress?.base58 !== state.address) throw new Error('Wallet account changed. Reconnect before paying.');
      const host = new URL(rawProvider.fullNode?.host || '').hostname;
      if (host !== 'api.trongrid.io' && host !== 'api.tronstack.io') throw new Error('Select TRON mainnet in TronLink or pay manually.');
    }
    if (state.walletType === 'bitcoin') {
      if (!rawProvider.getNetwork || !rawProvider.getAccounts) throw new Error('This Bitcoin wallet requires manual payment.');
      const network = await rawProvider.getNetwork();
      const accounts = await rawProvider.getAccounts();
      if (!['livenet', 'mainnet'].includes(network) || accounts[0] !== state.address) throw new Error('Select Bitcoin mainnet and reconnect your wallet.');
    }

  }, [state, rawProvider]);

  const sendTransaction = useCallback(async (to: string, amount: string, decimals: number, contractAddress?: string, chain?: string, beforeSend?: () => Promise<void>): Promise<string> => {
    await prepareSend(chain || '');
    if (state.walletType === 'evm') {
      const chainId = `0x${EVM_CHAINS[chain!].id.toString(16)}`;
      if (contractAddress) {
        const value = parseUnits(amount, decimals);
        const transferSelector = '0xa9059cbb';
        const paddedTo = to.slice(2).padStart(64, '0');
        const paddedAmount = value.toString(16).padStart(64, '0');
        const data = transferSelector + paddedTo + paddedAmount;
        await beforeSend?.();
        try { await prepareSend(chain || ''); } catch { throw Object.assign(new Error('Wallet changed before sending. Reconnect and retry.'), { code: 4001 }); }
        return await rawProvider.request({
          method: 'eth_sendTransaction',
          params: [{ chainId, from: state.address, to: contractAddress, data, value: '0x0' }],
        });
      }
      const value = parseUnits(amount, decimals);
      await beforeSend?.();
        try { await prepareSend(chain || ''); } catch { throw Object.assign(new Error('Wallet changed before sending. Reconnect and retry.'), { code: 4001 }); }
      return await rawProvider.request({
        method: 'eth_sendTransaction',
        params: [{ chainId, from: state.address, to, value: '0x' + value.toString(16) }],
      });
    }

    if (state.walletType === 'solana') {
      const { PublicKey, Transaction, Connection } = await import('@solana/web3.js');
      const connection = new Connection(getSolanaRpcUrl());
      const tx = new Transaction();

      if (contractAddress) {
        const { tokenPaymentInstructions } = await import('@/lib/solana-payment');
        tx.add(...tokenPaymentInstructions(new PublicKey(state.address!), new PublicKey(to), new PublicKey(contractAddress), parseUnits(amount, decimals), decimals));
      } else {
        const { SystemProgram } = await import('@solana/web3.js');
        const lamports = parseUnits(amount, decimals);
        tx.add(SystemProgram.transfer({ fromPubkey: new PublicKey(state.address!), toPubkey: new PublicKey(to), lamports }));
      }

      tx.feePayer = new PublicKey(state.address!);
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      await beforeSend?.();
        try { await prepareSend(chain || ''); } catch { throw Object.assign(new Error('Wallet changed before sending. Reconnect and retry.'), { code: 4001 }); }
      const signed = await rawProvider.signAndSendTransaction(tx);
      return signed.signature;
    }

    if (state.walletType === 'tron') {
      const tw = rawProvider;
      if (contractAddress) {
        const contract = await tw.contract().at(contractAddress);
        const tokenAmount = parseUnits(amount, decimals);
        await beforeSend?.();
        try { await prepareSend(chain || ''); } catch { throw Object.assign(new Error('Wallet changed before sending. Reconnect and retry.'), { code: 4001 }); }
        const result = await contract.transfer(to, tokenAmount.toString()).send();
        return result;
      }
      const sunAmount = Number(parseUnits(amount, 6));
      if (!Number.isSafeInteger(sunAmount)) throw new Error('Amount exceeds supported wallet precision');
      const unsigned = await tw.transactionBuilder.sendTrx(to, sunAmount, state.address);
      await beforeSend?.();
        try { await prepareSend(chain || ''); } catch { throw Object.assign(new Error('Wallet changed before sending. Reconnect and retry.'), { code: 4001 }); }
      const signed = await tw.trx.sign(unsigned);
      const tx = await tw.trx.sendRawTransaction(signed);
      if (!tx.result) throw new Error('TRON broadcast could not be verified');
      const txid = tx.txid || tx.transaction?.txID;
      if (!txid) throw new Error('TronLink did not return a transaction id');
      return txid;
    }

    if (state.walletType === 'bitcoin') {
      if (typeof rawProvider.sendBitcoin !== 'function') {
        throw new Error(`${state.walletName ?? 'This wallet'} cannot send from CipherPay. Use "Send manually" instead.`);
      }
      const satoshis = Number(parseUnits(amount, 8));
      if (!Number.isSafeInteger(satoshis)) throw new Error('Amount exceeds supported wallet precision');
      await beforeSend?.();
        try { await prepareSend(chain || ''); } catch { throw Object.assign(new Error('Wallet changed before sending. Reconnect and retry.'), { code: 4001 }); }
      return await rawProvider.sendBitcoin(to, satoshis);
    }

    throw new Error('Unknown wallet type');
  }, [state, rawProvider, prepareSend]);

  return {
    ...state,
    connect,
    disconnect,
    sendTransaction,
    prepareSend,
    getWalletsForChain,
    allWallets,
    switching,
  };
}
