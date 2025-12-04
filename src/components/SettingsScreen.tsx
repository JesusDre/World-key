import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Shield,
  Smartphone,
  HelpCircle,
  LogOut,
  ChevronRight,
  User,
  Crown
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
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
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    worldKeyId: ''
  });

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
              <p className="text-sm text-white font-mono truncate">{userProfile.worldKeyId || 'WK-XXXXXXXXXX'}</p>
            </div>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Este dispositivo</p>
                  <p className="text-xs text-slate-400">Activo ahora</p>
                </div>
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              </div>
            </div>
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
              onClick={() => toast.info('Centro de ayuda próximamente disponible')}
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
              onClick={() => toast.info('WorldKey v1.0.0')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-white">Acerca de WorldKey</p>
                  <p className="text-xs text-slate-400">Versión 1.0.0</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </Card>
        </div>

        {/* Hazte premium */}
        <div>
          <h2 className="text-lg mb-4 flex items-center gap-2 text-white">
            <Crown className="w-5 h-5 text-yellow-400" />
            Hazte Premium
          </h2>

          <Card className="bg-slate-900 border-slate-800">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <Crown className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-white">Accede a más beneficios</p>
                  <p className="text-xs text-slate-400">Ver planes disponibles</p>
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
                  <p className="text-white font-mono text-sm break-all">{userProfile.worldKeyId || 'WK-XXXXXXXXXX'}</p>
                </div>
              </div>
            </Card>
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
    </div>
  );
}
