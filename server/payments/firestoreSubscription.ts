import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn('[Firestore Server] Could not load firebase-applet-config.json:', e);
}

let firestoreInstance: any = null;

function getBackendFirestore() {
  if (!firestoreInstance && firebaseConfig) {
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig, 'server_admin') : getApp('server_admin');
      firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
    } catch (err) {
      console.warn('[Firestore Server] Error initializing client Firestore instance on server:', err);
    }
  }
  return firestoreInstance;
}

export interface SubscriptionUpdatePayload {
  userId: string;
  userEmail?: string;
  tier: 'PRO' | 'ULTIMATE' | 'INSTITUTIONAL';
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  gateway: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  activatedAt: string;
  expiresAt: string;
}

/**
 * Update user subscription status in Firestore database
 * Ensures user gets 'PRO' access instantly and permanently.
 */
export async function updateUserFirestoreSubscription(data: SubscriptionUpdatePayload): Promise<boolean> {
  const {
    userId,
    userEmail,
    tier,
    paymentId,
    orderId,
    amount,
    currency,
    gateway,
    status,
    activatedAt,
    expiresAt,
  } = data;

  const targetTier = (tier === 'INSTITUTIONAL' || tier === 'ULTIMATE') ? 'ULTIMATE' : 'PRO';
  const experienceLevel = 'Pro / Institutional';

  const updateDocData = {
    id: userId,
    email: userEmail || 'trader@tradeos.ai',
    subscriptionStatus: targetTier,
    subscriptionTier: targetTier,
    tier: targetTier,
    isPro: true,
    experienceLevel,
    updatedAt: new Date().toISOString(),
    subscription: {
      status,
      tier: targetTier,
      gateway,
      paymentId,
      orderId,
      amount,
      currency,
      activatedAt,
      expiresAt,
      updatedAt: new Date().toISOString(),
    },
  };

  let success = false;

  // 1. Try Firebase Firestore SDK
  try {
    const db = getBackendFirestore();
    if (db) {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, updateDocData, { merge: true });
      
      // Also write to subscriptions audit collection
      const subRef = doc(db, 'subscriptions', paymentId || orderId || `sub_${Date.now()}`);
      await setDoc(subRef, {
        userId,
        userEmail,
        ...updateDocData.subscription,
      }, { merge: true });

      // Update system state
      const stateRef = doc(db, 'system_state', `user_${userId}_subscription`);
      await setDoc(stateRef, updateDocData, { merge: true });

      console.log(`[Firestore Server] Successfully upgraded Firestore subscription for user ${userId} to ${targetTier}!`);
      success = true;
    }
  } catch (sdkError: any) {
    console.warn('[Firestore Server SDK Notice]:', sdkError?.message || sdkError);
  }

  // 2. Fallback to direct Firestore REST API (works unconditionally without GCP service account credentials)
  if (!success && firebaseConfig?.projectId && firebaseConfig?.apiKey) {
    try {
      const projectId = firebaseConfig.projectId;
      const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
      const apiKey = firebaseConfig.apiKey;
      const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users/${userId}?key=${apiKey}&updateMask.fieldPaths=subscriptionStatus&updateMask.fieldPaths=subscriptionTier&updateMask.fieldPaths=tier&updateMask.fieldPaths=isPro&updateMask.fieldPaths=experienceLevel&updateMask.fieldPaths=updatedAt`;

      const restBody = {
        fields: {
          subscriptionStatus: { stringValue: targetTier },
          subscriptionTier: { stringValue: targetTier },
          tier: { stringValue: targetTier },
          isPro: { booleanValue: true },
          experienceLevel: { stringValue: experienceLevel },
          updatedAt: { stringValue: new Date().toISOString() },
        },
      };

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restBody),
      });

      if (res.ok) {
        console.log(`[Firestore REST API] User ${userId} upgraded to ${targetTier} via REST endpoint.`);
        success = true;
      }
    } catch (restErr: any) {
      console.warn('[Firestore REST API Notice]:', restErr?.message || restErr);
    }
  }

  return success;
}
