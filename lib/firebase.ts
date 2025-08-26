"use client";

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

let cached: { app: FirebaseApp; db: Firestore } | null | undefined;

function getConfig() {
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
  // Require minimal keys for Firestore (projectId and appId are typical, but allow partial)
  if (!cfg.projectId || !cfg.apiKey || !cfg.appId) return null;
  return cfg as Required<typeof cfg>;
}

export function getFirebase(): { app: FirebaseApp; db: Firestore } | null {
  if (cached !== undefined) return cached ?? null;
  try {
    const cfg = getConfig();
    if (!cfg) {
      cached = null;
      return null;
    }
    const app = initializeApp(cfg);
    const db = getFirestore(app);
    cached = { app, db };
    return cached;
  } catch {
    cached = null;
    return null;
  }
}
