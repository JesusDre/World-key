import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    CreditCard,
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import type { Screen } from '../App';
import type { AuthSession } from '../types/auth';
import { apiRequest } from '../services/api';

interface RechargeScreenProps {
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

export function RechargeScreen({ onNavigate, session }: RechargeScreenProps) {
    const [cards, setCards] = useState<WalletCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState(false);
    const [deviceSessionId, setDeviceSessionId] = useState<string>('');

    useEffect(() => {
        // Load cards
        if (session?.token) {
            apiRequest('/wallet/cards', {
                method: 'GET',
                token: session.token
            })
                .then((cardsData: any) => {
                    setCards(cardsData as WalletCard[]);
                    if (cardsData.length > 0) {
                        setSelectedCard(cardsData[0].id);
                    }
                })
                .catch(err => {
                    console.error('Error loading cards:', err);
                    setError('Error al cargar las tarjetas');
                });
        }

        // Generate device session ID for OpenPay
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        setDeviceSessionId(sessionId);
    }, [session]);

    const handleRecharge = async () => {
        if (!selectedCard || !amount || parseFloat(amount) <= 0) {
            setError('Por favor selecciona una tarjeta e ingresa un monto válido');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response: any = await apiRequest('/wallet/recharge', {
                method: 'POST',
                token: session?.token,
                body: {
                    cardId: selectedCard,
                    amount: parseFloat(amount),
                    deviceSessionId: deviceSessionId
                }
            });

            if (response.success) {
                setSuccess(true);
                setAmount('');
                setTimeout(() => {
                    onNavigate('dashboard');
                }, 2000);
            } else {
                setError(response.message || 'Error al procesar la recarga');
            }
        } catch (err: any) {
            console.error('Recharge error:', err);
            setError(err.message || 'Error al procesar la recarga');
        } finally {
            setIsLoading(false);
        }
    };

    const quickAmounts = [100, 200, 500, 1000];

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 px-6 pt-12 pb-8 border-b border-slate-800">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold">Recargar Saldo</h1>
                </div>
            </div>

            <div className="px-6 py-6 space-y-6">
                {/* Success Message */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-500/10 border border-emerald-500/50 rounded-xl p-4 flex items-center gap-3"
                    >
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                        <div>
                            <p className="text-emerald-400 font-medium">¡Recarga exitosa!</p>
                            <p className="text-sm text-slate-400">Redirigiendo al inicio...</p>
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
                <Card className="p-6 bg-slate-900 border-slate-800">
                    <label className="block text-sm text-slate-400 mb-2">Monto a recargar</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-slate-400">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-12 py-4 text-2xl text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            min="0"
                            step="0.01"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">MXN</span>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2 mt-4">
                        {quickAmounts.map((quickAmount) => (
                            <button
                                key={quickAmount}
                                onClick={() => setAmount(quickAmount.toString())}
                                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                            >
                                ${quickAmount}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Card Selection */}
                <div>
                    <label className="block text-sm text-slate-400 mb-3">Selecciona una tarjeta</label>
                    <div className="space-y-3">
                        {cards.length === 0 ? (
                            <Card className="p-6 bg-slate-900 border-slate-800 text-center">
                                <p className="text-slate-400 mb-4">No tienes tarjetas guardadas</p>
                                <Button
                                    onClick={() => onNavigate('wallet')}
                                    className="bg-emerald-500 hover:bg-emerald-600"
                                >
                                    Agregar Tarjeta
                                </Button>
                            </Card>
                        ) : (
                            cards.map((card) => (
                                <motion.div
                                    key={card.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedCard(card.id)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedCard === card.id
                                        ? 'bg-emerald-500/10 border-emerald-500'
                                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedCard === card.id
                                                ? 'bg-emerald-500/20'
                                                : 'bg-slate-800'
                                                }`}>
                                                <CreditCard className={`w-6 h-6 ${selectedCard === card.id ? 'text-emerald-400' : 'text-slate-400'
                                                    }`} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{card.brand}</p>
                                                <p className="text-sm text-slate-400">•••• {card.cardNumber.slice(-4)}</p>
                                            </div>
                                        </div>
                                        {selectedCard === card.id && (
                                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recharge Button */}
                <Button
                    onClick={handleRecharge}
                    disabled={isLoading || !selectedCard || !amount || parseFloat(amount) <= 0}
                    className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white py-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Procesando...
                        </span>
                    ) : (
                        `Recargar $${amount || '0.00'}`
                    )}
                </Button>

                {/* Info */}
                <Card className="p-4 bg-blue-500/10 border-blue-500/50">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-300">
                            <p className="font-medium mb-1">Información importante</p>
                            <ul className="space-y-1 text-blue-300/80">
                                <li>• El cargo se realizará inmediatamente</li>
                                <li>• El saldo estará disponible al instante</li>
                                <li>• Monto mínimo: $10.00 MXN</li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
