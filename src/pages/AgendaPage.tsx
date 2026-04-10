import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, X, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import { loadData, saveData, generateId, AgendaItem, KEYS } from "@/lib/storage";
import { ConfirmDeleteDrawer } from "@/components/ConfirmDeleteDrawer";

const AgendaPage = () => {
  const [items, setItems] = useState<AgendaItem[]>(() => loadData(KEYS.AGENDA, []));
  const [topics, setTopics] = useState<string[]>(() => loadData(KEYS.AGENDA_TOPICS, []));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AgendaItem | null>(null);
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "done">("all");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [hasTime, setHasTime] = useState(false);
  const [notes, setNotes] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const saveEntries = (list: AgendaItem[]) => {
    const sorted = [...list].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (!a.time && b.time) return -1;
      if (a.time && !b.time) return 1;
      return (a.time || "").localeCompare(b.time || "");
    });
    setItems(sorted); saveData(KEYS.AGENDA, sorted);
  };

  const requestNotifications = async () => {
    const p = await Notification.requestPermission();
    if (p === 'granted') new Notification("My Daily Hub", { body: "Notificações ativadas!" });
  };

  const testNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification("My Daily Hub", { body: "Sua notificação está funcionando!" });
    } else {
      alert("Ative as notificações primeiro!");
    }
  };
   const saveTopics = (list: string[]) => { setTopics(list); saveData(KEYS.AGENDA_TOPICS, list); };

  const addTopic = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    if (topics.includes(newTopic.trim())) return;
    saveTopics([...topics, newTopic.trim()]);
    setNewTopic("");
  };

  const removeTopic = (t: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveTopics(topics.filter(x => x !== t));
  };

  const useTopic = (t: string) => {
    setNotes(prev => prev + (prev.trim() ? "\n" : "") + t);
  };
  const resetForm = () => { setShowForm(false); setEditing(null); setTitle(""); setDate(new Date().toISOString().slice(0, 10)); setTime("09:00"); setHasTime(false); setNotes(""); setNewTopic(""); };

  const startEdit = (item: AgendaItem) => {
    setEditing(item); setTitle(item.title); setDate(item.date); setTime(item.time || "09:00"); setHasTime(!!item.time); setNotes(item.notes); setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const now = new Date().toISOString();
    const saveTime = hasTime ? time : "";
    if (editing) {
      saveEntries(items.map(it => it.id === editing.id ? { ...it, title, date, time: saveTime, notes } : it));
    } else {
      saveEntries([...items, { id: generateId(), title, date, time: saveTime, notes, completed: false, createdAt: now }]);
    }
    resetForm();
  };

  const toggleComplete = (id: string) => saveEntries(items.map(it => it.id === id ? { ...it, completed: !it.completed } : it));

  const filtered = useMemo(() => {
    let list = items;
    if (search) list = list.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));
    if (filterMonth) list = list.filter(i => i.date.slice(0, 7) === filterMonth);
    if (filterStatus === "pending") list = list.filter(i => !i.completed);
    if (filterStatus === "done") list = list.filter(i => i.completed);
    return list;
  }, [items, search, filterMonth, filterStatus]);

  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", weekday: "short" });

  return (
    <div className="min-h-screen px-5 pt-14 pb-8 safe-bottom">
      <div className="flex justify-between items-start">
        <PageHeader title="Agenda" />
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="h-8 text-[10px] uppercase font-bold px-3 rounded-xl border-dashed" onClick={requestNotifications}>🔔 Ativar</Button>
          <Button variant="secondary" size="sm" className="h-8 text-[10px] uppercase font-bold px-3 rounded-xl" onClick={testNotification}>Testar</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar compromisso" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-36" />
      </div>
      <div className="flex gap-2 mb-3">
        {(["all", "pending", "done"] as const).map(f => (
          <button key={f} onClick={() => setFilterStatus(f)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterStatus === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
            {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : "Concluídos"}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-4 mb-4 flex flex-col gap-3 overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">{editing ? "Editar" : "Novo"} compromisso</span>
              <button type="button" onClick={resetForm}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <Input placeholder="Compromisso" value={title} onChange={e => setTitle(e.target.value)} />
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1" />
                {hasTime && <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-28" />}
              </div>
              <button 
                type="button"
                onClick={() => setHasTime(!hasTime)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase transition-all w-fit ${hasTime ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary text-muted-foreground border-border"}`}
              >
                {hasTime ? "✓ Com horário" : "+ Adicionar horário"}
              </button>
            </div>
            <Textarea placeholder="Observações" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            
            {/* Topics Section */}
            <div className="flex flex-col gap-2 bg-secondary/30 p-3 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tópicos rápidos</span>
              <div className="flex flex-wrap gap-2">
                {topics.map(t => (
                  <motion.div 
                    key={t} 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => useTopic(t)}
                    className="flex items-center gap-1.5 bg-background border border-border px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:border-primary/50 transition-colors group"
                  >
                    <span>{t}</span>
                    <button onClick={(e) => removeTopic(t, e)} className="p-0.5 rounded-md hover:bg-destructive/10">
                      <X className="w-3 h-3 text-muted-foreground group-hover:text-destructive" />
                    </button>
                  </motion.div>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <Input 
                  placeholder="Novo tópico..." 
                  value={newTopic} 
                  onChange={e => setNewTopic(e.target.value)} 
                  className="h-8 text-xs bg-background"
                  onKeyDown={e => e.key === 'Enter' && addTopic(e as any)}
                />
                <Button type="button" size="icon" className="h-8 w-8 shrink-0" onClick={addTopic}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button type="submit">{editing ? "Salvar" : "Adicionar"}</Button>
          </motion.form>
        )}
      </AnimatePresence>

      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full mb-4 rounded-xl" size="lg">
          <Plus className="w-5 h-5 mr-2" />Novo compromisso
        </Button>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`bg-card border border-border rounded-2xl p-4 ${item.completed ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3">
              <button onClick={() => toggleComplete(item.id)} className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${item.completed ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                {item.completed && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
              </button>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-sm ${item.completed ? "line-through" : ""}`}>{item.title}</h3>
                <p className="text-muted-foreground text-xs">{fmtDate(item.date)} {item.time ? `· ${item.time}` : ""}</p>
                {item.notes && <p className="text-muted-foreground text-xs mt-1 line-clamp-1">{item.notes}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(item)} className="p-2 rounded-lg active:bg-secondary"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => setDeleteTarget(item.id)} className="p-2 rounded-lg active:bg-secondary"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm mt-8">Nenhum compromisso encontrado</p>}
      </div>

      <ConfirmDeleteDrawer
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => saveEntries(items.filter(x => x.id !== deleteTarget))}
        title="Excluir compromisso?"
        description="Essa ação não pode ser desfeita. O compromisso será removido permanentemente."
      />
    </div>
  );
};

export default AgendaPage;
