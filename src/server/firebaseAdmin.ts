import { initializeApp, getApps, getApp, cert, applicationDefault } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { Auth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let adminAppInstance: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminFirestoreInstance: Firestore | null = null;

/**
 * Deterministically generates a stable, secure Firebase UID from the user's username.
 * - Does not expose raw phone numbers or national IDs.
 * - Consistent across multiple logins for the exact same user.
 * - Non-modifiable from client.
 */
export function generateDeterministicFirebaseUid(username: string): string {
  const normalized = String(username || '').trim().toLowerCase();
  const hash = crypto
    .createHash('sha256')
    .update(`urmia_engineer_salt:${normalized}`)
    .digest('hex')
    .substring(0, 24);
  return `eng_${hash}`;
}

/**
 * Initializes Firebase Admin SDK using secure server-side environment variables
 * or Application Default Credentials.
 * Guaranteed single app initialization using getApps() / getApp().
 */
export function initFirebaseAdmin(): Auth | null {
  if (adminAuthInstance) {
    return adminAuthInstance;
  }

  try {
    let projectId = 'core-trilogy-psmzh';
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.projectId) projectId = config.projectId;
      }
    } catch {}

    const existingApps = getApps();
    if (existingApps.length > 0) {
      adminAppInstance = getApp();
    } else {
      const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmailEnv = process.env.FIREBASE_CLIENT_EMAIL;

      let credentialOption;

      if (serviceAccountEnv) {
        try {
          if (serviceAccountEnv.trim().startsWith('{')) {
            credentialOption = cert(JSON.parse(serviceAccountEnv));
          } else if (fs.existsSync(serviceAccountEnv)) {
            credentialOption = cert(serviceAccountEnv);
          }
        } catch (e) {
          console.warn('[FirebaseAdmin] Failed parsing FIREBASE_SERVICE_ACCOUNT_KEY:', e);
        }
      } else if (privateKeyEnv && clientEmailEnv) {
        credentialOption = cert({
          projectId,
          clientEmail: clientEmailEnv,
          privateKey: privateKeyEnv.replace(/\\n/g, '\n'),
        });
      }

      if (credentialOption) {
        adminAppInstance = initializeApp({
          credential: credentialOption,
          projectId,
        });
        console.log(`[FirebaseAdmin] Initialized with Service Account for project: ${projectId}`);
      } else {
        try {
          adminAppInstance = initializeApp({
            credential: applicationDefault(),
            projectId,
          });
        } catch {
          adminAppInstance = initializeApp({
            projectId,
          });
        }
        console.log(`[FirebaseAdmin] Initialized with Application Default Credentials for project: ${projectId}`);
      }
    }

    adminAuthInstance = getAuth(adminAppInstance);
    return adminAuthInstance;
  } catch (err: any) {
    console.warn('[FirebaseAdmin] Initialization warning:', err?.message || err);
    return null;
  }
}

/**
 * Checks whether a valid Service Account key or credentials are provided in the environment.
 */
export function hasServiceAccountKeyConfigured(): boolean {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmailEnv = process.env.FIREBASE_CLIENT_EMAIL;

  if (serviceAccountEnv && serviceAccountEnv.trim().length > 10) {
    return true;
  }
  if (privateKeyEnv && clientEmailEnv && privateKeyEnv.trim().length > 10) {
    return true;
  }
  return false;
}

/**
 * Creates a Firebase Custom Token for a successfully authenticated user.
 * - Adds admin custom claim if user is admin.
 * - Handles errors gracefully if signing keys are not yet configured in env.
 */
export async function createFirebaseCustomTokenForUser(
  username: string,
  isAdmin: boolean
): Promise<{ customToken: string | null; uid: string }> {
  const uid = generateDeterministicFirebaseUid(username);

  // Minting custom tokens strictly requires a Service Account Private Key.
  // When running with Application Default Credentials (Cloud Run Sandbox) without FIREBASE_SERVICE_ACCOUNT_KEY,
  // skip calling createCustomToken to prevent 'iam.serviceAccounts.signBlob' permission errors.
  if (!hasServiceAccountKeyConfigured()) {
    return { customToken: null, uid };
  }

  const auth = initFirebaseAdmin();
  if (!auth) {
    return { customToken: null, uid };
  }

  const customClaims: Record<string, any> = {
    role: isAdmin ? 'admin' : 'user',
  };

  if (isAdmin) {
    customClaims.admin = true;
  }

  try {
    const customToken = await auth.createCustomToken(uid, customClaims);
    return { customToken, uid };
  } catch {
    return { customToken: null, uid };
  }
}

