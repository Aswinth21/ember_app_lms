import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";
import fs from "fs";
import path from "path";

/**
 * Load Firebase service account safely
 */
function loadServiceAccount() {
  // 1️⃣ Prefer file-based key (MOST STABLE)
  const saPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    "./secrets/serviceAccountKey.json";

  const fullPath = path.resolve(saPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(
      `Firebase service account not found at ${fullPath}`
    );
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const serviceAccount = JSON.parse(raw);

  // 🔧 CRITICAL: Fix escaped newlines if any
  if (serviceAccount.private_key) {
    serviceAccount.private_key =
      serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  return serviceAccount;
}

/**
 * Validate DB URL
 */
const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  "https://lms-db-2d3dc-default-rtdb.firebaseio.com";

if (!databaseURL) {
  throw new Error("FIREBASE_DATABASE_URL is missing");
}

/**
 * Initialize Firebase Admin (only once)
 */
if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL,
  });

  console.log("✅ Firebase Admin initialized");
}

/**
 * Exports
 */
const db = admin.database();

export { admin, db };
export default db;
