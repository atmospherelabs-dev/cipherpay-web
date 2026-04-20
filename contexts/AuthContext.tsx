'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, type MerchantInfo } from '@/lib/api';

interface AuthContextType {
  merchant: MerchantInfo | null;
  loading: boolean;
  login: (token: string) => Promise<boolean>;
  loginWithPasskey: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshMerchant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  merchant: null,
  loading: true,
  login: async () => false,
  loginWithPasskey: async () => false,
  logout: async () => {},
  refreshMerchant: async () => {},
});

function supportsWebAuthn(): boolean {
  return typeof window !== 'undefined'
    && !!window.PublicKeyCredential
    && typeof window.PublicKeyCredential === 'function';
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const me = await api.me();
      setMerchant(me);
    } catch {
      setMerchant(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (token: string): Promise<boolean> => {
    try {
      await api.createSession(token);
      await checkSession();
      return true;
    } catch {
      return false;
    }
  };

  const loginWithPasskey = async (): Promise<boolean> => {
    if (!supportsWebAuthn()) return false;
    try {
      const { challenge_id, options } = await api.passkeyLoginBegin();

      // Convert base64url strings to ArrayBuffers for the WebAuthn API
      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge: base64urlToBuffer(options.publicKey.challenge),
        rpId: options.publicKey.rpId,
        timeout: options.publicKey.timeout,
        userVerification: options.publicKey.userVerification || 'preferred',
        allowCredentials: (options.publicKey.allowCredentials || []).map(
          (c: { id: string; type: string; transports?: string[] }) => ({
            id: base64urlToBuffer(c.id),
            type: c.type,
            transports: c.transports,
          }),
        ),
      };

      const assertion = await navigator.credentials.get({ publicKey }) as PublicKeyCredential;
      if (!assertion) return false;

      const response = assertion.response as AuthenticatorAssertionResponse;
      const credential = {
        id: assertion.id,
        rawId: bufferToBase64url(assertion.rawId),
        type: assertion.type,
        response: {
          authenticatorData: bufferToBase64url(response.authenticatorData),
          clientDataJSON: bufferToBase64url(response.clientDataJSON),
          signature: bufferToBase64url(response.signature),
          userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : null,
        },
      };

      await api.passkeyLoginComplete({ challenge_id, credential });
      await checkSession();
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Cookie already cleared or expired
    }
    setMerchant(null);
  };

  return (
    <AuthContext.Provider value={{ merchant, loading, login, loginWithPasskey, logout, refreshMerchant: checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { supportsWebAuthn, bufferToBase64url, base64urlToBuffer };
