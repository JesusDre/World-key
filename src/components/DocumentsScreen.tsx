import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  File,
  Image,
  FileText,
  Download,
  Share2,
  Trash2,
  Link as LinkIcon,
  Crown,
  HardDrive,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle,
  CreditCard,
  FileCheck,
  Briefcase,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Screen } from '../App';
import type { AuthSession } from '../types/auth';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { apiRequest } from '../services/api';

interface DocumentsScreenProps {
  onNavigate: (screen: Screen) => void;
  session?: AuthSession;
}

interface UserFile {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  description: string;
  groupId: string | null;
  documentType: string | null;
  customName: string | null;
  isPublic: boolean;
  shareToken: string | null;
  uploadedAt: string;
  isTokenized: boolean;
}

interface DocumentGroup {
  groupId: string;
  documentType: string;
  customName: string;
  files: UserFile[];
  totalSize: number;
  uploadedAt: string;
  isPublic: boolean;
}

interface StorageInfo {
  storageUsed: number;
  storageAvailable: number;
  storageLimit: number;
}

const DOCUMENT_CATEGORIES = [
  {
    value: 'INE',
    label: 'INE - Identificación Nacional',
    icon: CreditCard,
    requiresBothSides: true,
    description: 'Sube el frente y reverso de tu INE'
  },
  {
    value: 'Pasaporte',
    label: 'Pasaporte',
    icon: FileCheck,
    requiresBothSides: false,
    description: 'Sube la página principal de tu pasaporte'
  },
  {
    value: 'RFC',
    label: 'RFC - Registro Federal',
    icon: FileText,
    requiresBothSides: false,
    description: 'Sube tu constancia de situación fiscal'
  },
  {
    value: 'CURP',
    label: 'CURP',
    icon: FileText,
    requiresBothSides: false,
    description: 'Sube tu CURP'
  },
  {
    value: 'Licencia',
    label: 'Licencia de Conducir',
    icon: CreditCard,
    requiresBothSides: true,
    description: 'Sube el frente y reverso de tu licencia'
  },
  {
    value: 'Comprobante',
    label: 'Comprobante de Domicilio',
    icon: FileText,
    requiresBothSides: false,
    description: 'Recibo de luz, agua, teléfono, etc.'
  },
  {
    value: 'Contrato',
    label: 'Contrato',
    icon: Briefcase,
    requiresBothSides: false,
    description: 'Contratos laborales, de arrendamiento, etc.'
  },
  {
    value: 'Otro',
    label: 'Otro Documento',
    icon: File,
    requiresBothSides: false,
    description: 'Cualquier otro tipo de documento'
  },
];

