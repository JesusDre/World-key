import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Shield,
  Fingerprint,
  Smartphone,
  Key,
  Download,
  Bell,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Lock,
  User,

  Users,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Plus,
  Trash2
} from 'lucide-react';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import type { Screen } from '../App';
import { toast } from 'sonner';
import { useSoroban } from '../hooks/useSoroban';
import { fetchIdentity as fetchIdentityApi } from '../services/identities';
import type { AuthSession } from '../types/auth';
interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  session?: AuthSession;
}

export function SettingsScreen({ onNavigate, onLogout, session }: SettingsScreenProps) {
  const { identity } = useSoroban();
  const [biometricEnabled, setBiometricEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('biometricEnabled') === 'true';
    }
    return false;
  });
  const [notifications, setNotifications] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showSocialRecoveryDialog, setShowSocialRecoveryDialog] = useState(false);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);

  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    worldKeyId: ''
  });

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('Español');
  const [seedPhrase] = useState('wisdom tackle hover flight menu gather winter bounce ship veteran future');

  // Social Recovery
  const [guardians, setGuardians] = useState<Array<{ email: string; token: string }>>([]);
  const [newGuardianEmail, setNewGuardianEmail] = useState('');
  const [socialRecoveryEnabled, setSocialRecoveryEnabled] = useState(false);
  const [copiedGuardian, setCopiedGuardian] = useState<number | null>(null);

  // Security Questions
  const [securityQuestions, setSecurityQuestions] = useState<Array<{ question: string; answer: string }>>([]);
  const [questionsEnabled, setQuestionsEnabled] = useState(false);

  // 2FA Setup
  const [totpSecret] = useState('JBSWY3DPEHPK3PXP');
  const [verificationCode, setVerificationCode] = useState('');

  const waitForBackend = (delay = 600) => new Promise((resolve) => setTimeout(resolve, delay));

  useEffect(() => {
    const fallbackName = identity?.name ?? session?.fullName ?? '';
    const fallbackEmail = identity?.email ?? session?.email ?? '';
    const fallbackWorldKeyId = identity?.publicKey ?? session?.publicKey ?? '';

    setUserProfile({
      name: fallbackName,
      email: fallbackEmail,
      worldKeyId: fallbackWorldKeyId,
    });

    const targetKey = session?.publicKey ?? identity?.publicKey;
    if (!targetKey) return;

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const payload = await fetchIdentityApi(targetKey);
        if (cancelled) return;
        setUserProfile({
          name: payload.fullName ?? fallbackName,
          email: fallbackEmail,
          worldKeyId: payload.publicKey,
        });
      } catch (error) {
        if (cancelled) return;
        console.warn('No se pudo sincronizar el perfil con el backend', error);
      }
    };

    loadProfile().catch((error) => {
      console.warn('Error al cargar el perfil', error);
    });

    return () => {
      cancelled = true;
    };
  }, [identity, session]);

  const handleLogout = () => {
    toast.success('Sesión cerrada correctamente');
    setShowLogoutDialog(false);
    setTimeout(onLogout, 500);
  };

  const handleBackup = () => {
    // Copiar frase semilla usando el método alternativo
    try {
      const textArea = document.createElement('textarea');
      textArea.value = seedPhrase;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();

      toast.success('Frase semilla copiada', {
        description: 'Guárdala en un lugar seguro'
      });
      setShowBackupDialog(false);
    } catch (err) {
      console.warn(err);
      toast.error('No se pudo copiar');
    }
  };

  const handlePinChange = () => {
    if (newPin.length !== 6 || confirmPin.length !== 6) {
      toast.error('El PIN debe tener 6 dígitos');
      return;
    }

    if (newPin !== confirmPin) {
      toast.error('Los PINs no coinciden');
      return;
    }

    // Aquí guardarías el PIN en el backend de forma segura
    toast.success('PIN actualizado correctamente', {
      description: 'Tu nuevo PIN ha sido guardado de forma segura'
    });
    setNewPin('');
    setConfirmPin('');
    setShowPinDialog(false);
  };

  const handleBiometricToggle = (checked: boolean) => {
    setBiometricEnabled(checked);
    localStorage.setItem('biometricEnabled', String(checked));
    toast.success(
      checked ? 'Autenticación biométrica activada' : 'Autenticación biométrica desactivada'
    );
  };

  // 2FA toggle handled via explicit setup flow; keep state in `twoFactorEnabled`

  const handleNotificationsToggle = (checked: boolean) => {
    setNotifications(checked);
    toast.success(
      checked ? 'Notificaciones activadas' : 'Notificaciones desactivadas'
    );
  };

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    toast.success(`Idioma cambiado a ${language}`);
    setShowLanguageDialog(false);
  };

  // Social Recovery handlers
  const handleAddGuardian = () => {
    if (!newGuardianEmail || !newGuardianEmail.includes('@')) {
      toast.error('Ingresa un email válido');
      return;
    }

    if (guardians.length >= 3) {
      toast.error('Máximo 3 guardianes permitidos');
      return;
    }

    const token = `WK-GUARDIAN-${guardians.length + 1}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setGuardians([...guardians, { email: newGuardianEmail, token }]);
    setNewGuardianEmail('');
    toast.success('Guardián agregado', {
      description: 'Comparte el token con esta persona de confianza'
    });
  };

  const handleRemoveGuardian = (index: number) => {
    setGuardians(guardians.filter((_, i) => i !== index));
    toast.success('Guardián eliminado');
  };

  const copyGuardianToken = (token: string, index: number) => {
    navigator.clipboard.writeText(token);
    setCopiedGuardian(index);
    toast.success('Token copiado');
    setTimeout(() => setCopiedGuardian(null), 2000);
  };

  const handleSaveSocialRecovery = async () => {
    if (guardians.length < 2) {
      toast.error('Necesitas al menos 2 guardianes');
      return;
    }

    try {
      await waitForBackend();
      setSocialRecoveryEnabled(true);
      toast.success('Recuperación social configurada', {
        description: `${guardians.length} guardianes asignados`
      });
      setShowSocialRecoveryDialog(false);
    } catch (error) {
      console.error('Error saving social recovery:', error);
      toast.error('Error al guardar configuración');
    }
  };

  // Security Questions handlers
  const handleAddQuestion = () => {
    if (securityQuestions.length >= 10) {
      toast.error('Máximo 10 preguntas permitidas');
      return;
    }
    setSecurityQuestions([...securityQuestions, { question: '', answer: '' }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (securityQuestions.length <= 1) {
      toast.error('Debes tener al menos 1 pregunta');
      return;
    }
    setSecurityQuestions(securityQuestions.filter((_, i) => i !== index));
  };

  const handleUpdateQuestion = (index: number, field: 'question' | 'answer', value: string) => {
    const newQuestions = [...securityQuestions];
    newQuestions[index][field] = value;
    setSecurityQuestions(newQuestions);
  };

  const handleSaveQuestions = async () => {
    if (securityQuestions.length < 3) {
      toast.error('Debes configurar al menos 3 preguntas');
      return;
    }

    const allComplete = securityQuestions.every(q =>
      q.question.trim() !== '' && q.answer.trim() !== ''
    );

    if (!allComplete) {
      toast.error('Todas las preguntas y respuestas deben estar completas');
      return;
    }

    try {
      await waitForBackend();
      setQuestionsEnabled(true);
      toast.success('Preguntas de seguridad configuradas', {
        description: `${securityQuestions.length} preguntas guardadas`
      });
      setShowQuestionsDialog(false);
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error('Error al guardar preguntas');
    }
  };

  // 2FA handlers
  const handleSetup2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return;
    }

    // Verificar código
    try {
      await waitForBackend();
      setTwoFactorEnabled(true);
      toast.success('Autenticador 2FA configurado');
      setShow2FADialog(false);
      setVerificationCode('');
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast.error('Error al configurar 2FA');
    }
  };

  // Nuevo: navegar a la pantalla de planes
  const handleViewPlans = () => {
    onNavigate('plans');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 px-6 pt-12 pb-8 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl">Configuración</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Profile Section */}
        <div>
          <h2 className="text-lg mb-4 flex items-center gap-2 text-white">
            <User className="w-5 h-5 text-blue-400" />
            Perfil
          </h2>

          <Card className="bg-slate-900 border-slate-800 divide-y divide-slate-800">
            <button
              className="p-4 flex items-center justify-between w-full hover:bg-slate-800/50 transition-colors"
              onClick={() => setShowProfileDialog(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-white">{userProfile.name || 'Tu Nombre'}</p>
                  <p className="text-xs text-slate-400">{userProfile.email || 'email@ejemplo.com'}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>

            <div className="p-4">
              <p className="text-xs text-slate-400 mb-1">WorldKey ID</p>
              <p className="text-sm text-white font-mono">{userProfile.worldKeyId || 'WK-XXXXXXXXXX'}</p>
            </div>
          </Card>
        </div>

        {/* Security Section */}
        <div>
          <h2 className="text-lg mb-4 flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-emerald-400" />
            Seguridad
          </h2>

          <Card className="bg-slate-900 border-slate-800 divide-y divide-slate-800">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <Fingerprint className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-white">Autenticación Biométrica</p>
                  <p className="text-xs text-slate-400">Face ID / Touch ID</p>
                </div>
              </div>
              <Switch
                checked={biometricEnabled}
                onCheckedChange={handleBiometricToggle}
              />
            </div>

            <button
              className="p-4 flex items-center justify-between w-full hover:bg-slate-800/50 transition-colors"
              onClick={() => setShowPinDialog(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-white">Cambiar PIN</p>
                  <p className="text-xs text-slate-400">Actualizar tu PIN de 6 dígitos</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>

            <button
              className="p-4 flex items-center justify-between w-full hover:bg-slate-800/50 transition-colors"
              onClick={() => setShowBackupDialog(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-white">Backup de Cuenta</p>
                  <p className="text-xs text-slate-400">Frase semilla y recuperación</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </Card>
        </div>

        {/* Account Recovery Section */}
        <div>
          <h2 className="text-lg mb-4 flex items-center gap-2 text-white">
            <Key className="w-5 h-5 text-orange-400" />
            Recuperación de Cuenta
          </h2>

          <Card className="bg-slate-900 border-slate-800 divide-y divide-slate-800">
            <button
              className="p-4 flex items-center justify-between w-full hover:bg-slate-800/50 transition-colors"
              onClick={() => setShowSocialRecoveryDialog(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white">Recuperación Social</p>
                    {socialRecoveryEnabled && (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {socialRecoveryEnabled
                      ? `${guardians.length} guardianes configurados`
                      : 'Comparte tu clave con personas de confianza'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>

            <button
              className="p-4 flex items-center justify-between w-full hover:bg-slate-800/50 transition-colors"
              onClick={() => setShowQuestionsDialog(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white">Preguntas de Seguridad</p>
                    {questionsEnabled && (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {questionsEnabled
                      ? `Configuradas (${securityQuestions.length})`
                      : 'Configura preguntas personales'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>

            <button
              className="p-4 flex items-center justify-between w-full hover:bg-slate-800/50 transition-colors"
              onClick={() => setShow2FADialog(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white">Autenticador 2FA</p>
                    {twoFactorEnabled && (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {twoFactorEnabled ? 'Configurado' : 'Google/Microsoft Authenticator'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </Card>
        </div>

        {/* Devices */}
        <div>
          <h2 className="text-lg mb-4 flex items-center gap-2 text-white">
            <Smartphone className="w-5 h-5 text-blue-400" />
            Dispositivos
          </h2>

          <Card className="bg-slate-900 border-slate-800">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-white">Este dispositivo</p>
                  <p className="text-xs text-slate-400">Activo ahora</p>
                </div>
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              </div>
            </div>
          </Card>
        </div>

        {/* Preferences */}
        <div>
          <h2 className="text-lg mb-4 flex items-center gap-2 text-white">
            <Bell className="w-5 h-5 text-yellow-400" />
            Preferencias
          </h2>

          <Card className="bg-slate-900 border-slate-800 divide-y divide-slate-800">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-white">Notificaciones Push</p>
                  <p className="text-xs text-slate-400">Alertas de solicitudes y pagos</p>
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={handleNotificationsToggle}
              />
            </div>

            <button
              className="p-4 flex items-center justify-between w-full hover:bg-slate-800/50 transition-colors"
              onClick={() => setShowLanguageDialog(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-white">Idioma</p>
                  <p className="text-xs text-slate-400">{currentLanguage}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </Card>
        </div>

        {/* Support */}
        <div>
          <h2 className="text-lg mb-4 flex items-center gap-2 text-white">
            <HelpCircle className="w-5 h-5 text-slate-400" />
            Soporte
          </h2>

          <Card className="bg-slate-900 border-slate-800 divide-y divide-slate-800">
            <button
              className="p-4 flex items-center justify-between w-full hover:bg-slate-800/50 transition-colors"
              onClick={() => toast.info('Abriendo centro de ayuda...')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm text-white">Centro de Ayuda</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>

            <button
              className="p-4 flex items-center justify-between w-full hover:bg-slate-800/50 transition-colors"
              onClick={() => toast.info('WorldKey v1.0.0 - Prototipo de demostración')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm text-white">Acerca de WorldKey</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </Card>
        </div>

        {/* Hazte premium (Nueva sección) */}
        <div>
          <h2 className="text-lg mb-4 flex items-center gap-2 text-white">
            {/* icon existente disponible en imports */}
            <Users className="w-5 h-5 text-yellow-300" />
            Hazte premium
          </h2>

          <Card className="bg-slate-900 border-slate-800 divide-y divide-slate-800">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  {/* pequeño distintivo */}
                  <svg className="w-5 h-5 text-yellow-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-white">Accede a planes y beneficios</p>
                  <p className="text-xs text-slate-400">Ver y comparar planes disponibles</p>
                </div>
              </div>
              <Button onClick={handleViewPlans} className="bg-blue-500 hover:bg-blue-600">
                Ver planes
              </Button>
            </div>
          </Card>
        </div>

        {/* Logout */}
        <Button
          onClick={() => setShowLogoutDialog(true)}
          variant="outline"
          className="w-full h-12 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40 gap-2"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </Button>

        <p className="text-xs text-center text-slate-400 pt-4">
          WorldKey v1.0.0 • © 2025
        </p>
      </div>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Información del Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Card className="p-4 bg-slate-800 border-slate-700">
              <div className="space-y-3">
                <div>
                  <Label className="text-slate-400 text-xs">Nombre</Label>
                  <p className="text-white">{userProfile.name || 'Usuario'}</p>
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Email</Label>
                  <p className="text-white">{userProfile.email || 'email@ejemplo.com'}</p>
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">WorldKey ID</Label>
                  <p className="text-white font-mono text-sm">{userProfile.worldKeyId || 'WK-XXXXXXXXXX'}</p>
                </div>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Change Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Cambiar PIN</DialogTitle>
            <DialogDescription className="text-slate-400">
              Ingresa un nuevo PIN de 6 dígitos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-400 mb-2">Nuevo PIN</Label>
              <Input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="h-12 text-center text-xl tracking-widest bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-400 mb-2">Confirmar PIN</Label>
              <Input
                type="password"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="h-12 text-center text-xl tracking-widest bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <Button
              onClick={handlePinChange}
              disabled={newPin.length !== 6 || confirmPin.length !== 6}
              className="w-full bg-emerald-500 hover:bg-emerald-600"
            >
              Actualizar PIN
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Language Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Seleccionar Idioma</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {['Español', 'English', 'Português'].map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${currentLanguage === lang
                  ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>¿Cerrar sesión?</DialogTitle>
            <DialogDescription className="text-slate-400">
              Necesitarás autenticarte nuevamente para acceder a tu cuenta.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLogout}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              Cerrar Sesión
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Backup de Cuenta</DialogTitle>
            <DialogDescription className="text-slate-400">
              Guarda tu frase semilla en un lugar seguro. Necesitarás estas palabras para recuperar tu cuenta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Card className="p-4 bg-slate-800 border-slate-700">
              <p className="font-mono text-sm text-center text-white">
                {seedPhrase}
              </p>
            </Card>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-sm text-yellow-400">⚠️ Importante</p>
              <p className="text-xs text-slate-400 mt-1">
                No compartas estas palabras con nadie. Cualquiera con acceso a ellas puede controlar tu cuenta.
              </p>
            </div>

            <Button
              onClick={handleBackup}
              className="w-full bg-emerald-500 hover:bg-emerald-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Copiar Frase Semilla
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Social Recovery Dialog */}
      <Dialog open={showSocialRecoveryDialog} onOpenChange={setShowSocialRecoveryDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperación Social</DialogTitle>
            <DialogDescription className="text-slate-400">
              Configura guardianes de confianza que te ayudarán a recuperar tu cuenta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex gap-2 text-sm text-blue-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>
                  Cada guardián recibirá un token. Necesitarás al menos 2 de 3 tokens para recuperar tu cuenta.
                </p>
              </div>
            </div>

            {/* Lista de guardianes */}
            {guardians.length > 0 && (
              <div className="space-y-2">
                {guardians.map((guardian, index) => (
                  <Card key={index} className="p-3 bg-slate-800 border-slate-700">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-white">{guardian.email}</p>
                        <p className="text-xs text-slate-400 font-mono mt-1">{guardian.token}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => copyGuardianToken(guardian.token, index)}
                          className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                        >
                          {copiedGuardian === index ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRemoveGuardian(index)}
                          className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Agregar guardián */}
            {guardians.length < 3 && (
              <div className="space-y-2">
                <Label className="text-slate-400">Agregar Guardián</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={newGuardianEmail}
                    onChange={(e) => setNewGuardianEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    className="flex-1 bg-slate-800 border-slate-700 text-white"
                  />
                  <Button
                    onClick={handleAddGuardian}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setShowSocialRecoveryDialog(false)}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveSocialRecovery}
                disabled={guardians.length < 2}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Security Questions Dialog */}
      <Dialog open={showQuestionsDialog} onOpenChange={setShowQuestionsDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preguntas de Seguridad</DialogTitle>
            <DialogDescription className="text-slate-400">
              Crea preguntas personalizadas para recuperar tu cuenta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex gap-2 text-sm text-blue-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>
                  Crea al menos 3 preguntas cuyas respuestas solo tú conozcas. Evita información pública.
                </p>
              </div>
            </div>

            {/* Lista de preguntas */}
            {securityQuestions.length > 0 && (
              <div className="space-y-4">
                {securityQuestions.map((q, index) => (
                  <Card key={index} className="p-4 bg-slate-800 border-slate-700">
                    <div className="flex items-start justify-between mb-3">
                      <Label className="text-slate-400 text-sm">
                        Pregunta {index + 1}
                      </Label>
                      {securityQuestions.length > 1 && (
                        <button
                          onClick={() => handleRemoveQuestion(index)}
                          className="p-1 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleUpdateQuestion(index, 'question', e.target.value)}
                        placeholder="¿Cuál es...?"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                      />
                      <Input
                        type="text"
                        value={q.answer}
                        onChange={(e) => handleUpdateQuestion(index, 'answer', e.target.value)}
                        placeholder="Tu respuesta..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Botón agregar pregunta */}
            {securityQuestions.length < 10 && (
              <Button
                onClick={handleAddQuestion}
                variant="outline"
                className="w-full border-slate-700 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Pregunta
              </Button>
            )}

            {securityQuestions.length === 0 && (
              <div className="text-center py-8">
                <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-4">
                  No hay preguntas configuradas
                </p>
                <Button
                  onClick={handleAddQuestion}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Pregunta
                </Button>
              </div>
            )}

            {securityQuestions.length > 0 && (
              <>
                <div className="p-3 bg-slate-800 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Preguntas configuradas:</span>
                    <span className={`${securityQuestions.length >= 3 ? 'text-emerald-400' : 'text-orange-400'
                      }`}>
                      {securityQuestions.length} {securityQuestions.length >= 3 ? '✓' : '(mínimo 3)'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex gap-2 text-sm text-emerald-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="mb-1">Importante:</p>
                      <ul className="text-xs space-y-1 text-slate-400">
                        <li>• Las respuestas son sensibles a mayúsculas</li>
                        <li>• Recuerda exactamente cómo las escribiste</li>
                        <li>• No uses información fácil de adivinar</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowQuestionsDialog(false)}
                    variant="outline"
                    className="flex-1 border-slate-700 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveQuestions}
                    disabled={securityQuestions.length < 3 ||
                      !securityQuestions.every(q => q.question.trim() && q.answer.trim())}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Guardar {securityQuestions.length} Preguntas
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Autenticador 2FA</DialogTitle>
            <DialogDescription className="text-slate-400">
              Escanea el código QR con tu aplicación autenticadora
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {!twoFactorEnabled ? (
              <>
                {/* QR Code */}
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-white rounded-lg">
                    <div className="w-48 h-48 bg-slate-200 flex items-center justify-center">
                      <p className="text-xs text-slate-600 text-center px-4">
                        Código QR<br />
                        (Escanear con autenticador)
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 text-center">
                    Google Authenticator, Microsoft Authenticator, Authy, etc.
                  </p>
                </div>

                {/* Manual entry */}
                <div>
                  <Label className="text-slate-400 mb-2 block">O ingresa manualmente</Label>
                  <Card className="p-3 bg-slate-800 border-slate-700">
                    <p className="font-mono text-sm text-center text-white break-all">
                      {totpSecret}
                    </p>
                  </Card>
                </div>

                {/* Verification */}
                <div>
                  <Label className="text-slate-400 mb-2">Código de Verificación</Label>
                  <Input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="h-12 text-center text-xl tracking-widest bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Ingresa el código de 6 dígitos de tu aplicación
                  </p>
                </div>

                <Button
                  onClick={handleSetup2FA}
                  disabled={verificationCode.length !== 6}
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                >
                  Verificar y Activar
                </Button>
              </>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <p className="text-white mb-2">2FA ya configurado</p>
                <p className="text-sm text-slate-400">
                  Tu cuenta está protegida con autenticación de dos factores
                </p>
                <Button
                  onClick={() => {
                    setTwoFactorEnabled(false);
                    toast.success('2FA desactivado');
                    setShow2FADialog(false);
                  }}
                  variant="outline"
                  className="mt-4 border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  Desactivar 2FA
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
