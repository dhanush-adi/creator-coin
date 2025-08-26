"use client";

import { useState } from "react";
import { Button } from "@/components/ui-kit";
import { useWallet } from "@/context/wallet-context";
import { getProvider, ensureFuji } from "@/lib/evm";
import TokenAbi from "@/abi/CreatorToken.json";
import { ethers } from "ethers";

type Props = {
  requiredTokens: number;
  creatorName?: string;
  creatorSymbol?: string;
  initialTokenAddress?: string;
};

export default function BuyContent(props: Props) {
  const { address, wallet } = useWallet();
  const [tokenAddr, setTokenAddr] = useState(props.initialTokenAddress || "");
  const [avaxAmount, setAvaxAmount] = useState<string>("");
  const [minTokens, setMinTokens] = useState<number>(props.requiredTokens || 0);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function onBuy() {
    setError(null);
    setTxHash(null);
    if (!wallet) {
      setError("Connect your wallet first");
      return;
    }
    try {
      // Provider and network
      const injected = getProvider(wallet);
      if (!injected) throw new Error("No wallet provider found");
      const ethProvider = new ethers.BrowserProvider(injected as any);
      try {
        await (injected as any).request?.({ method: "eth_requestAccounts" });
      } catch {}
      try {
        await ensureFuji(injected as any);
      } catch {}
      const net = await ethProvider.getNetwork();
      if (Number(net?.chainId?.toString?.() || 0) !== 43113) {
        throw new Error("Switch to Avalanche Fuji (43113)");
      }

      // Validate token address
      if (!ethers.isAddress(tokenAddr))
        throw new Error("Enter a valid token address");
      const tokenAddress = ethers.getAddress(tokenAddr);
      const code = await ethProvider.getCode(tokenAddress);
      if (!code || code === "0x")
        throw new Error("No contract at the token address on Fuji");

      // Prepare call data
      const iface = new ethers.Interface((TokenAbi as any).abi ?? TokenAbi);
      const min = BigInt(
        Math.max(0, Number.isFinite(minTokens) ? minTokens : 0)
      );
      const data = iface.encodeFunctionData("buyTokens", [min]);

      // Value (wei)
      const valueWei = ethers.parseEther(String(Number(avaxAmount || 0)));
      if (valueWei <= BigInt(0)) throw new Error("Enter AVAX amount > 0");

      const signer = await ethProvider.getSigner();
      // Estimate gas
      let gasHex: string | undefined;
      try {
        const est = await signer.estimateGas({
          to: tokenAddress,
          data,
          value: valueWei,
        });
        gasHex = ethers.toBeHex((est as bigint) + BigInt(100000));
      } catch {
        gasHex = ethers.toBeHex(1_000_000);
      }

      setBuying(true);
      let receipt: ethers.TransactionReceipt | null = null;
      try {
        const tx = await signer.sendTransaction({
          to: tokenAddress,
          data,
          value: valueWei,
          gasLimit: gasHex,
        });
        receipt = await tx.wait();
      } catch (primaryErr: any) {
        try {
          const from = await signer.getAddress();
          const txHashLocal: string = await (injected as any).request?.({
            method: "eth_sendTransaction",
            params: [
              {
                from,
                to: tokenAddress,
                data,
                gas: gasHex,
                value: ethers.toBeHex(valueWei),
              },
            ],
          });
          receipt = await ethProvider.waitForTransaction(txHashLocal);
        } catch (fallbackErr: any) {
          const msg =
            [
              fallbackErr?.data?.message,
              fallbackErr?.reason,
              fallbackErr?.message,
              primaryErr?.data?.message,
              primaryErr?.reason,
              primaryErr?.message,
            ].filter(Boolean)[0] || "Transaction failed";
          throw new Error(msg);
        }
      }
      setTxHash(receipt?.hash || null);
    } catch (e: any) {
      setError(e?.message || "Failed to buy tokens");
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="grid gap-3 p-4 border rounded-xl">
      <div className="text-sm">
        Buy access tokens{" "}
        {props.creatorSymbol ? `(${props.creatorSymbol})` : ""}
      </div>
      <label className="grid gap-1">
        <span className="text-xs text-muted-foreground">
          Creator Token Address (Fuji)
        </span>
        <input
          className="border rounded-md px-3 py-2 font-mono"
          placeholder="0x..."
          value={tokenAddr}
          onChange={(e) => setTokenAddr(e.target.value)}
        />
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">AVAX to spend</span>
          <input
            className="border rounded-md px-3 py-2"
            type="number"
            min="0"
            step="0.001"
            value={avaxAmount}
            onChange={(e) => setAvaxAmount(e.target.value)}
            placeholder="0.25"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">
            Minimum tokens (slippage)
          </span>
          <input
            className="border rounded-md px-3 py-2"
            type="number"
            min={0}
            value={minTokens}
            onChange={(e) => setMinTokens(Number(e.target.value))}
          />
        </label>
      </div>
      {props.requiredTokens > 0 && (
        <div className="text-xs text-muted-foreground">
          Content requires at least {props.requiredTokens} tokens.
        </div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {txHash && (
        <a
          className="text-xs text-blue-600 underline"
          href={`https://testnet.snowtrace.io/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          View on Snowtrace
        </a>
      )}
      <div>
        <Button onClick={onBuy} disabled={buying}>
          {buying
            ? "Processing…"
            : address
            ? "Buy Tokens"
            : "Connect wallet to buy"}
        </Button>
      </div>
    </div>
  );
}
