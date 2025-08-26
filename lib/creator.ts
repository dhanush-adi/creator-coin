"use client";

import { doc, setDoc } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";

export type CreatorProfile = {
  name: string;
  walletAddress: string;
  creatorTokenAddress: string;
  creatorTokenSymbol: string;
  creatorTokenPriceUSD: number;
  bio?: string;
  profileImageUrl?: string;
  socialLinks?: {
    twitter?: string;
    website?: string;
  };
  createdAt: string; // ISO
};

export async function createOrUpdateCreator(
  profile: CreatorProfile
): Promise<void> {
  const fb = getFirebase();
  if (!fb) throw new Error("Firebase not configured");
  const id = profile.walletAddress.toLowerCase();
  const ref = doc(fb.db, "creators", id);
  await setDoc(ref, profile, { merge: true });
}
