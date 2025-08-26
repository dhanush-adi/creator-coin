"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@/context/wallet-context";
import { BOOKING_REQUESTS, CREATORS, TRANSACTIONS } from "@/lib/mock-data";
import { Button, Card, Input } from "@/components/ui-kit";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function CreatorDashboard() {
  const { address } = useWallet();
  // Map connected creator address to a creator profile (mock association by index)
  const myCreator = CREATORS[0]; // For demo, first creator represents connected creator UI
  const { toast } = useToast();

  const myBookings = useMemo(
    () => BOOKING_REQUESTS.filter((b) => b.creatorId === myCreator.id),
    [myCreator.id]
  );
  const myTx = useMemo(
    () => TRANSACTIONS.filter((t) => t.creatorId === myCreator.id),
    [myCreator.id]
  );

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [required, setRequired] = useState<number>(10);
  const [fileName, setFileName] = useState("");

  return (
    <div className="grid gap-8">
      {/* Upload Content */}
      <section className="grid gap-4">
        <h3 className="font-semibold">{"Upload Content"}</h3>
        <Card className="rounded-2xl p-6 grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-1">
              <label className="text-sm font-medium">{"Title"}</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">{"Required Tokens"}</label>
              <Input
                type="number"
                value={required}
                onChange={(e) => setRequired(Number(e.target.value))}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">{"Description"}</label>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe your content..."
              className="min-h-[100px] rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">
              {"File Upload (Mock)"}
            </label>
            <Input
              type="file"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              className="rounded-xl"
            />
            {fileName && (
              <span className="text-xs text-muted-foreground">
                {"Selected: "}
                {fileName}
              </span>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              className="rounded-xl"
              onClick={() =>
                toast({
                  title: "Uploaded (Mock)",
                  description: `Title: ${
                    title || "Untitled"
                  }, Tokens: ${required}`,
                })
              }
            >
              {"Publish"}
            </Button>
          </div>
        </Card>
      </section>

      {/* Booking Requests */}
      <section className="grid gap-4">
        <h3 className="font-semibold">{"Booking Requests"}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myBookings.map((b) => (
            <Card key={b.id} className="rounded-xl p-4 grid gap-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{"Session Request"}</div>
                <Badge variant="outline" className="uppercase">
                  {b.status}
                </Badge>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground">{"From"}</div>
                <div className="font-mono truncate">{b.userAddress}</div>
              </div>
              <div className="text-sm flex gap-4">
                <div>
                  <div className="text-muted-foreground">{"Date"}</div>
                  <div>{b.date}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">{"Time"}</div>
                  <div>{b.time}</div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="rounded-lg"
                  onClick={() =>
                    toast({ title: "Accepted (Mock)", description: b.id })
                  }
                >
                  {"Accept"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg bg-transparent"
                  onClick={() =>
                    toast({ title: "Declined (Mock)", description: b.id })
                  }
                >
                  {"Decline"}
                </Button>
              </div>
            </Card>
          ))}
          {myBookings.length === 0 && (
            <p className="text-muted-foreground">{"No bookings yet."}</p>
          )}
        </div>
      </section>

      {/* Transactions */}
      <section className="grid gap-4">
        <h3 className="font-semibold">{"Transaction History"}</h3>
        <div className="w-full overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="p-3 font-medium">{"Date"}</th>
                <th className="p-3 font-medium">{"Type"}</th>
                <th className="p-3 font-medium">{"Amount"}</th>
                <th className="p-3 font-medium">{"Token"}</th>
                <th className="p-3 font-medium">{"Tx Hash"}</th>
              </tr>
            </thead>
            <tbody>
              {myTx.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-3">{t.date}</td>
                  <td className="p-3">
                    <Badge variant="secondary" className="uppercase">
                      {t.type}
                    </Badge>
                  </td>
                  <td className="p-3">{t.amount}</td>
                  <td className="p-3">{t.symbol}</td>
                  <td className="p-3 font-mono">{t.txHash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
