import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK
// This bypasses Firestore security rules and is used for server-side operations

let adminApp: App | null = null;
let adminFirestore: Firestore | null = null;

function formatPrivateKey(key: string): string {
  // Handle different formats of the private key
  // 1. If it has literal \n strings, replace them with actual newlines
  // 2. If it's wrapped in quotes, remove them
  // 3. Handle escaped newlines from JSON

  let formattedKey = key;

  // Remove surrounding quotes if present
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.slice(1, -1);
  }
  if (formattedKey.startsWith("'") && formattedKey.endsWith("'")) {
    formattedKey = formattedKey.slice(1, -1);
  }

  // Replace literal \n with actual newlines
  formattedKey = formattedKey.replace(/\\n/g, "\n");

  // Also handle double-escaped newlines (\\n -> \n)
  formattedKey = formattedKey.replace(/\\\\n/g, "\n");

  return formattedKey;
}

function getFirebaseAdmin(): App {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  console.log("[Firebase Admin] Initializing...");

  // Option 1: Use service account JSON (recommended for production)
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (serviceAccountBase64) {
    console.log("[Firebase Admin] Using FIREBASE_SERVICE_ACCOUNT_BASE64");
    try {
      const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountBase64, "base64").toString("utf8")
      );
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("[Firebase Admin] Initialized with base64 service account");
      return adminApp;
    } catch (error) {
      console.error(
        "[Firebase Admin] Failed to parse base64 service account:",
        error
      );
      throw error;
    }
  }

  // Option 2: Use individual environment variables
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  console.log("[Firebase Admin] Checking individual env vars:", {
    hasProjectId: !!projectId,
    hasClientEmail: !!clientEmail,
    hasPrivateKey: !!privateKeyRaw,
    privateKeyLength: privateKeyRaw?.length || 0,
  });

  if (projectId && clientEmail && privateKeyRaw) {
    console.log("[Firebase Admin] Using individual env vars");
    try {
      const privateKey = formatPrivateKey(privateKeyRaw);

      // Debug: Check if the key looks valid
      console.log(
        "[Firebase Admin] Private key starts with:",
        privateKey.substring(0, 40)
      );
      console.log(
        "[Firebase Admin] Private key ends with:",
        privateKey.substring(privateKey.length - 40)
      );

      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("[Firebase Admin] Initialized successfully");
      return adminApp;
    } catch (error) {
      console.error("[Firebase Admin] Failed to initialize:", error);
      throw error;
    }
  }

  throw new Error(
    "[Firebase Admin] No valid credentials found. Please set:\n" +
      "- FIREBASE_SERVICE_ACCOUNT_BASE64 (base64 encoded service account JSON)\n" +
      "OR all of these:\n" +
      "- FIREBASE_PROJECT_ID\n" +
      "- FIREBASE_CLIENT_EMAIL\n" +
      "- FIREBASE_PRIVATE_KEY"
  );
}

export function getAdminDb(): Firestore {
  if (adminFirestore) {
    return adminFirestore;
  }
  const app = getFirebaseAdmin();
  adminFirestore = getFirestore(app);
  return adminFirestore;
}

// Lazy initialization - only initialize when first accessed
export const adminDb = {
  collection: (name: string) => getAdminDb().collection(name),
};

// Auth instance for token verification
let adminAuthInstance: Auth | null = null;

export function getAdminAuth(): Auth {
  if (adminAuthInstance) {
    return adminAuthInstance;
  }
  const app = getFirebaseAdmin();
  adminAuthInstance = getAuth(app);
  return adminAuthInstance;
}

export const adminAuth = {
  verifyIdToken: (token: string) => getAdminAuth().verifyIdToken(token),
  verifySessionCookie: (cookie: string, checkRevoked?: boolean) =>
    getAdminAuth().verifySessionCookie(cookie, checkRevoked),
  createSessionCookie: (idToken: string, options: { expiresIn: number }) =>
    getAdminAuth().createSessionCookie(idToken, options),
  getUser: (uid: string) => getAdminAuth().getUser(uid),
};
