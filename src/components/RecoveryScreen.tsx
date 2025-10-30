import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Users, HelpCircle, Shield, CheckCircle, AlertCircle, Lock, Copy, Check, Mail, Phone, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface RecoveryScreenProps {
  onBack: () => void;
}

interface RecoveryMethods {
  social: boolean;
  questions: boolean;
  twoFactor: boolean;
  guardianCount?: number;
}

export function RecoveryScreen({ onBack }: RecoveryScreenProps) {
  // Paso 1: Identificación de cuenta
  const [step, setStep] = useState<'identify' | 'methods' | 'recovery'>('identify');
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [isLoading, setIsLoading] = useState(false);
  
  // Métodos disponibles para la cuenta
  const [availableMethods, setAvailableMethods] = useState<RecoveryMethods | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'social' | 'questions' | 'twoFactor' | null>(null);
  
  // Social Recovery States
  const [guardianTokens, setGuardianTokens] = useState(['', '', '']);
  const [recoveredToken, setRecoveredToken] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  
  // Security Questions States
  const [userQuestions, setUserQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);

  // 2FA State
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleIdentifyAccount = async () => {
    if (!identifier.trim()) {
      toast.error('Ingresa tu email o teléfono');
      return;
    }

    setIsLoading(true);

    try {
      // Llamada al backend para verificar qué métodos de recuperación tiene configurados
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4118c158/recovery/check-methods`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            identifier,
            type: identifierType
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      
      setAvailableMethods(data.methods);
      
      // Si tiene preguntas de seguridad, cargar las preguntas del usuario
      if (data.methods.questions && data.questions) {
        setUserQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(''));
      }
      
      setStep('methods');
      
      toast.success('Cuenta encontrada', {
        description: 'Selecciona un método de recuperación disponible'
      });
    } catch (error) {
      console.error('Error al verificar cuenta:', error);
      toast.error('No se encontró una cuenta con esos datos', {
        description: 'Verifica tu email o teléfono'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialRecovery = async () => {
    const filledTokens = guardianTokens.filter(t => t.trim() !== '');
    const required = availableMethods?.guardianCount || 2;
    
    if (filledTokens.length < required) {
      toast.error(`Necesitas al menos ${required} tokens de guardianes`);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4118c158/recovery/social-recovery`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            identifier,
            tokens: filledTokens
          })
        }
      );

      if (!response.ok) {
        throw new Error('Error al reconstruir token');
      }

      const data = await response.json();
      setRecoveredToken(data.recoveryToken);
      
      toast.success('¡Token de recuperación reconstruido!', {
        description: 'Usa este token para restablecer tu acceso'
      });
    } catch (error) {
      console.error('Error en recuperación social:', error);
      toast.error('Error al reconstruir el token', {
        description: 'Verifica que los tokens sean correctos'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityQuestions = async () => {
    const filledAnswers = answers.filter(a => a.trim() !== '');
    
    if (filledAnswers.length < userQuestions.length) {
      toast.error('Debes responder todas las preguntas');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4118c158/recovery/verify-questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            identifier,
            answers: answers
          })
        }
      );

      if (!response.ok) {
        throw new Error('Respuestas incorrectas');
      }

      const data = await response.json();
      
      toast.success('¡Respuestas verificadas correctamente!', {
        description: 'Redirigiendo al restablecimiento de contraseña...'
      });
      
      // Aquí podrías navegar a pantalla de restablecimiento o hacer auto-login
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Error al verificar preguntas:', error);
      toast.error('Respuestas incorrectas', {
        description: 'Verifica tus respuestas e intenta nuevamente'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FARecovery = async () => {
    if (twoFactorCode.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4118c158/recovery/verify-2fa`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            identifier,
            code: twoFactorCode
          })
        }
      );

      if (!response.ok) {
        throw new Error('Código incorrecto');
      }

      toast.success('¡Código verificado!', {
        description: 'Acceso restaurado correctamente'
      });
      
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error) {
      console.error('Error al verificar 2FA:', error);
      toast.error('Código incorrecto', {
        description: 'Verifica el código de tu autenticador'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    toast.success('Token copiado al portapapeles');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="flex-1 flex flex-col px-8 py-12">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al inicio
        </button>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-400 rounded-3xl flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl mb-2">Recuperar Acceso</h1>
          <p className="text-slate-400">
            {step === 'identify' && 'Identifica tu cuenta para comenzar'}
            {step === 'methods' && 'Selecciona un método de recuperación'}
            {step === 'recovery' && 'Completa la verificación'}
          </p>
        </motion.div>

        {/* PASO 1: Identificar cuenta */}
        {step === 'identify' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto"
          >
            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <h3 className="text-white mb-6">Identifica tu cuenta</h3>

              {/* Toggle Email/Phone */}
              <div className="flex gap-2 mb-6">
                <Button
                  onClick={() => setIdentifierType('email')}
                  variant={identifierType === 'email' ? 'default' : 'outline'}
                  className={`flex-1 ${
                    identifierType === 'email' 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  onClick={() => setIdentifierType('phone')}
                  variant={identifierType === 'phone' ? 'default' : 'outline'}
                  className={`flex-1 ${
                    identifierType === 'phone' 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Teléfono
                </Button>
              </div>

              <div className="mb-6">
                <Label className="text-slate-400 mb-2">
                  {identifierType === 'email' ? 'Email registrado' : 'Teléfono registrado'}
                </Label>
                <Input
                  type={identifierType === 'email' ? 'email' : 'tel'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={identifierType === 'email' ? 'tu@email.com' : '+52 1234567890'}
                  className="h-12 bg-slate-900 border-slate-700 text-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleIdentifyAccount()}
                />
              </div>

              <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex gap-2 text-sm text-blue-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>
                    Ingresa el {identifierType === 'email' ? 'email' : 'teléfono'} que usaste para registrarte. Verificaremos qué métodos de recuperación tienes configurados.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleIdentifyAccount}
                disabled={isLoading || !identifier.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verificando...
                  </div>
                ) : (
                  'Continuar'
                )}
              </Button>
            </Card>
          </motion.div>
        )}

        {/* PASO 2: Mostrar métodos disponibles */}
        {step === 'methods' && availableMethods && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto space-y-4"
          >
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div className="flex gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-emerald-400 mb-1">Cuenta encontrada</p>
                  <p className="text-slate-400">
                    {identifierType === 'email' ? identifier : `Teléfono: ${identifier}`}
                  </p>
                </div>
              </div>
            </div>

            {availableMethods.social && (
              <Card 
                onClick={() => {
                  setSelectedMethod('social');
                  setStep('recovery');
                }}
                className="p-6 bg-slate-900/50 border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white">Recuperación Social</h3>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      Reúne tokens de tus {availableMethods.guardianCount || 3} guardianes de confianza
                    </p>
                    <div className="flex items-center gap-2 text-xs text-blue-400">
                      <Lock className="w-3 h-3" />
                      <span>Configurado • Requiere {Math.ceil((availableMethods.guardianCount || 3) * 0.67)} de {availableMethods.guardianCount || 3} guardianes</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {availableMethods.questions && (
              <Card 
                onClick={() => {
                  setSelectedMethod('questions');
                  setStep('recovery');
                }}
                className="p-6 bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white">Preguntas de Seguridad</h3>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      Responde las preguntas que configuraste
                    </p>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <Lock className="w-3 h-3" />
                      <span>Configurado • 3 preguntas</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {availableMethods.twoFactor && (
              <Card 
                onClick={() => {
                  setSelectedMethod('twoFactor');
                  setStep('recovery');
                }}
                className="p-6 bg-slate-900/50 border-slate-800 hover:border-purple-500/50 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white">Autenticador 2FA</h3>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      Usa tu aplicación autenticadora
                    </p>
                    <div className="flex items-center gap-2 text-xs text-purple-400">
                      <Lock className="w-3 h-3" />
                      <span>Configurado • Google/Microsoft Authenticator</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {!availableMethods.social && !availableMethods.questions && !availableMethods.twoFactor && (
              <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-white mb-2">No hay métodos configurados</h3>
                    <p className="text-sm text-slate-400 mb-3">
                      Esta cuenta no tiene métodos de recuperación configurados. Deberás contactar a soporte.
                    </p>
                    <p className="text-sm text-orange-400">
                      Email: <a href="mailto:soporte@worldkey.com" className="underline">soporte@worldkey.com</a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                setStep('identify');
                setAvailableMethods(null);
                setIdentifier('');
              }}
              variant="ghost"
              className="w-full text-slate-400 hover:text-white"
            >
              Usar otra cuenta
            </Button>
          </motion.div>
        )}

        {/* PASO 3: Proceso de recuperación según método seleccionado */}
        {step === 'recovery' && selectedMethod === 'social' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto"
          >
            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white">Recuperación Social</h3>
                  <p className="text-xs text-slate-400">Tokens de tus guardianes</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex gap-2 text-sm text-blue-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>
                    Necesitas recolectar al menos <strong>{Math.ceil((availableMethods?.guardianCount || 3) * 0.67)} tokens</strong> de los {availableMethods?.guardianCount || 3} guardianes que designaste.
                  </p>
                </div>
              </div>

              {!recoveredToken ? (
                <>
                  <div className="space-y-4 mb-6">
                    {Array.from({ length: availableMethods?.guardianCount || 3 }).map((_, index) => (
                      <div key={index}>
                        <Label className="text-slate-400 mb-2">
                          Token del Guardián {index + 1}
                        </Label>
                        <Input
                          type="text"
                          value={guardianTokens[index] || ''}
                          onChange={(e) => {
                            const newTokens = [...guardianTokens];
                            newTokens[index] = e.target.value;
                            setGuardianTokens(newTokens);
                          }}
                          placeholder={`WK-GUARDIAN-${index + 1}-XXXXX`}
                          className="h-12 bg-slate-900 border-slate-700 text-white font-mono"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Tokens proporcionados:</span>
                      <span className="text-white">
                        {guardianTokens.filter(t => t.trim() !== '').length} / {availableMethods?.guardianCount || 3}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-1">
                      {Array.from({ length: availableMethods?.guardianCount || 3 }).map((_, index) => (
                        <div 
                          key={index}
                          className={`flex-1 h-2 rounded ${
                            guardianTokens[index]?.trim() !== '' 
                              ? 'bg-blue-500' 
                              : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleSocialRecovery}
                    disabled={isLoading || guardianTokens.filter(t => t.trim() !== '').length < Math.ceil((availableMethods?.guardianCount || 3) * 0.67)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 mb-3"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Reconstruyendo token...
                      </div>
                    ) : (
                      'Reconstruir Token de Recuperación'
                    )}
                  </Button>
                </>
              ) : (
                <div>
                  <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <p className="text-blue-400">¡Token reconstruido exitosamente!</p>
                    </div>
                    <Label className="text-slate-400 mb-2 block">Tu Token de Recuperación:</Label>
                    <div className="flex gap-2">
                      <div className="flex-1 p-3 bg-slate-900 rounded border border-slate-700 font-mono text-sm text-white break-all">
                        {recoveredToken}
                      </div>
                      <Button
                        onClick={() => copyToClipboard(recoveredToken)}
                        variant="outline"
                        className="flex-shrink-0 border-slate-700 hover:bg-slate-800"
                      >
                        {copiedToken ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={onBack}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12"
                  >
                    Volver al Inicio de Sesión
                  </Button>
                </div>
              )}

              <Button
                onClick={() => setStep('methods')}
                variant="ghost"
                className="w-full text-slate-400 hover:text-white mt-3"
              >
                Cambiar método
              </Button>
            </Card>
          </motion.div>
        )}

        {step === 'recovery' && selectedMethod === 'questions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto"
          >
            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white">Preguntas de Seguridad</h3>
                  <p className="text-xs text-slate-400">Verifica tu identidad</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="flex gap-2 text-sm text-emerald-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>
                    Responde las {userQuestions.length} preguntas de seguridad que configuraste.
                  </p>
                </div>
              </div>

              <div className="space-y-5 mb-6">
                {userQuestions.map((question, index) => (
                  <div key={index}>
                    <Label className="text-slate-400 mb-2 block">
                      Pregunta {index + 1}
                    </Label>
                    <div className="mb-2 p-3 bg-slate-800 rounded text-sm text-white">
                      {question}
                    </div>
                    <Input
                      type="text"
                      value={answers[index] || ''}
                      onChange={(e) => {
                        const newAnswers = [...answers];
                        newAnswers[index] = e.target.value;
                        setAnswers(newAnswers);
                      }}
                      placeholder="Tu respuesta..."
                      className="h-12 bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                ))}
              </div>

              <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Preguntas respondidas:</span>
                  <span className="text-white">
                    {answers.filter(a => a.trim() !== '').length} / {userQuestions.length}
                  </span>
                </div>
                <div className="mt-2 flex gap-1">
                  {userQuestions.map((_, index) => (
                    <div 
                      key={index}
                      className={`flex-1 h-2 rounded ${
                        answers[index]?.trim() !== '' 
                          ? 'bg-emerald-500' 
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSecurityQuestions}
                disabled={isLoading || answers.filter(a => a.trim() !== '').length < userQuestions.length}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 mb-3"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verificando...
                  </div>
                ) : (
                  'Verificar Respuestas'
                )}
              </Button>

              <Button
                onClick={() => setStep('methods')}
                variant="ghost"
                className="w-full text-slate-400 hover:text-white mt-3"
              >
                Cambiar método
              </Button>
            </Card>
          </motion.div>
        )}

        {step === 'recovery' && selectedMethod === 'twoFactor' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto"
          >
            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white">Autenticador 2FA</h3>
                  <p className="text-xs text-slate-400">Código de verificación</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex gap-2 text-sm text-purple-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>
                    Ingresa el código de 6 dígitos de tu aplicación autenticadora (Google Authenticator, Microsoft Authenticator, etc.)
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <Label className="text-slate-400 mb-2">Código de Verificación</Label>
                <Input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="h-14 text-center text-2xl tracking-widest bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <Button
                onClick={handle2FARecovery}
                disabled={isLoading || twoFactorCode.length !== 6}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white h-12 mb-3"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verificando...
                  </div>
                ) : (
                  'Verificar Código'
                )}
              </Button>

              <Button
                onClick={() => setStep('methods')}
                variant="ghost"
                className="w-full text-slate-400 hover:text-white mt-3"
              >
                Cambiar método
              </Button>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
