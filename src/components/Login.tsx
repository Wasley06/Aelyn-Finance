import React, { useState } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn, Mail, Lock, AlertCircle, Fingerprint, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import aelynLogo from '../assets/aelyn-logo.png';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStakeholderQuickFill = (target: 'asya' | 'george') => {
    const emails = {
      asya: 'asya@aelyn.finance',
      george: 'george@aelyn.finance',
    };
    setEmail(emails[target]);
    setPassword('12345678');
  };

  return (
    <div className="min-h-screen aelyn-bg flex items-center justify-center p-4 selection:bg-gold-light selection:text-white font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md aelyn-panel rounded-[28px] p-10 relative overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="flex flex-col items-center mb-10">
          <img
            src={aelynLogo}
            className="w-20 h-20 object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
            alt="Aelyn"
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">Welcome Back</h1>
          <p className="text-[12px] text-slate-400 mt-1">Sign in to continue</p>
        </div>

        <div className="mb-8 flex flex-col gap-2 p-4 rounded-2xl border border-white/10 bg-white/5">
          <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest text-center mb-2">
            Stakeholder Quick Access
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleStakeholderQuickFill('asya')}
              className="flex-grow py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-semibold uppercase tracking-tighter hover:border-sky/40 hover:text-sky transition-all"
              type="button"
            >
              Asya Afidh
            </button>
            <button
              onClick={() => handleStakeholderQuickFill('george')}
              className="flex-grow py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-semibold uppercase tracking-tighter hover:border-sky/40 hover:text-sky transition-all"
              type="button"
            >
              George Wasley
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-1 tracking-tight">
            Requires one-time provisioning if not already active.
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-2 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/7 focus:ring-2 focus:ring-sky/20 focus:border-sky/30 outline-none transition-all text-sm font-medium text-white placeholder:text-slate-600"
                placeholder="name@aelyn.finance"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/7 focus:ring-2 focus:ring-sky/20 focus:border-sky/30 outline-none transition-all text-sm font-medium text-white placeholder:text-slate-600"
                placeholder="••••••••"
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[12px] text-slate-400 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-sky w-4 h-4 rounded"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() =>
                setError(
                  'Password reset is not wired yet. Ask an admin to reset your account or use Workspace SSO.',
                )
              }
              className="text-[12px] text-sky hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {error && (
            <div className="bg-danger/10 p-3 rounded-2xl border border-danger/20 flex items-start gap-3">
              <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
              <p className="text-[11px] text-danger/90 font-semibold leading-tight tracking-tight">
                {error.includes('auth/too-many-requests')
                  ? 'Access Locked: Too many attempts. Please wait 1-5 minutes before trying again.'
                  : error.includes('auth/invalid-credential')
                    ? 'Access Denied: Invalid credentials.'
                    : error}
              </p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-sky to-sky-2 text-navy py-4 rounded-2xl font-semibold tracking-tight text-sm hover:brightness-110 active:brightness-95 transition-all flex items-center justify-center gap-3 shadow-[0_20px_60px_rgba(46,229,210,0.18)]"
          >
            <LogIn size={18} className="text-navy" />
            {isSignUp ? 'Create Account' : 'Login'}
            <ArrowRight size={16} className="opacity-80" />
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-semibold tracking-widest">
            <span className="px-4 text-slate-500 bg-transparent">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full bg-white/5 border border-white/10 text-slate-200 py-4 rounded-2xl font-semibold tracking-tight hover:bg-white/10 transition-all flex items-center justify-center gap-3 group"
          >
            <img
              src="https://www.google.com/favicon.ico"
              className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all"
              alt="Google"
            />
            Google
          </button>
          <button
            type="button"
            onClick={() =>
              setError('Biometric sign-in is not available in this web app yet. Use email/password or Workspace SSO.')
            }
            className="w-full bg-white/5 border border-white/10 text-slate-200 py-4 rounded-2xl font-semibold tracking-tight hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <Fingerprint size={18} className="text-sky" />
            Biometrics
          </button>
        </div>

        <p className="mt-8 text-center text-[12px] text-slate-500">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-sky hover:underline font-semibold" type="button">
            {isSignUp ? 'Login' : 'Sign up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

