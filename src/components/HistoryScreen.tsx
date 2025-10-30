import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Send, 
  Download, 
  FileText, 
  Shield,
  Filter,
  Search,
  Eye,
  ChevronRight
} from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import type { Screen } from '../App';

interface HistoryScreenProps {
  onNavigate: (screen: Screen) => void;
  accessToken?: string;
}

interface HistoryItem {
  id: string;
  type: 'payment-sent' | 'payment-received' | 'document-shared' | 'document-access' | 'access-revoked' | 'document-registered';
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
  hash: string;
  from?: string;
  to?: string;
  documentType?: string;
  rfcVerified?: boolean;
  blockchainVerified?: boolean;
}

export function HistoryScreen({ onNavigate, accessToken }: HistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (accessToken) {
      loadHistory();
    }
  }, [accessToken]);

  const loadHistory = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-4118c158/transactions`;
      console.log('🔍 Cargando historial...');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Transacciones cargadas:', data.transactions?.length || 0);
        console.log('📜 Transacciones:', data.transactions);
        setHistoryItems(data.transactions || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Error al cargar historial:', errorText);
      }
    } catch (error) {
      console.error('❌ Error loading history:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment-sent':
        return <Send className="w-5 h-5 text-red-400" />;
      case 'payment-received':
        return <Download className="w-5 h-5 text-emerald-400" />;
      case 'document-shared':
      case 'document-access':
        return <Eye className="w-5 h-5 text-blue-400" />;
      case 'document-registered':
        return <FileText className="w-5 h-5 text-emerald-400" />;
      case 'access-revoked':
        return <Shield className="w-5 h-5 text-orange-400" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'payment-sent':
        return 'bg-red-500/10';
      case 'payment-received':
        return 'bg-emerald-500/10';
      case 'document-shared':
      case 'document-access':
        return 'bg-blue-500/10';
      case 'document-registered':
        return 'bg-emerald-500/10';
      case 'access-revoked':
        return 'bg-orange-500/10';
      default:
        return 'bg-slate-500/10';
    }
  };

  const paymentHistory = historyItems.filter(item => 
    item.type === 'payment-sent' || item.type === 'payment-received'
  );

  const documentHistory = historyItems.filter(item => 
    item.type === 'document-shared' || item.type === 'document-access' || item.type === 'access-revoked' || item.type === 'document-registered'
  );

  const filteredItems = (items: HistoryItem[]) => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 px-6 pt-12 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl">Historial</h1>
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

      <div className="px-6 py-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900 mb-6">
            <TabsTrigger value="all" className="text-slate-300 data-[state=active]:text-slate-900 data-[state=active]:bg-white">Todo</TabsTrigger>
            <TabsTrigger value="payments" className="text-slate-300 data-[state=active]:text-slate-900 data-[state=active]:bg-white">Pagos</TabsTrigger>
            <TabsTrigger value="documents" className="text-slate-300 data-[state=active]:text-slate-900 data-[state=active]:bg-white">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {filteredItems(historyItems).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  onClick={() => {
                    setSelectedItem(item);
                    setShowDetail(true);
                  }}
                  className="p-4 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getBackgroundColor(item.type)}`}>
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{item.title}</p>
                          <p className="text-xs text-slate-400 truncate">{item.description}</p>
                        </div>
                        {item.amount !== undefined && (
                          <p className={`text-sm ${item.amount > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {item.amount > 0 ? '+' : ''}{item.amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{item.timestamp}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="payments" className="space-y-3">
            {filteredItems(paymentHistory).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  onClick={() => {
                    setSelectedItem(item);
                    setShowDetail(true);
                  }}
                  className="p-4 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getBackgroundColor(item.type)}`}>
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{item.title}</p>
                          <p className="text-xs text-slate-400 truncate">{item.description}</p>
                        </div>
                        {item.amount !== undefined && (
                          <p className={`text-sm ${item.amount > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {item.amount > 0 ? '+' : ''}{item.amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{item.timestamp}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="documents" className="space-y-3">
            {filteredItems(documentHistory).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  onClick={() => {
                    setSelectedItem(item);
                    setShowDetail(true);
                  }}
                  className="p-4 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getBackgroundColor(item.type)}`}>
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.title}</p>
                      <p className="text-xs text-slate-400 truncate">{item.description}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.timestamp}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Detalles de la Transacción</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3 p-4 bg-slate-800 rounded-xl">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getBackgroundColor(selectedItem.type)}`}>
                  {getIcon(selectedItem.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{selectedItem.title}</p>
                  <p className="text-xs text-slate-400">{selectedItem.description}</p>
                </div>
                {selectedItem.amount !== undefined && (
                  <p className={`text-xl ${selectedItem.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {selectedItem.amount > 0 ? '+' : ''}${Math.abs(selectedItem.amount).toFixed(2)}
                  </p>
                )}
              </div>

              <Card className="p-4 bg-slate-800 border-slate-700">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Fecha y Hora</p>
                    <p className="text-white">{selectedItem.timestamp}</p>
                  </div>

                  {selectedItem.from && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">De</p>
                      <p className="text-white">{selectedItem.from}</p>
                    </div>
                  )}

                  {selectedItem.to && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Para</p>
                      <p className="text-white">{selectedItem.to}</p>
                    </div>
                  )}

                  {selectedItem.documentType && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Tipo de Documento</p>
                      <div className="flex items-center gap-2">
                        <p className="text-white">{selectedItem.documentType}</p>
                        {selectedItem.rfcVerified && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                            RFC Verificado
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-slate-400 mb-1">Hash de Transacción</p>
                    <p className="font-mono text-xs break-all text-blue-400">{selectedItem.hash}</p>
                  </div>
                </div>
              </Card>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex gap-2">
                  <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400">
                    Esta transacción está protegida con firma digital y registrada en el historial auditable.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
