import { useEffect, useState } from 'react';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { WalletScreen } from './components/WalletScreen';
import { DocumentsScreen } from './components/DocumentsScreen';
import { RequestsScreen } from './components/RequestsScreen';
import { NotificationsScreen } from './components/NotificationsScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { SendMoneyScreen } from './components/SendMoneyScreen';
import { ReceiveMoneyScreen } from './components/ReceiveMoneyScreen';
import { Toaster } from './components/ui/sonner';
import { useSoroban } from './hooks/useSoroban';
import type { AuthSession } from './types/auth';

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
  | 'receive-money';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [session, setSession] = useState<AuthSession | null>(null);
  const { identity, disconnect, authSession: contextSession, setAuthSession } = useSoroban();
  const isAuthenticated = Boolean(identity);

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
        return <Dashboard onNavigate={navigateTo} />;
      case 'wallet':
        return <WalletScreen onNavigate={navigateTo} />;
      case 'documents':
        return <DocumentsScreen onNavigate={navigateTo} />;
      case 'requests':
        return <RequestsScreen onNavigate={navigateTo} />;
      case 'notifications':
        return <NotificationsScreen onNavigate={navigateTo} />;
      case 'history':
        return <HistoryScreen onNavigate={navigateTo} />;
      case 'settings':
        return <SettingsScreen onNavigate={navigateTo} onLogout={handleLogout} session={session ?? undefined} />;
      case 'send-money':
        return <SendMoneyScreen onNavigate={navigateTo} />;
      case 'receive-money':
        return <ReceiveMoneyScreen onNavigate={navigateTo} />;
      default:
        return <Dashboard onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {renderScreen()}
      <Toaster />
    </div>
  );
}
