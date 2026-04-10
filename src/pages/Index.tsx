import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ShoppingCart, Calendar, Clock, Heart, User, Download, Upload } from "lucide-react";
import { useRef, useCallback, useState } from "react";
import SecretAccessDialog from "@/components/SecretAccessDialog";
import { exportAllData, importAllData, loadData, saveData, KEYS } from "@/lib/storage";
import { toast } from "sonner";
import { useEffect } from "react";

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
  const lastUpdate = loadData<string>(KEYS.LAST_UPDATE, "").split('T')[0]?.split('-').reverse().join('/') || "—";

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

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meu-espaco-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportado com sucesso!");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const ok = importAllData(ev.target?.result as string);
        if (ok) {
          saveData(KEYS.LAST_UPDATE, new Date().toISOString());
          toast.success("Dados restaurados! Recarregando...");
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast.error("Arquivo inválido");
        }
      };
      reader.readAsText(file);
    };
    input.click();
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

        {/* Backup buttons */}
        <div className="mt-3 flex gap-2">
          <button onClick={handleExport} className="flex-1 bg-card border border-border rounded-2xl p-3 flex items-center justify-center gap-2 text-sm text-muted-foreground active:bg-secondary">
            <Download className="w-4 h-4" /> Exportar Backup
          </button>
          <button onClick={handleImport} className="flex-1 bg-card border border-border rounded-2xl p-3 flex items-center justify-center gap-2 text-sm text-muted-foreground active:bg-secondary">
            <Upload className="w-4 h-4" /> Restaurar Backup
          </button>
        </div>
      </div>

      <SecretAccessDialog open={showSecret} onOpenChange={setShowSecret} />
    </div>
  );
};

export default Index;
