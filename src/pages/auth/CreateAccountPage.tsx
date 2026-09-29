import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { MaraLogo } from '../../components/common/MaraLogo';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';

export const CreateAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { createAccount, signInWithGoogle } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!agreed) {
      setError('Please accept the Terms & Conditions and Privacy Policy.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createAccount(email, password, firstName, lastName);
      navigate(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      console.error('Account creation error:', err);
      if (err.code === 'auth/operation-not-allowed' || String(err).includes('OPERATION_NOT_ALLOWED')) {
        setError(
          'L\'inscription par e-mail et mot de passe nécessite l\'activation du fournisseur dans la console Firebase. Vous pouvez créer votre compte immédiatement en 1 clic avec Google ci-dessous !'
        );
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email address already exists. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError(err.message || 'Failed to create account.');
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
      navigate('/');
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err.message || 'Google account sign up could not be completed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F3] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <MaraLogo to="/" size="lg" className="mx-auto" />
        <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
          Create your MARA account
        </h2>
        <p className="mt-2 text-xs text-[#6E746F]">
          Join buyers and sellers around the world
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs rounded-2xl border border-[#E2E4DF] sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col gap-2.5 text-xs text-amber-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span>{error}</span>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="w-full"
                isLoading={googleLoading}
                onClick={handleGoogleSignIn}
              >
                Créer mon compte avec Google (Recommandé)
              </Button>
            </div>
          )}

          {/* Quick Google Sign-in */}
          <div className="mb-5">
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
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                icon={<User className="w-4 h-4" />}
              />
              <Input
                label="Last Name"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>

            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              icon={<Lock className="w-4 h-4" />}
            />

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#F4C430] border-[#E2E4DF] focus:ring-[#F4C430] cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-[#6E746F] leading-tight">
                I agree to the{' '}
                <span className="text-[#101312] font-semibold underline cursor-pointer">
                  Terms & Conditions
                </span>{' '}
                and{' '}
                <span className="text-[#101312] font-semibold underline cursor-pointer">
                  Privacy Policy
                </span>
                .
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={loading}
            >
              Create account with Email
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-[#6E746F]">
            Already have an account?{' '}
            <Link to="/auth/sign-in" className="text-[#101312] font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
