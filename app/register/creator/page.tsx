"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/wallet-context";
import { getProvider, ensureFuji } from "@/lib/evm";
import { getFirebase } from "@/lib/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import SiteHeader from "@/components/site-header";
import { Button } from "@/components/ui-kit";
import { ethers } from "ethers";
import FactoryAbi from "@/abi/CreatorFactory.json";
import TokenAbi from "@/abi/CreatorToken.json";
import { createOrUpdateCreator, type CreatorProfile } from "@/lib/creator";

// Prefer env var for Fuji factory; fallback to default
const FACTORY_ADDRESS =
  (process.env.NEXT_PUBLIC_FACTORY_ADDRESS_FUJI as string | undefined) ||
  "0xf7e2846C0eFa00EE35fc19e666c9Fe3761CedAE3";
const TOKEN_ADDRESS_PLACEHOLDER = "0x0000000000000000000000000000000000000000";

export default function CreatorRegisterPage() {
  const { address, wallet } = useWallet();
  const router = useRouter();

  const nowIso = useMemo(() => new Date().toISOString(), []);
  const [form, setForm] = useState({
    name: "",
    walletAddress: address ?? "",
    creatorTokenAddress: "",
    creatorTokenSymbol: "",
    creatorTokenPriceUSD: 0,
    bio: "",
    profileImageUrl: "",
    socialTwitter: "",
    socialWebsite: "",
    createdAt: nowIso,
  });
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fb = getFirebase();
      if (!fb) throw new Error("Firebase not configured");
      const storage = getStorage(fb.app);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const who = (address || "anon").toLowerCase();
      const path = `aval-2025/${who}-${Date.now()}-${safeName}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      setForm((f) => ({ ...f, profileImageUrl: url }));
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function deployOrSelectToken() {
    if (!wallet) throw new Error("Connect a wallet first");
    // Choose the injected provider that matches the connected wallet (MetaMask/Core)
    const injected = getProvider(wallet ?? "metamask");
    if (!injected) throw new Error("No injected wallet provider found");
    // Ethers v6 BrowserProvider from EIP-1193 provider
    const ethProvider = new ethers.BrowserProvider(injected as any);
    // Ensure account permission (avoids silent missing account)
    try {
      await (injected as any).request?.({ method: "eth_requestAccounts" });
    } catch {}
    // Ensure Avalanche Fuji testnet
    try {
      await ensureFuji(injected as any);
    } catch {}
    // Hard assert we're on Fuji 43113 to avoid sending to wrong chain
    const net = await ethProvider.getNetwork();
    if (Number(net?.chainId?.toString?.() || 0) !== 43113) {
      throw new Error(
        "Please switch your wallet to Avalanche Fuji (43113) and retry."
      );
    }

    // If user already pasted an existing token address, validate and return it
    if (
      form.creatorTokenAddress &&
      ethers.isAddress(form.creatorTokenAddress)
    ) {
      const tokenAddr = ethers.getAddress(form.creatorTokenAddress);
      // Validate that code exists at the address on Fuji
      const code = await ethProvider.getCode(tokenAddr);
      if (!code || code === "0x") {
        throw new Error(
          "No contract code at the provided token address on Fuji."
        );
      }
      // Try to read symbol and set if missing
      try {
        const tokenAbi = (TokenAbi as any).abi ?? TokenAbi;
        const erc = new ethers.Contract(tokenAddr, tokenAbi, ethProvider);
        const sym: string = await erc.symbol();
        if (!form.creatorTokenSymbol && sym) {
          setForm((f) => ({ ...f, creatorTokenSymbol: String(sym) }));
        }
      } catch {}
      return tokenAddr;
    }
    // Otherwise deploy/register via factory
    setDeploying(true);
    try {
      const signer = await ethProvider.getSigner();
      const signerAddr = (await signer.getAddress())?.toLowerCase?.();
      if (address && signerAddr && signerAddr !== address.toLowerCase()) {
        throw new Error(
          "Active wallet account doesn't match connected address. Please switch account in your wallet."
        );
      }
      const factoryAbi = (FactoryAbi as any).abi ?? FactoryAbi;
      const iface = new ethers.Interface(factoryAbi);
      // Factory.registerCreator(name, metadataUri, tokenName, tokenSymbol, basePriceScaled, slopeScaled)
      const tokenName = (form.name || "").trim();
      if (!tokenName) throw new Error("Name is required");
      const tokenSymbol = (
        form.creatorTokenSymbol || form.name.slice(0, 4)
      ).toUpperCase();
      const metadataUri = (form.profileImageUrl || "").trim();
      // Map USD to scaled params if your contract expects bonding curve params
      const price = Number(form.creatorTokenPriceUSD || 0);
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("Base price must be greater than 0");
      }
      const basePriceScaled = ethers.parseUnits(String(price), 18);
      const slopeScaled = BigInt(0);
      const data = iface.encodeFunctionData("registerCreator", [
        tokenName,
        metadataUri,
        tokenName,
        tokenSymbol,
        basePriceScaled,
        slopeScaled,
      ]);
      // Estimate gas and send with hex gasLimit to avoid BigInt serialization issues in some wallets
      let gasLimitHex: string | undefined;
      try {
        const gasEst = await signer.estimateGas({ to: FACTORY_ADDRESS, data });
        gasLimitHex = ethers.toBeHex((gasEst as bigint) + BigInt(100000));
      } catch {
        // Fallback gas limit if estimation fails (wallets may override)
        gasLimitHex = ethers.toBeHex(2_500_000);
      }
      let receipt: ethers.TransactionReceipt | null = null;
      try {
        const tx = await signer.sendTransaction({
          to: FACTORY_ADDRESS,
          data,
          gasLimit: gasLimitHex,
        });
        receipt = await tx.wait();
      } catch (primaryErr: any) {
        // Fallback: use injected provider directly (some wallets require explicit eth_sendTransaction)
        try {
          // Validate factory exists on Fuji
          const factoryCode = await ethProvider.getCode(FACTORY_ADDRESS);
          if (!factoryCode || factoryCode === "0x") {
            throw new Error(
              "Factory not found on Fuji. Set NEXT_PUBLIC_FACTORY_ADDRESS_FUJI to a deployed CreatorFactory address."
            );
          }
          const from = await signer.getAddress();
          const txHash: string = await (injected as any).request?.({
            method: "eth_sendTransaction",
            params: [
              {
                from,
                to: FACTORY_ADDRESS,
                data,
                gas: gasLimitHex,
              },
            ],
          });
          receipt = await ethProvider.waitForTransaction(txHash);
        } catch (fallbackErr: any) {
          const msg =
            [
              fallbackErr?.data?.message,
              fallbackErr?.reason,
              fallbackErr?.message,
              primaryErr?.data?.message,
              primaryErr?.reason,
              primaryErr?.message,
            ].filter(Boolean)[0] || "Unable to sign the message";
          throw new Error(msg);
        }
      }
      // Try to grab the CreatorRegistered event or read the last token for caller
      let deployedAddress: string | null = null;
      if (receipt?.logs) {
        try {
          const parseIface = new ethers.Interface(factoryAbi);
          for (const l of receipt.logs) {
            try {
              const parsed = parseIface.parseLog(l);
              if (parsed?.name === "CreatorRegistered") {
                deployedAddress = parsed.args?.token as string;
            // Basic balance preflight to catch obvious issues
            try {
              const bal = await ethProvider.getBalance(signerAddr || (await signer.getAddress()));
              const min = ethers.parseEther("0.005"); // ~0.005 AVAX floor for tx cost
              if ((bal as bigint) < min) {
                throw new Error("Insufficient AVAX on Fuji to cover gas. Fund your wallet and retry.");
              }
            } catch {}
                break;
              }
            } catch {}
          }
        } catch {}
      }
      if (!deployedAddress) {
        // Fallback to reading creators mapping by counting creatorsCount - 1, omitted here for simplicity
        throw new Error("Could not get deployed token address");
      }
      setForm((f) => ({ ...f, creatorTokenAddress: deployedAddress! }));
      return deployedAddress!;
    } catch (err: any) {
      // Surface EIP-1193 errors clearly
      const msg =
        [
          err?.info?.error?.message,
          err?.error?.message,
          err?.shortMessage,
          err?.data?.message,
          err?.reason,
          err?.message,
        ].filter(Boolean)[0] || "Transaction failed";
      throw new Error(msg);
    } finally {
      setDeploying(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    setSaving(true);
    setError(null);
    try {
      const tokenAddr = await deployOrSelectToken();
      if (!tokenAddr || !ethers.isAddress(tokenAddr)) {
        throw new Error("Invalid token address");
      }
      const profile: CreatorProfile = {
        name: form.name,
        walletAddress: (address || "").toLowerCase(),
        creatorTokenAddress: tokenAddr,
        creatorTokenSymbol:
          form.creatorTokenSymbol || form.name.slice(0, 4).toUpperCase(),
        creatorTokenPriceUSD: Number(form.creatorTokenPriceUSD || 0),
        bio: form.bio || undefined,
        profileImageUrl: form.profileImageUrl || undefined,
        socialLinks: {
          twitter: form.socialTwitter || undefined,
          website: form.socialWebsite || undefined,
        },
        createdAt: form.createdAt,
      };
      await createOrUpdateCreator(profile);
      router.replace("/dashboard/creator");
    } catch (err: any) {
      setError(err?.message || "Failed to register creator");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Register as Creator</h1>
        <form className="grid gap-4 max-w-2xl" onSubmit={onSubmit}>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <label className="grid gap-1">
            <span className="text-sm">Name</span>
            <input
              className="border rounded-md px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Wallet Address</span>
            <input
              className="border rounded-md px-3 py-2 font-mono"
              value={address || ""}
              readOnly
            />
          </label>
          <div className="grid gap-2">
            <label className="grid gap-1">
              <span className="text-sm">Profile Image</span>
              <input type="file" accept="image/*" onChange={uploadImage} />
            </label>
            {uploading && (
              <div className="text-xs text-muted-foreground">Uploading…</div>
            )}
            {form.profileImageUrl && (
              <div className="flex items-center gap-3">
                <img
                  src={form.profileImageUrl}
                  alt="Profile"
                  className="h-14 w-14 rounded object-cover border"
                />
                <a
                  className="text-xs text-blue-600 underline"
                  href={form.profileImageUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open image
                </a>
              </div>
            )}
          </div>
          <label className="grid gap-1">
            <span className="text-sm">Bio</span>
            <textarea
              className="border rounded-md px-3 py-2"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm">
                Creator Token Address (if already deployed)
              </span>
              <input
                className="border rounded-md px-3 py-2 font-mono"
                value={form.creatorTokenAddress}
                onChange={(e) =>
                  setForm({ ...form, creatorTokenAddress: e.target.value })
                }
                placeholder="0xABC..."
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Creator Token Symbol</span>
              <input
                className="border rounded-md px-3 py-2"
                value={form.creatorTokenSymbol}
                onChange={(e) =>
                  setForm({ ...form, creatorTokenSymbol: e.target.value })
                }
                placeholder="JANE"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Creator Token Base Price (USD)</span>
              <input
                type="number"
                step="0.01"
                className="border rounded-md px-3 py-2"
                value={form.creatorTokenPriceUSD}
                onChange={(e) =>
                  setForm({
                    ...form,
                    creatorTokenPriceUSD: Number(e.target.value),
                  })
                }
                placeholder="0.50"
              />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm">Twitter</span>
              <input
                className="border rounded-md px-3 py-2"
                value={form.socialTwitter}
                onChange={(e) =>
                  setForm({ ...form, socialTwitter: e.target.value })
                }
                placeholder="https://twitter.com/username"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Website</span>
              <input
                className="border rounded-md px-3 py-2"
                value={form.socialWebsite}
                onChange={(e) =>
                  setForm({ ...form, socialWebsite: e.target.value })
                }
                placeholder="https://example.com"
              />
            </label>
          </div>
          <div className="text-sm text-muted-foreground">
            Created At: {form.createdAt}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              disabled={deploying}
              onClick={deployOrSelectToken}
            >
              {deploying ? "Deploying…" : "Deploy/Select Token"}
            </Button>
            <Button type="submit" disabled={saving || deploying}>
              {saving ? "Saving…" : "Register Creator"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
