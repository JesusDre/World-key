import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, QrCode, Copy, Share2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { Screen } from '../App';
import { toast } from 'sonner';

interface ReceiveMoneyScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function ReceiveMoneyScreen({ onNavigate }: ReceiveMoneyScreenProps) {
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [copied, setCopied] = useState(false);

  const worldKeyID = 'WK-7F2A8E3B9C';
  const paymentLink = `worldkey.app/pay/${worldKeyID}`;

  const handleCopy = (text: string) => {
    // Fallback method for copying text when Clipboard API is blocked
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      
      setCopied(true);
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn(err);
      toast.error('No se pudo copiar', {
        description: 'Por favor, copia el texto manualmente'
      });
    }
  };

  const handleShare = () => {
    toast.success('Enlace compartido', {
      description: 'El enlace de pago ha sido compartido'
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 px-6 pt-12 pb-8 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl">Recibir Dinero</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* QR Code */}
          <Card className="p-8 bg-slate-900 border-slate-800">
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-4">Escanea este código QR</p>
              <div className="w-64 h-64 mx-auto bg-white rounded-2xl flex items-center justify-center mb-4">
                <QrCode className="w-48 h-48 text-blue-600" />
              </div>
              <p className="text-xs text-slate-400">
                O comparte tu WorldKey ID
              </p>
            </div>
          </Card>

          {/* WorldKey ID */}
          <div>
            <Label className="text-slate-400 mb-2">Tu WorldKey ID</Label>
            <div className="flex gap-2">
              <Input
                value={worldKeyID}
                readOnly
                className="h-12 bg-slate-900 border-slate-800 text-white"
              />
              <Button
                onClick={() => handleCopy(worldKeyID)}
                className="h-12 px-4 bg-slate-800 hover:bg-slate-700"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Request Amount (Optional) */}
          <div>
            <Label className="text-slate-400 mb-2">Solicitar cantidad específica (opcional)</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">$</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-14 pl-12 pr-16 text-2xl bg-slate-900 border-slate-800 text-white"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">MXN</span>
            </div>
          </div>

          {/* Concept */}
          <div>
            <Label className="text-slate-400 mb-2">Concepto (opcional)</Label>
            <Input
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej: Pago de servicio"
              className="h-12 bg-slate-900 border-slate-800 text-white"
            />
          </div>

          {/* Payment Link */}
          {(amount || concept) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <Card className="p-4 bg-blue-900/20 border-blue-500/30">
                <p className="text-sm text-white mb-2">Enlace de pago personalizado</p>
                <div className="flex gap-2">
                  <Input
                    value={`${paymentLink}?amount=${amount}${concept ? `&concept=${encodeURIComponent(concept)}` : ''}`}
                    readOnly
                    className="h-10 bg-slate-900 border-slate-800 text-white text-xs"
                  />
                  <Button
                    onClick={() => handleCopy(`${paymentLink}?amount=${amount}${concept ? `&concept=${encodeURIComponent(concept)}` : ''}`)}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Share Button */}
          <Button
            onClick={handleShare}
            className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white gap-2"
          >
            <Share2 className="w-5 h-5" />
            Compartir Enlace de Pago
          </Button>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Card className="p-4 bg-slate-900 border-slate-800 text-center">
              <Download className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-white mb-1">Sin comisión</p>
              <p className="text-xs text-slate-400">Al recibir pagos</p>
            </Card>
            <Card className="p-4 bg-slate-900 border-slate-800 text-center">
              <QrCode className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-white mb-1">Instantáneo</p>
              <p className="text-xs text-slate-400">Recibes al momento</p>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
