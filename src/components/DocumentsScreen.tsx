import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Loader2,
  Plus,
  Shield,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import type { Screen } from "../App";
import { useSoroban } from "@/hooks/useSoroban";
import type { DocumentRecord, PermissionRecord } from "@/utils/stellar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface DocumentsScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface ShareEntry {
  docId: number;
  target: string;
  grantedAt: string;
}

const DOCUMENT_TYPES = [
  { value: "INE", label: "INE - Identificación Nacional" },
  { value: "Pasaporte", label: "Pasaporte" },
  { value: "RFC", label: "RFC - Registro Federal" },
  { value: "CURP", label: "CURP" },
  { value: "Licencia", label: "Licencia de Conducir" },
  { value: "Certificado", label: "Certificado Profesional" },
];

export function DocumentsScreen({ onNavigate }: DocumentsScreenProps) {
  const {
    identity,
    documents,
    grantedPermissions,
    createDocument,
    shareDocument,
    revokePermission,
    refresh,
  } = useSoroban();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareTarget, setShareTarget] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (identity) {
      refresh().catch((error: unknown) => {
        const err = error as Error;
        console.warn("No se pudieron refrescar los documentos", err);
      });
    }
  }, [identity, refresh]);

  const sharesByDoc = useMemo(() => {
    const grouped = new Map<number, ShareEntry[]>();
    grantedPermissions.forEach((permission: PermissionRecord) => {
      const collection = grouped.get(permission.docId) ?? [];
      const existing = collection.find((entry) => entry.target === permission.target);
      if (existing) {
        existing.grantedAt = permission.grantedAt ?? existing.grantedAt;
      } else {
        collection.push({
          docId: permission.docId,
          target: permission.target,
          grantedAt: permission.grantedAt ?? new Date().toISOString(),
        });
      }
      grouped.set(permission.docId, collection);
    });
    return grouped;
  }, [grantedPermissions]);

  const activeShares = (doc: DocumentRecord) => sharesByDoc.get(doc.docId)?.length ?? 0;

  const handleAddDocument = async () => {
    if (!identity) {
      toast.error("Conecta tu wallet primero");
      return;
    }

    if (!docType || !docNumber || !issueDate) {
      toast.error("Completa tipo, número y fecha de emisión");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Registrando documento…", { id: "mint-doc" });

    try {
      const record = await createDocument({
        type: docType,
        number: docNumber,
        issueDate,
        expiryDate: expiryDate || null,
      });
      toast.success("Documento registrado", {
        id: "mint-doc",
        description: `Hash: ${shorten(record.hash)}`,
      });
      setShowAddDialog(false);
      setDocType("");
      setDocNumber("");
      setIssueDate("");
      setExpiryDate("");
      await refresh();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error("No se pudo registrar el documento", {
        id: "mint-doc",
        description: err.message ?? "Intenta de nuevo",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareSubmit = async () => {
    if (!selectedDoc) return;
    const target = shareTarget.trim();
    if (!target) {
      toast.error("Ingresa la dirección pública que deseas autorizar");
      return;
    }

    setIsSharing(true);
    try {
      await shareDocument(selectedDoc.docId, target);
      toast.success("Acceso aprobado", {
        description: `La dirección ${shorten(target)} ahora puede consultar este documento`,
      });
      setShareTarget("");
    } catch (error: unknown) {
      const err = error as Error;
      toast.error("No se pudo compartir el documento", {
        description: err.message ?? "Intenta nuevamente",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeShare = async (entry: ShareEntry) => {
    try {
      await revokePermission(entry.docId, entry.target);
      toast.success("Acceso revocado correctamente");
    } catch (error: unknown) {
      const err = error as Error;
      toast.error("No se pudo revocar el acceso", {
        description: err.message ?? "Intenta nuevamente",
      });
    }
  };

  const openBlockchainExplorer = (hash: string) => {
    const explorerUrl = `https://horizon-futurenet.stellar.org/transactions/${hash}`;
    window.open(explorerUrl, "_blank", "noopener,noreferrer");
  };

  const documentsList = useMemo(
    () =>
      [...documents].sort(
        (a, b) =>
          new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime(),
      ),
    [documents],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-8">
      <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 px-6 pt-12 pb-8 border-b border-slate-800">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate("dashboard")}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl text-white">Documentos</h1>
        </div>

        <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
          <Shield className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-white">Documentos tokenizados en Soroban</p>
            <p className="text-xs text-slate-400">
              Cada registro genera un hash inmutable. Los permisos se controlan desde los contratos de WorldKey.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <Button onClick={() => setShowAddDialog(true)} className="w-full mb-6 bg-purple-500 hover:bg-purple-600 h-12 gap-2">
          <Plus className="w-5 h-5" />
          Añadir Documento
        </Button>

        {documentsList.length === 0 ? (
          <Card className="p-8 bg-slate-900 border-slate-800 text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No tienes documentos registrados</p>
            <p className="text-sm text-slate-500">Agrega tu primer documento para tokenizarlo en Soroban.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {documentsList.map((doc: DocumentRecord, index: number) => (
              <motion.div
                key={doc.hash}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-purple-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm text-white truncate">{doc.metadata.type}</h3>
                          <p className="text-xs text-slate-400">No. {doc.metadata.number}</p>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            On-chain
                          </span>
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-xs">
                          <LinkIcon className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-400">Hash:</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(doc.hash)}
                            className="font-mono text-slate-400 hover:text-blue-400 transition-colors truncate"
                          >
                            {doc.hash}
                          </button>
                        </div>
                        {doc.lastTx && (
                          <div className="flex items-center gap-2 text-xs bg-emerald-500/10 px-2 py-1.5 rounded border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Tx:</span>
                            <button
                              onClick={() => openBlockchainExplorer(doc.lastTx!)}
                              className="font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex-1 truncate text-left"
                            >
                              {doc.lastTx}
                            </button>
                            <ExternalLink className="w-3 h-3 text-emerald-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 text-xs text-slate-400 mb-3">
                        <span>
                          Emitido: {doc.metadata.issueDate ? new Date(doc.metadata.issueDate).toLocaleDateString("es-MX") : "-"}
                        </span>
                        {doc.metadata.expiryDate && (
                          <>
                            <span>|</span>
                            <span>Vence: {new Date(doc.metadata.expiryDate).toLocaleDateString("es-MX")}</span>
                          </>
                        )}
                      </div>

                      {activeShares(doc) > 0 && (
                        <div className="flex items-center gap-2 text-xs text-orange-400 mb-3 p-2 bg-orange-500/10 rounded-lg">
                          <Eye className="w-4 h-4" />
                          <span>{activeShares(doc)} acceso(s) activo(s)</span>
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
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:bg-slate-800"
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
      </div>

      <Card className="mx-6 mt-4 mb-10 p-4 bg-purple-900/20 border-purple-500/30">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white mb-1">Privacidad respaldada por contratos Soroban</p>
            <p className="text-xs text-slate-400">
              Autoriza o revoca accesos desde esta pantalla. Las decisiones quedan registradas en Futurenet.
            </p>
          </div>
        </div>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Agregar documento</DialogTitle>
            <DialogDescription className="text-slate-400">
              Se generará un hash con tus datos y se enviará una transacción a la red Futurenet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white mb-2 block">Tipo</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {DOCUMENT_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white mb-2 block">Número</Label>
              <Input
                value={docNumber}
                onChange={(event) => setDocNumber(event.target.value)}
                placeholder="Ej: ABCD123456HEFGHI00"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Fecha de emisión</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Fecha de expiración (opcional)</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <Button onClick={handleAddDocument} disabled={isSubmitting} className="w-full bg-purple-500 hover:bg-purple-600">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registrando…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Tokenizar documento
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de documento</DialogTitle>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-4 mt-2">
              <Card className="p-4 bg-slate-800 border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{selectedDoc.metadata.type}</p>
                    <p className="text-xs text-slate-400 font-mono truncate">{selectedDoc.metadata.number}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-3 bg-slate-800 border-slate-700">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Hash</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedDoc.hash)}
                      className="font-mono text-blue-400 hover:text-blue-300 transition-colors truncate text-right"
                    >
                      {selectedDoc.hash}
                    </button>
                  </div>
                  {selectedDoc.lastTx && (
                    <div className="flex justify-between text-xs text-emerald-400">
                      <span>Transacción</span>
                      <button onClick={() => openBlockchainExplorer(selectedDoc.lastTx!)} className="font-mono hover:underline truncate text-right">
                        {selectedDoc.lastTx}
                      </button>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-3 bg-slate-800/50 border-slate-700">
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Emitido</span>
                    <span>
                      {selectedDoc.metadata.issueDate
                        ? new Date(selectedDoc.metadata.issueDate).toLocaleDateString("es-MX")
                        : "-"}
                    </span>
                  </div>
                  {selectedDoc.metadata.expiryDate && (
                    <div className="flex justify-between pt-2 border-t border-slate-700">
                      <span>Vencimiento</span>
                      <span>{new Date(selectedDoc.metadata.expiryDate).toLocaleDateString("es-MX")}</span>
                    </div>
                  )}
                </div>
              </Card>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5" />
                <span>Documento protegido en Futurenet. El hash puede verificarse públicamente con cualquier visor Soroban.</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Administrar accesos</DialogTitle>
          </DialogHeader>

          {selectedDoc ? (
            <div className="space-y-5 mt-3">
              <Card className="p-4 bg-slate-800 border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Documento</p>
                <p className="text-sm text-white">{selectedDoc.metadata.type}</p>
                <p className="text-xs text-slate-400 font-mono truncate">{selectedDoc.hash}</p>
              </Card>

              <div className="space-y-3">
                <Label className="text-white text-sm">Dirección pública a autorizar</Label>
                <Input
                  value={shareTarget}
                  onChange={(event) => setShareTarget(event.target.value)}
                  placeholder="G... destino en Futurenet"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
                <Button onClick={handleShareSubmit} disabled={isSharing} className="w-full bg-emerald-500 hover:bg-emerald-600">
                  {isSharing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Firmando…
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Conceder acceso
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm text-white flex items-center gap-2">
                  Accesos activos
                  <Badge variant="outline" className="border-purple-500/40 text-purple-300">
                    {sharesByDoc.get(selectedDoc.docId)?.length ?? 0}
                  </Badge>
                </h3>

                {(sharesByDoc.get(selectedDoc.docId) ?? []).map((share) => (
                  <Card key={`${share.docId}-${share.target}`} className="p-4 bg-slate-800 border-slate-700 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{shorten(share.target, 6)}</p>
                        <p className="text-xs text-slate-400">
                          Desde {new Date(share.grantedAt).toLocaleString("es-MX")}
                        </p>
                      </div>
                      <Badge className="bg-emerald-500/10 border-emerald-500/40 text-emerald-300">Activo</Badge>
                    </div>
                    <Button
                      onClick={() => handleRevokeShare(share)}
                      size="sm"
                      variant="outline"
                      className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                    >
                      Revocar acceso
                    </Button>
                  </Card>
                ))}

                {(sharesByDoc.get(selectedDoc.docId) ?? []).length === 0 && (
                  <Card className="p-4 bg-slate-800/60 border-slate-700 text-xs text-slate-400">
                    No hay accesos registrados para este documento.
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">Selecciona un documento para gestionar permisos.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function shorten(value: string, size = 4): string {
  if (!value) return "";
  return `${value.slice(0, size)}…${value.slice(-size)}`;
}
