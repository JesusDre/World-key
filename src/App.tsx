import { useState } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  const handleLogin = (token: string, uid: string) => {
    setAccessToken(token);
    setUserId(uid);
    setIsAuthenticated(true);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setAccessToken('');
    setUserId('');
    setIsAuthenticated(false);
    setCurrentScreen('login');
  };

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

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
        return <DocumentsScreen onNavigate={navigateTo} accessToken={accessToken} />;
      case 'requests':
        return <RequestsScreen onNavigate={navigateTo} />;
      case 'notifications':
        return <NotificationsScreen onNavigate={navigateTo} accessToken={accessToken} />;
      case 'history':
        return <HistoryScreen onNavigate={navigateTo} accessToken={accessToken} />;
      case 'settings':
        return <SettingsScreen onNavigate={navigateTo} onLogout={handleLogout} accessToken={accessToken} />;
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
