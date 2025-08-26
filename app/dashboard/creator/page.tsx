"use client";
import SiteHeader from "@/components/site-header";
import CreatorDashboard from "@/components/creator-dashboard";
import { useWallet } from "@/context/wallet-context";
import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter } from "next/navigation";

export default function CreatorDashboardPage() {
  const { address, role, chainId, wallet, connecting, connect, disconnect } =
    useWallet();

  const router = useRouter();

  //   useEffect(() => {
  //     async function fetchUserData() {
  //       if (address) {
  //         const docRef = doc(db, "users", address);
  //         const docSnap = await getDoc(docRef);
  //         if (docSnap.exists()) {
  //           const userData = docSnap.data();
  //           if (userData.isCreator) {
  //             router.push("/dashboard/creator");
  //           } else {
  //             router.push("/dashboard/user");
  //           }
  //         } else {
  //           router.push("/register");
  //         }
  //       }
  //     }
  //     fetchUserData();
  //   }, [address]);
  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{"Creator Dashboard"}</h1>
        <CreatorDashboard />
      </main>
    </div>
  );
}
