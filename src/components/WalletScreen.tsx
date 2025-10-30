import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, CreditCard, CheckCircle, Trash2, ArrowUpRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import type { Screen } from '../App';
import { toast } from 'sonner';

interface WalletScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function WalletScreen({ onNavigate }: WalletScreenProps) {
  const [methods, setMethods] = useState([
    { id: 1, type: 'Visa', number: '4242', balance: 2450.00, verified: true, color: 'from-blue-600 to-blue-800' },
    { id: 2, type: 'Mastercard', number: '8888', balance: 1230.50, verified: true, color: 'from-orange-600 to-red-700' },
    { id: 3, type: 'Cuenta Bancaria', number: '1234', balance: 5420.00, verified: true, color: 'from-emerald-600 to-teal-700' },
  ]);

  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAddCard = () => {
    toast.success('Tarjeta añadida correctamente', {
      description: 'Tu método de pago ha sido verificado'
    });
    setShowAddDialog(false);
  };

  const handleRemoveMethod = (id: number) => {
    setMethods(methods.filter(m => m.id !== id));
    toast.success('Método de pago eliminado');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 px-6 pt-12 pb-8 border-b border-slate-800">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl">Wallet</h1>
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-400 mb-2">Balance Total</p>
          <h2 className="text-5xl mb-1">
            ${methods.reduce((sum, m) => sum + m.balance, 0).toFixed(2)}
          </h2>
          <p className="text-emerald-400 text-sm">MXN</p>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Add Method Button */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6 bg-emerald-500 hover:bg-emerald-600 h-12 gap-2">
              <Plus className="w-5 h-5" />
              Agregar Método de Pago
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Agregar Tarjeta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Número de Tarjeta</Label>
                <Input
                  placeholder="1234 5678 9012 3456"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vencimiento</Label>
                  <Input
                    placeholder="MM/AA"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input
                    type="password"
                    placeholder="•••"
                    maxLength={3}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div>
                <Label>Nombre del Titular</Label>
                <Input
                  placeholder="Como aparece en la tarjeta"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddCard}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                >
                  Agregar
                </Button>
              </div>
              <p className="text-xs text-slate-400 text-center">
                🔒 Tu información está protegida con encriptación de nivel bancario
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Methods */}
        <div className="space-y-4">
          <h3 className="text-lg text-white mb-4">Métodos de Pago</h3>
          
          {methods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-gradient-to-br ${method.color} border-0 p-6 text-white`}>
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <p className="text-sm opacity-80 mb-1">{method.type}</p>
                    <p className="text-xl">•••• {method.number}</p>
                  </div>
                  {method.verified && (
                    <Badge className="bg-white/20 text-white border-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verificada
                    </Badge>
                  )}
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm opacity-80 mb-1">Balance Disponible</p>
                    <p className="text-3xl">${method.balance.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRemoveMethod(method.id)}
                      className="p-2 bg-white/10 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Security Info */}
        <Card className="mt-6 p-4 bg-blue-900/20 border-blue-500/30">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm mb-1">Métodos Verificados</p>
              <p className="text-xs text-slate-400">
                Todos tus métodos de pago están protegidos con tokenización bancaria.
                No almacenamos tu CVV.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
