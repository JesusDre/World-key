import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Bell, 
  Shield, 
  Send, 
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Trash2
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { Screen } from '../App';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface NotificationsScreenProps {
  onNavigate: (screen: Screen) => void;
  accessToken?: string;
}

interface Notification {
  id: string;
  type: 'request' | 'payment' | 'access-granted' | 'access-revoked' | 'document-update';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable: boolean;
  relatedId?: string;
  icon?: string;
}

export function NotificationsScreen({ onNavigate, accessToken }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'request',
      title: 'Nueva solicitud de acceso',
      message: 'Banco Nacional México solicita acceso a tu INE para verificación de cuenta',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
      read: false,
      actionable: true,
      relatedId: 'req-123'
    },
    {
      id: '2',
      type: 'payment',
      title: 'Pago recibido',
      message: 'Has recibido $500.00 MXN de María González',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      read: false,
      actionable: false
    },
    {
      id: '3',
      type: 'access-granted',
      title: 'Acceso concedido',
      message: 'Has concedido acceso a tu RFC a Empresa XYZ',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
      read: true,
      actionable: false
    },
    {
      id: '4',
      type: 'request',
      title: 'Nueva solicitud de acceso',
      message: 'Agencia de Viajes Premium solicita acceso a tu Pasaporte',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      read: true,
      actionable: true,
      relatedId: 'req-124'
    },
    {
      id: '5',
      type: 'document-update',
      title: 'Documento verificado',
      message: 'Tu CURP ha sido verificada exitosamente en blockchain',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      read: true,
      actionable: false
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'request':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'payment':
        return <Download className="w-5 h-5 text-emerald-400" />;
      case 'access-granted':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'access-revoked':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'document-update':
        return <FileText className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'request':
        return 'bg-blue-500/10';
      case 'payment':
        return 'bg-emerald-500/10';
      case 'access-granted':
        return 'bg-emerald-500/10';
      case 'access-revoked':
        return 'bg-red-500/10';
      case 'document-update':
        return 'bg-purple-500/10';
      default:
        return 'bg-slate-500/10';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `Hace ${minutes} min`;
    } else if (hours < 24) {
      return `Hace ${hours}h`;
    } else if (days === 1) {
      return 'Ayer';
    } else {
      return `Hace ${days} días`;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast.success('Notificación eliminada');
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    toast.success('Todas las notificaciones marcadas como leídas');
  };

  const handleAction = (notification: Notification) => {
    if (notification.type === 'request') {
      markAsRead(notification.id);
      onNavigate('requests');
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 px-6 pt-12 pb-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl">Notificaciones</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-slate-400">{unreadCount} sin leer</p>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="ghost"
              size="sm"
              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            >
              Marcar todas
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900">
            <TabsTrigger value="all" onClick={() => setFilter('all')}>
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" onClick={() => setFilter('unread')}>
              Sin leer ({unreadCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-6 py-6">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No hay notificaciones</p>
            <p className="text-sm text-slate-500">
              {filter === 'unread' 
                ? 'Todas tus notificaciones están leídas' 
                : 'Te notificaremos sobre actividad importante'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`p-4 border-slate-800 transition-colors cursor-pointer ${
                    notification.read 
                      ? 'bg-slate-900/50' 
                      : 'bg-slate-900 border-blue-500/30'
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationBgColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm text-white">{notification.title}</h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-400 mb-2">{notification.message}</p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          {formatTimestamp(notification.timestamp)}
                        </p>

                        <div className="flex gap-2">
                          {notification.actionable && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(notification);
                              }}
                              size="sm"
                              className="h-7 text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30"
                            >
                              Ver solicitud
                            </Button>
                          )}
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
