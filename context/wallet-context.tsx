"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getProvider,
  getAccounts,
  requestAccounts,
  type Eip1193Provider,
  type WalletKind,
} from "@/lib/evm";
import { fetchPersonRole, type PersonRole, touchLastLogin } from "@/lib/person";

type WalletRole = PersonRole;

export type WalletContextValue = {
  address: string | null;
  role: WalletRole | null;
  roleLoading: boolean;
  chainId: number | null;
  wallet: WalletKind | null;
  connecting: boolean;
  connect: (wallet: WalletKind) => Promise<void>;
  disconnect: () => void;
};

const STORAGE_KEY = "wallet-connection";

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [wallet, setWallet] = useState<WalletKind | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [role, setRole] = useState<WalletRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const providerRef = useRef<Eip1193Provider | null>(null);

  // Resolve role whenever address changes
  useEffect(() => {
    let cancelled = false;
    async function resolveRole() {
      if (!address) {
        setRole(null);
        return;
      }
      setRoleLoading(true);
      const r = await fetchPersonRole(address);
      if (!cancelled) {
        setRole(r);
        setRoleLoading(false);
      }
    }
    resolveRole();
    return () => {
      cancelled = true;
      setRoleLoading(false);
    };
  }, [address]);

  // When role resolves for a connected wallet, touch lastLogin
  useEffect(() => {
    if (!address) return;
    if (roleLoading) return;
    if (role === "creator" || role === "user") {
      // Fire and forget
      void touchLastLogin(address);
    }
  }, [address, role, roleLoading]);

  // Restore persisted session on mount
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { wallet: WalletKind };
      silentReconnect(parsed.wallet);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to provider events for account/chain changes
  useEffect(() => {
    const provider = providerRef.current;
    if (!provider || !provider.on) return;
    const onAccountsChanged = (accs: string[]) => setAddress(accs?.[0] ?? null);
    const onChainChanged = (hex: string) => setChainId(parseInt(hex, 16));
    const onDisconnect = () => disconnect();
    provider.on("accountsChanged", onAccountsChanged);
    provider.on("chainChanged", onChainChanged);
    provider.on?.("disconnect", onDisconnect);
    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
      provider.removeListener?.("disconnect", onDisconnect);
    };
    // Re-attach when wallet type changes
  }, [wallet]);

  const silentReconnect = async (kind: WalletKind) => {
    const p = getProvider(kind);
    if (!p) return;
    providerRef.current = p;
    try {
      const [accs, cid] = await Promise.all([
        getAccounts(p),
        p.request({ method: "eth_chainId" }),
      ]);
      const addr = accs?.[0] ?? null;
      setAddress(addr);
      setChainId(typeof cid === "string" ? parseInt(cid, 16) : Number(cid));
      if (addr) setWallet(kind);
      // role will auto-resolve via effect on address
    } catch {
      // ignore
    }
  };

  const connect = async (kind: WalletKind) => {
    setConnecting(true);
    try {
      const p = getProvider(kind);
      if (!p) throw new Error(`${kind} not detected`);
      providerRef.current = p;
      const accs = await requestAccounts(p);
      const addr = accs?.[0] ?? null;
      const cid = await p.request({ method: "eth_chainId" });
      setAddress(addr);
      setChainId(typeof cid === "string" ? parseInt(cid, 16) : Number(cid));
      setWallet(kind);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ wallet: kind })
      );
      // Resolve role immediately after connect (null when missing)
      if (addr) {
        setRoleLoading(true);
        setRole(await fetchPersonRole(addr));
        setRoleLoading(false);
      }
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setChainId(null);
    setWallet(null);
    setRole(null);
    providerRef.current = null;
    if (typeof window !== "undefined")
      window.localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      address,
      role,
      roleLoading,
      chainId,
      wallet,
      connecting,
      connect,
      disconnect,
    }),
    [address, role, roleLoading, chainId, wallet, connecting]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
