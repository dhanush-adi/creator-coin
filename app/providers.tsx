"use client"

import type React from "react"

import { WalletProvider } from "@/context/wallet-context"

export default function Providers({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>
}
