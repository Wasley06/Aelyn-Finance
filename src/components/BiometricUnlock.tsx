import React, { useState } from 'react';
import { Fingerprint, ArrowRight, AlertCircle } from 'lucide-react';
import { verifyBiometrics } from '../lib/biometrics';
import { auth, functions } from '../lib/firebase';

export default function BiometricUnlock({ userId, onUnlocked }: { userId: string; onUnlocked: () => void }) {
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const unlock = async () => {
    setError('');
    setBusy(true);
    try {
      // Uses FirebaseWebAuthn to verify the currently signed-in user.
      await verifyBiometrics(auth, functions);
      onUnlocked();
    } catch (e: any) {
      setError(e?.message || 'Biometric unlock failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen aelyn-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md aelyn-panel rounded-[28px] p-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-sky">
            <Fingerprint size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-[16px] font-semibold" style={{ color: 'var(--aelyn-fg)' }}>
              Sign in with Biometrics
            </div>
            <div className="text-[12px]" style={{ color: 'var(--aelyn-muted)' }}>
              Verify to access your account
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-danger/10 p-3 rounded-2xl border border-danger/20 flex items-start gap-3">
            <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
            <p className="text-[12px] font-medium text-danger/90 leading-tight">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={unlock}
          disabled={busy}
          className="mt-8 w-full bg-gradient-to-r from-sky to-sky-2 text-navy py-4 rounded-2xl font-semibold tracking-tight text-sm hover:brightness-110 active:brightness-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
        >
          {busy ? 'Verifying…' : 'Sign in'}
          <ArrowRight size={16} className="opacity-80" />
        </button>
      </div>
    </div>
  );
}
