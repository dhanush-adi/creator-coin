"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/wallet-context";

export default function DashboardIndex() {
  const { role, roleLoading, address } = useWallet();
  const router = useRouter();

  useEffect(() => {
    // If not connected, keep them here; could also redirect to home/login
    if (!address) return;
    if (roleLoading) return;
    if (role === "creator") router.push("/dashboard/creator");
    else if (role === "user") router.push("/dashboard/user");
    else router.push("/register");
  }, [role, roleLoading, address, router]);

  return (
    <div className="min-h-dvh grid place-items-center p-10 text-muted-foreground">
      <div className="space-y-2 text-center">
        <div className="text-sm">Loading your dashboard…</div>
        <div className="text-xs">Checking your role and redirecting</div>
      </div>
    </div>
  );
}
