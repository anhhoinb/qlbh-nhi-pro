import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId =
  process.env.FIREBASE_PROJECT_ID?.trim();

const clientEmail =
  process.env.FIREBASE_CLIENT_EMAIL?.trim();

const privateKey =
  process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/\\n/g, "\n")
    .trim();

if (!projectId) {
  throw new Error(
    "Thiếu FIREBASE_PROJECT_ID trong .env.local"
  );
}

if (!clientEmail) {
  throw new Error(
    "Thiếu FIREBASE_CLIENT_EMAIL trong .env.local"
  );
}

if (!privateKey) {
  throw new Error(
    "Thiếu FIREBASE_PRIVATE_KEY trong .env.local"
  );
}

if (
  !privateKey.startsWith(
    "-----BEGIN PRIVATE KEY-----"
  ) ||
  !privateKey.endsWith(
    "-----END PRIVATE KEY-----"
  )
) {
  throw new Error(
    "FIREBASE_PRIVATE_KEY sai định dạng"
  );
}

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);