import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { Toaster } from 'sonner';
import BiometricUnlock from './components/BiometricUnlock';
import aelynLogo from './assets/aelyn-logo.png';

function AppContent() {
  const { user, loading } = useAuth();
  const [unlocked, setUnlocked] = React.useState(false);
  const [lockedUid, setLockedUid] = React.useState<string | null>(null);

  React.useEffect(() => {
    setUnlocked(false);
  }, [user?.uid]);

  React.useEffect(() => {
    const read = () => setLockedUid(localStorage.getItem('aelyn.locked.uid'));
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'aelyn.locked.uid') read();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen aelyn-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src={aelynLogo} alt="Aelyn" className="w-14 h-14 object-contain" />
          <div className="w-8 h-8 border-2 border-white/30 border-t-sky rounded-full animate-spin"></div>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-500">Initializing Session</p>
        </div>
      </div>
    );
  }

  if (user) {
    const isLocked = lockedUid === user.uid;
    if (isLocked) {
      return (
        <BiometricUnlock
          userId={user.uid}
          onUnlocked={() => {
            localStorage.removeItem('aelyn.locked.uid');
            setLockedUid(null);
            setUnlocked(true);
          }}
        />
      );
    }
    return <Dashboard />;
  }

  return <Login />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
