import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, CreditCard, Trash2, Wallet, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import type { Screen } from '../App';
import { useSoroban } from '../hooks/useSoroban';
import { getCards, addCard as apiAddCard, deleteCard as apiDeleteCard } from '../services/wallet';

// Declare OpenPay global
declare const OpenPay: any;

interface DigitalWalletProps {
    onNavigate: (screen: Screen) => void;
}

interface PaymentMethod {
    id: string;
    type: 'visa' | 'mastercard' | 'amex' | 'unknown';
    number: string;
    holder: string;
    expiry: string;
    color: string;
    cvv?: string;
}



export function DigitalWallet({ onNavigate }: DigitalWalletProps) {
    const { authSession } = useSoroban();
    const [cards, setCards] = useState<PaymentMethod[]>([]);

    const [showAddCard, setShowAddCard] = useState(false);
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [cardToDelete, setCardToDelete] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Form states
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [processing, setProcessing] = useState(false);

    // ... (inside component)

    useEffect(() => {
        // Initialize OpenPay sandbox
        if (typeof OpenPay !== 'undefined') {
            const merchantId = import.meta.env.VITE_OPENPAY_MERCHANT_ID;
            const publicKey = import.meta.env.VITE_OPENPAY_PUBLIC_KEY;

            if (merchantId && publicKey) {
                OpenPay.setId(merchantId);
                OpenPay.setApiKey(publicKey);
                OpenPay.setSandboxMode(true);
            } else {
                console.warn("OpenPay credentials not found in environment variables");
            }
        }

        // Fetch cards from backend
        if (authSession?.token) {
            setIsLoading(true);
            getCards(authSession.token)
                .then(backendCards => {
                    const mappedCards = backendCards.map(c => ({
                        id: c.id,
                        type: getCardType(c.brand),
                        number: c.cardNumber.slice(-4),
                        holder: c.holderName,
                        expiry: `${c.expirationMonth}/${c.expirationYear}`,
                        color: getCardColor(c.brand),
                        cvv: '***'
                    }));
                    setCards(mappedCards);
                })
                .catch(err => {
                    console.error('Error loading cards:', err);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, [authSession]);

    const handleAddCard = async () => {
        const rawCardNumber = cardNumber.replace(/\s/g, '');
        if (!rawCardNumber || rawCardNumber.length !== 16 || !cardHolder || !cardExpiry || !cardCvv) {
            toast.error('Por favor completa todos los campos correctamente');
            return;
        }

        setProcessing(true);

        try {
            const deviceSessionId = OpenPay.deviceData.setup();

            const tokenRequest = {
                card_number: cardNumber.replace(/\s/g, ''),
                holder_name: cardHolder,
                expiration_year: cardExpiry.split('/')[1],
                expiration_month: cardExpiry.split('/')[0],
                cvv2: cardCvv,
            };

            OpenPay.token.create(tokenRequest,
                async (response: any) => {
                    try {
                        const tokenId = response.data.id;
                        if (!authSession?.token) throw new Error("No auth token");

                        console.log("Sending to backend:", { tokenId, deviceSessionId });
                        const newBackendCard = await apiAddCard(authSession.token, tokenId, deviceSessionId);

                        const newCard: PaymentMethod = {
                            id: newBackendCard.id,
                            type: getCardType(newBackendCard.brand),
                            number: newBackendCard.cardNumber.slice(-4),
                            holder: newBackendCard.holderName,
                            expiry: `${newBackendCard.expirationMonth}/${newBackendCard.expirationYear}`,
                            color: getCardColor(newBackendCard.brand),
                            cvv: '***'
                        };

                        setCards([...cards, newCard]);
                        toast.success('Tarjeta guardada exitosamente');
                        setShowAddCard(false);
                        resetForm();
                    } catch (err: any) {
                        console.error("Backend error:", err);
                        const status = err.response?.status;
                        const message = err.response?.data?.message || err.message || 'Desconocido';
                        toast.error(`Error ${status || ''}: ${message}`);
                    } finally {
                        setProcessing(false);
                    }
                },
                (error: any) => {
                    console.error(error);
                    toast.error('Error de OpenPay: ' + error.data.description);
                    setProcessing(false);
                }
            );
        } catch (e) {
            console.error(e);
            toast.error('Error interno');
            setProcessing(false);
        }
    };

    const resetForm = () => {
        setCardNumber('');
        setCardHolder('');
        setCardExpiry('');
        setCardCvv('');
    };

    const getCardType = (brand: string): any => {
        const b = brand.toLowerCase();
        if (b.includes('visa')) return 'visa';
        if (b.includes('master')) return 'mastercard';
        if (b.includes('amex')) return 'amex';
        return 'unknown';
    };

    const getCardColor = (brand: string) => {
        const b = brand.toLowerCase();
        if (b.includes('visa')) return 'from-blue-600 to-blue-900';
        if (b.includes('master')) return 'from-orange-600 to-red-900';
        if (b.includes('amex')) return 'from-slate-600 to-slate-800';
        return 'from-emerald-600 to-teal-900';
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            {/* Header */}
            <div className="px-6 pt-12 pb-6 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate('dashboard')} className="p-2 hover:bg-slate-800 rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold">Mi Cartera</h1>
                </div>
                <Button
                    onClick={() => setShowAddCard(true)}
                    size="icon"
                    className="rounded-full bg-emerald-500 hover:bg-emerald-600"
                >
                    <Plus className="w-5 h-5" />
                </Button>
            </div>



            {/* Content */}
            <div className="px-4 py-8 max-w-md mx-auto min-h-[600px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key="cards"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6 relative perspective-1000"
                    >
                            {isLoading ? (
                                <div className="text-center py-20">
                                    <div className="relative w-32 h-32 mx-auto mb-6">
                                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                                        <div className="relative w-full h-full bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center">
                                            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Cargando tarjetas...</h3>
                                    <p className="text-slate-400">Un momento por favor</p>
                                </div>
                            ) : cards.length > 0 ? (
                                cards.map((card, index) => (
                                    <motion.div
                                        key={card.id}
                                        layoutId={card.id}
                                        onClick={() => {
                                            if (selectedCard === card.id) {
                                                setIsFlipped(!isFlipped);
                                            } else {
                                                setSelectedCard(card.id);
                                                setIsFlipped(false);
                                            }
                                        }}
                                        initial={{ y: index * 20, scale: 1 - index * 0.03, zIndex: cards.length - index }}
                                        animate={{
                                            y: selectedCard === card.id ? 0 : index * 20,
                                            scale: selectedCard === card.id ? 1 : (selectedCard ? 0.92 : 1 - index * 0.03),
                                            zIndex: selectedCard === card.id ? 100 : cards.length - index,
                                            rotateX: selectedCard === card.id ? 0 : 3,
                                            rotateY: isFlipped && selectedCard === card.id ? 180 : 0
                                        }}
                                        className={`relative w-full aspect-[1.58/1] cursor-pointer transition-all duration-500`}
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        {/* Front Face */}
                                        <div
                                            className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br ${card.color} p-6 sm:p-8 shadow-2xl border border-white/10 flex flex-col justify-between`}
                                            style={{ backfaceVisibility: 'hidden' }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="w-12 h-8 sm:w-14 sm:h-9 bg-yellow-400/80 rounded-md flex items-center justify-center shadow-inner">
                                                    <div className="w-8 h-5 sm:w-10 sm:h-6 border border-yellow-600/50 rounded-sm" />
                                                </div>
                                                <span className="text-lg sm:text-2xl font-bold italic opacity-80 tracking-wider">{card.type.toUpperCase()}</span>
                                            </div>

                                            <div>
                                                <p className="text-xl sm:text-3xl tracking-widest font-mono mb-4 sm:mb-6 text-shadow-sm truncate">•••• •••• •••• {card.number}</p>
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[10px] sm:text-xs opacity-70 uppercase tracking-wider mb-1">Titular</p>
                                                        <p className="font-medium tracking-wide text-sm sm:text-lg truncate max-w-[120px] sm:max-w-[200px]">{card.holder}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] sm:text-xs opacity-70 uppercase tracking-wider mb-1">Expira</p>
                                                        <p className="font-medium text-sm sm:text-lg">{card.expiry}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Back Face */}
                                        <div
                                            className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br ${card.color} shadow-2xl border border-white/10`}
                                            style={{
                                                backfaceVisibility: 'hidden',
                                                transform: 'rotateY(180deg)'
                                            }}
                                        >
                                            <div className="w-full h-12 bg-black/80 mt-6" />
                                            <div className="px-8 mt-6">
                                                <div className="flex justify-end items-center gap-4">
                                                    <p className="text-xs uppercase opacity-70">CVV</p>
                                                    <div className="bg-white text-black font-mono px-3 py-1 rounded text-sm font-bold">
                                                        {card.cvv || '123'}
                                                    </div>
                                                </div>
                                                <div className="mt-4 h-8 bg-white/20 rounded w-3/4" />
                                                <p className="text-[10px] mt-4 opacity-60 text-justify leading-tight">
                                                    Esta tarjeta es intransferible y su uso está sujeto a los términos y condiciones del contrato.
                                                    Si encuentra esta tarjeta, por favor devuélvala a la sucursal más cercana.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Delete Button (Only visible when selected and NOT flipped) */}
                                        {selectedCard === card.id && !isFlipped && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCardToDelete(card.id);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </motion.button>
                                        )}
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-20">
                                    <div className="relative w-32 h-32 mx-auto mb-6">
                                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                                        <div className="relative w-full h-full bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center">
                                            <Wallet className="w-16 h-16 text-emerald-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Tu cartera está vacía</h3>
                                    <p className="text-slate-400 max-w-xs mx-auto mb-8">
                                        Agrega tus tarjetas de crédito o débito para realizar pagos seguros y rápidos.
                                    </p>
                                    <Button
                                        onClick={() => setShowAddCard(true)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 rounded-full text-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Agregar mi primera tarjeta
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                </AnimatePresence>
            </div>

            {/* Add Card Dialog */}
            <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md z-[200]">
                    <DialogHeader>
                        <DialogTitle>Agregar Nueva Tarjeta</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label>Número de Tarjeta</Label>
                            <div className="relative">
                                <Input
                                    name="card-number"
                                    autoComplete="cc-number"
                                    value={cardNumber}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                                        const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                                        setCardNumber(formatted);
                                    }}
                                    maxLength={19}
                                    placeholder="0000 0000 0000 0000"
                                    className="bg-slate-800 border-slate-700 text-white pl-10"
                                />
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <Label>Nombre del Titular</Label>
                            <Input
                                name="cc-name"
                                autoComplete="cc-name"
                                value={cardHolder}
                                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                placeholder="NOMBRE APELLIDO"
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Expiración (MM/YY)</Label>
                                <Input
                                    name="cc-exp"
                                    autoComplete="cc-exp"
                                    value={cardExpiry}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/\D/g, '');
                                        if (value.length >= 2) {
                                            value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                        }
                                        setCardExpiry(value);
                                    }}
                                    placeholder="MM/YY"
                                    maxLength={5}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                            <div>
                                <Label>CVV</Label>
                                <Input
                                    name="cc-csc"
                                    autoComplete="cc-csc"
                                    value={cardCvv}
                                    onChange={(e) => setCardCvv(e.target.value)}
                                    type="password"
                                    maxLength={4}
                                    placeholder="123"
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleAddCard}
                            disabled={processing}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 mt-4"
                        >
                            {processing ? 'Procesando...' : 'Guardar Tarjeta'}
                        </Button>

                        <p className="text-xs text-center text-slate-500 mt-2">
                            Procesado de forma segura por OpenPay
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={cardToDelete !== null} onOpenChange={(open) => !open && setCardToDelete(null)}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-sm z-[200]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center">¿Eliminar tarjeta?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-center text-slate-400">
                            Esta acción no se puede deshacer. La tarjeta será eliminada permanentemente de tu cartera.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setCardToDelete(null)}
                                className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={async () => {
                                    if (!cardToDelete || !authSession?.token) return;

                                    try {
                                        await apiDeleteCard(authSession.token, cardToDelete);
                                        setCards(cards.filter(c => c.id !== cardToDelete));
                                        setSelectedCard(null);
                                        setCardToDelete(null);
                                        toast.success('Tarjeta eliminada exitosamente');
                                    } catch (error) {
                                        console.error('Error deleting card:', error);
                                        toast.error('Error al eliminar la tarjeta');
                                    }
                                }}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                            >
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
