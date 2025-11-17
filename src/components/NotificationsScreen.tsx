import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, CheckCircle, Clock, Eye, FileText, Shield, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Screen } from "../App";
import { useSoroban } from "@/hooks/useSoroban";
import type { DocumentRecord, HistoryRecord, PermissionRecord } from "@/utils/stellar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

type NotificationType = "request" | "access-granted" | "access-revoked" | "document-verified" | "info";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable: boolean;
  relatedHash?: string;
  requester?: string;
}

const ICONS: Record<NotificationType, JSX.Element> = {
  request: <Shield className="w-5 h-5 text-blue-400" />,
  "access-granted": <CheckCircle className="w-5 h-5 text-emerald-400" />,
  "access-revoked": <XCircle className="w-5 h-5 text-red-400" />,
  "document-verified": <FileText className="w-5 h-5 text-purple-400" />,
  info: <Bell className="w-5 h-5 text-slate-400" />,
};

const BACKGROUND_CLASSES: Record<NotificationType, string> = {
  request: "bg-blue-500/10",
  "access-granted": "bg-emerald-500/10",
  "access-revoked": "bg-red-500/10",
  "document-verified": "bg-purple-500/10",
  info: "bg-slate-500/10",
};

interface NotificationsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function NotificationsScreen({ onNavigate }: NotificationsScreenProps) {
  const { documents, grantedPermissions, sharedDocuments, history } = useSoroban();
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const notifications = useMemo(
    () => buildNotifications(documents, grantedPermissions, sharedDocuments, history),
    [documents, grantedPermissions, sharedDocuments, history],
  )
    .filter((notification) => !dismissedNotifications.has(notification.id))
    .map((notification) => ({
      ...notification,
      read: notification.read || readNotifications.has(notification.id),
    }));

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const filtered = filter === "all" ? notifications : notifications.filter((notification) => !notification.read);

  const markAsRead = (id: string) => {
    setReadNotifications((prev) => new Set(prev).add(id));
  };

  const markAllAsRead = () => {
    setReadNotifications(new Set(notifications.map((notification) => notification.id)));
    toast.success("Todas las notificaciones marcadas como leídas");
  };

  const deleteNotification = (id: string) => {
    setDismissedNotifications((prev) => new Set(prev).add(id));
    toast.success("Notificación eliminada");
  };

  const handleAction = (notification: NotificationItem) => {
    markAsRead(notification.id);
    if (notification.type === "request") {
      onNavigate("requests");
    } else if (notification.relatedHash) {
      window.open(`https://horizon-futurenet.stellar.org/transactions/${notification.relatedHash}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-8">
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 px-6 pt-12 pb-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate("dashboard")} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl">Notificaciones</h1>
              {unreadCount > 0 && <p className="text-sm text-slate-400">{unreadCount} sin leer</p>}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
              Marcar todas
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900">
            <TabsTrigger value="all" onClick={() => setFilter("all")}>
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" onClick={() => setFilter("unread")}>
              Sin leer ({unreadCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-6 py-6 space-y-4">
        {filtered.length === 0 ? (
          <Card className="p-6 bg-slate-900 border-slate-800 text-center text-sm text-slate-400">No hay notificaciones por ahora.</Card>
        ) : (
          filtered.map((notification, index) => (
            <motion.div key={notification.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="p-4 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${BACKGROUND_CLASSES[notification.type]}`}>
                    {ICONS[notification.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{notification.title}</p>
                        <p className="text-xs text-slate-400 truncate">{notification.message}</p>
                      </div>
                      {notification.read ? (
                        <Badge className="bg-slate-800 border-slate-700 text-slate-300">Leída</Badge>
                      ) : (
                        <Badge className="bg-blue-500/10 border-blue-500/40 text-blue-300">Nueva</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {new Date(notification.timestamp).toLocaleString("es-MX")}
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        onClick={() => handleAction(notification)}
                        size="sm"
                        className="bg-slate-800 hover:bg-slate-700 text-white"
                      >
                        {notification.type === "request" ? "Revisar solicitud" : "Ver detalle"}
                      </Button>
                      <Button
                        onClick={() => {
                          if (!notification.read) markAsRead(notification.id);
                          else deleteNotification(notification.id);
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                      >
                        {notification.read ? (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marcar leída
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Card className="mx-6 mt-4 p-4 bg-slate-900/40 border-slate-800 text-sm text-slate-400 flex gap-3">
        <Eye className="w-5 h-5 text-slate-300 mt-0.5" />
        <span>
          Estas alertas se generan con tus contratos Soroban. Gestiona las solicitudes pendientes desde la sección Solicitudes o verifica el hash en un explorador Futurenet.
        </span>
      </Card>
    </div>
  );
}

function buildNotifications(
  documents: DocumentRecord[],
  granted: PermissionRecord[],
  sharedWithMe: DocumentRecord[],
  history: HistoryRecord[],
): NotificationItem[] {
  const notifications: NotificationItem[] = [];

  documents.forEach((doc) => {
    notifications.push({
      id: `doc-${doc.docId}`,
      type: "document-verified",
      title: `${doc.metadata.type} tokenizado`,
      message: `Hash ${shorten(doc.hash, 10)} registrado en Soroban`,
      timestamp: doc.metadata.createdAt,
      read: false,
      actionable: true,
      relatedHash: doc.lastTx,
    });
  });

  granted.forEach((share) => {
    notifications.push({
      id: `grant-${share.docId}-${share.target}`,
      type: "access-granted",
      title: "Acceso concedido",
      message: `Documento ${share.docId} visible para ${shorten(share.target, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
      actionable: true,
      relatedHash: share.lastTx,
      requester: share.target,
    });
  });

  sharedWithMe.forEach((doc) => {
    notifications.push({
      id: `shared-${doc.docId}`,
      type: "info",
      title: "Documento compartido contigo",
      message: `${doc.metadata.type} de ${shorten(doc.owner, 6)} está disponible`,
      timestamp: doc.metadata.createdAt,
      read: false,
      actionable: false,
      relatedHash: doc.lastTx,
    });
  });

  history
    .filter((item) => item.type === "access" && item.title.toLowerCase().includes("revocado"))
    .forEach((record) => {
      notifications.push({
        id: `revoked-${record.id}`,
        type: "access-revoked",
        title: record.title,
        message: record.description,
        timestamp: record.timestamp,
        read: false,
        actionable: true,
        relatedHash: record.txHash,
        requester: record.actor,
      });
    });

  return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function shorten(value: string, size = 4): string {
  if (!value) return "";
  return `${value.slice(0, size)}…${value.slice(-size)}`;
}
