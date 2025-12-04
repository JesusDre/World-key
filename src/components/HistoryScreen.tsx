import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Send, CreditCard, Search } from 'lucide-react';
import type { Screen } from '../App';
import type { AuthSession } from '../types/auth';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { apiRequest } from '../services/api';

interface HistoryScreenProps {
  onNavigate: (screen: Screen) => void;
  session?: AuthSession;
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

export function HistoryScreen({ onNavigate, session }: HistoryScreenProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (session?.token) {
      apiRequest('/wallet/transactions', {
        method: 'GET',
        token: session.token
      })
        .then((data: any) => {
          setTransactions(data);
        })
        .catch(err => console.error('Error loading transactions:', err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const filteredTransactions = transactions.filter(tx =>
    tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.fromUserEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.toUserEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 px-6 pt-12 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Historial de Transacciones</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar transacciones..."
            className="pl-10 h-12 bg-slate-900 border-slate-800 text-white"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-6 py-6">
        {isLoading ? (
          // Skeleton loader
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-4 bg-slate-900 border-slate-800 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-800 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-slate-800 rounded"></div>
                      <div className="h-3 w-24 bg-slate-800 rounded"></div>
                    </div>
                  </div>
                  <div className="h-5 w-20 bg-slate-800 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <Card className="p-8 bg-slate-900 border-slate-800 text-center">
            <p className="text-slate-400">
              {searchQuery ? 'No se encontraron transacciones' : 'No hay transacciones todavía'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx, index) => {
              const isTransfer = tx.type === 'TRANSFER';
              const isRecharge = tx.type === 'RECHARGE';
              const isReceived = isTransfer && tx.toUserEmail === session?.email;
              const isSent = isTransfer && tx.fromUserEmail === session?.email;

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSent ? 'bg-red-500/10' :
                            isReceived ? 'bg-emerald-500/10' :
                              'bg-blue-500/10'
                          }`}>
                          {isSent ? (
                            <Send className="w-6 h-6 text-red-400" />
                          ) : isReceived ? (
                            <Download className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <CreditCard className="w-6 h-6 text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{tx.description}</p>
                          <p className="text-xs text-slate-400">
                            {isTransfer && (
                              <>
                                {isSent && `Para: ${tx.toUserEmail}`}
                                {isReceived && `De: ${tx.fromUserEmail}`}
                                {' • '}
                              </>
                            )}
                            {formatTimeAgo(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-medium ${isReceived || isRecharge ? 'text-emerald-400' : 'text-slate-300'
                          }`}>
                          {isReceived || isRecharge ? '+' : '-'}${tx.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{tx.status.toLowerCase()}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
