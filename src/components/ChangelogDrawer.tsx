import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, MinusCircle, PlusCircle, Rocket, History, Sparkles } from "lucide-react";

interface ChangelogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const versions = [
  {
    tag: "v2.1",
    title: "Mobile Plus 🚀",
    date: "Atual",
    items: [
      { type: "add", text: "Alarmes Nativos (Aviso 5min + Alarme sonoro)" },
      { type: "add", text: "Alarme Visual Full-Screen com vibração visual" },
      { type: "add", text: "Notificação de Inatividade na Saúde (Lembrete 7 dias)" },
      { type: "add", text: "Backup Inteligente (Snapshot interno - adeus busca de arquivos!)" },
      { type: "add", text: "Trava de Segurança no Restore (máximo 90 dias)" },
    ],
  },
  {
    tag: "v2.0",
    title: "Mobile Native 📱",
    date: "Abril 2026",
    items: [
      { type: "add", text: "ConfirmDeleteDrawer customizado (Premium UI)" },
      { type: "add", text: "UX otimizado para toque (Touch Targets 64px)" },
      { type: "rem", text: "Alertas nativos do navegador (window.confirm)" },
      { type: "rem", text: "Tópicos rápidos na aba de Saúde Secreta" },
    ],
  },
  {
    tag: "v1.0",
    title: "Lançamento PWA",
    date: "Março 2026",
    items: [
      { type: "add", text: "Módulos: Agenda, Compras, Diário e Histórico" },
      { type: "add", text: "Persistência Local (LocalStorage)" },
    ],
  },
];

export function ChangelogDrawer({ isOpen, onClose }: ChangelogDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[210] bg-background rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-500/10 rounded-xl">
                  <History className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black leading-tight">Notas de Atualização</h2>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">O que mudou no Hub</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-12 space-y-8">
              {versions.map((ver, idx) => (
                <div key={ver.tag} className="relative">
                  {/* Timeline line */}
                  {idx !== versions.length - 1 && (
                    <div className="absolute left-[1.35rem] top-10 bottom-[-2rem] w-[1px] bg-border border-dashed border-l" />
                  )}

                  <div className="flex gap-4">
                    <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center ${
                      idx === 0 ? "bg-teal-500 shadow-lg shadow-teal-500/30" : "bg-muted"
                    }`}>
                      {idx === 0 ? (
                        <Sparkles className="w-5 h-5 text-white" />
                      ) : (
                        <Rocket className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-black text-base">{ver.title}</h3>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          idx === 0 ? "bg-teal-100 text-teal-700" : "bg-muted text-muted-foreground"
                        }`}>
                          {ver.tag}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                        {ver.date}
                      </p>

                      <ul className="space-y-3">
                        {ver.items.map((item, i) => (
                          <li key={i} className="flex gap-2 items-start">
                            {item.type === "add" ? (
                              <PlusCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <MinusCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <span className="text-sm font-medium leading-snug">
                              {item.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-4 bg-muted/30 rounded-2xl border border-dashed border-border text-center">
                <p className="text-xs font-bold text-muted-foreground italic">
                  "Sempre evoluindo para o seu bem-estar."
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
