import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Mail, Eye, EyeOff, Wallet } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { toast } from "sonner";
import { RecoveryScreen } from "./RecoveryScreen";
import { useSoroban } from "../hooks/useSoroban";
import { login as loginRequest, register as registerRequest, googleLogin, googleRegister } from "../services/auth";
import type { AuthSession } from "../types/auth";
import { GoogleLogin } from '@react-oauth/google';

interface LoginProps {
  onLogin: (session: AuthSession) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);

  const { connectWallet: connectWalletCtx, registerIdentity, refresh, setAuthSession } = useSoroban();

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      const authSession = await loginRequest({ email, password });

      // Try to connect wallet if possible, but don't block login
      try {
        await connectWalletCtx();
        await refresh();
      } catch (e) {
        console.log("Wallet connection skipped during login");
      }

      toast.success('¡Bienvenido a WorldKey!');

      const session: AuthSession = {
        token: authSession.token,
        fullName: authSession.fullName,
        publicKey: authSession.publicKey,
        email,
      };
      setAuthSession(session);
      onLogin(session);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Login error:', err);
      toast.error('Error al iniciar sesión', {
        description: err.message || 'Verifica tus credenciales'
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
      // For email signup, we still try to register identity if wallet is present, 
      // but we can also proceed with just DB registration if we want to allow non-web3 users.
      // Current flow requires wallet for identity registration.
      // Let's try to connect wallet first.
      let publicKey = "";
      try {
        const wallet = await connectWalletCtx();
        publicKey = wallet.publicKey;
        await registerIdentity({ name, email });
      } catch (e) {
        console.log("Wallet registration skipped/failed");
        // If we want to allow signup without wallet, we need to handle empty public key in backend
        // For now, let's assume we want to encourage wallet connection but allow proceed?
        // The backend register endpoint expects a public key.
        // If we want purely email signup, we might need to adjust backend or generate a key.
        // For now, let's warn user.
        // toast.warning("Sin wallet conectada, algunas funciones estarán limitadas.");
      }

      const authSession = await registerRequest({
        email,
        password,
        fullName: name,
        publicKey: publicKey,
      });

      toast.success('¡Cuenta creada exitosamente!');

      setIsSignup(false);
      const session: AuthSession = {
        token: authSession.token,
        fullName: authSession.fullName,
        publicKey: authSession.publicKey,
        email,
      };
      setAuthSession(session);
      onLogin(session);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Signup error:', err);
      toast.error('Error al crear cuenta', {
        description: err.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setIsLoading(true);
    try {
      const wallet = await connectWalletCtx();
      const profile = await refresh();

      if (profile) {
        // User exists on chain, but we need a backend session.
        // This part is tricky because we don't have a "login with wallet" endpoint in backend yet 
        // that issues a JWT without a password/signature.
        // For now, we can just simulate a session or we need to implement wallet-auth in backend.
        // Let's just show a toast for now as "Coming Soon" or implement a signature challenge.
        toast.info("Login con Wallet próximamente. Por favor usa Google o Email.");
      } else {
        toast.info("Wallet conectada. Por favor regístrate para crear tu identidad.");
      }
    } catch (e) {
      toast.error("No se pudo conectar la wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      if (!credentialResponse.credential) throw new Error("No credential received");
      const token = credentialResponse.credential;

      try {
        // Intentar login
        const authSession = await googleLogin({ token });

        // Decode token to get photo
        let photoUrl = "";
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          photoUrl = payload.picture;
        } catch (e) {
          console.log("Error parsing JWT for photo", e);
        }

        const session: AuthSession = {
          token: authSession.token,
          fullName: authSession.fullName,
          publicKey: authSession.publicKey,
          email: "Google Account",
          photoUrl
        };
        setAuthSession(session);
        onLogin(session);
        toast.success('¡Bienvenido a WorldKey!');
      } catch (e) {
        console.log("Google login failed, trying registration...", e);

        // Register directly
        try {
          // Try to connect wallet silently for public key
          let publicKey = "";
          try {
            const wallet = await connectWalletCtx();
            publicKey = wallet.publicKey;
          } catch (wErr) {
            console.log("No wallet for google register");
          }

          const authSession = await googleRegister({
            token,
            publicKey: publicKey
          });

          // Decode token to get photo
          let photoUrl = "";
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            photoUrl = payload.picture;
          } catch (e) {
            console.log("Error parsing JWT for photo", e);
          }

          const session: AuthSession = {
            token: authSession.token,
            fullName: authSession.fullName,
            publicKey: authSession.publicKey || "",
            email: "Google Account",
            photoUrl
          };
          setAuthSession(session);
          onLogin(session);
          toast.success('¡Cuenta creada exitosamente!');
        } catch (finalError: any) {
          console.error(finalError);
          toast.error("Error en el registro: " + (finalError.message || "Intente nuevamente"));
        }
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Error con Google: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (showRecovery) {
    return <RecoveryScreen onBack={() => setShowRecovery(false)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-emerald-400 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">WorldKey</h1>
          <p className="text-slate-400">
            {isSignup ? 'Crea tu identidad digital' : 'Accede a tu cuenta'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <Card className="p-6 bg-slate-900/80 backdrop-blur-xl border-slate-800 shadow-xl">

            {/* Google Login Button */}
            <div className="mb-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Login Failed")}
                theme="filled_black"
                shape="pill"
                width="300"
                text={isSignup ? "signup_with" : "signin_with"}
              />
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">O continúa con email</span>
              </div>
            </div>

            <div className="space-y-4">
              {isSignup && (
                <div>
                  <Label className="text-slate-400 mb-2">Nombre completo</Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="h-11 bg-slate-950/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-emerald-500/20"
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
                  className="h-11 bg-slate-950/50 border-slate-700 text-white focus:border-emerald-500 focus:ring-emerald-500/20"
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
                    className="h-11 bg-slate-950/50 border-slate-700 text-white pr-12 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              onClick={isSignup ? handleSignup : handleEmailLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white h-11 mt-6 mb-4 font-medium shadow-lg shadow-blue-900/20"
            >
              {isLoading ? 'Procesando...' : (isSignup ? 'Crear Cuenta' : 'Iniciar Sesión')}
            </Button>

            <button
              onClick={() => setIsSignup(!isSignup)}
              className="w-full text-center text-sm text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {isSignup ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </Card>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              className="text-slate-500 hover:text-white text-sm"
              onClick={handleWalletLogin}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Conectar Wallet (Solo Web3)
            </Button>
          </div>

        </motion.div>
      </div>

      <div className="px-8 pb-8 text-center">
        <button
          onClick={() => setShowRecovery(true)}
          className="text-slate-500 hover:text-emerald-400 text-sm transition-colors"
        >
          ¿Problemas para acceder?
        </button>
      </div>
    </div>
  );
}

function shorten(value: string, size = 4): string {
  if (!value) return "";
  return `${value.slice(0, size)}…${value.slice(-size)}`;
}
