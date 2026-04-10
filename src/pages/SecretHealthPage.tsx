import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { loadData, saveData, generateId, HealthRecord, KEYS } from "@/lib/storage";
import { ConfirmDeleteDrawer } from "@/components/ConfirmDeleteDrawer";
import { showNotification } from "@/lib/notifications";

const TYPES: { value: HealthRecord["type"]; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "dor", label: "Dor" },
];

const SecretHealthPage = () => {
  const [records, setRecords] = useState<HealthRecord[]>(() => loadData(KEYS.HEALTH, []));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HealthRecord | null>(null);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [isIdle, setIsIdle] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showInactivityBanner, setShowInactivityBanner] = useState(false);

  // 7-day inactivity notification
  useEffect(() => {
    const allRecords = loadData<HealthRecord[]>(KEYS.HEALTH, []);
    if (allRecords.length === 0) return;
    const latest = allRecords[0];
    const daysDiff = Math.floor(
      (Date.now() - new Date(latest.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff >= 7) {
      setShowInactivityBanner(true);
      setTimeout(() => {
        showNotification(
          "PSIIUUU! 💩",
          `Faz ${daysDiff} dias que você não registra nada... Você não caga não?`,
          "health-inactivity"
        );
      }, 1500); // slight delay so the page loads first
    }
  }, []);

  // Activity detection for screensaver
  useEffect(() => {
    let idleTimer: any;
    let countdownInterval: any;
    let warningTimer: any;

    const handleActivity = () => {
      setIsIdle(false);
      setCountdown(null);
      clearTimeout(idleTimer);
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
      
      // Start warning timer after 5s
      warningTimer = setTimeout(() => {
        setCountdown(5);
        countdownInterval = setInterval(() => {
          setCountdown(prev => (prev !== null && prev > 1) ? prev - 1 : null);
        }, 1000);
      }, 5000);

      // Start idle timer after 10s
      idleTimer = setTimeout(() => {
        setIsIdle(true);
        setCountdown(null);
        clearInterval(countdownInterval);
      }, 10000);
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    // Initial state setup
    handleActivity(); 
    setIsIdle(true); // Forces screensaver on mount as requested

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      clearTimeout(idleTimer);
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
    };
  }, []);

  const [type, setType] = useState<HealthRecord["type"]>("normal");
  const [text, setText] = useState("");
  const [intensity, setIntensity] = useState(0);
  const [bleeding, setBleeding] = useState(false);
  const [dry, setDry] = useState(false);

  const saveEntries = (list: HealthRecord[]) => { setRecords(list); saveData(KEYS.HEALTH, list); };

  const resetForm = () => { setShowForm(false); setEditing(null); setType("normal"); setText(""); setIntensity(0); setBleeding(false); setDry(false); };

  const startEdit = (r: HealthRecord) => {
    setEditing(r); setType(r.type); setText(r.text); setIntensity(r.intensity); setBleeding(!!r.bleeding); setDry(!!r.dry); setShowForm(true);
  };

  const typeLabel = (t: string) => TYPES.find(x => x.value === t)?.label || t;
  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const nowIso = now.toISOString();
    let newList: HealthRecord[];
    if (editing) {
      newList = records.map(r => r.id === editing.id ? { ...r, type, text, intensity, bleeding, dry } : r);
    } else {
      newList = [{
        id: generateId(), type, text, intensity,
        bleeding, dry,
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        createdAt: nowIso,
      }, ...records];
    }
    saveEntries(newList);
    saveData(KEYS.LAST_UPDATE, nowIso);
    resetForm();
  };

  const filtered = useMemo(() => {
    let list = records;
    if (search) list = list.filter(r => r.text.toLowerCase().includes(search.toLowerCase()));
    if (filterDate) list = list.filter(r => r.date === filterDate);
    return list;
  }, [records, search, filterDate]);

  // Last registered tracker logic
  const daysSinceLast = useMemo(() => {
    if (records.length === 0) return 0;
    const latest = records[0];
    const diff = new Date().getTime() - new Date(latest.createdAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [records]);

  const progress = Math.min((daysSinceLast / 14) * 100, 100);
  const stroke = 157; // 2 * PI * r (r=25)
  const offset = stroke - (stroke * progress) / 100;

  return (
    <div className="min-h-screen px-5 pt-14 pb-8 safe-bottom">
      <PageHeader title="Registros" />

      {/* Countdown Warning Warning */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div 
            key={countdown}
            initial={{ opacity: 1, scale: 0.8 }}
            animate={{ opacity: 0, scale: 2.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none select-none"
          >
            <span className="font-black text-[180px] text-primary/30 leading-none">{countdown}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screensaver Overlay */}
      <AnimatePresence>
        {isIdle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsIdle(false)}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="relative w-48 h-48 flex items-center justify-center"
            >
              <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="25" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/20" />
                <motion.circle 
                  cx="30" cy="30" r="25" fill="none" stroke="currentColor" strokeWidth="3" 
                  className="text-primary"
                  strokeDasharray={stroke}
                  initial={{ strokeDashoffset: stroke }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <motion.div 
                animate={{ y: [0, -15, 0], rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }} 
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center text-6xl select-none"
              >
                💩
              </motion.div>
            </motion.div>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">Proteção Ativa</p>
              <p className="text-xl font-black">{daysSinceLast} {daysSinceLast === 1 ? "DIA" : "DIAS"}</p>
              <p className="mt-6 text-[10px] font-bold text-primary animate-pulse uppercase tracking-widest">Toque para entrar</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7-day Inactivity Banner */}
      <AnimatePresence>
        {showInactivityBanner && !isIdle && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-3 flex items-start gap-3"
          >
            <span className="text-2xl">💩</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-amber-800 text-sm">PSIIUUU!</p>
              <p className="text-xs text-amber-700 font-medium mt-0.5">
                Faz mais de 7 dias sem registrar nada... Você não caga não?
              </p>
            </div>
            <button onClick={() => setShowInactivityBanner(false)} className="p-1 shrink-0">
              <X className="w-4 h-4 text-amber-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-36" />
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-4 mb-4 flex flex-col gap-3 overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">{editing ? "Editar" : "Novo"} registro</span>
              <button type="button" onClick={resetForm}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <Select value={type} onValueChange={(v) => {
              const newType = v as HealthRecord["type"];
              setType(newType);
              if (newType === "normal") setBleeding(false);
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Descrição" value={text} onChange={e => setText(e.target.value)} rows={3} />

            <div className="flex flex-col gap-2 py-1">
              {type !== "normal" && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="bleeding" checked={bleeding} onChange={e => setBleeding(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="bleeding" className="text-sm font-medium">Teve sangramento?</label>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="dry" checked={dry} onChange={e => setDry(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <label htmlFor="dry" className="text-sm font-medium">Saiu Seco?</label>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Intensidade (opcional): {intensity || "—"}</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setIntensity(n)}
                    className={`w-9 h-9 rounded-full text-sm font-medium border transition-colors ${intensity === n ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}
                  >{n === 0 ? "—" : n}</button>
                ))}
              </div>
            </div>
            <Button type="submit">{editing ? "Salvar" : "Adicionar"}</Button>
          </motion.form>
        )}
      </AnimatePresence>

      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full mb-4 rounded-xl" size="lg">
          <Plus className="w-5 h-5 mr-2" />Novo registro
        </Button>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((rec, i) => (
          <motion.div key={rec.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="text-xs font-medium text-primary">{typeLabel(rec.type)}</span>
                {rec.intensity > 0 && <span className="text-xs text-muted-foreground ml-2">Intensidade: {rec.intensity}</span>}
                {rec.bleeding && <span className="text-xs text-red-500 font-bold ml-2">⚠️ Sangramento</span>}
                {rec.dry && <span className="text-xs text-teal-500 font-bold ml-2">🌵 Seco</span>}
              </div>
              <span className="text-[11px] text-muted-foreground">{fmtDate(rec.date)} · {rec.time}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap line-clamp-3">{rec.text}</p>
            <div className="flex justify-end gap-1 mt-2">
              <button onClick={() => startEdit(rec)} className="p-2 rounded-lg active:bg-secondary"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
              <button onClick={() => setDeleteTarget(rec.id)} className="p-2 rounded-lg active:bg-secondary"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm mt-8">Nenhum registro</p>}
      </div>

      <ConfirmDeleteDrawer
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => saveEntries(records.filter(x => x.id !== deleteTarget))}
        title="Excluir registro?"
        description="Essa ação não pode ser desfeita. O registro será removido permanentemente."
      />
    </div>
  );
};

export default SecretHealthPage;
