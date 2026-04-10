import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { AgendaItem } from "@/lib/storage";
import { playAlarmSound } from "@/lib/notifications";

interface AlarmOverlayProps {
  item: AgendaItem | null;
  onDismiss: () => void;
}

export function AlarmOverlay({ item, onDismiss }: AlarmOverlayProps) {
  // Play sound whenever a new alarm fires
  React.useEffect(() => {
    if (item) {
      playAlarmSound(6);
    }
  }, [item?.id]);

  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Pulsing red backdrop */}
          <motion.div
            key="alarm-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="fixed inset-0 z-[300] bg-red-500 pointer-events-none"
          />

          {/* Alarm card */}
          <motion.div
            key="alarm-card"
            initial={{ scale: 0.7, opacity: 0, y: -60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -40 }}
            transition={{ type: "spring", damping: 18, stiffness: 280 }}
            className="fixed inset-0 z-[310] flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full text-center pointer-events-auto">
              {/* Animated bell icon */}
              <motion.div
                animate={{ rotate: [0, -20, 20, -20, 20, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.8 }}
                className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-[2rem] flex items-center justify-center mx-auto mb-6"
              >
                <Bell className="w-12 h-12 text-red-500" strokeWidth={1.5} />
              </motion.div>

              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400 mb-2">
                Agora!
              </p>
              <h2 className="text-2xl font-black text-foreground leading-tight mb-3">
                {item.title}
              </h2>
              {item.notes && (
                <p className="text-sm text-muted-foreground font-medium mb-2 italic">
                  {item.notes}
                </p>
              )}
              <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mb-8">
                {new Date(`${item.date}T${item.time}:00`).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              <button
                onClick={onDismiss}
                className="w-full h-16 bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-3"
              >
                <X className="w-5 h-5" />
                Dispensar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
