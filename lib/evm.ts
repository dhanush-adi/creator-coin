"use client";

// Minimal helpers to detect injected EVM providers (MetaMask, Core, etc.)

export type Eip1193Provider = {
  request: (args: {
    method: string;
    params?: unknown[] | object;
  }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
  isCore?: boolean;
  providers?: Eip1193Provider[];
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
    avalanche?: Eip1193Provider; // Core extension often exposes this
  }
}

export type WalletKind = "metamask" | "core";

function getAllInjected(): Eip1193Provider[] {
  const list: Eip1193Provider[] = [];
  const eth = typeof window !== "undefined" ? window.ethereum : undefined;
  if (eth) {
    if (Array.isArray(eth.providers) && eth.providers.length)
      list.push(...eth.providers);
    list.push(eth);
  }
  const core =
    typeof window !== "undefined"
      ? (window.avalanche as Eip1193Provider | undefined)
      : undefined;
  if (core && !list.includes(core)) list.push(core);
  return list;
}

export function getProvider(kind: WalletKind): Eip1193Provider | undefined {
  const providers = getAllInjected();
  if (kind === "metamask")
    return (
      providers.find((p) => p?.isMetaMask) ?? providers.find((p) => !!p.request)
    );
  if (kind === "core") {
    const p = providers.find((p) => (p as any)?.isCore);
    if (p) return p;
    // Some Core builds expose window.avalanche without isCore
    if (typeof window !== "undefined" && window.avalanche)
      return window.avalanche;
    // Fallback: if only a single provider exists and it's not explicitly MetaMask, try it
    if (providers.length === 1 && !providers[0].isMetaMask) return providers[0];
  }
  return undefined;
}

export async function requestAccounts(
  provider: Eip1193Provider
): Promise<string[]> {
  return provider.request({ method: "eth_requestAccounts" });
}

export async function getAccounts(
  provider: Eip1193Provider
): Promise<string[]> {
  try {
    return await provider.request({ method: "eth_accounts" });
  } catch {
    return [];
  }
}

export async function getChainId(
  provider: Eip1193Provider
): Promise<number | null> {
  try {
    const hex = await provider.request({ method: "eth_chainId" });
    return typeof hex === "string" ? parseInt(hex, 16) : Number(hex);
  } catch {
    return null;
  }
}

// Chain helpers (wallet_switchEthereumChain / wallet_addEthereumChain)
export type AddEthereumChainParameter = {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
};

export const AVALANCHE_FUJI_PARAMS: AddEthereumChainParameter = {
  chainId: "0xa869", // 43113
  chainName: "Avalanche Fuji Testnet",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
  blockExplorerUrls: ["https://testnet.snowtrace.io/"],
};

export async function switchOrAddChain(
  provider: Eip1193Provider,
  params: AddEthereumChainParameter
): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: params.chainId } as any],
    });
  } catch (err: any) {
    // 4902 = Unrecognized chain
    if (
      err?.code === 4902 ||
      /Unrecognized chain/i.test(String(err?.message ?? ""))
    ) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [params as any],
      });
      return;
    }
    throw err;
  }
}

export async function ensureFuji(provider: Eip1193Provider): Promise<void> {
  return switchOrAddChain(provider, AVALANCHE_FUJI_PARAMS);
}
