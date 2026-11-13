/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { UserProfile } from '../../types';

const ADMIN_EMAIL = 'sudhanshujangid143@gmail.com';

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const user = cred.user;
    return await syncUserProfile(user);
  } catch (err) {
    console.error('Google Sign In Error:', err);
    throw err;
  }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Server-backed admin check: verifies against Firestore `/admins/{uid}`
 * and bootstraps the admin registry doc when the verified primary owner signs in.
 */
export async function verifyServerAdminPermission(firebaseUser: FirebaseUser): Promise<boolean> {
  if (!firebaseUser || !firebaseUser.uid) return false;

  const isVerifiedBootstrapOwner =
    firebaseUser.email?.toLowerCase() === ADMIN_EMAIL && firebaseUser.emailVerified === true;

  try {
    const adminDocRef = doc(db, 'admins', firebaseUser.uid);
    const adminSnap = await getDoc(adminDocRef);

    if (adminSnap.exists()) {
      return true;
    }

    // Bootstrap primary owner into server-backed /admins registry (enforced by firestore.rules)
    if (isVerifiedBootstrapOwner) {
      await setDoc(adminDocRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Administrator',
        grantedAt: new Date().toISOString(),
      });
      return true;
    }

    return false;
  } catch (err) {
    // Fallback to verified ID token claim only if network/offline while already emailVerified
    return isVerifiedBootstrapOwner;
  }
}

export function isUserAdmin(user: UserProfile | null): boolean {
  if (!user) return false;
  return user.isServerVerifiedAdmin === true;
}

export async function syncUserProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const serverAdmin = await verifyServerAdminPermission(firebaseUser);

  try {
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as UserProfile;
      return {
        ...data,
        role: serverAdmin ? 'admin' : 'customer',
        isServerVerifiedAdmin: serverAdmin,
      };
    } else {
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Valued Client',
        email: firebaseUser.email || '',
        phoneNumber: firebaseUser.phoneNumber || '',
        photoURL: firebaseUser.photoURL || '',
        role: serverAdmin ? 'admin' : 'customer',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, newProfile);
      return {
        ...newProfile,
        isServerVerifiedAdmin: serverAdmin,
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
    return {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || 'Client',
      email: firebaseUser.email || '',
      role: serverAdmin ? 'admin' : 'customer',
      isServerVerifiedAdmin: serverAdmin,
    };
  }
}

export function subscribeToAuthChanges(
  callback: (profile: UserProfile | null, rawUser: FirebaseUser | null) => void
) {
  return firebaseOnAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const profile = await syncUserProfile(user);
        callback(profile, user);
      } catch {
        const serverAdmin = await verifyServerAdminPermission(user);
        callback(
          {
            uid: user.uid,
            displayName: user.displayName || 'Client',
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            role: serverAdmin ? 'admin' : 'customer',
            isServerVerifiedAdmin: serverAdmin,
          },
          user
        );
      }
    } else {
      callback(null, null);
    }
  });
}
