import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { firestoreService, ProfileNotFoundError } from '../services/firestoreService';
import { authService } from '../services/authService';

export type AuthStatus = 'launching' | 'login' | 'onboarding' | 'authenticated';

export interface AuthState {
  status: AuthStatus;
  firebaseUser: FirebaseUser | null;
  user: UserProfile | null;
  onboardingUserId?: string;
  onboardingDisplayName?: string;
  error?: string;
}

export interface AuthContextType extends AuthState {
  completeOnboarding: (user: UserProfile) => void;
  refreshUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    status: 'launching',
    firebaseUser: null,
    user: null,
  });

  const loadUserProfile = async (fbUser: FirebaseUser) => {
    try {
      const profile = await firestoreService.fetchUserProfile(fbUser.uid);
      setAuthState({
        status: 'authenticated',
        firebaseUser: fbUser,
        user: profile,
      });
    } catch (error: unknown) {
      if (error instanceof ProfileNotFoundError) {
        setAuthState({
          status: 'onboarding',
          firebaseUser: fbUser,
          user: null,
          onboardingUserId: fbUser.uid,
          onboardingDisplayName: fbUser.displayName || '',
        });
      } else {
        console.error('[AuthContext] Failed to load user profile:', error);
        setAuthState({
          status: 'login',
          firebaseUser: null,
          user: null,
          error: error instanceof Error ? error.message : 'Failed to fetch user profile.',
        });
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await loadUserProfile(fbUser);
      } else {
        setAuthState({
          status: 'login',
          firebaseUser: null,
          user: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const completeOnboarding = (profile: UserProfile) => {
    setAuthState({
      status: 'authenticated',
      firebaseUser: authService.getCurrentUser(),
      user: profile,
    });
  };

  const refreshUserProfile = async () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      await loadUserProfile(currentUser);
    }
  };

  const logout = async () => {
    await authService.logout();
    setAuthState({
      status: 'login',
      firebaseUser: null,
      user: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        completeOnboarding,
        refreshUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
