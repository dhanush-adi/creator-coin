"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import { db } from "@/firebase";

export type PersonRole = "creator" | "user";

export type AppUser = {
  displayName: string;
  email: string;
  walletAddress: string;
  profileImageUrl?: string;
  isCreator: boolean;
  createdAt: string; // ISO string
  lastLogin?: string; // ISO string
  tokenBalances?: Record<string, number>;
};

export async function fetchPersonRole(
  address: string
): Promise<PersonRole | null> {
  const fb = getFirebase();
  if (!fb) return null;
  try {
    const id = address.toLowerCase();
    // Try by doc id first
    const byIdRef = doc(fb.db, "users", id);
    const byIdSnap = await getDoc(byIdRef);
    if (byIdSnap.exists()) {
      const data = byIdSnap.data() as Partial<AppUser> & {
        isCreator?: boolean;
      };
      return data.isCreator ? "creator" : "user";
    }
    // Fall back to query by walletAddress field (case-sensitive match)
    const usersCol = collection(fb.db, "users");
    const q1 = query(usersCol, where("walletAddress", "==", address), limit(1));
    const rs1 = await getDocs(q1);
    if (!rs1.empty) {
      const data = rs1.docs[0].data() as Partial<AppUser> & {
        isCreator?: boolean;
      };
      return data.isCreator ? "creator" : "user";
    }
    // Try lowercase walletAddress as a fallback
    const q2 = query(
      usersCol,
      where("walletAddress", "==", address.toLowerCase()),
      limit(1)
    );
    const rs2 = await getDocs(q2);
    if (!rs2.empty) {
      const data = rs2.docs[0].data() as Partial<AppUser> & {
        isCreator?: boolean;
      };
      return data.isCreator ? "creator" : "user";
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch user role", e);
    return null;
  }
}

export async function getUserByAddress(
  address: string
): Promise<AppUser | null> {
  const fb = getFirebase();
  if (!fb) return null;
  try {
    const id = address.toLowerCase();
    const byIdRef = doc(fb.db, "users", id);
    const byIdSnap = await getDoc(byIdRef);
    if (byIdSnap.exists()) return byIdSnap.data() as AppUser;
    const usersCol = collection(fb.db, "users");
    const q1 = query(usersCol, where("walletAddress", "==", address), limit(1));
    const rs1 = await getDocs(q1);
    if (!rs1.empty) return rs1.docs[0].data() as AppUser;
    const q2 = query(
      usersCol,
      where("walletAddress", "==", address.toLowerCase()),
      limit(1)
    );
    const rs2 = await getDocs(q2);
    if (!rs2.empty) return rs2.docs[0].data() as AppUser;
    return null;
  } catch (e) {
    console.error("Failed to fetch user", e);
    return null;
  }
}

export async function createOrUpdateUser(user: AppUser): Promise<void> {
  const id = user.walletAddress.toLowerCase();
  const ref = doc(db, "users", id);
  await setDoc(ref, user, { merge: true });
}

export async function touchLastLogin(address: string): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  const now = new Date().toISOString();
  // Try update by doc id
  const id = address.toLowerCase();
  const byIdRef = doc(fb.db, "users", id);
  const byIdSnap = await getDoc(byIdRef);
  if (byIdSnap.exists()) {
    await setDoc(byIdRef, { lastLogin: now }, { merge: true });
    return;
  }
  // Fallback: find by walletAddress field
  const usersCol = collection(fb.db, "users");
  const q1 = query(usersCol, where("walletAddress", "==", address), limit(1));
  const rs1 = await getDocs(q1);
  if (!rs1.empty) {
    const docId = rs1.docs[0].id;
    await setDoc(
      doc(fb.db, "users", docId),
      { lastLogin: now },
      { merge: true }
    );
    return;
  }
  const q2 = query(
    usersCol,
    where("walletAddress", "==", address.toLowerCase()),
    limit(1)
  );
  const rs2 = await getDocs(q2);
  if (!rs2.empty) {
    const docId = rs2.docs[0].id;
    await setDoc(
      doc(fb.db, "users", docId),
      { lastLogin: now },
      { merge: true }
    );
  }
}
