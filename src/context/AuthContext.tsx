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
  isAdmin: boolean;
  isSeller: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  createAccount: (email: string, pass: string, firstName: string, lastName: string) => Promise<void>;
  signInWithDemoAccount: (role: 'BUYER' | 'SELLER') => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSellerStore: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
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
      if (user) {
        localStorage.removeItem('mara_preview_user');
        setCurrentUser(user);
        const [userProf, store] = await Promise.all([
          fetchProfile(user.uid),
          fetchSellerStore(user.uid)
        ]);
        setProfile(userProf);
        setSellerStore(store);
      } else {
        const storedDemo = localStorage.getItem('mara_preview_user');
        if (storedDemo) {
          try {
            const demo = JSON.parse(storedDemo);
            const mockUser = {
              uid: demo.uid,
              email: demo.email,
              displayName: demo.displayName,
              emailVerified: true,
              isAnonymous: false,
              providerData: []
            } as unknown as FirebaseUser;
            setCurrentUser(mockUser);
            const [userProf, store] = await Promise.all([
              fetchProfile(demo.uid),
              fetchSellerStore(demo.uid)
            ]);
            setProfile(
              userProf || {
                user_id: demo.uid,
                first_name: demo.displayName.split(' ')[0],
                last_name: demo.displayName.split(' ').slice(1).join(' '),
                display_name: demo.displayName,
                country: 'US',
                language: 'en',
                currency: 'USD',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                role: demo.role,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            );
            setSellerStore(store);
          } catch (e) {
            console.error('Failed to parse preview user:', e);
            setCurrentUser(null);
            setProfile(null);
            setSellerStore(null);
          }
        } else {
          setCurrentUser(null);
          setProfile(null);
          setSellerStore(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    localStorage.removeItem('mara_preview_user');
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
        role: 'BUYER',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await setDoc(doc(db, 'profiles', user.uid), newProf);
      setProfile(newProf);
    } else {
      setProfile(existing);
    }
    const store = await fetchSellerStore(user.uid);
    setSellerStore(store);
  };

  const signInWithDemoAccount = async (role: 'BUYER' | 'SELLER') => {
    let demoUser: { uid: string; email: string; displayName: string; role: 'BUYER' | 'SELLER' };
    if (role === 'SELLER') {
      demoUser = {
        uid: 'seller_caribbean_crafts',
        email: 'seller@mara.market',
        displayName: 'Caribbean Crafts Studio',
        role: 'SELLER'
      };
    } else {
      demoUser = {
        uid: 'buyer_international',
        email: 'buyer@mara.market',
        displayName: 'Alexandre Jean',
        role: 'BUYER'
      };
    }

    localStorage.setItem('mara_preview_user', JSON.stringify(demoUser));
    const mockUser = {
      uid: demoUser.uid,
      email: demoUser.email,
      displayName: demoUser.displayName,
      emailVerified: true,
      isAnonymous: false,
      providerData: []
    } as unknown as FirebaseUser;
    setCurrentUser(mockUser);

    // Load or create profile in Firestore
    let prof = await fetchProfile(demoUser.uid);
    if (!prof) {
      prof = {
        user_id: demoUser.uid,
        first_name: demoUser.displayName.split(' ')[0],
        last_name: demoUser.displayName.split(' ').slice(1).join(' '),
        display_name: demoUser.displayName,
        country: 'US',
        language: 'en',
        currency: 'USD',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        role: demoUser.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      try {
        await setDoc(doc(db, 'profiles', demoUser.uid), prof);
      } catch (e) {
        console.warn('Demo profile set deferred:', e);
      }
    }
    setProfile(prof);

    // If seller, ensure store exists
    if (role === 'SELLER') {
      let store = await fetchSellerStore(demoUser.uid);
      if (!store) {
        const storeRef = doc(collection(db, 'stores'));
        const sampleStore: Store = {
          id: storeRef.id,
          seller_id: demoUser.uid,
          name: 'Caribbean Crafts & Textiles',
          slug: 'caribbean-crafts',
          description: 'Authentic handcrafted artisanal goods, textiles, and design from the Caribbean to the world.',
          status: 'ACTIVE',
          rating: 4.9,
          reviews_count: 24,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        try {
          await setDoc(storeRef, sampleStore);
          store = sampleStore;
        } catch (e) {
          console.warn('Demo store set deferred:', e);
        }
      }
      setSellerStore(store);
    } else {
      setSellerStore(null);
    }
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
    localStorage.removeItem('mara_preview_user');
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout notice:', e);
    }
    setCurrentUser(null);
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

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const docRef = doc(db, 'profiles', currentUser.uid);
    const sanitized = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    await setDoc(docRef, sanitized, { merge: true });
    setProfile((prev) => (prev ? { ...prev, ...sanitized } : null));
  };

  const isAdmin = false;

  const isSeller = Boolean(sellerStore || profile?.role === 'SELLER');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        sellerStore,
        isAdmin,
        isSeller,
        loading,
        signInWithGoogle,
        signInWithEmail,
        createAccount,
        signInWithDemoAccount,
        resendVerificationEmail,
        sendPasswordReset,
        signOut,
        refreshProfile,
        refreshSellerStore,
        updateProfile
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
