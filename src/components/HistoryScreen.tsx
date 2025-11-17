import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Eye, Filter, FileText, Search, Send, Shield } from "lucide-react";
import { toast } from "sonner";
import type { Screen } from "../App";
import { useSoroban } from "@/hooks/useSoroban";
import type { HistoryRecord } from "@/utils/stellar";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

type HistoryCategory = "document" | "verification" | "access" | "identity";

interface HistoryScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface DisplayHistoryItem {
  id: string;
  category: HistoryCategory;
  title: string;
  description: string;
  timestamp: string;
  status?: "pending" | "completed" | "denied";
  hash?: string;
  actor?: string;
}

export function HistoryScreen({ onNavigate }: HistoryScreenProps) {
  const { history } = useSoroban();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<DisplayHistoryItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "documents" | "access">("all");

  const mappedHistory: DisplayHistoryItem[] = useMemo(() => history.map(formatHistoryItem), [history]);

  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return mappedHistory;
    return mappedHistory.filter((item) => item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query));
  }, [mappedHistory, searchQuery]);

  const documentsHistory = filteredHistory.filter((item) => item.category === "document" || item.category === "verification");
  const accessHistory = filteredHistory.filter((item) => item.category === "access");

  const getIcon = (category: HistoryCategory) => {
    switch (category) {
      case "document":
        return <FileText className="w-5 h-5 text-blue-400" />;
      case "verification":
        return <Shield className="w-5 h-5 text-emerald-400" />;
      case "access":
        return <Eye className="w-5 h-5 text-purple-400" />;
      case "identity":
      default:
        return <Send className="w-5 h-5 text-slate-400" />;
    }
  };

  const getBackgroundColor = (category: HistoryCategory) => {
    switch (category) {
      case "document":
        return "bg-blue-500/10";
      case "verification":
        return "bg-emerald-500/10";
      case "access":
        return "bg-purple-500/10";
      case "identity":
      default:
        return "bg-slate-500/10";
    }
  };

  const openExplorer = (hash?: string) => {
    if (!hash) {
      toast.error("Hash no disponible");
      return;
    }
    window.open(`https://horizon-futurenet.stellar.org/transactions/${hash}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-8">
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 px-6 pt-12 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => onNavigate("dashboard")} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl">Historial</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar eventos…"
            className="pl-10 h-12 bg-slate-900 border-slate-800 text-white"
          />
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900 mb-6">
            <TabsTrigger value="all" className="text-slate-300 data-[state=active]:text-slate-900 data-[state=active]:bg-white">
              Todo
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-slate-300 data-[state=active]:text-slate-900 data-[state=active]:bg-white">
              Documentos
            </TabsTrigger>
            <TabsTrigger value="access" className="text-slate-300 data-[state=active]:text-slate-900 data-[state=active]:bg-white">
              Accesos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <HistoryList items={filteredHistory} getIcon={getIcon} getBackgroundColor={getBackgroundColor} onSelect={setSelectedItem} setShowDetail={setShowDetail} />
          </TabsContent>

          <TabsContent value="documents">
            <HistoryList items={documentsHistory} getIcon={getIcon} getBackgroundColor={getBackgroundColor} onSelect={setSelectedItem} setShowDetail={setShowDetail} />
          </TabsContent>

          <TabsContent value="access">
            <HistoryList items={accessHistory} getIcon={getIcon} getBackgroundColor={getBackgroundColor} onSelect={setSelectedItem} setShowDetail={setShowDetail} />
          </TabsContent>
        </Tabs>

        <Card className="p-4 bg-slate-900/40 border-slate-800">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-white">Cada evento es on-chain</p>
              <p className="text-xs text-slate-400">
                Los contratos Soroban generan este historial. Usa tu hash para rastrear verificaciones y permisos.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del evento</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 mt-3">
              <Card className="p-4 bg-slate-800 border-slate-700">
                <h3 className="text-sm text-white">{selectedItem.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedItem.description}</p>
              </Card>

              <Card className="p-3 bg-slate-800 border-slate-700 text-xs text-slate-400 space-y-2">
                <div className="flex justify-between">
                  <span>Fecha</span>
                  <span>{new Date(selectedItem.timestamp).toLocaleString("es-MX")}</span>
                </div>
                {selectedItem.actor && (
                  <div className="flex justify-between">
                    <span>Actor</span>
                    <span className="font-mono text-slate-300 truncate">{selectedItem.actor}</span>
                  </div>
                )}
                {selectedItem.hash && (
                  <div className="flex justify-between items-center">
                    <span>Hash</span>
                    <button
                      onClick={() => openExplorer(selectedItem.hash)}
                      className="font-mono text-blue-400 hover:text-blue-300 transition-colors truncate text-right"
                    >
                      {selectedItem.hash}
                    </button>
                  </div>
                )}
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HistoryList({
  items,
  getIcon,
  getBackgroundColor,
  onSelect,
  setShowDetail,
}: {
  items: DisplayHistoryItem[];
  getIcon: (category: HistoryCategory) => JSX.Element;
  getBackgroundColor: (category: HistoryCategory) => string;
  onSelect: (item: DisplayHistoryItem) => void;
  setShowDetail: (open: boolean) => void;
}) {
  if (items.length === 0) {
    return (
      <Card className="p-6 bg-slate-900 border-slate-800 text-center text-sm text-slate-400">
        No hay eventos registrados todavía.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
          <Card
            onClick={() => {
              onSelect(item);
              setShowDetail(true);
            }}
            className="p-4 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getBackgroundColor(item.category)}`}>{getIcon(item.category)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.title}</p>
                    <p className="text-xs text-slate-400 truncate">{item.description}</p>
                  </div>
                  {item.status && (
                    <Badge
                      className={
                        item.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : item.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                      }
                    >
                      {item.status === "completed" ? "Completado" : item.status === "pending" ? "Pendiente" : "Denegado"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{new Date(item.timestamp).toLocaleString("es-MX")}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function formatHistoryItem(item: HistoryRecord): DisplayHistoryItem {
  const category: HistoryCategory = item.type === "access" ? "access" : item.type === "identity" ? "identity" : "document";
  return {
    id: item.id,
    category,
    title: item.title,
    description: item.description,
    timestamp: item.timestamp,
    hash: item.txHash,
    actor: item.actor,
  };
}
