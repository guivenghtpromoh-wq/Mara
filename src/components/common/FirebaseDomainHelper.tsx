import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, ExternalLink, RefreshCw, UserCheck, Store } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../../context/AuthContext';
import firebaseConfig from '../../../firebase-applet-config.json';

interface FirebaseDomainHelperProps {
  onRetryGoogle?: () => void;
  onSuccess?: () => void;
  showDismiss?: boolean;
}

export const FirebaseDomainHelper: React.FC<FirebaseDomainHelperProps> = ({
  onRetryGoogle,
  onSuccess,
  showDismiss = false
}) => {
  const { signInWithDemoAccount } = useAuth();
  const [copied, setCopied] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(currentHost);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDemoLogin = async (role: 'BUYER' | 'SELLER') => {
    setDemoLoading(role);
    try {
      await signInWithDemoAccount(role);
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error('Demo sign in failed:', e);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-300 text-[#101312] space-y-4 shadow-sm animate-in fade-in">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-amber-800" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-amber-950">
            Domaine non autorisé dans Firebase / Unauthorized Domain
          </h3>
          <p className="text-xs text-amber-900 leading-relaxed">
            Firebase bloque la connexion Google OAuth car ce domaine web n&apos;est pas encore ajouté à la liste des domaines autorisés de votre projet Firebase.
          </p>
        </div>
      </div>

      {/* Domain Copy Box */}
      <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
        <span className="text-[11px] font-semibold text-[#6E746F] uppercase tracking-wider block">
          Votre domaine actuel à autoriser :
        </span>
        <div className="flex items-center justify-between gap-2 bg-[#F7F7F3] p-2 rounded-lg border border-[#E2E4DF]">
          <code className="text-xs font-mono font-bold text-[#101312] truncate select-all">
            {currentHost}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-white border border-[#E2E4DF] rounded-md hover:bg-amber-50 transition-colors shrink-0 text-[#101312] cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#6E746F]" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="text-[11px] text-[#6E746F] space-y-1 pt-1">
          <p className="font-semibold text-[#101312]">Comment l&apos;activer en 15 secondes :</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>
              Ouvrez les paramètres Firebase :{' '}
              <a
                href={firebaseSettingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#123C2F] font-bold hover:underline inline-flex items-center gap-0.5"
              >
                Authentication &gt; Settings
                <ExternalLink className="w-3 h-3 inline ml-0.5" />
              </a>
            </li>
            <li>Descendez à <strong>Authorized domains</strong> (Domaines autorisés).</li>
            <li>Cliquez sur <strong>Add domain</strong>, collez <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono text-[10px]">{currentHost}</code> et enregistrez.</li>
          </ol>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {onRetryGoogle && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetryGoogle}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Réessayer Google Sign-in
          </Button>
        )}
        <a
          href={firebaseSettingsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors"
        >
          <span>Ouvrir Firebase Console</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Instant Demo Access (No Setup Required) */}
      <div className="pt-3 border-t border-amber-200 space-y-2">
        <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider block">
          Ou connectez-vous immédiatement en 1 clic (Mode Test) :
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-xs justify-center bg-white hover:bg-amber-50/50"
            isLoading={demoLoading === 'SELLER'}
            onClick={() => handleDemoLogin('SELLER')}
            icon={<Store className="w-3.5 h-3.5 text-[#123C2F]" />}
          >
            Vendeur / Store
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-xs justify-center bg-white hover:bg-amber-50/50"
            isLoading={demoLoading === 'BUYER'}
            onClick={() => handleDemoLogin('BUYER')}
            icon={<UserCheck className="w-3.5 h-3.5 text-blue-700" />}
          >
            Acheteur / Buyer
          </Button>
        </div>
      </div>
    </div>
  );
};
