import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { MaraLogo } from '../../components/common/MaraLogo';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, resendVerificationEmail } = useAuth();

  const userEmail = searchParams.get('email') || currentUser?.email || 'your email';

  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      await resendVerificationEmail();
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      console.error('Failed to resend verification:', err);
      setError(err.message || 'Could not resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setError(null);
    try {
      if (currentUser) {
        await currentUser.reload();
        if (currentUser.emailVerified) {
          navigate('/');
        } else {
          setError('Email is not verified yet. Please check your inbox and click the verification link.');
        }
      } else {
        navigate('/auth/sign-in');
      }
    } catch (err: any) {
      setError(err.message || 'Error checking verification status.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F3] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <MaraLogo to="/" size="lg" className="mx-auto" />
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs rounded-2xl border border-[#E2E4DF] sm:px-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F4C430]/20 text-[#101312] flex items-center justify-center mx-auto mb-4 border border-[#F4C430]/40">
            <Mail className="w-8 h-8 text-[#101312]" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[#101312]">
            Check your email
          </h2>

          <p className="mt-2 text-xs text-[#6E746F]">
            We sent a verification link to:
          </p>
          <p className="mt-1 text-sm font-semibold text-[#101312] bg-[#F7F7F3] py-1.5 px-3 rounded-lg border border-[#E2E4DF] inline-block max-w-full truncate">
            {userEmail}
          </p>

          <p className="mt-4 text-xs text-[#6E746F] leading-relaxed">
            Click the link in that email to confirm your account and access all marketplace features.
          </p>

          {resendSuccess && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>A new verification link has been sent!</span>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              isLoading={checking}
              onClick={handleCheckStatus}
            >
              I verified my email
            </Button>

            <Button
              variant="outline"
              size="md"
              className="w-full"
              isLoading={resending}
              onClick={handleResend}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Resend email
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-[#6E746F] hover:text-[#101312]"
              onClick={() => navigate('/')}
            >
              Continue to marketplace (verify later)
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-[#E2E4DF] flex items-center justify-between text-xs text-[#6E746F]">
            <Link
              to="/auth/create-account"
              className="hover:text-[#101312] transition-colors"
            >
              Change email
            </Link>
            <Link
              to="/auth/sign-in"
              className="hover:text-[#101312] font-semibold flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
