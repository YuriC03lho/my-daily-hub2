import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, AlertTriangle } from "lucide-react";

interface ConfirmDeleteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function ConfirmDeleteDrawer({
  isOpen,
  onClose,
  onConfirm,
  title = "Excluir registro?",
  description = "Essa ação não pode ser desfeita.",
}: ConfirmDeleteDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[210] bg-background rounded-t-[2rem] shadow-2xl overflow-hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 1.5rem)" }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            <div className="px-6 pt-4 pb-8">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center">
                  <Trash2 className="w-10 h-10 text-red-500" strokeWidth={1.5} />
                </div>
              </div>

              {/* Title & Description */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-foreground mb-2">{title}</h2>
                <p className="text-muted-foreground text-base leading-relaxed font-medium">
                  {description}
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-4 text-amber-500">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Ação Irreversível</span>
                </div>
              </div>

              {/* Buttons — large touch targets for mobile */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { onConfirm(); onClose(); }}
                  className="w-full h-16 bg-red-500 hover:bg-red-600 active:bg-red-700 active:scale-[0.98] text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-red-500/30"
                >
                  Sim, Excluir
                </button>
                <button
                  onClick={onClose}
                  className="w-full h-16 bg-secondary hover:bg-secondary/80 active:scale-[0.98] text-foreground font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all border border-border/50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