export function getAdminFirestore(): Firestore | null {
  initFirebaseAdmin();
  if (adminFirestoreInstance) return adminFirestoreInstance;
  try {
    const apps = getApps();
    if (apps.length > 0) {
      let databaseId = 'ai-studio-8b8632d7-f479-4149-9358-9eb00171cc54';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          if (config.firestoreDatabaseId) databaseId = config.firestoreDatabaseId;
        }
      } catch {}

      adminFirestoreInstance = getFirestore(getApp(), databaseId);
      try {
        adminFirestoreInstance.settings({ ignoreUndefinedProperties: true });
      } catch (settingsErr) {
        // settings already configured or initialized
      }
      return adminFirestoreInstance;
    }
  } catch (err) {
    console.warn('[FirebaseAdmin] Firestore init notice:', err);
  }
  return null;
}

/**
 * Sanitizes an object before writing to Firestore:
 * - Recursively removes any undefined properties
 * - Preserves nulls, arrays, numbers, strings, booleans, and dates
 */
export function sanitizeFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  if (!data || typeof data !== 'object') return data;
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeFirestoreData(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Server-side Admin Approval:
 * Updates an artisan or vendor's status to 'approved' and verifiedByAssociation to true in Firestore.
 */
export async function approveArtisanServerSide(
  artisanId: string
): Promise<{ success: boolean; error?: string }> {
  const fs = getAdminFirestore();
  if (!fs) {
    return { success: false, error: 'Firebase Admin Firestore not initialized' };
  }
  try {
    const nowFa = new Intl.DateTimeFormat('fa-IR').format(new Date());
    await fs.collection('artisans').doc(artisanId).update({
      status: 'approved',
      verifiedByAssociation: true,
      approvedAt: nowFa,
    });
    return { success: true };
  } catch (err: any) {
    console.warn(`[FirebaseAdmin] Approve notice for ${artisanId} in Firestore:`, err?.message || err);
    return { success: false, error: err?.message || 'Failed to update artisan in Firestore' };
  }
}

/**
 * Concurrency locks per artisanId to avoid race conditions during rapid review updates
 */
const artisanRatingLocks = new Map<string, Promise<any>>();

/**
 * Server-authoritative rating recalculation:
 * 1. Reads committed real reviews directly from Firestore subcollection.
 * 2. Computes true mathematical average and count.
 * 3. When 0 reviews remain, sets rating = 0 and ratingCount = 0.
 * 4. Completely ignores any client-supplied rating numbers.
 * 5. Concurrency-safe against race conditions via per-artisan execution queue.
 */
export async function recalculateAndSyncArtisanRating(
  artisanId: string
): Promise<{ rating: number; ratingCount: number }> {
  const previousLock = artisanRatingLocks.get(artisanId) || Promise.resolve();

  const currentOp = previousLock
    .catch(() => {})
    .then(async () => {
      const fs = getAdminFirestore();
      if (!fs) {
        console.warn('[FirebaseAdmin] Firestore instance unavailable for rating sync.');
        return { rating: 0, ratingCount: 0 };
      }

      try {
        // Read actual committed reviews from Firestore
        const reviewsSnapshot = await fs
          .collection('artisans')
          .doc(artisanId)
          .collection('reviews')
          .get();

        const validScores: number[] = [];
        reviewsSnapshot.forEach((doc) => {
          const data = doc.data();
          const score = Number(data?.score);
          if (!isNaN(score) && score >= 1 && score <= 5) {
            validScores.push(score);
          }
        });

        const ratingCount = validScores.length;
        let rating = 0;
        if (ratingCount > 0) {
          const sum = validScores.reduce((acc, curr) => acc + curr, 0);
          rating = parseFloat((sum / ratingCount).toFixed(1));
        } else {
          rating = 0;
        }

        // Commit true values to the parent document via Admin SDK
        await fs.collection('artisans').doc(artisanId).update({
          rating,
          ratingCount,
        });

        return { rating, ratingCount };
      } catch (err: any) {
        console.warn(`[FirebaseAdmin] Rating recalculation notice for ${artisanId}:`, err?.message || err);
        return { rating: 0, ratingCount: 0 };
      }
    });

  artisanRatingLocks.set(artisanId, currentOp);
  return currentOp;
}

/**
 * Updates an artisan's rating and ratingCount securely from the server
 */
export async function updateArtisanRatingServerSide(
  artisanId: string,
  newRating: number,
  newRatingCount: number
): Promise<void> {
  const fs = getAdminFirestore();
  if (!fs) return;
  try {
    await fs.collection('artisans').doc(artisanId).update({
      rating: newRating,
      ratingCount: newRatingCount,
    });
  } catch (e: any) {
    console.warn(`[FirebaseAdmin] Notice updating artisan rating in Firestore:`, e?.message || e);
  }
}
