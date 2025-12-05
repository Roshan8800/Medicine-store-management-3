import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser, Auth } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, Timestamp, Firestore, QuerySnapshot, DocumentData } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "binayak-pharmacy-c4a0f.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "binayak-pharmacy-c4a0f",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "binayak-pharmacy-c4a0f.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "",
};

const hasValidConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  if (hasValidConfig) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
} catch (error) {
  console.warn("Firebase initialization failed:", error);
}

export {
  app,
  auth,
  db,
  storage,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
};

export type { FirebaseUser };

export const isFirebaseConfigured = hasValidConfig;

export const firebaseCollections = {
  medicines: "medicines",
  batches: "batches",
  invoices: "invoices",
  customers: "customers",
  suppliers: "suppliers",
  categories: "categories",
  users: "users",
  notifications: "notifications",
  backups: "backups",
  analytics: "analytics",
};

export async function syncToFirebase(collectionName: string, data: Record<string, unknown>[]) {
  if (!db) {
    console.warn("Firebase not configured - skipping sync");
    return;
  }
  
  const colRef = collection(db, collectionName);
  
  for (const item of data) {
    const docRef = doc(colRef, item.id as string);
    await setDoc(docRef, {
      ...item,
      syncedAt: Timestamp.now(),
    }, { merge: true });
  }
}

export function subscribeToCollection(
  collectionName: string,
  callback: (data: Record<string, unknown>[]) => void,
  constraints?: { field: string; operator: "==" | "!=" | ">" | "<"; value: unknown }[]
) {
  if (!db) {
    console.warn("Firebase not configured - skipping subscription");
    return () => {};
  }
  
  let q = collection(db, collectionName);
  
  if (constraints) {
    const queryConstraints = constraints.map(c => where(c.field, c.operator, c.value));
    q = query(q, ...queryConstraints) as ReturnType<typeof collection>;
  }
  
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const data = snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    }));
    callback(data);
  });
}
