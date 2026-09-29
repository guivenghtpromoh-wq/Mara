import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  handleFirestoreError,
  OperationType,
  FirebaseUser
} from '../lib/firebase';
import { UserProfile, Store } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  profile: UserProfile | null;
  sellerStore: Store | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  createAccount: (email: string, pass: string, firstName: string, lastName: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSellerStore: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sellerStore, setSellerStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const snap = await getDoc(doc(db, 'profiles', uid));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (err) {
      console.error('Failed to load profile:', err);
      return null;
    }
  };

  const fetchSellerStore = async (uid: string): Promise<Store | null> => {
    try {
      const q = query(collection(db, 'stores'), where('seller_id', '==', uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as Store;
      }
      return null;
    } catch (err) {
      console.error('Failed to load store:', err);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const [userProf, store] = await Promise.all([
          fetchProfile(user.uid),
          fetchSellerStore(user.uid)
        ]);
        setProfile(userProf);
        setSellerStore(store);
      } else {
        setProfile(null);
        setSellerStore(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    // Ensure profile exists in Firestore
    const existing = await fetchProfile(user.uid);
    if (!existing) {
      const names = (user.displayName || '').split(' ');
      const newProf: UserProfile = {
        user_id: user.uid,
        first_name: names[0] || 'User',
        last_name: names.slice(1).join(' ') || '',
        display_name: user.displayName || user.email?.split('@')[0] || 'Member',
        avatar_url: user.photoURL || undefined,
        country: 'US',
        language: 'en',
        currency: 'USD',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await setDoc(doc(db, 'profiles', user.uid), newProf);
      setProfile(newProf);
    }
    const store = await fetchSellerStore(user.uid);
    setSellerStore(store);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    const user = res.user;
    const [userProf, store] = await Promise.all([
      fetchProfile(user.uid),
      fetchSellerStore(user.uid)
    ]);
    setProfile(userProf);
    setSellerStore(store);
  };

  const createAccount = async (email: string, pass: string, firstName: string, lastName: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const user = res.user;
    // Send email verification
    try {
      await sendEmailVerification(user);
    } catch (err) {
      console.warn('Could not send email verification immediately:', err);
    }

    const newProf: UserProfile = {
      user_id: user.uid,
      first_name: firstName,
      last_name: lastName,
      display_name: `${firstName} ${lastName}`.trim() || email.split('@')[0],
      country: 'US',
      language: 'en',
      currency: 'USD',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'profiles', user.uid), newProf);
    } catch (e) {
      console.warn('Profile write deferred:', e);
    }
    setProfile(newProf);
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setProfile(null);
    setSellerStore(null);
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      const prof = await fetchProfile(auth.currentUser.uid);
      setProfile(prof);
    }
  };

  const refreshSellerStore = async () => {
    if (auth.currentUser) {
      const store = await fetchSellerStore(auth.currentUser.uid);
      setSellerStore(store);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        sellerStore,
        loading,
        signInWithGoogle,
        signInWithEmail,
        createAccount,
        resendVerificationEmail,
        sendPasswordReset,
        signOut,
        refreshProfile,
        refreshSellerStore
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
