import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, User, Fingerprint, CreditCard, QrCode } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Screen } from '../App';
import { toast } from 'sonner';
import { QRScanner } from './QRScanner';

interface SendMoneyScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function SendMoneyScreen({ onNavigate }: SendMoneyScreenProps) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [concept, setConcept] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('1');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const paymentMethods = [
    { id: '1', type: 'Visa', last4: '4242', balance: 2450.00 },
    { id: '2', type: 'Mastercard', last4: '8888', balance: 1230.50 },
    { id: '3', type: 'Cuenta Bancaria', last4: '1234', balance: 5420.00 },
  ];

  const handleSend = () => {
    // Simulate biometric confirmation
    toast.success('Pago enviado exitosamente', {
      description: `$${amount} enviado a ${recipient}`
    });
    setShowConfirm(false);
    setTimeout(() => onNavigate('dashboard'), 1500);
  };

  const handleScan = (data: string) => {
    setRecipient(data);
    setShowScanner(false);
    toast.success('Código QR escaneado');
  };

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);
  const fee = parseFloat(amount) * 0.01; // 1% fee
  const total = parseFloat(amount) + fee;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
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
            <h1 className="text-2xl">Enviar Dinero</h1>
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
            </div>

            {/* Recipient */}
            <div>
              <Label className="text-slate-400 mb-2">Destinatario</Label>
              <div className="flex gap-2">
                <Input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="WorldKey ID, correo o RFC"
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
                Ingresa el identificador del destinatario o escanea un QR
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <Label className="text-slate-400 mb-2">Método de pago</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger className="h-12 bg-slate-900 border-slate-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.type} •••• {method.last4} (${method.balance.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Concept */}
            <div>
              <Label className="text-slate-400 mb-2">Concepto (opcional)</Label>
              <Input
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej: Pago de cena"
                className="h-12 bg-slate-900 border-slate-800 text-white"
              />
            </div>

            {/* Summary */}
            {amount && parseFloat(amount) > 0 && (
              <Card className="p-4 bg-slate-900 border-slate-800">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Comisión (1%)</span>
                    <span className="text-white">${fee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between">
                    <span className="text-white">Total</span>
                    <span className="text-lg text-white">${total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Submit Button */}
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!amount || !recipient || parseFloat(amount) <= 0}
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
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

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-400">Desde</p>
                      <p className="text-sm text-white">
                        {selectedMethodData?.type} •••• {selectedMethodData?.last4}
                      </p>
                    </div>
                  </div>

                  {concept && (
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Concepto</p>
                      <p className="text-sm text-white">{concept}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Comisión</span>
                    <span>${fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">Total a pagar</span>
                    <span className="text-lg text-white">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Biometric Confirmation */}
            <div className="text-center py-6">
              <button
                onClick={handleSend}
                className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50 hover:border-emerald-500 transition-all hover:scale-105 active:scale-95"
              >
                <Fingerprint className="w-12 h-12 text-emerald-400" />
              </button>
              <p className="text-sm text-slate-400">
                Confirma con tu huella o Face ID
              </p>
            </div>

            <Button
              onClick={() => setShowConfirm(false)}
              variant="outline"
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
