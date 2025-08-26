"use client";

import { useMemo } from "react";
import { useWallet } from "@/context/wallet-context";
import { BALANCES, CONTENT, PURCHASES } from "@/lib/mock-data";
import { Button, Card } from "@/components/ui-kit";
import Link from "next/link";

export default function UserDashboard() {
  const { address } = useWallet();
  const balances = useMemo(
    () => BALANCES.filter((b) => b.address === address),
    [address]
  );
  const history = useMemo(
    () => PURCHASES.filter((p) => p.address === address),
    [address]
  );

  return (
    <div className="grid gap-8">
      {/* Wallet */}
      <Card className="rounded-2xl p-6">
        <h2 className="font-semibold mb-2">{"Connected Wallet"}</h2>
        <p className="font-mono text-sm text-muted-foreground break-all">
          {address ?? "Not connected"}
        </p>
      </Card>

      {/* Token Balances */}
      <section className="grid gap-4">
        <h3 className="font-semibold">{"Token Balances"}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {balances.map((b) => (
            <Card
              key={b.symbol}
              className="rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <div className="text-sm text-muted-foreground">{"Symbol"}</div>
                <div className="font-medium">{b.symbol}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">{"Amount"}</div>
                <div className="font-medium">{b.amount}</div>
              </div>
            </Card>
          ))}
          {balances.length === 0 && (
            <p className="text-muted-foreground">{"No balances found."}</p>
          )}
        </div>
      </section>

      {/* Purchase History */}
      <section className="grid gap-4">
        <h3 className="font-semibold">{"Purchased Content"}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {history.map((h) => {
            const item = CONTENT.find((c) => c.id === h.contentId);
            if (!item) return null;
            return (
              <Card key={h.txHash} className="rounded-xl overflow-hidden">
                <img
                  src={item.thumbnailUrl || "/placeholder.svg"}
                  alt={`${item.title} thumbnail`}
                  className="w-full aspect-video object-cover"
                />
                <div className="p-4">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {"Purchased: "}
                    {h.date}
                  </div>
                  <div className="mt-3">
                    <Link href={`/content/${item.id}`}>
                      <Button variant="secondary" className="w-full rounded-xl">
                        {"View Content"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
          {history.length === 0 && (
            <p className="text-muted-foreground">{"No purchases yet."}</p>
          )}
        </div>
      </section>
    </div>
  );
}
