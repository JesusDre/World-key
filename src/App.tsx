import { useEffect, useState } from 'react';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { DigitalWallet } from './components/DigitalWallet';
import { DocumentsScreen } from './components/DocumentsScreen';
import { RequestsScreen } from './components/RequestsScreen';
import { NotificationsScreen } from './components/NotificationsScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { SendMoneyScreen } from './components/SendMoneyScreen';
import { ReceiveMoneyScreen } from './components/ReceiveMoneyScreen';
import { RechargeScreen } from './components/RechargeScreen';
import { PublicFileView } from './components/PublicFileView';
import { Toaster } from './components/ui/sonner';
import { useSoroban } from './hooks/useSoroban';
import type { AuthSession } from './types/auth';
import { Fingerprint } from 'lucide-react';
import { Button } from './components/ui/button';
import PlansScreen from './screens/PlansScreen';

export type Screen =
  | 'onboarding'
  | 'login'
  | 'dashboard'
  | 'wallet'
  | 'documents'
  | 'requests'
  | 'notifications'
  | 'history'
  | 'settings'
  | 'send-money'
  | 'receive-money'
  | 'recharge'
  | 'plans';

function UnlockScreen({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-emerald-500/10 rounded-full flex items-center justify-center animate-pulse">
          <Fingerprint className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">WorldKey Bloqueado</h2>
        <p className="text-slate-400 mb-8">Usa tu huella o Face ID para desbloquear</p>
        <Button
          onClick={onUnlock}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 rounded-full text-lg shadow-lg shadow-emerald-500/20"
        >
          Desbloquear
        </Button>
      </div>
    </div>
  );
}

export default function App() {
  const { identity, disconnect, authSession: contextSession, setAuthSession } = useSoroban();

  // Check if we're on a public share link
  const isPublicShareLink = window.location.pathname.startsWith('/share/');

  const [session, setSession] = useState<AuthSession | null>(contextSession);
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    return contextSession ? 'dashboard' : 'onboarding';
  });

  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window !== 'undefined') {
      const bioEnabled = localStorage.getItem('biometricEnabled') === 'true';
      const hasSession = !!localStorage.getItem('worldkey-auth-session');
      return bioEnabled && hasSession;
    }
    return false;
  });

  const isAuthenticated = Boolean(identity) || Boolean(session);

  const handleLogin = (authSession: AuthSession) => {
    setSession(authSession);
    setAuthSession(authSession);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    disconnect();
    setAuthSession(null);
    setSession(null);
    setCurrentScreen('login');
  };

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  useEffect(() => {
    if (!isAuthenticated && currentScreen !== 'onboarding' && currentScreen !== 'login') {
      setCurrentScreen('login');
    }
  }, [isAuthenticated, currentScreen]);

  useEffect(() => {
    if (contextSession && !session) {
      setSession(contextSession);
    }
  }, [contextSession, session]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <Onboarding onComplete={() => setCurrentScreen('login')} />;
      case 'login':
        return <Login onLogin={handleLogin} />;
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} session={session ?? undefined} />;
      case 'wallet':
        return <DigitalWallet onNavigate={navigateTo} />;
      case 'documents':
        return <DocumentsScreen onNavigate={navigateTo} session={session ?? undefined} />;
      case 'requests':
        return <RequestsScreen onNavigate={navigateTo} />;
      case 'notifications':
        return <NotificationsScreen onNavigate={navigateTo} />;
      case 'history':
        return <HistoryScreen onNavigate={navigateTo} session={session ?? undefined} />;
      case 'settings':
        return <SettingsScreen onNavigate={navigateTo} onLogout={handleLogout} session={session ?? undefined} />;
      case 'send-money':
        return <SendMoneyScreen onNavigate={navigateTo} session={session ?? undefined} />;
      case 'receive-money':
        return <ReceiveMoneyScreen onNavigate={navigateTo} />;
      case 'recharge':
        return <RechargeScreen onNavigate={navigateTo} session={session ?? undefined} />;
      case 'plans':
        return <PlansScreen onNavigate={navigateTo} />;
      default:
        return <Dashboard onNavigate={navigateTo} session={session ?? undefined} />;
    }
  };

  // If it's a public share link, show PublicFileView directly
  if (isPublicShareLink) {
    return (
      <div className="min-h-screen bg-slate-950">
        <PublicFileView />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {isLocked && <UnlockScreen onUnlock={() => setIsLocked(false)} />}
      {renderScreen()}
      <Toaster />
    </div>
  );
}
