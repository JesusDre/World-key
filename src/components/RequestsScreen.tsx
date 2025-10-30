import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Shield,
  Clock,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import type { Screen } from '../App';
import { toast } from 'sonner';

interface RequestsScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface DocumentRequest {
  id: number;
  requester: string;
  requesterRFC: string;
  rfcVerified: boolean;
  documentType: string;
  reason: string;
  duration: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'denied';
}

export function RequestsScreen({ onNavigate }: RequestsScreenProps) {
  const [requests, setRequests] = useState<DocumentRequest[]>([
    {
      id: 1,
      requester: 'Banco Nacional México',
      requesterRFC: 'BNM010101ABC',
      rfcVerified: true,
      documentType: 'INE',
      reason: 'Verificación KYC para apertura de cuenta',
      duration: '24 horas',
      timestamp: 'Hace 2 horas',
      status: 'pending'
    },
    {
      id: 2,
      requester: 'Empresa Consultora XYZ',
      requesterRFC: 'ECX123456DEF',
      rfcVerified: false,
      documentType: 'RFC',
      reason: 'Validación para contratación',
      duration: '7 días',
      timestamp: 'Hace 5 horas',
      status: 'pending'
    },
    {
      id: 3,
      requester: 'Inmobiliaria Del Valle',
      requesterRFC: 'IDV987654GHI',
      rfcVerified: true,
      documentType: 'Comprobante de ingresos',
      reason: 'Proceso de arrendamiento',
      duration: '3 días',
      timestamp: 'Ayer',
      status: 'approved'
    }
  ]);

  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const handleApprove = (request: DocumentRequest) => {
    setRequests(requests.map(r => 
      r.id === request.id ? { ...r, status: 'approved' } : r
    ));
    toast.success('Acceso concedido', {
      description: `${request.requester} ahora puede ver tu ${request.documentType} por ${request.duration}`
    });
    setShowDetailDialog(false);
  };

  const handleDeny = (request: DocumentRequest) => {
    setRequests(requests.map(r => 
      r.id === request.id ? { ...r, status: 'denied' } : r
    ));
    toast.success('Solicitud denegada', {
      description: 'El solicitante ha sido notificado'
    });
    setShowDetailDialog(false);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const historyRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-900/40 to-slate-900/40 px-6 pt-12 pb-8 border-b border-slate-800">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl">Solicitudes</h1>
        </div>

        {pendingRequests.length > 0 ? (
          <div className="flex items-center gap-3 p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
            <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-white">Tienes {pendingRequests.length} solicitud(es) pendiente(s)</p>
              <p className="text-xs text-slate-400">
                Revisa los detalles antes de conceder acceso
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
            <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-white">No hay solicitudes pendientes</p>
              <p className="text-xs text-slate-400">
                Todas las solicitudes han sido procesadas
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-6">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg mb-4">Pendientes</h2>
            <div className="space-y-4">
              {pendingRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-4 bg-slate-900 border-orange-500/30 hover:border-orange-500/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-orange-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="text-sm text-white">{request.requester}</h3>
                            <p className="text-xs text-slate-400">RFC: {request.requesterRFC}</p>
                          </div>
                          <Badge className={request.rfcVerified 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                          }>
                            {request.rfcVerified ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> RFC Verificado</>
                            ) : (
                              <><AlertTriangle className="w-3 h-3 mr-1" /> RFC No Verificado</>
                            )}
                          </Badge>
                        </div>

                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-xs">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-400">Solicita:</span>
                            <span className="text-white">{request.documentType}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-400">Duración:</span>
                            <span className="text-white">{request.duration}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 mb-3 p-2 bg-slate-800 rounded">
                          Motivo: {request.reason}
                        </p>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailDialog(true);
                            }}
                            size="sm"
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Revisar
                          </Button>
                          <Button
                            onClick={() => handleDeny(request)}
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Denegar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {historyRequests.length > 0 && (
          <div>
            <h2 className="text-lg mb-4">Historial</h2>
            <div className="space-y-3">
              {historyRequests.map((request) => (
                <Card 
                  key={request.id} 
                  className="p-4 bg-slate-900/50 border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">{request.requester}</p>
                      <p className="text-xs text-slate-400">{request.documentType}</p>
                      <p className="text-xs text-slate-400">{request.timestamp}</p>
                    </div>
                    <Badge className={
                      request.status === 'approved' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }>
                      {request.status === 'approved' ? 'Aprobada' : 'Denegada'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Revisar Solicitud</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <Card className="p-4 bg-slate-800 border-slate-700">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Solicitante</p>
                    <p className="text-sm text-white">{selectedRequest.requester}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">RFC</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white">{selectedRequest.requesterRFC}</p>
                      {selectedRequest.rfcVerified ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verificado
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Documento solicitado</p>
                    <p className="text-sm text-white">{selectedRequest.documentType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Tiempo de acceso</p>
                    <p className="text-sm text-white">{selectedRequest.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Motivo</p>
                    <p className="text-sm text-white">{selectedRequest.reason}</p>
                  </div>
                </div>
              </Card>

              {!selectedRequest.rfcVerified && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-yellow-400">⚠️ RFC no verificado</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Este RFC no ha pasado la validación automática. Procede con precaución.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white">Acceso Controlado</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Si apruebas, el solicitante recibirá un token temporal firmado.
                      Podrás revocar el acceso en cualquier momento.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleDeny(selectedRequest)}
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Denegar
                </Button>
                <Button
                  onClick={() => handleApprove(selectedRequest)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
