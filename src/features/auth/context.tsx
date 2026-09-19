'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initAnonymousUser } from '@/lib/firebase/client';

interface AuthContextValue {
  uid: string | null;
  isLoaded: boolean;
  isCloudAuth: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  uid: null,
  isLoaded: false,
  isCloudAuth: false,
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCloudAuth, setIsCloudAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function setupUser() {
      try {
        const session = await initAnonymousUser();
        if (isMounted) {
          setUid(session.uid);
          setIsCloudAuth(session.isCloudAuth);
          setIsLoaded(true);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Auth initialization error:', err);
          setError('Failed to start anonymous session');
          setIsLoaded(true);
        }
      }
    }

    setupUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ uid, isLoaded, isCloudAuth, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
