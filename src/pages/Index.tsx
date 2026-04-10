import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ShoppingCart, Calendar, Clock, Heart, User, Download, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRef, useCallback, useState, useEffect } from "react";
import SecretAccessDialog from "@/components/SecretAccessDialog";
import {
  exportBackupSnapshot,
  restoreFromSnapshot,
  getBackupInfo,
  loadData,
  KEYS,
} from "@/lib/storage";
import { toast } from "sonner";
import { requestNotificationPermission } from "@/lib/notifications";

const cards = [
  { title: "Anotações", subtitle: "Seus registros pessoais", icon: BookOpen, path: "/diary", bg: "bg-teal-50", iconBg: "bg-teal-100", iconColor: "text-teal-600" },
  { title: "Compras", subtitle: "Controle de pedidos", icon: ShoppingCart, path: "/shopping", bg: "bg-blue-50", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { title: "Agenda", subtitle: "Compromissos e tarefas", icon: Calendar, path: "/agenda", bg: "bg-violet-50", iconBg: "bg-violet-100", iconColor: "text-violet-600" },
  { title: "Histórico", subtitle: "Todos os registros", icon: Clock, path: "/history", bg: "bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
];

const Index = () => {
  const navigate = useNavigate();
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout>>();
  const [showSecret, setShowSecret] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const lastUpdate = loadData<string>(KEYS.LAST_UPDATE, "").split('T')[0]?.split('-').reverse().join('/') || "—";
  const backupInfo = getBackupInfo();

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const handleTripleTap = useCallback(() => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 3) {
      tapCount.current = 0;
      setShowSecret(true);
      return;
    }
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 800);
  }, []);

  // EXPORT: saves snapshot internally + downloads fixed-name file
  const handleExport = () => {
    const { json } = exportBackupSnapshot();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meu-espaco-backup.json"; // FIXED name — always overwrites
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup salvo! Arquivo: meu-espaco-backup.json");
  };

  // RESTORE: reads from internal snapshot, no file picker needed
  const handleRestoreConfirmed = () => {
    setShowRestoreConfirm(false);
    const result = restoreFromSnapshot();
    if (result.ok) {
      toast.success("Dados restaurados com sucesso! Recarregando...");
      setTimeout(() => window.location.reload(), 1200);
    } else {
      if (result.reason === 'no_backup') {
        toast.error("Nenhum backup encontrado. Exporte primeiro!");
      } else if (result.reason === 'too_old') {
        toast.error(
          `Backup com ${result.daysDiff} dias é muito antigo (máx. 90 dias). Use Exportar para criar um novo.`,
          { duration: 6000 }
        );
      } else {
        toast.error("Backup inválido ou corrompido.");
      }
    }
  };

  const fmtBackupDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen flex flex-col safe-bottom">
      {/* Header banner - triple tap area */}
      <div
        className="bg-gradient-to-br from-teal-500 to-teal-600 px-5 pt-12 pb-8 rounded-b-3xl shadow-lg shadow-teal-500/10"
        onClick={handleTripleTap}
        onTouchStart={handleTripleTap}
      >
        <div className="flex items-center gap-3 mb-1 pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Meu Espaço</h1>
            <p className="text-teal-100 text-xs">Seu hub pessoal de bem-estar</p>
            {lastUpdate !== "—" && (
              <p className="text-[10px] text-teal-200/80 mt-1">Atualizado em: {lastUpdate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="px-5 -mt-4 flex-1">
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card, i) => (
            <motion.button
              key={card.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(card.path)}
              className={`${card.bg} rounded-2xl p-4 flex flex-col items-center gap-3 text-center shadow-sm active:shadow-none transition-shadow aspect-square justify-center`}
            >
              <div className={`w-14 h-14 ${card.iconBg} rounded-2xl flex items-center justify-center`}>
                <card.icon className={`w-7 h-7 ${card.iconColor}`} />
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground block">{card.title}</span>
                <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">{card.subtitle}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Bottom info */}
        <div className="mt-6 bg-card rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-border">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-medium">Cuide de você</p>
            <p className="text-xs text-muted-foreground">Organize sua rotina e bem-estar</p>
          </div>
        </div>

        {/* Backup section */}
        <div className="mt-3 bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Backup</span>
            {backupInfo.exists && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                (backupInfo.daysDiff ?? 0) > 30
                  ? "bg-amber-100 text-amber-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}>
                {backupInfo.daysDiff === 0 ? "Hoje" : `${backupInfo.daysDiff}d atrás`}
              </span>
            )}
          </div>

          {backupInfo.exists && (
            <p className="text-[11px] text-muted-foreground mb-3 font-medium">
              Último: {fmtBackupDate(backupInfo.exportedAt)}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-bold text-teal-700 active:bg-teal-100 transition-colors"
            >
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button
              onClick={() => setShowRestoreConfirm(true)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-bold text-slate-600 active:bg-slate-100 transition-colors"
            >
              <Upload className="w-4 h-4" /> Restaurar
            </button>
          </div>

          {!backupInfo.exists && (
            <p className="text-[10px] text-amber-500 font-bold mt-2 text-center">
              ⚠️ Nenhum backup salvo. Exporte agora!
            </p>
          )}
        </div>
      </div>

      <SecretAccessDialog open={showSecret} onOpenChange={setShowSecret} />

      {/* Restore confirmation drawer */}
      {showRestoreConfirm && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRestoreConfirm(false)}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[210] bg-background rounded-t-[2rem] shadow-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 1.5rem)" }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>
            <div className="px-6 pt-4 pb-8">
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-amber-500" strokeWidth={1.5} />
                </div>
              </div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black mb-2">Restaurar Backup?</h2>
                <p className="text-muted-foreground text-base font-medium">
                  Seus dados atuais serão substituídos pelo backup salvo.
                </p>
                {backupInfo.exists ? (
                  <div className="mt-4 p-4 bg-muted/30 rounded-2xl border border-dashed border-muted text-left">
                    <p className="text-xs font-bold text-muted-foreground mb-1">BACKUP DISPONÍVEL</p>
                    <p className="text-sm font-black">{fmtBackupDate(backupInfo.exportedAt)}</p>
                    <p className={`text-xs font-bold mt-1 flex items-center gap-1 ${
                      (backupInfo.daysDiff ?? 0) > 30 ? "text-amber-500" : "text-emerald-500"
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {backupInfo.daysDiff === 0 ? "Feito hoje" : `${backupInfo.daysDiff} dias atrás`}
                      {(backupInfo.daysDiff ?? 0) > 30 && " · Antigo"}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <p className="text-sm font-bold text-red-500">
                      Nenhum backup encontrado. Exporte primeiro!
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRestoreConfirmed}
                  disabled={!backupInfo.exists}
                  className="w-full h-16 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all"
                >
                  Sim, Restaurar
                </button>
                <button
                  onClick={() => setShowRestoreConfirm(false)}
                  className="w-full h-16 bg-secondary active:scale-[0.98] text-foreground font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all border border-border/50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Index;
