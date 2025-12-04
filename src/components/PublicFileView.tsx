import { useEffect, useState } from 'react';
import { Download, FileText, Image as ImageIcon, File as FileIcon, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface SharedFileInfo {
    fileName: string;
    fileType: string;
    fileSize: number;
    description: string;
    uploadedAt: string;
    ownerEmail: string;
    driveViewLink?: string;
    driveDownloadLink?: string;
    storedInDrive?: boolean;
}

export function PublicFileView() {
    // Get shareToken from URL path (e.g., /share/abc123)
    const shareToken = window.location.pathname.split('/share/')[1];

    const [fileInfo, setFileInfo] = useState<SharedFileInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (shareToken) {
            loadFileInfo();
        }
    }, [shareToken]);

    const loadFileInfo = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/storage/public/${shareToken}/info`);
            const data = await response.json();

            if (data.success) {
                setFileInfo(data.file);
            } else {
                setError('Archivo no encontrado o el enlace ha expirado');
            }
        } catch (err) {
            setError('Error al cargar el archivo');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        // Use Google Drive link if available, otherwise use backend
        if (fileInfo?.driveDownloadLink) {
            window.open(fileInfo.driveDownloadLink, '_blank');
        } else {
            window.open(`http://localhost:8080/api/storage/public/${shareToken}`, '_blank');
        }
    };

    const handleView = () => {
        // Use Google Drive link if available, otherwise use backend
        if (fileInfo?.driveViewLink) {
            window.open(fileInfo.driveViewLink, '_blank');
        } else {
            window.open(`http://localhost:8080/api/storage/public/${shareToken}`, '_blank');
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
        if (fileType.startsWith('image/')) return <ImageIcon className="w-16 h-16 text-blue-400" />;
        if (fileType.includes('pdf')) return <FileText className="w-16 h-16 text-red-400" />;
        return <FileIcon className="w-16 h-16 text-slate-400" />;
    };

    const isImage = fileInfo?.fileType.startsWith('image/');
    const isPDF = fileInfo?.fileType.includes('pdf');

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-white">Cargando archivo...</p>
                </div>
            </div>
        );
    }

    if (error || !fileInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
                <Card className="max-w-md w-full p-8 bg-slate-900 border-slate-800 text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl text-white mb-2">Archivo no disponible</h1>
                    <p className="text-slate-400">{error}</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">W</span>
                        </div>
                        <div>
                            <h1 className="text-white font-bold">WorldKey</h1>
                            <p className="text-xs text-slate-400">Archivo compartido</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleDownload}
                        className="bg-purple-500 hover:bg-purple-600 gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Descargar
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto p-6">
                <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                    {/* File Preview */}
                    <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-800">
                        <div className="flex flex-col items-center justify-center text-center">
                            {getFileIcon(fileInfo.fileType)}
                            <h2 className="text-2xl text-white font-bold mt-4 mb-2">{fileInfo.fileName}</h2>
                            <p className="text-slate-400 text-sm">{formatFileSize(fileInfo.fileSize)}</p>
                        </div>

                        {/* Preview for images */}
                        {isImage && !fileInfo.storedInDrive && (
                            <div className="mt-6 rounded-lg overflow-hidden bg-slate-950 p-4">
                                <img
                                    src={`http://localhost:8080/api/storage/public/${shareToken}`}
                                    alt={fileInfo.fileName}
                                    className="max-w-full max-h-96 mx-auto rounded-lg"
                                />
                            </div>
                        )}

                        {/* Show Drive preview for Drive files */}
                        {fileInfo.storedInDrive && fileInfo.driveViewLink && (
                            <div className="mt-6">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                                    <p className="text-blue-400 text-sm text-center">
                                        Este archivo está almacenado en Google Drive
                                    </p>
                                </div>
                                <Button
                                    onClick={handleView}
                                    className="w-full bg-blue-500 hover:bg-blue-600"
                                >
                                    Ver en Google Drive
                                </Button>
                            </div>
                        )}

                        {/* Preview for PDFs (local storage only) */}
                        {isPDF && !fileInfo.storedInDrive && (
                            <div className="mt-6">
                                <Button
                                    onClick={handleView}
                                    variant="outline"
                                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Ver PDF
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* File Info */}
                    <div className="p-6 space-y-4">
                        {fileInfo.description && (
                            <div>
                                <h3 className="text-sm text-slate-400 mb-1">Descripción</h3>
                                <p className="text-white">{fileInfo.description}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm text-slate-400 mb-1">Compartido por</h3>
                                <p className="text-white text-sm">{fileInfo.ownerEmail}</p>
                            </div>
                            <div>
                                <h3 className="text-sm text-slate-400 mb-1">Fecha de subida</h3>
                                <p className="text-white text-sm">
                                    {new Date(fileInfo.uploadedAt).toLocaleDateString('es-MX', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <div className="flex items-start gap-3 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-bold text-sm">W</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm text-white font-medium mb-1">Compartido con WorldKey</h4>
                                    <p className="text-xs text-slate-400">
                                        Este archivo fue compartido de forma segura usando WorldKey.
                                        Descárgalo o visualízalo de manera segura.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleDownload}
                                className="flex-1 bg-purple-500 hover:bg-purple-600 gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Descargar Archivo
                            </Button>
                            {(isImage || isPDF) && (
                                <Button
                                    onClick={handleView}
                                    variant="outline"
                                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                                >
                                    Ver en nueva pestaña
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
