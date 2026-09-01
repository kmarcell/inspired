import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendSignInLinkToEmail, 
  signInAnonymously,
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
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
    const result = await signInWithPopup(auth, provider);
    return result.user;
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
