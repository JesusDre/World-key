import { useState } from 'react';
import { motion } from 'motion/react';
import { Fingerprint, Lock, Shield, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { RecoveryScreen } from './RecoveryScreen';

interface LoginProps {
  onLogin: (accessToken: string, userId: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'biometric' | 'pin' | 'email'>('biometric');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);

  const handleBiometricLogin = () => {
    // Simular autenticación biométrica - en producción usarías Web Authentication API
    toast.success('Autenticación biométrica exitosa');
    setTimeout(() => {
      // Por ahora usamos un token demo - cambiar a login real después
      setMode('email');
      toast.info('Por favor, inicia sesión con email para la demo');
    }, 500);
  };

  const handlePinLogin = async () => {
    if (pin.length !== 6) return;
    
    toast.success('PIN verificado');
    setTimeout(() => {
      setMode('email');
      toast.info('Por favor, inicia sesión con email');
    }, 300);
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-4118c158/login`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      toast.success('¡Bienvenido a WorldKey!');
      onLogin(data.accessToken, data.user.id);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Error al iniciar sesión', {
        description: error.message || 'Verifica tus credenciales'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !name) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-4118c158/signup`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear cuenta');
      }

      toast.success('¡Cuenta creada exitosamente!', {
        description: 'Ahora puedes iniciar sesión'
      });
      
      setIsSignup(false);
      // Auto login después de registro
      setTimeout(() => handleEmailLogin(), 500);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error('Error al crear cuenta', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showRecovery) {
    return <RecoveryScreen onBack={() => setShowRecovery(false)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-emerald-400 rounded-3xl flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl mb-2">WorldKey</h1>
          <p className="text-slate-400">
            {isSignup ? 'Crea tu cuenta segura' : 'Acceso seguro a tu cuenta'}
          </p>
        </motion.div>

        {mode === 'biometric' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center w-full max-w-sm"
          >
            <button
              onClick={handleBiometricLogin}
              className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-emerald-400/20 rounded-full flex items-center justify-center border-2 border-emerald-400/50 hover:border-emerald-400 transition-all hover:scale-105 active:scale-95"
            >
              <Fingerprint className="w-16 h-16 text-emerald-400" />
            </button>
            <p className="text-lg mb-2">Accede con tu huella</p>
            <p className="text-slate-400 text-sm mb-8">o reconocimiento facial</p>

            <div className="space-y-3">
              <Button
                onClick={() => setMode('pin')}
                variant="outline"
                className="w-full border-slate-600 bg-slate-900/50 text-white hover:bg-white hover:text-slate-900 hover:border-white transition-all"
              >
                <Lock className="w-4 h-4 mr-2" />
                Usar PIN
              </Button>
              
              <Button
                onClick={() => setMode('email')}
                variant="outline"
                className="w-full border-slate-600 bg-slate-900/50 text-white hover:bg-white hover:text-slate-900 hover:border-white transition-all"
              >
                <Mail className="w-4 h-4 mr-2" />
                Usar Email
              </Button>
            </div>
          </motion.div>
        )}

        {mode === 'pin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <div className="mb-6">
                <Label className="text-slate-400 mb-2">PIN de 6 dígitos</Label>
                <Input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="h-14 text-center text-2xl tracking-widest bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <Button
                onClick={handlePinLogin}
                disabled={pin.length !== 6}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 mb-3"
              >
                Ingresar
              </Button>

              <Button
                onClick={() => setMode('biometric')}
                variant="ghost"
                className="w-full text-slate-400 hover:text-white"
              >
                <Fingerprint className="w-4 h-4 mr-2" />
                Usar biometría
              </Button>
            </Card>
          </motion.div>
        )}

        {mode === 'email' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <div className="space-y-4">
                {isSignup && (
                  <div>
                    <Label className="text-slate-400 mb-2">Nombre completo</Label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre"
                      className="h-12 bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-slate-400 mb-2">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="h-12 bg-slate-900 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400 mb-2">Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 bg-slate-900 border-slate-700 text-white pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={isSignup ? handleSignup : handleEmailLogin}
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 mt-6 mb-3"
              >
                {isLoading ? 'Procesando...' : (isSignup ? 'Crear Cuenta' : 'Iniciar Sesión')}
              </Button>

              <button
                onClick={() => setIsSignup(!isSignup)}
                className="w-full text-center text-sm text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {isSignup ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
              </button>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <Button
                  onClick={() => setMode('biometric')}
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-white"
                >
                  <Fingerprint className="w-4 h-4 mr-2" />
                  Volver a biometría
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      <div className="px-8 pb-8 text-center">
        <button 
          onClick={() => setShowRecovery(true)}
          className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
        >
          ¿Problemas para acceder?
        </button>
      </div>
    </div>
  );
}
