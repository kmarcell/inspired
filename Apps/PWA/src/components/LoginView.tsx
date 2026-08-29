import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { firestoreService } from '../services/firestoreService';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isStagingMode = import.meta.env.MODE === 'staging';

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.loginWithGoogle();
    } catch (err: unknown) {
      console.error('[LoginView] Google sign-in error:', err);
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. yogi@example.com).');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isStagingMode) {
        const isInvited = await firestoreService.checkStagingInvite(cleanEmail);
        if (!isInvited) {
          setError(`🔒 Staging access restricted. ${cleanEmail} has not been invited. Request an invite from the administrator.`);
          setIsLoading(false);
          return;
        }
      }

      await authService.sendSignInLink(cleanEmail);
      setMagicLinkSent(true);
      setCooldown(60);
    } catch (err: unknown) {
      console.error('[LoginView] Magic link error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send magic link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto px-6 py-12">
      {/* Brand Header */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-500/30 text-white text-2xl font-bold">
          I
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
          Welcome to Inspired
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Connect with local yoga teachers and communities near you.
        </p>
      </div>

      {/* Login Form Container */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6 backdrop-blur-xl transition-colors">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>

        {/* Staging Gating Badge */}
        {isStagingMode && (
          <div data-testid="staging-gating-badge" className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center space-x-2">
            <span>🔒</span>
            <span>Staging Preview Mode — Invitation Only Access</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div data-testid="login-error" className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center space-x-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Primary Option: Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          data-testid="google-login-button"
          className="w-full h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700/80 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 text-sm font-semibold text-slate-800 dark:text-slate-100 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">or passwordless email</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
        </div>

        {/* Magic Link Sent Toast Banner */}
        {magicLinkSent && (
          <div data-testid="magic-link-sent" className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center space-x-2">
            <span>✉️</span>
            <span>Magic link sent to {email}! Check your inbox.</span>
          </div>
        )}

        {/* Magic Link Form */}
        <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yogi@example.com"
                disabled={isLoading}
                data-testid="email-input"
                className="w-full h-12 pr-10 pl-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
              />
              {email && (
                <button
                  type="button"
                  onClick={() => setEmail('')}
                  data-testid="clear-email-button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!email || isLoading || cooldown > 0}
            data-testid="send-link-button"
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-[0.98] transition-all font-semibold text-sm text-white shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading
              ? 'Sending...'
              : cooldown > 0
              ? `Resend link in ${cooldown}s`
              : 'Send Magic Sign-In Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
