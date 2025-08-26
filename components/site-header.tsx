"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/wallet-context";
import { USERS } from "@/lib/mock-data";
import { Button, Card } from "@/components/ui-kit";
import { Modal } from "@/components/ui-kit";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import Link from "next/link";

export default function SiteHeader() {
  const { address, role, chainId, wallet, connecting, connect, disconnect } =
    useWallet();
  // Lazy import to avoid next/navigation in server components
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [locRole, setLocRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (address) {
        const docRef = doc(db, "users", address.toLowerCase());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.isCreator) {
            setLocRole("creator");
          } else {
            setLocRole("user");
          }
        } else {
          setLocRole(null);
        }
      }
    }
    fetchUserData();
  }, [address]);

  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <div className="font-semibold">
        <Link href="/">Creator Token dApp</Link>
      </div>
      <div className="font-semibold">
        <Button
          onClick={() => {
            if (locRole === "creator") {
              router.push("/dashboard/creator");
            } else if (locRole === "user") {
              router.push("/dashboard/user");
            } else {
              toast({
                title: "Not registered",
                description: "Please register to access the dashboard.",
              });
              router.push("/register");
            }
          }}
        >
          Dashboard
        </Button>
      </div>
      <div className="font-semibold">
        <Link href="/content">Content</Link>
      </div>
      <div className="flex items-center gap-3">
        {address ? (
          <>
            <span className="text-sm text-muted-foreground">
              {address.slice(0, 6)}...{address.slice(-4)} ({role ?? "guest"})
            </span>
            {wallet && (
              <Badge variant="outline" className="hidden sm:inline-flex">
                {wallet} {chainId ? `· chain ${chainId}` : ""}
              </Badge>
            )}
            <Button variant="outline" onClick={() => disconnect()}>
              Disconnect
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={async () => {
                await connect("metamask");
                router.push("/dashboard");
              }}
              disabled={connecting}
            >
              {connecting ? "Connecting…" : "Connect MetaMask"}
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await connect("core");
                router.push("/dashboard");
              }}
              disabled={connecting}
            >
              {connecting ? "Connecting…" : "Connect Core"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setOpen(true)}
              className="hidden sm:inline-flex"
            >
              Mock wallets
            </Button>
          </>
        )}
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Connect a mock wallet"
        description="Select from mocked addresses to preview role-based dashboards (dev-only)."
      >
        <div className="grid gap-3">
          {USERS.map((u) => (
            <Card
              key={u.address}
              className="p-3 flex items-center justify-between hover:shadow-md transition-shadow rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-xs">
                  {u.role === "creator" ? "🎨" : "👤"}
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {u.displayName ?? "Wallet"}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {shorten(u.address)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{u.role.toUpperCase()}</Badge>
                <Button
                  size="sm"
                  onClick={() =>
                    toast({
                      title: "Mock removed",
                      description: "Use real wallet buttons above.",
                    })
                  }
                >
                  {"Use Real Wallets Above"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Modal>
    </header>
  );
}

function shorten(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
