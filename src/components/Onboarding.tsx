import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Wallet, FileCheck, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Wallet,
    title: 'Pagos Rápidos y Seguros',
    description: 'Envía y recibe dinero al instante con seguridad bancaria de nivel empresarial.'
  },
  {
    icon: FileCheck,
    title: 'Documentos Tokenizados',
    description: 'Almacena y comparte tus documentos oficiales de forma segura con control total.'
  },
  {
    icon: Shield,
    title: 'Control Total',
    description: 'Tú decides quién ve tus documentos y por cuánto tiempo. Revoca el acceso en cualquier momento.'
  }
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onAnimationComplete={() => {
            setTimeout(() => setShowSplash(false), 1500);
          }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-emerald-400 rounded-3xl flex items-center justify-center"
          >
            <Shield className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-white text-5xl mb-2">WorldKey</h1>
          <p className="text-emerald-300">Tu identidad segura</p>
        </motion.div>
      </motion.div>
    );
  }

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-md"
          >
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-500/20 to-emerald-400/20 rounded-full flex items-center justify-center border-2 border-blue-500/30">
              <CurrentIcon className="w-16 h-16 text-emerald-400" />
            </div>
            <h2 className="text-3xl mb-4">{slides[currentSlide].title}</h2>
            <p className="text-slate-300 text-lg">{slides[currentSlide].description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-8 pb-12">
        <div className="flex gap-2 justify-center mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-8 bg-emerald-400' : 'w-2 bg-slate-600'
              }`}
            />
          ))}
        </div>

        {currentSlide < slides.length - 1 ? (
          <Button
            onClick={() => setCurrentSlide(currentSlide + 1)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-14 gap-2"
          >
            Siguiente
            <ChevronRight className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            onClick={onComplete}
            className="w-full bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white h-14"
          >
            Comenzar
          </Button>
        )}

        {currentSlide === 0 && (
          <Button
            onClick={onComplete}
            variant="ghost"
            className="w-full mt-4 text-slate-400 hover:text-white"
          >
            Omitir
          </Button>
        )}
      </div>
    </div>
  );
}
