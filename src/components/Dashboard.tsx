import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Download,
  FileText,
  Bell,
  CreditCard,
  History,
  Settings,
  ChevronRight,
  Shield,
  Eye,
  CheckCircle
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { Screen } from '../App';
import type { AuthSession } from '../types/auth';
import { apiRequest } from '../services/api';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
  session?: AuthSession;
}

interface WalletCard {
  id: string;
  brand: string;
  cardNumber: string;
  holderName: string;
  expirationMonth: string;
  expirationYear: string;
}

interface Transaction {
  id: number;
  type: 'RECHARGE' | 'TRANSFER';
  amount: number;
  description: string;
  fromUserEmail?: string;
  toUserEmail?: string;
  createdAt: string;
  status: string;
}

export function Dashboard({ onNavigate, session }: DashboardProps) {
  const [pendingRequests] = useState(2);
  const [balance, setBalance] = useState<number>(0);
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [recentActivity, setRecentActivity] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fullName = session?.fullName || 'Juan Díaz';
  const photoUrl = session?.photoUrl;
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    if (session?.token) {
      // Fetch balance
      apiRequest('/wallet/balance', {
        method: 'GET',
        token: session.token
      })
        .then((data: any) => {
          setBalance(data.balance || 0);
        })
        .catch(err => console.error('Error loading balance:', err));

      // Fetch cards
      apiRequest('/wallet/cards', {
        method: 'GET',
        token: session.token
      })
        .then((cardsData: any) => {
          setCards(cardsData as WalletCard[]);
        })
        .catch(err => console.error('Error loading cards:', err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [session]);

  // Load recent transactions
  useEffect(() => {
    if (session?.token) {
      apiRequest('/wallet/transactions', {
        method: 'GET',
        token: session.token
      })
        .then((data: any) => {
          setRecentActivity(data.slice(0, 5)); // Only show last 5
        })
        .catch(err => console.error('Error loading transactions:', err));
    }
  }, [session]);

  const paymentMethods = cards.map(card => ({
    id: card.id,
    type: card.brand,
    last4: card.cardNumber.slice(-4),
    verified: true
  }));

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays}d`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 px-6 pt-12 pb-8 border-b border-slate-800">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-emerald-400">
              {photoUrl ? (
                <img src={photoUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-emerald-400 text-white">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="text-sm text-slate-400">Bienvenido</p>
              <p className="text-lg text-white">{fullName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate('notifications')}
              className="relative p-3 bg-slate-800/50 rounded-full hover:bg-slate-700 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {pendingRequests > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {pendingRequests}
                </span>
              )}
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="p-3 bg-slate-800/50 rounded-full hover:bg-slate-700 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Balance */}
        <div className="text-center">
          <p className="text-sm text-slate-400 mb-2">Saldo</p>
          <h2 className="text-5xl mb-1">${balance.toFixed(2)}</h2>
          <p className="text-emerald-400 text-sm mb-4">MXN</p>
          <button
            onClick={() => onNavigate('recharge')}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 rounded-full text-sm font-medium transition-all"
          >
            + Recargar Saldo
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => onNavigate('send-money')}
            className="flex flex-col items-center gap-2 p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all hover:bg-slate-800"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-emerald-400/20 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xs text-slate-300">Enviar</span>
          </button>

          <button
            onClick={() => onNavigate('receive-money')}
            className="flex flex-col items-center gap-2 p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all hover:bg-slate-800"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-emerald-400/20 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs text-slate-300">Recibir</span>
          </button>

          <button
            onClick={() => onNavigate('documents')}
            className="flex flex-col items-center gap-2 p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-all hover:bg-slate-800"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-400/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs text-slate-300">Docs</span>
          </button>

          <button
            onClick={() => onNavigate('requests')}
            className="relative flex flex-col items-center gap-2 p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-orange-500/50 transition-all hover:bg-slate-800"
          >
            {pendingRequests > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {pendingRequests}
              </span>
            )}
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-yellow-400/20 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-xs text-slate-300">Solicitudes</span>
          </button>
        </div>

        {/* Payment Methods */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-white">Métodos de Pago</h3>
            <button
              onClick={() => onNavigate('wallet')}
              className="text-emerald-400 text-sm flex items-center gap-1 hover:text-emerald-300"
            >
              Ver todos
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6">
            {paymentMethods.map((method) => (
              <motion.div
                key={method.id}
                whileHover={{ scale: 1.02 }}
                className="min-w-[280px] bg-gradient-to-br from-blue-900/40 to-slate-900/60 p-6 rounded-2xl border border-slate-700"
              >
                <div className="flex items-center justify-between mb-6">
                  <CreditCard className="w-8 h-8 text-emerald-400" />
                  {method.verified && (
                    <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verificada
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-1">{method.type} •••• {method.last4}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-white">Actividad Reciente</h3>
            <button
              onClick={() => onNavigate('history')}
              className="text-emerald-400 text-sm flex items-center gap-1 hover:text-emerald-300"
            >
              Ver todo
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              // Skeleton loader
              [1, 2, 3].map((i) => (
                <Card key={i} className="p-4 bg-slate-900 border-slate-800 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-slate-800 rounded"></div>
                        <div className="h-3 w-20 bg-slate-800 rounded"></div>
                      </div>
                    </div>
                    <div className="h-4 w-16 bg-slate-800 rounded"></div>
                  </div>
                </Card>
              ))
            ) : recentActivity.length === 0 ? (
              <Card className="p-6 bg-slate-900 border-slate-800 text-center">
                <p className="text-slate-400">No hay actividad reciente</p>
              </Card>
            ) : (
              recentActivity.map((activity) => {
                const isTransfer = activity.type === 'TRANSFER';
                const isRecharge = activity.type === 'RECHARGE';
                const isReceived = isTransfer && activity.toUserEmail === session?.email;
                const isSent = isTransfer && activity.fromUserEmail === session?.email;

                return (
                  <Card key={activity.id} className="p-4 bg-slate-900 border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSent ? 'bg-red-500/10' :
                            isReceived ? 'bg-emerald-500/10' :
                              'bg-blue-500/10'
                          }`}>
                          {isSent ? (
                            <Send className="w-5 h-5 text-red-400" />
                          ) : isReceived ? (
                            <Download className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-white">{activity.description}</p>
                          <p className="text-xs text-slate-400">{formatTimeAgo(activity.createdAt)}</p>
                        </div>
                      </div>
                      <p className={`${isReceived || isRecharge ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {isReceived || isRecharge ? '+' : '-'}${activity.amount.toFixed(2)}
                      </p>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-6 py-4">
        <div className="flex justify-around items-center">
          <button className="flex flex-col items-center gap-1 text-emerald-400">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs">Inicio</span>
          </button>
          <button
            onClick={() => onNavigate('wallet')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <CreditCard className="w-6 h-6" />
            <span className="text-xs">Wallet</span>
          </button>
          <button
            onClick={() => onNavigate('documents')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <FileText className="w-6 h-6" />
            <span className="text-xs">Documentos</span>
          </button>
          <button
            onClick={() => onNavigate('history')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <History className="w-6 h-6" />
            <span className="text-xs">Historial</span>
          </button>
        </div>
      </div>
    </div>
  );
}
