import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Shield, Store, UserCheck } from 'lucide-react';
import { MaraLogo } from '../../components/common/MaraLogo';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { FirebaseDomainHelper } from '../../components/common/FirebaseDomainHelper';
import { useAuth } from '../../context/AuthContext';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const { signInWithEmail, signInWithGoogle, signInWithDemoAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      navigate(redirectPath);
    } catch (err: any) {
      console.error('Sign in failed:', err);
      if (err.code === 'auth/operation-not-allowed' || String(err).includes('OPERATION_NOT_ALLOWED')) {
        setError(
          'Email & Password provider is not yet enabled in Firebase Console. You can use Google Sign-in above or instant demo test accounts below.'
        );
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setError(err.message || 'Failed to sign in. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate(redirectPath);
    } catch (err: any) {
      console.error('Google sign in failed:', err);
      const isDomainError =
        err?.code === 'auth/unauthorized-domain' ||
        String(err?.message || '').includes('auth/unauthorized-domain') ||
        String(err || '').includes('unauthorized-domain');

      if (isDomainError) {
        setIsUnauthorizedDomain(true);
        setError(null);
      } else {
        setError(err.message || 'Google sign in could not be completed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoSignIn = async (role: 'BUYER' | 'SELLER') => {
    setDemoLoading(role);
    try {
      await signInWithDemoAccount(role);
      navigate(redirectPath);
    } catch (e: any) {
      setError(e.message || 'Demo sign in failed.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F3] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <MaraLogo to="/" size="lg" className="mx-auto" />
        <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
          Welcome back
        </h2>
        <p className="mt-2 text-xs text-[#6E746F]">
          Sign in to your MARA buyer or seller account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs rounded-2xl border border-[#E2E4DF] sm:px-10 space-y-6">
          {/* Specific Domain Authorization Helper */}
          {isUnauthorizedDomain && (
            <FirebaseDomainHelper
              onRetryGoogle={handleGoogleSignIn}
              onSuccess={() => navigate(redirectPath)}
            />
          )}

          {error && !isUnauthorizedDomain && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col gap-2.5 text-xs text-amber-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Top Google Sign-In */}
          <div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              isLoading={googleLoading}
              onClick={handleGoogleSignIn}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              }
            >
              Continue with Google
            </Button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E4DF]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-white px-3 text-[#6E746F] font-semibold">Or with Email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#101312] uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-[#123C2F] hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={loading}
            >
              Sign in with Email
            </Button>
          </form>

          {/* Quick Demo Accounts Strip */}
          <div className="pt-4 border-t border-[#E2E4DF] space-y-2">
            <span className="text-[11px] font-semibold text-[#6E746F] block text-center uppercase tracking-wider">
              Accès rapide démo (Sans mot de passe)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('SELLER')}
                disabled={Boolean(demoLoading)}
                className="py-1.5 px-2 rounded-xl border border-[#E2E4DF] bg-[#F7F7F3] hover:bg-amber-50 hover:border-amber-300 text-[11px] font-semibold text-[#101312] flex flex-col items-center gap-1 transition-all cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-[#123C2F]" />
                <span>Vendeur</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('BUYER')}
                disabled={Boolean(demoLoading)}
                className="py-1.5 px-2 rounded-xl border border-[#E2E4DF] bg-[#F7F7F3] hover:bg-blue-50 hover:border-blue-300 text-[11px] font-semibold text-[#101312] flex flex-col items-center gap-1 transition-all cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>Acheteur</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-[#6E746F]">
            Don&apos;t have an account?{' '}
            <Link
              to="/auth/create-account"
              className="text-[#101312] font-semibold hover:underline"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
