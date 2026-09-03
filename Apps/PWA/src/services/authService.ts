import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendSignInLinkToEmail, 
  signInAnonymously,
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '../firebase';

export interface AuthService {
  loginWithGoogle: () => Promise<FirebaseUser>;
  loginWithEmailPassword: (email: string, pass: string) => Promise<FirebaseUser>;
  sendSignInLink: (email: string) => Promise<void>;
  loginAnonymously: () => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
  getCurrentUser: () => FirebaseUser | null;
}

export const authService: AuthService = {
  async loginWithGoogle(): Promise<FirebaseUser> {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err: unknown) {
      const { fetchSignInMethodsForEmail, linkWithCredential } = await import('firebase/auth');
      if (err instanceof FirebaseError && err.code === 'auth/account-exists-with-different-credential') {
        const pendingCred = GoogleAuthProvider.credentialFromError(err);
        const email = err.customData?.email as string;

        if (email && pendingCred) {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.includes('password')) {
            const password = window.prompt(`An account already exists for ${email}. Enter your password to link Google sign-in:`);
            if (password) {
              const userCred = await authService.loginWithEmailPassword(email, password);
              if (auth.currentUser) {
                await linkWithCredential(auth.currentUser, pendingCred);
              }
              return userCred;
            }
          }
        }
      }
      throw err;
    }
  },

  async loginWithEmailPassword(email: string, pass: string): Promise<FirebaseUser> {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  },

  async sendSignInLink(email: string): Promise<void> {
    const actionCodeSettings = {
      url: window.location.origin + '/finish-sign-in',
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  },

  async loginAnonymously(): Promise<FirebaseUser | null> {
    try {
      const res = await signInAnonymously(auth);
      return res.user;
    } catch (e) {
      console.warn('[authService] Anonymous login fallback:', e);
      return null;
    }
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },
};
