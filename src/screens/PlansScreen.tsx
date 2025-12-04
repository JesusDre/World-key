import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import type { Screen } from '../App';
import { toast } from 'sonner';

export function PlansScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  // estado para plan seleccionado (por defecto "Start")
  const [selectedPlan, setSelectedPlan] = useState<'Start' | 'Pro' | 'Business'>('Start');

  const handleObtener = (planId: string) => {
    toast.success(`Plan solicitado: ${planId}`, { description: 'Gracias por elegir WorldKey' });
    onNavigate('settings');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-8">
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 px-6 pt-12 pb-8 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('settings')} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl">Planes Premium</h1>
        </div>
      </div>

      <div className="px-6 py-6 max-w-md mx-auto space-y-4">
        {/* Start - Gratis */}
        <Card
          onClick={() => setSelectedPlan('Start')}
          className={`p-4 bg-slate-800 border-slate-700 cursor-pointer ${selectedPlan === 'Start' ? 'border-2 border-blue-500' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-slate-400">Start</p>
              <p className="text-xs text-slate-500">Grátis</p>
            </div>
            <span className="text-2xl font-mono text-white">0$</span>
          </div>
          <ul className="text-sm text-slate-300 space-y-1 mb-4">
            <li>• 5GB de almacenamiento</li>
            <li>• Archivos tokenizados: 1</li>
          </ul>
          <Button onClick={() => handleObtener('Start')} className="w-full bg-slate-700 hover:bg-slate-600">
            Obtener
          </Button>
        </Card>

        {/* Pro - Recomendado */}
        <Card
          onClick={() => setSelectedPlan('Pro')}
          className={`p-4 bg-gradient-to-b from-blue-900/30 to-slate-800 cursor-pointer ${selectedPlan === 'Pro' ? 'border-2 border-blue-500' : 'border-slate-700'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-white">Pro</p>
                <span className="text-xs text-blue-200 bg-blue-600/20 px-2 rounded">Recomendado</span>
              </div>
              <p className="text-xs text-blue-300">Mejor balance</p>
            </div>
            <span className="text-2xl font-mono text-white">4.99 USD</span>
          </div>
          <ul className="text-sm text-slate-300 space-y-1 mb-4">
            <li>• 10GB de almacenamiento</li>
            <li>• Archivos tokenizados: 5-10</li>
          </ul>
          <Button onClick={() => handleObtener('Pro')} className="w-full bg-emerald-500 hover:bg-emerald-600">
            Obtener
          </Button>
        </Card>

        {/* Business - La mejor elección */}
        <Card
          onClick={() => setSelectedPlan('Business')}
          className={`p-4 bg-slate-800 border-slate-700 cursor-pointer ${selectedPlan === 'Business' ? 'border-2 border-blue-500' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-slate-400">Business</p>
              <p className="text-xs text-slate-500">La mejor elección</p>
            </div>
            <span className="text-2xl font-mono text-white">12.99$</span>
          </div>
          <ul className="text-sm text-slate-300 space-y-1 mb-4">
            <li>• 15GB de almacenamiento</li>
            <li>• Archivos tokenizados: Ilimitado</li>
          </ul>
          <p className="text-xs text-slate-400 mb-3">Precio a convenir / Contacta ventas</p>
          <Button onClick={() => handleObtener('Business')} className="w-full bg-blue-500 hover:bg-blue-600">
            Obtener
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default PlansScreen;
