"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/wallet-context";
import { createOrUpdateUser, type AppUser } from "@/lib/person";
import { getFirebase } from "@/lib/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import SiteHeader from "@/components/site-header";
import { Button } from "@/components/ui-kit";
import { db, storage } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function RegisterPage() {
  const { address } = useWallet();
  const router = useRouter();
  const nowIso = useMemo(() => new Date().toISOString(), []);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    profileImageUrl: "",
    isCreator: false,
    createdAt: nowIso,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const walletAddress = address ?? "";

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

  async function onImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const who = (walletAddress || "anon").toLowerCase();
      const path = `aval-2025/${who}-${Date.now()}-${safeName}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      setForm((prev) => ({ ...prev, profileImageUrl: url }));
    } catch (err) {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!walletAddress) return;
    setError(null);
    setSaving(true);
    try {
      let parsedBalances: Record<string, number> | undefined = undefined;
      const payload: AppUser = {
        displayName: form.displayName,
        email: form.email,
        walletAddress,
        profileImageUrl: form.profileImageUrl || undefined,
        isCreator: form.isCreator,
        createdAt: form.createdAt || new Date().toISOString(),
      };
      await createOrUpdateUser(payload);
      router.push(form.isCreator ? "/register/creator" : "/dashboard/user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Register</h1>
        <form className="grid gap-4 max-w-xl" onSubmit={onSubmit}>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <label className="grid gap-1">
            <span className="text-sm">Display Name</span>
            <input
              className="border rounded-md px-3 py-2"
              value={form.displayName}
              onChange={(e) =>
                setForm({ ...form, displayName: e.target.value })
              }
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Email</span>
            <input
              type="email"
              className="border rounded-md px-3 py-2"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <div className="grid gap-2">
            <label className="grid gap-1">
              <span className="text-sm">Profile Image Upload</span>
              <input type="file" accept="image/*" onChange={onImageSelected} />
            </label>
            {uploadError && (
              <div className="text-xs text-red-600">{uploadError}</div>
            )}
            {uploading && (
              <div className="text-xs text-muted-foreground">Uploading…</div>
            )}
            {form.profileImageUrl && (
              <div className="flex items-center gap-3">
                <img
                  src={form.profileImageUrl}
                  alt="Profile preview"
                  className="h-14 w-14 rounded object-cover border"
                />
                <a
                  href={form.profileImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 underline"
                >
                  Open image
                </a>
              </div>
            )}
            <label className="grid gap-1">
              <span className="text-sm">Profile Image URL (optional)</span>
              <input
                className="border rounded-md px-3 py-2"
                value={form.profileImageUrl}
                onChange={(e) =>
                  setForm({ ...form, profileImageUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </label>
          </div>
          <label className="grid gap-1">
            <span className="text-sm">Wallet Address</span>
            <input
              className="border rounded-md px-3 py-2 font-mono"
              value={walletAddress}
              readOnly
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Created At (ISO)</span>
            <input
              className="border rounded-md px-3 py-2"
              value={form.createdAt}
              onChange={(e) => setForm({ ...form, createdAt: e.target.value })}
            />
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isCreator}
              onChange={(e) =>
                setForm({ ...form, isCreator: e.target.checked })
              }
            />
            <span>I'm a creator</span>
          </label>
          <div className="text-sm text-muted-foreground">
            Connected wallet:{" "}
            <span className="font-mono">
              {walletAddress || "Not connected"}
            </span>
          </div>
          <Button type="submit" disabled={!walletAddress || saving}>
            {saving ? "Saving…" : "Create Account"}
          </Button>
        </form>
      </main>
    </div>
  );
}
