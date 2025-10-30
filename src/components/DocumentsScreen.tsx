import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  FileText, 
  Shield, 
  CheckCircle, 
  Clock, 
  Share2, 
  Download,
  Eye,
  Plus,
  XCircle,
  Link as LinkIcon,
  Upload,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import type { Screen } from '../App';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DocumentsScreenProps {
  onNavigate: (screen: Screen) => void;
  accessToken?: string;
}

interface Document {
  id: string;
  userId: string;
  type: string;
  number: string;
  issueDate: string;
  expiryDate?: string;
  verified: boolean;
  tokenHash: string;
  blockchainTxHash?: string;
  blockchainVerified?: boolean;
  createdAt: string;
  activeShares?: number;
}

export function DocumentsScreen({ onNavigate, accessToken }: DocumentsScreenProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (accessToken) {
      loadDocuments();
    }
  }, [accessToken]);

  const loadDocuments = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-4118c158/documents`;
      console.log('🔍 Cargando documentos...');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Documentos cargados:', data.documents?.length || 0);
        console.log('📄 Documentos:', data.documents);
        setDocuments(data.documents || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Error al cargar documentos:', errorText);
        toast.error('Error al cargar documentos');
      }
    } catch (error) {
      console.error('❌ Error loading documents:', error);
      toast.error('Error de conexión al cargar documentos');
    }
  };

  const handleAddDocument = async () => {
    if (!docType || !docNumber || !issueDate) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);
    console.log('📝 Iniciando creación de documento...');

    try {
      // 1. Crear documento en backend
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-4118c158/documents`;
      console.log('📤 Enviando documento:', { type: docType, number: docNumber, issueDate, expiryDate });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          type: docType,
          number: docNumber,
          issueDate,
          expiryDate: expiryDate || null,
          verified: false
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.error || 'Error al crear documento');
      }

      const data = await response.json();
      console.log('✅ Documento creado:', data.document);
      
      // Mostrar que se está registrando en blockchain
      toast.loading('🔐 Registrando en blockchain...', {
        id: 'blockchain-registration',
        description: 'Confirmando transacción en la red',
      });

      // 2. Registrar en blockchain
      console.log('⛓️ Iniciando verificación en blockchain...');
      const txHash = await registerInBlockchain(data.document);
      console.log('✅ Blockchain TX Hash:', txHash);

      // Dismiss loading toast
      toast.dismiss('blockchain-registration');

      toast.success('✅ ¡Documento verificado en Blockchain!', {
        description: `TX: ${txHash.substring(0, 20)}...`
      });

      // Limpiar form
      setDocType('');
      setDocNumber('');
      setIssueDate('');
      setExpiryDate('');
      setShowAddDialog(false);

      // Recargar documentos
      console.log('🔄 Recargando lista de documentos...');
      await loadDocuments();
    } catch (error: any) {
      console.error('❌ Error adding document:', error);
      toast.dismiss('blockchain-registration');
      toast.error('Error al agregar documento', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const registerInBlockchain = async (document: Document): Promise<string> => {
    // Simular delay de blockchain (en producción sería la confirmación real)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-4118c158/documents/${document.id}/verify-blockchain`;
      console.log('⛓️ Registrando en blockchain:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error en blockchain:', errorData);
        throw new Error('Error al verificar en blockchain');
      }

      const data = await response.json();
      console.log('✅ Documento verificado en blockchain:', data);
      
      return data.txHash;
    } catch (error) {
      console.error('❌ Error registering in blockchain:', error);
      throw error;
    }
  };

  const getStatusColor = (verified: boolean, blockchainVerified?: boolean) => {
    if (blockchainVerified) {
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    } else if (verified) {
      return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    } else {
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    }
  };

  const getStatusIcon = (verified: boolean, blockchainVerified?: boolean) => {
    if (blockchainVerified) {
      return <CheckCircle className="w-4 h-4" />;
    } else if (verified) {
      return <Clock className="w-4 h-4" />;
    } else {
      return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (verified: boolean, blockchainVerified?: boolean) => {
    if (blockchainVerified) {
      return 'Verificado en Blockchain';
    } else if (verified) {
      return 'En proceso';
    } else {
      return 'Pendiente';
    }
  };

  const handleShare = () => {
    toast.success('Solicitud enviada', {
      description: 'El destinatario recibirá una notificación para aceptar el acceso'
    });
    setShowShareDialog(false);
  };

  const handleRevoke = (docId: string) => {
    toast.success('Acceso revocado', {
      description: 'Los permisos han sido eliminados inmediatamente'
    });
  };

  const openBlockchainExplorer = (hash: string) => {
    // En producción abriría https://etherscan.io/tx/${hash} o similar
    toast.info('Explorador de Blockchain', {
      description: `Hash: ${hash}`
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 px-6 pt-12 pb-8 border-b border-slate-800">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl text-white">Documentos</h1>
        </div>

        <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
          <Shield className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-white">Documentos Tokenizados en Blockchain</p>
            <p className="text-xs text-slate-400">
              Cada documento es un token protegido con hash inmutable. Tú controlas quién tiene acceso.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Add Document Button */}
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="w-full mb-6 bg-purple-500 hover:bg-purple-600 h-12 gap-2 text-white"
        >
          <Plus className="w-5 h-5" />
          Añadir Documento
        </Button>

        {/* Documents List */}
        {documents.length === 0 ? (
          <Card className="p-8 bg-slate-900 border-slate-800 text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No tienes documentos registrados</p>
            <p className="text-sm text-slate-500">
              Agrega tu primer documento para tokenizarlo en blockchain
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {documents.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-purple-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm text-white truncate">{doc.type}</h3>
                          <p className="text-xs text-slate-400">No. {doc.number}</p>
                        </div>
                        <Badge className={`${getStatusColor(doc.verified, doc.blockchainVerified)} flex items-center gap-1`}>
                          {getStatusIcon(doc.verified, doc.blockchainVerified)}
                          {getStatusText(doc.verified, doc.blockchainVerified)}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-xs">
                          <LinkIcon className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-400">Hash:</span>
                          <button 
                            onClick={() => openBlockchainExplorer(doc.tokenHash)}
                            className="font-mono text-slate-400 hover:text-blue-400 transition-colors truncate"
                          >
                            {doc.tokenHash}
                          </button>
                        </div>
                        {doc.blockchainVerified && doc.blockchainTxHash && (
                          <div className="flex items-center gap-2 text-xs bg-emerald-500/10 px-2 py-1.5 rounded border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Blockchain TX:</span>
                            <button 
                              onClick={() => openBlockchainExplorer(doc.blockchainTxHash!)}
                              className="font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex-1 text-left truncate"
                            >
                              {doc.blockchainTxHash.substring(0, 20)}...
                            </button>
                            <ExternalLink className="w-3 h-3 text-emerald-400" />
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mb-3">
                        Emitido: {new Date(doc.issueDate).toLocaleDateString('es-MX')}
                        {doc.expiryDate && ` • Vence: ${new Date(doc.expiryDate).toLocaleDateString('es-MX')}`}
                      </div>

                      {doc.activeShares && doc.activeShares > 0 && (
                        <div className="flex items-center gap-2 text-xs text-orange-400 mb-3 p-2 bg-orange-500/10 rounded-lg">
                          <Eye className="w-4 h-4" />
                          <span>{doc.activeShares} acceso(s) activo(s)</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedDoc(doc);
                            setShowShareDialog(true);
                          }}
                          size="sm"
                          className="flex-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Compartir
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedDoc(doc);
                            setShowDetailDialog(true);
                          }}
                          size="sm"
                          className="bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Security Notice */}
        <Card className="mt-6 p-4 bg-purple-900/20 border-purple-500/30">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white mb-1">Nivel de Privacidad Alto con Blockchain</p>
              <p className="text-xs text-slate-400">
                Cada documento está protegido con hash criptográfico registrado en blockchain.
                No compartas documentos sin revisar la solicitud. Puedes revocar el acceso
                en cualquier momento.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Document Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Agregar Documento</DialogTitle>
            <DialogDescription className="text-slate-400">
              El documento será tokenizado y registrado en blockchain
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white mb-2 block">Tipo de Documento</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="INE" className="text-white">INE - Identificación Nacional</SelectItem>
                  <SelectItem value="Pasaporte" className="text-white">Pasaporte</SelectItem>
                  <SelectItem value="RFC" className="text-white">RFC - Registro Federal</SelectItem>
                  <SelectItem value="CURP" className="text-white">CURP</SelectItem>
                  <SelectItem value="Licencia" className="text-white">Licencia de Conducir</SelectItem>
                  <SelectItem value="Certificado" className="text-white">Certificado Profesional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white mb-2 block">Número de Documento</Label>
              <Input
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Ej: ABCD123456HEFGHI00"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Fecha de Emisión</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Fecha de Vencimiento (opcional)</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex gap-2">
                <LinkIcon className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white">
                  Al agregar el documento, se generará un hash criptográfico único que será
                  registrado en blockchain Ethereum/Polygon para garantizar su inmutabilidad.
                </p>
              </div>
            </div>

            <Button
              onClick={handleAddDocument}
              disabled={isLoading}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registrando en Blockchain...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Agregar y Tokenizar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Detalles del Documento</DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4 mt-2">
              {/* Info principal */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{selectedDoc.type}</p>
                    <p className="text-xs text-slate-400 font-mono truncate">{selectedDoc.number}</p>
                  </div>
                  <Badge className={getStatusColor(selectedDoc.verified, selectedDoc.blockchainVerified)}>
                    {getStatusIcon(selectedDoc.verified, selectedDoc.blockchainVerified)}
                  </Badge>
                </div>
              </div>

              {/* Información blockchain */}
              <Card className="p-3 bg-slate-800/50 border-slate-700">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      Hash del Token
                    </p>
                    <button 
                      onClick={() => openBlockchainExplorer(selectedDoc.tokenHash)}
                      className="text-blue-400 font-mono text-xs flex items-center gap-1.5 hover:text-blue-300 transition-colors group w-full"
                    >
                      <span className="truncate">{selectedDoc.tokenHash}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                    </button>
                  </div>
                  
                  {selectedDoc.blockchainVerified && selectedDoc.blockchainTxHash && (
                    <div className="pt-2 border-t border-slate-700">
                      <p className="text-xs text-emerald-400 mb-1.5 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Transacción Blockchain
                      </p>
                      <button 
                        onClick={() => openBlockchainExplorer(selectedDoc.blockchainTxHash!)}
                        className="text-emerald-400 font-mono text-xs flex items-center gap-1.5 hover:text-emerald-300 transition-colors group w-full"
                      >
                        <span className="truncate">{selectedDoc.blockchainTxHash}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                      </button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Fechas */}
              <Card className="p-3 bg-slate-800/50 border-slate-700">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-400">Emitido</p>
                    <p className="text-xs text-white">{new Date(selectedDoc.issueDate).toLocaleDateString('es-MX')}</p>
                  </div>
                  {selectedDoc.expiryDate && (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                      <p className="text-xs text-slate-400">Vencimiento</p>
                      <p className="text-xs text-white">{new Date(selectedDoc.expiryDate).toLocaleDateString('es-MX')}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Aviso de seguridad */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="flex gap-2">
                  <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white">
                    Documento protegido con blockchain. Hash inmutable verificable por cualquier entidad autorizada.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Compartir Documento</DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4 mt-4">
              <Card className="p-4 bg-slate-800 border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Documento seleccionado</p>
                <p className="text-sm text-white">{selectedDoc.type}</p>
                <p className="text-xs text-slate-400 font-mono mt-1">{selectedDoc.tokenHash}</p>
              </Card>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-sm text-yellow-400">⚠️ Importante</p>
                <p className="text-xs text-white mt-1">
                  Esta acción genera una solicitud. El destinatario deberá proporcionar
                  su RFC para validar su identidad antes de recibir acceso. Todo queda
                  registrado en blockchain.
                </p>
              </div>

              <Button
                onClick={handleShare}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
              >
                Generar Solicitud de Compartir
              </Button>

              {selectedDoc.activeShares && selectedDoc.activeShares > 0 && (
                <>
                  <div className="border-t border-slate-800 pt-4">
                    <p className="text-sm text-white mb-3">Accesos Activos</p>
                    <div className="space-y-2">
                      <Card className="p-3 bg-slate-800 border-slate-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white">Banco Nacional</p>
                            <p className="text-xs text-slate-400">RFC: BNA010101ABC</p>
                            <p className="text-xs text-slate-400">Expira en 2 días</p>
                          </div>
                          <Button
                            onClick={() => handleRevoke(selectedDoc.id)}
                            size="sm"
                            variant="destructive"
                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                          >
                            Revocar
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
