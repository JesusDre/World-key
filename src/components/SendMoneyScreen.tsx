import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, User, Fingerprint, QrCode, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { Screen } from '../App';
import type { AuthSession } from '../types/auth';
import { toast } from 'sonner';
import { QRScanner } from './QRScanner';
import { apiRequest } from '../services/api';

interface SendMoneyScreenProps {
  onNavigate: (screen: Screen) => void;
  session?: AuthSession;
}

export function SendMoneyScreen({ onNavigate, session }: SendMoneyScreenProps) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  const [balance, setBalance] = useState<number>(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load balance
    if (session?.token) {
      apiRequest('/wallet/balance', {
        method: 'GET',
        token: session.token
      })
        .then((data: any) => {
          setBalance(data.balance || 0);
        })
        .catch(err => console.error('Error loading balance:', err));
    }
  }, [session]);

  const handleSend = async () => {
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (parseFloat(amount) > balance) {
      setError('Saldo insuficiente');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response: any = await apiRequest('/wallet/transfer', {
        method: 'POST',
        token: session?.token,
        body: {
          toUserEmail: recipient,
          amount: parseFloat(amount),
          description: description || 'Transferencia WorldKey'
        }
      });

      if (response.success) {
        setSuccess(true);
        toast.success('Transferencia exitosa', {
          description: `$${amount} enviado a ${recipient}`
        });
        setTimeout(() => {
          onNavigate('dashboard');
        }, 2000);
      } else {
        setError(response.message || 'Error al procesar la transferencia');
      }
    } catch (err: any) {
      console.error('Transfer error:', err);
      setError(err.message || 'Error al procesar la transferencia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = (data: string) => {
    // Assume QR contains email
    setRecipient(data);
    setShowScanner(false);
    toast.success('Código QR escaneado');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900/40 px-6 pt-12 pb-8 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Enviar Dinero</h1>
              <p className="text-sm text-slate-400">Saldo disponible: ${balance.toFixed(2)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowScanner(true)}
            className="rounded-full bg-slate-800/50 hover:bg-slate-800 text-emerald-400"
          >
            <QrCode className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {!showConfirm ? (
        <div className="px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/50 rounded-xl p-4 flex items-center gap-3"
              >
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-medium">¡Transferencia exitosa!</p>
                  <p className="text-sm text-slate-400">Redirigiendo...</p>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-3"
              >
                <AlertCircle className="w-6 h-6 text-red-400" />
                <p className="text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Amount Input */}
            <div>
              <Label className="text-slate-400 mb-2">Cantidad a enviar</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-slate-400">$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-16 pl-12 pr-16 text-3xl bg-slate-900 border-slate-800 text-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">MXN</span>
              </div>
              {parseFloat(amount) > balance && (
                <p className="text-xs text-red-400 mt-2">Saldo insuficiente</p>
              )}
            </div>

            {/* Recipient */}
            <div>
              <Label className="text-slate-400 mb-2">Destinatario</Label>
              <div className="flex gap-2">
                <Input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Email del destinatario"
                  className="h-12 bg-slate-900 border-slate-800 text-white"
                />
                <Button
                  variant="outline"
                  className="h-12 w-12 border-slate-800 bg-slate-900 hover:bg-slate-800 px-0"
                  onClick={() => setShowScanner(true)}
                >
                  <QrCode className="w-5 h-5 text-slate-400" />
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Ingresa el email del destinatario o escanea su código QR
              </p>
            </div>

            {/* Description */}
            <div>
              <Label className="text-slate-400 mb-2">Descripción (opcional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Pago de cena"
                className="h-12 bg-slate-900 border-slate-800 text-white"
              />
            </div>

            {/* Summary */}
            {amount && parseFloat(amount) > 0 && (
              <Card className="p-4 bg-slate-900 border-slate-800">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monto a enviar</span>
                    <span className="text-white">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Comisión</span>
                    <span className="text-emerald-400">$0.00</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between">
                    <span className="text-white font-medium">Total</span>
                    <span className="text-lg text-white">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Submit Button */}
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!amount || !recipient || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white gap-2 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              Continuar
            </Button>
          </motion.div>
        </div>
      ) : (
        <div className="px-6 py-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                <Send className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl mb-2">Confirmar Envío</h2>
              <p className="text-slate-400">Revisa los detalles antes de confirmar</p>
            </div>

            <Card className="p-6 bg-slate-900 border-slate-800">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="text-slate-400">Enviar</span>
                  <span className="text-3xl text-white">${parseFloat(amount).toFixed(2)}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-400">Para</p>
                      <p className="text-sm text-white">{recipient}</p>
                    </div>
                  </div>

                  {description && (
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Descripción</p>
                      <p className="text-sm text-white">{description}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Comisión</span>
                    <span className="text-emerald-400">$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">Total a enviar</span>
                    <span className="text-lg text-white">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Biometric Confirmation */}
            <div className="text-center py-6">
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50 hover:border-emerald-500 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                ) : (
                  <Fingerprint className="w-12 h-12 text-emerald-400" />
                )}
              </button>
              <p className="text-sm text-slate-400">
                {isLoading ? 'Procesando...' : 'Confirma con tu huella o Face ID'}
              </p>
            </div>

            <Button
              onClick={() => setShowConfirm(false)}
              variant="outline"
              disabled={isLoading}
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
