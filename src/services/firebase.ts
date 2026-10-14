import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signOut as fbSignOut, User } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId.
// Using experimentalForceLongPolling to ensure reliable connectivity inside sandboxed web/iframe environments.
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);

/**
 * Signs the user into Firebase Authentication using the Custom Token issued by the server.
 * Returns the authenticated User or null if bridge sign-in fails or is not supported.
 */
export async function signInWithFirebaseCustomToken(customToken: string): Promise<User | null> {
  if (!customToken) return null;
  try {
    const userCredential = await signInWithCustomToken(auth, customToken);
    console.info(`[FirebaseAuthBridge] Authenticated into Firebase with UID: ${userCredential.user.uid}`);
    return userCredential.user;
  } catch (err: any) {
    console.warn('[FirebaseAuthBridge] Notice: Firebase Custom Token sign-in skipped/failed:', err?.message || err);
    return null;
  }
}

/**
 * Signs out the user from Firebase Authentication.
 */
export async function signOutFromFirebase(): Promise<void> {
  try {
    if (auth.currentUser) {
      await fbSignOut(auth);
      console.info('[FirebaseAuthBridge] Signed out from Firebase.');
    }
  } catch (err) {
    console.warn('[FirebaseAuthBridge] Error signing out from Firebase:', err);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as required by skill instructions
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Operating in offline mode or awaiting network readiness.');
    }
  }
}
testConnection();