export function DocumentsScreen({ onNavigate, session }: DocumentsScreenProps) {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    storageUsed: 0,
    storageAvailable: 5368709120,
    storageLimit: 5368709120,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UserFile | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<DocumentGroup | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Upload flow states
  const [uploadStep, setUploadStep] = useState<'category' | 'files' | 'details'>('category');
  const [documentCategory, setDocumentCategory] = useState('');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [session]);

  useEffect(() => {
    // Group files by groupId
    const grouped = new Map<string, UserFile[]>();
    const ungrouped: UserFile[] = [];

    files.forEach(file => {
      if (file.groupId) {
        const existing = grouped.get(file.groupId) || [];
        existing.push(file);
        grouped.set(file.groupId, existing);
      } else {
        ungrouped.push(file);
      }
    });

    const groups: DocumentGroup[] = [];

    // Add grouped documents
    grouped.forEach((groupFiles, groupId) => {
      const firstFile = groupFiles[0];
      groups.push({
        groupId,
        documentType: firstFile.documentType || 'Documento',
        customName: firstFile.customName || firstFile.documentType || 'Documento',
        files: groupFiles.sort((a, b) => a.fileName.localeCompare(b.fileName)),
        totalSize: groupFiles.reduce((sum, f) => sum + f.fileSize, 0),
        uploadedAt: firstFile.uploadedAt,
        isPublic: groupFiles.some(f => f.isPublic),
      });
    });

    // Add ungrouped files as single-file groups
    ungrouped.forEach(file => {
      groups.push({
        groupId: `single-${file.id}`,
        documentType: file.documentType || 'Documento',
        customName: file.customName || file.fileName,
        files: [file],
        totalSize: file.fileSize,
        uploadedAt: file.uploadedAt,
        isPublic: file.isPublic,
      });
    });

    // Sort by upload date
    groups.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    setDocumentGroups(groups);
  }, [files]);

  const loadFiles = async () => {
    if (!session?.token) {
      setIsLoading(false);
      return;
    }

    try {
      const response: any = await apiRequest('/storage/files', {
        method: 'GET',
        token: session.token,
      });

      if (response.success) {
        setFiles(response.files);
        setStorageInfo({
          storageUsed: response.storageUsed,
          storageAvailable: response.storageAvailable,
          storageLimit: response.storageLimit,
        });
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCategory = DOCUMENT_CATEGORIES.find(c => c.value === documentCategory);

  const handleStartUpload = () => {
    setUploadStep('category');
    setDocumentCategory('');
    setFrontFile(null);
    setBackFile(null);
    setCustomName('');
    setShowUploadDialog(true);
  };

  const handleCategorySelect = () => {
    if (!documentCategory) {
      toast.error('Selecciona un tipo de documento');
      return;
    }
    setUploadStep('files');
  };

  const handleFrontFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > storageInfo.storageAvailable) {
        toast.error('Espacio insuficiente');
        return;
      }
      setFrontFile(file);
    }
  };

  const handleBackFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > storageInfo.storageAvailable) {
        toast.error('Espacio insuficiente');
        return;
      }
      setBackFile(file);
    }
  };

  const handleContinueToDetails = () => {
    if (!frontFile) {
      toast.error('Sube al menos el archivo principal');
      return;
    }
    if (selectedCategory?.requiresBothSides && !backFile) {
      toast.error('Este tipo de documento requiere frente y reverso');
      return;
    }
    setUploadStep('details');
  };

  const handleUpload = async () => {
    if (!frontFile || !session?.token) return;

    setIsUploading(true);

    try {
      const groupId = crypto.randomUUID();
      const finalCustomName = customName || selectedCategory?.label || 'Documento';

      // Upload front file
      const frontFormData = new FormData();
      frontFormData.append('file', frontFile);
      frontFormData.append('description', `${selectedCategory?.label} - Frente`);
      frontFormData.append('groupId', groupId);
      frontFormData.append('documentType', documentCategory);
      frontFormData.append('customName', finalCustomName);

      const frontResponse = await fetch('http://localhost:8080/api/storage/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
        body: frontFormData,
      });

      const frontData = await frontResponse.json();

      if (!frontData.success) {
        throw new Error(frontData.message || 'Error al subir archivo');
      }

      // Upload back file if exists
      if (backFile) {
        const backFormData = new FormData();
        backFormData.append('file', backFile);
        backFormData.append('description', `${selectedCategory?.label} - Reverso`);
        backFormData.append('groupId', groupId);
        backFormData.append('documentType', documentCategory);
        backFormData.append('customName', finalCustomName);

        const backResponse = await fetch('http://localhost:8080/api/storage/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
          body: backFormData,
        });

        const backData = await backResponse.json();

        if (!backData.success) {
          throw new Error(backData.message || 'Error al subir reverso');
        }
      }

      toast.success('Documento subido exitosamente');
      setShowUploadDialog(false);
      resetUploadState();
      loadFiles();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Error al subir archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadState = () => {
    setUploadStep('category');
    setDocumentCategory('');
    setFrontFile(null);
    setBackFile(null);
    setCustomName('');
  };

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleGenerateShareLink = async (file: UserFile) => {
    if (!session?.token) return;

    try {
      const response: any = await apiRequest(`/storage/share/${file.id}`, {
        method: 'POST',
        token: session.token,
      });
      if (response.success) {
        setSelectedFile({ ...file, shareToken: response.shareToken, isPublic: true });
        setShowShareDialog(true);
        loadFiles();
      } else {
        toast.error(response.message || 'Error al generar link');
      }
    } catch (error: any) {
      console.error('Share link error:', error);
      toast.error(error.message || 'Error al generar link');
    }
  };

  const handleCopyLink = () => {
    if (selectedFile?.shareToken) {
      const link = `${window.location.origin}/share/${selectedFile.shareToken}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success('Link copiado al portapapeles');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDeleteGroup = async () => {
    if (!session?.token || !selectedGroup) return;

    try {
      let deletedCount = 0;
      let errorCount = 0;

      for (const file of selectedGroup.files) {
        try {
          await apiRequest(`/storage/files/${file.id}`, {
            method: 'DELETE',
            token: session.token,
          });
          deletedCount++;
        } catch (fileError: any) {
          console.error(`Error deleting file ${file.id}:`, fileError);
          errorCount++;
        }
      }

      if (deletedCount > 0) {
        toast.success(`${deletedCount} archivo(s) eliminado(s)`);
      }

      if (errorCount > 0) {
        toast.warning(`No se pudieron eliminar ${errorCount} archivo(s)`);
      }

      setShowDeleteDialog(false);
      setSelectedGroup(null);
      loadFiles();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar documento');
      setShowDeleteDialog(false);
      setSelectedGroup(null);
    }
  };

  const handleDownload = async (file: UserFile) => {
    if (!session?.token) return;

    try {
      const response = await fetch(`http://localhost:8080/api/storage/download/${file.id}`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error('Error al descargar archivo');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Error al descargar archivo');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-6 h-6 text-blue-400" />;
    if (fileType.includes('pdf')) return <FileText className="w-6 h-6 text-red-400" />;
    return <File className="w-6 h-6 text-slate-400" />;
  };

  const storagePercentage = (storageInfo.storageUsed / storageInfo.storageLimit) * 100;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      <input
        ref={frontInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf"
        onChange={handleFrontFileSelect}
      />
      <input
        ref={backInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf"
        onChange={handleBackFileSelect}
      />

      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 px-6 pt-12 pb-8 border-b border-slate-800">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Mis Documentos</h1>
            <p className="text-sm text-slate-400">Almacenamiento seguro en la nube</p>
          </div>
        </div>

        {/* Storage Info */}
        <Card className="p-4 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-white">Almacenamiento</span>
            </div>
            <span className="text-sm text-slate-400">
              {formatFileSize(storageInfo.storageUsed)} / {formatFileSize(storageInfo.storageLimit)}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${storagePercentage > 90 ? 'bg-red-500' : storagePercentage > 70 ? 'bg-yellow-500' : 'bg-emerald-500'
                }`}
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {formatFileSize(storageInfo.storageAvailable)} disponibles
          </p>
        </Card>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900 mb-6">
            <TabsTrigger value="files">Archivos</TabsTrigger>
            <TabsTrigger value="blockchain" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Blockchain (Premium)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
            {/* Upload Button */}
            <Button
              onClick={handleStartUpload}
              className="w-full h-14 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 gap-2"
            >
              <Upload className="w-5 h-5" />
              Subir Documento
            </Button>

            {/* Document Groups List */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 bg-slate-900 border-slate-800 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-800 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 bg-slate-800 rounded"></div>
                        <div className="h-3 w-24 bg-slate-800 rounded"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : documentGroups.length === 0 ? (
              <Card className="p-8 bg-slate-900 border-slate-800 text-center">
                <File className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No tienes documentos subidos</p>
                <p className="text-sm text-slate-500">Sube tu primer documento para comenzar</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {documentGroups.map((group, index) => {
                  const isExpanded = expandedGroups.has(group.groupId);
                  const Icon = DOCUMENT_CATEGORIES.find(c => c.value === group.documentType)?.icon || File;

                  return (
                    <motion.div
                      key={group.groupId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors overflow-hidden">
                        {/* Group Header */}
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm text-white font-medium truncate">{group.customName}</h3>
                                  <p className="text-xs text-slate-400">
                                    {group.files.length} archivo{group.files.length > 1 ? 's' : ''} • {formatFileSize(group.totalSize)} • {new Date(group.uploadedAt).toLocaleDateString('es-MX')}
                                  </p>
                                </div>
                                {group.isPublic && (
                                  <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                                    <LinkIcon className="w-3 h-3" />
                                    Compartido
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {group.files.length > 1 && (
                                  <Button
                                    onClick={() => toggleGroupExpansion(group.groupId)}
                                    size="sm"
                                    variant="outline"
                                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-4 h-4 mr-1" />
                                        Ocultar
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-4 h-4 mr-1" />
                                        Ver archivos
                                      </>
                                    )}
                                  </Button>
                                )}
                                <Button
                                  onClick={() => {
                                    setSelectedGroup(group);
                                    setShowDeleteDialog(true);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Files */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-slate-800"
                            >
                              <div className="p-4 space-y-2 bg-slate-900/50">
                                {group.files.map((file) => (
                                  <Card key={file.id} className="p-3 bg-slate-800 border-slate-700">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {getFileIcon(file.fileType)}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs text-white truncate">{file.fileName}</p>
                                          <p className="text-xs text-slate-400">{formatFileSize(file.fileSize)}</p>
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          onClick={() => handleDownload(file)}
                                          size="sm"
                                          variant="outline"
                                          className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 px-2"
                                        >
                                          <Download className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          onClick={() => handleGenerateShareLink(file)}
                                          size="sm"
                                          className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 h-8 px-2"
                                        >
                                          <Share2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="blockchain">
            <Card className="p-8 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 text-center">
              <Crown className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl text-white mb-2">Tokenización Blockchain</h3>
              <p className="text-slate-400 mb-4">
                Convierte tus documentos en NFTs verificables en la blockchain de Stellar
              </p>
              <div className="space-y-2 text-sm text-slate-400 mb-6">
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Verificación inmutable</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Control de permisos on-chain</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Prueba de autenticidad</span>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                <Crown className="w-4 h-4 mr-2" />
                Actualizar a Premium
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Dialog - Same as before */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        setShowUploadDialog(open);
        if (!open) resetUploadState();
      }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {uploadStep === 'category' && 'Tipo de Documento'}
              {uploadStep === 'files' && 'Subir Archivos'}
              {uploadStep === 'details' && 'Detalles del Documento'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {uploadStep === 'category' && 'Selecciona el tipo de documento que vas a subir'}
              {uploadStep === 'files' && selectedCategory?.description}
              {uploadStep === 'details' && 'Personaliza el nombre de tu documento'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Step 1: Category Selection */}
            {uploadStep === 'category' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {DOCUMENT_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.value}
                        onClick={() => setDocumentCategory(category.value)}
                        className={`p-4 rounded-lg border-2 transition-all ${documentCategory === category.value
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                          }`}
                      >
                        <Icon className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                        <p className="text-xs text-white text-center">{category.label}</p>
                      </button>
                    );
                  })}
                </div>
                <Button
                  onClick={handleCategorySelect}
                  disabled={!documentCategory}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                >
                  Continuar
                </Button>
              </>
            )}

            {/* Step 2: File Upload */}
            {uploadStep === 'files' && (
              <>
                <div className="space-y-3">
                  {/* Front File */}
                  <div>
                    <Label className="text-white mb-2 block">
                      {selectedCategory?.requiresBothSides ? 'Frente *' : 'Archivo *'}
                    </Label>
                    {frontFile ? (
                      <Card className="p-3 bg-slate-800 border-slate-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <File className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <span className="text-sm text-white truncate">{frontFile.name}</span>
                          </div>
                          <button
                            onClick={() => setFrontFile(null)}
                            className="p-1 hover:bg-slate-700 rounded"
                          >
                            <X className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                      </Card>
                    ) : (
                      <Button
                        onClick={() => frontInputRef.current?.click()}
                        variant="outline"
                        className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Seleccionar archivo
                      </Button>
                    )}
                  </div>

                  {/* Back File (if required) */}
                  {selectedCategory?.requiresBothSides && (
                    <div>
                      <Label className="text-white mb-2 block">Reverso *</Label>
                      {backFile ? (
                        <Card className="p-3 bg-slate-800 border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <File className="w-4 h-4 text-purple-400 flex-shrink-0" />
                              <span className="text-sm text-white truncate">{backFile.name}</span>
                            </div>
                            <button
                              onClick={() => setBackFile(null)}
                              className="p-1 hover:bg-slate-700 rounded"
                            >
                              <X className="w-4 h-4 text-slate-400" />
                            </button>
                          </div>
                        </Card>
                      ) : (
                        <Button
                          onClick={() => backInputRef.current?.click()}
                          variant="outline"
                          className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Seleccionar archivo
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setUploadStep('category')}
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-300"
                  >
                    Atrás
                  </Button>
                  <Button
                    onClick={handleContinueToDetails}
                    className="flex-1 bg-purple-500 hover:bg-purple-600"
                  >
                    Continuar
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Details */}
            {uploadStep === 'details' && (
              <>
                <div>
                  <Label className="text-white mb-2 block">Nombre del documento</Label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={selectedCategory?.label}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Deja vacío para usar el nombre por defecto
                  </p>
                </div>

                <Card className="p-3 bg-slate-800 border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">Resumen:</p>
                  <div className="space-y-1 text-xs">
                    <p className="text-white">• Tipo: {selectedCategory?.label}</p>
                    <p className="text-white">• Archivos: {backFile ? '2 (Frente y reverso)' : '1'}</p>
                    <p className="text-white">• Tamaño total: {formatFileSize((frontFile?.size || 0) + (backFile?.size || 0))}</p>
                  </div>
                </Card>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setUploadStep('files')}
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-300"
                  >
                    Atrás
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-1 bg-purple-500 hover:bg-purple-600"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Subir
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Compartir Archivo</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedFile?.fileName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* WorldKey View Link */}
            <Card className="p-4 bg-slate-800 border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">W</span>
                </div>
                <Label className="text-sm text-white">Vista WorldKey</Label>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Link con el branding de WorldKey para visualizar el archivo
              </p>
              <div className="flex gap-2">
                <Input
                  value={selectedFile?.shareToken ? `${window.location.origin}/share/${selectedFile.shareToken}` : ''}
                  readOnly
                  className="bg-slate-900 border-slate-700 text-white font-mono text-xs"
                />
                <Button
                  onClick={() => {
                    if (selectedFile?.shareToken) {
                      navigator.clipboard.writeText(`${window.location.origin}/share/${selectedFile.shareToken}`);
                      toast.success('Link copiado');
                    }
                  }}
                  size="icon"
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* Direct Download Link */}
            <Card className="p-4 bg-slate-800 border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 text-emerald-400" />
                <Label className="text-sm text-white">Descarga Directa</Label>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Link directo para descargar el archivo sin vista previa
              </p>
              <div className="flex gap-2">
                <Input
                  value={selectedFile?.shareToken ? `http://localhost:8080/api/storage/public/${selectedFile.shareToken}` : ''}
                  readOnly
                  className="bg-slate-900 border-slate-700 text-white font-mono text-xs"
                />
                <Button
                  onClick={() => {
                    if (selectedFile?.shareToken) {
                      navigator.clipboard.writeText(`http://localhost:8080/api/storage/public/${selectedFile.shareToken}`);
                      toast.success('Link copiado');
                    }
                  }}
                  size="icon"
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Cualquier persona con estos links podrá ver y descargar el archivo. Los links son permanentes hasta que elimines el archivo.
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Documento</DialogTitle>
            <DialogDescription className="text-slate-400">
              Esta acción no se puede deshacer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-white mb-2">
                ¿Estás seguro de eliminar <span className="font-medium">"{selectedGroup?.customName}"</span>?
              </p>
              <p className="text-xs text-slate-400">
                {selectedGroup?.files.length === 1
                  ? 'Se eliminará 1 archivo'
                  : `Se eliminarán ${selectedGroup?.files.length} archivos`
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowDeleteDialog(false)}
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteGroup}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
