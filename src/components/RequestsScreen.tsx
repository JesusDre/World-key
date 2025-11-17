import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Eye, RefreshCcw, FileText, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import type { Screen } from "../App";
import { useSoroban } from "@/hooks/useSoroban";
import type { DocumentRecord } from "@/utils/stellar";

interface RequestsScreenProps {
	onNavigate: (screen: Screen) => void;
}

export function RequestsScreen({ onNavigate }: RequestsScreenProps) {
	const { sharedDocuments, refresh } = useSoroban();
	const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const sharedList = useMemo(
		() =>
			[...sharedDocuments].sort(
				(a, b) =>
					new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime(),
			),
		[sharedDocuments],
	);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await refresh();
			toast.success("Solicitudes sincronizadas");
		} catch (error) {
			const err = error as Error;
			toast.error("No se pudo sincronizar", {
				description: err.message ?? "Intenta nuevamente",
			});
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleCopyOwner = async (owner: string) => {
		try {
			await navigator.clipboard.writeText(owner);
			toast.success("Dirección copiada");
		} catch {
			toast.error("No se pudo copiar la dirección");
		}
	};

	return (
		<div className="min-h-screen bg-slate-950 text-white pb-8">
			<div className="bg-gradient-to-br from-orange-900/40 to-slate-900/40 px-6 pt-12 pb-8 border-b border-slate-800">
				<div className="flex items-center gap-4 mb-8">
					<button
						onClick={() => onNavigate("dashboard")}
						className="p-2 hover:bg-slate-800 rounded-full transition-colors"
					>
						<ArrowLeft className="w-6 h-6" />
					</button>
					<h1 className="text-2xl">Solicitudes</h1>
				</div>

				<div className="space-y-3">
					<div className="flex items-center gap-3 p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
						<Shield className="w-6 h-6 text-orange-400 flex-shrink-0" />
						<div>
							<p className="text-sm text-white">Documentos compartidos contigo</p>
							<p className="text-xs text-slate-300">
								{sharedList.length === 0
									? "Nadie ha compartido documentos recientemente"
									: `${sharedList.length} acceso(s) activo(s) desde la API de WorldKey`}
							</p>
						</div>
					</div>

					<Button
						onClick={handleRefresh}
						disabled={isRefreshing}
						className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center gap-2"
					>
						{isRefreshing ? (
							<>
								<RefreshCcw className="w-4 h-4 animate-spin" />
								Sincronizando…
							</>
						) : (
							<>
								<RefreshCcw className="w-4 h-4" />
								Actualizar solicitudes
							</>
						)}
					</Button>
				</div>
			</div>

			<div className="px-6 py-6 space-y-5">
				{sharedList.length === 0 ? (
					<Card className="p-8 bg-slate-900 border-slate-800 text-center">
						<FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
						<p className="text-slate-300 mb-2">No tienes solicitudes aprobadas todavía</p>
						<p className="text-sm text-slate-500">
							Cuando una organización comparta un documento contigo, aparecerá aquí con todos los detalles.
						</p>
					</Card>
				) : (
					<div className="space-y-4">
						{sharedList.map((doc, index) => (
							<motion.div
								key={`${doc.docId}-${doc.owner}`}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
							>
								<Card className="p-5 bg-slate-900 border border-orange-500/30 hover:border-orange-500/50 transition-colors">
									<div className="flex items-start justify-between gap-3">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-2">
												<Badge className="bg-orange-500/10 text-orange-300 border-orange-500/30">
													Compartido contigo
												</Badge>
												<span className="text-xs text-slate-500">
													{new Date(doc.metadata.createdAt).toLocaleString("es-MX")}
												</span>
											</div>
											<h3 className="text-sm text-white">{doc.metadata.type}</h3>
											<p className="text-xs text-slate-400">No. {doc.metadata.number}</p>

											<div className="mt-3 space-y-1 text-xs text-slate-400">
												<div className="flex items-center gap-2">
													<span className="text-slate-500">Propietario:</span>
													<button
														onClick={() => handleCopyOwner(doc.owner)}
														className="font-mono text-blue-400 hover:text-blue-300 truncate"
													>
														{shorten(doc.owner)}
													</button>
												</div>
												<div>
													Emitido: {doc.metadata.issueDate
														? new Date(doc.metadata.issueDate).toLocaleDateString("es-MX")
														: "-"}
												</div>
												{doc.metadata.expiryDate && (
													<div>Vence: {new Date(doc.metadata.expiryDate).toLocaleDateString("es-MX")}</div>
												)}
											</div>
										</div>

										<div className="flex flex-col gap-2">
											<Button
												onClick={() => {
													setSelectedDoc(doc);
													setShowDetailDialog(true);
												}}
												size="sm"
												className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
											>
												<Eye className="w-4 h-4 mr-2" />
												Ver
											</Button>
											<Button
												onClick={() => handleCopyOwner(doc.owner)}
												size="sm"
												variant="outline"
												className="border-slate-600 text-slate-300"
											>
												<Copy className="w-4 h-4 mr-2" />
												Copiar dueño
											</Button>
										</div>
									</div>
								</Card>
							</motion.div>
						))}
					</div>
				)}

				<Card className="p-4 bg-slate-900/50 border-slate-800 text-sm text-slate-300">
					<div className="flex items-center gap-3">
						<Shield className="w-5 h-5 text-orange-300" />
						<div>
							<p>Los accesos listados provienen del backend de WorldKey.</p>
							<p className="text-xs text-slate-500">
								Puedes revocar permisos desde Documentos; esta vista es solo para consulta rápida.
							</p>
						</div>
					</div>
				</Card>
			</div>

			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
					<DialogHeader>
						<DialogTitle>Detalle del documento</DialogTitle>
					</DialogHeader>
					{selectedDoc ? (
						<div className="space-y-4 mt-3">
							<Card className="p-4 bg-slate-800 border-slate-700 space-y-2">
								<div>
									<p className="text-xs text-slate-400">Tipo</p>
									<p className="text-sm text-white">{selectedDoc.metadata.type}</p>
								</div>
								<div>
									<p className="text-xs text-slate-400">Número</p>
									<p className="text-sm text-white font-mono">{selectedDoc.metadata.number}</p>
								</div>
								<div>
									<p className="text-xs text-slate-400">Hash</p>
									<p className="text-xs font-mono text-slate-300 break-all">{selectedDoc.hash}</p>
								</div>
								<div className="text-xs text-slate-400 space-y-1">
									<p>Emitido: {selectedDoc.metadata.issueDate ? new Date(selectedDoc.metadata.issueDate).toLocaleDateString("es-MX") : "-"}</p>
									<p>
										Vence: {selectedDoc.metadata.expiryDate
											? new Date(selectedDoc.metadata.expiryDate).toLocaleDateString("es-MX")
											: "-"}
									</p>
								</div>
							</Card>

							<div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-slate-300">
								<p className="text-sm text-white mb-1">¿Quién lo compartió?</p>
								<p className="font-mono text-blue-300 break-all mb-2">{selectedDoc.owner}</p>
								<p>
									Este acceso proviene directamente del backend y respeta los permisos configurados por el propietario.
								</p>
							</div>
						</div>
					) : (
						<p className="text-sm text-slate-400">Selecciona un documento para ver sus detalles.</p>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

function shorten(value: string, size = 6): string {
	if (!value) return "";
	return `${value.slice(0, size)}…${value.slice(-size)}`;
}
