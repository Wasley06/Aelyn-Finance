import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { AlertCircle, Ban, Trash2, RefreshCw, Shield, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminConsole() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [error, setError] = useState('');
  const [busyUser, setBusyUser] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('email', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => setUsers(snap.docs.map((d) => d.data() as UserProfile)),
      (e) => setError((e as any)?.message || 'Failed to load users'),
    );
    return () => unsub();
  }, []);

  const sorted = useMemo(() => users.slice(), [users]);

  const doUpdate = async (uid: string, patch: Partial<UserProfile>) => {
    setError('');
    setBusyUser(uid);
    try {
      await updateDoc(doc(db, 'users', uid), patch as any);
    } catch (e: any) {
      setError(e?.message || 'Update failed');
    } finally {
      setBusyUser(null);
    }
  };

  const resetPassword = async (email: string) => {
    setError('');
    setBusyUser(email);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e: any) {
      setError(e?.message || 'Password reset failed');
    } finally {
      setBusyUser(null);
    }
  };

  const removeUserProfile = async (uid: string) => {
    setError('');
    setBusyUser(uid);
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e: any) {
      setError(e?.message || 'Delete failed');
    } finally {
      setBusyUser(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="aelyn-panel-soft rounded-[28px] border border-white/10 overflow-hidden">
        <div className="px-8 py-7 border-b border-white/10 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-white font-semibold tracking-tight">Admin Console</h3>
            <p className="text-[12px] text-slate-500">User management and developer tools (Firestore-level).</p>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <UserPlus size={16} className="text-sky" />
            <span className="text-[12px]">Add users via normal signup/login</span>
          </div>
        </div>

        {error && (
          <div className="m-6 bg-danger/10 p-3 rounded-2xl border border-danger/20 flex items-start gap-3">
            <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
            <p className="text-[12px] font-medium text-danger/90 leading-tight">{error}</p>
          </div>
        )}

        <div className="divide-y divide-white/10">
          {sorted.map((u) => (
            <div key={u.uid} className="px-8 py-5 flex items-center justify-between gap-6">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-white truncate">{u.displayName || u.email}</div>
                <div className="text-[12px] text-slate-500 truncate">{u.email}</div>
                <div className="text-[11px] text-slate-600 font-mono">uid: {u.uid}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => doUpdate(u.uid, { role: u.role === 'admin' ? 'stakeholder' : 'admin' })}
                  disabled={busyUser === u.uid}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[12px] text-slate-200 hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  <Shield size={14} className="text-sky" />
                  {u.role}
                </button>

                <button
                  type="button"
                  onClick={() => doUpdate(u.uid, { banned: !u.banned })}
                  disabled={busyUser === u.uid}
                  className={cn(
                    'px-3 py-2 rounded-xl border text-[12px] transition-all flex items-center gap-2 disabled:opacity-60',
                    u.banned
                      ? 'bg-success/10 border-success/20 text-success hover:bg-success/15'
                      : 'bg-danger/10 border-danger/20 text-danger hover:bg-danger/15',
                  )}
                  title={u.banned ? 'Unban user' : 'Ban user'}
                >
                  <Ban size={14} />
                  {u.banned ? 'Unban' : 'Ban'}
                </button>

                <button
                  type="button"
                  onClick={() => resetPassword(u.email)}
                  disabled={busyUser === u.email}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[12px] text-slate-200 hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-60"
                  title="Send password reset email"
                >
                  <RefreshCw size={14} className="text-sky" />
                  Reset
                </button>

                <button
                  type="button"
                  onClick={() => removeUserProfile(u.uid)}
                  disabled={busyUser === u.uid}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-danger hover:bg-danger/10 transition-all disabled:opacity-60"
                  title="Delete user profile (does not delete Auth account)"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {sorted.length === 0 && <div className="p-10 text-center text-slate-500 text-sm">No users found.</div>}
        </div>
      </div>
    </div>
  );
}

