import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, X, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import { loadData, saveData, generateId, AgendaItem, KEYS } from "@/lib/storage";

const AgendaPage = () => {
  const [items, setItems] = useState<AgendaItem[]>(() => loadData(KEYS.AGENDA, []));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AgendaItem | null>(null);
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "done">("all");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");

  const save = (list: AgendaItem[]) => {
    const sorted = [...list].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    setItems(sorted); saveData(KEYS.AGENDA, sorted);
  };

  const resetForm = () => { setShowForm(false); setEditing(null); setTitle(""); setDate(new Date().toISOString().slice(0, 10)); setTime("09:00"); setNotes(""); };

  const startEdit = (item: AgendaItem) => {
    setEditing(item); setTitle(item.title); setDate(item.date); setTime(item.time); setNotes(item.notes); setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const now = new Date().toISOString();
    if (editing) {
      save(items.map(it => it.id === editing.id ? { ...it, title, date, time, notes } : it));
    } else {
      save([...items, { id: generateId(), title, date, time, notes, completed: false, createdAt: now }]);
    }
    resetForm();
  };

  const toggleComplete = (id: string) => save(items.map(it => it.id === id ? { ...it, completed: !it.completed } : it));

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
      <PageHeader title="Agenda" />

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
            <div className="flex gap-2">
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1" />
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-28" />
            </div>
            <Textarea placeholder="Observações" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
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
                <p className="text-muted-foreground text-xs">{fmtDate(item.date)} · {item.time}</p>
                {item.notes && <p className="text-muted-foreground text-xs mt-1 line-clamp-1">{item.notes}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(item)} className="p-2 rounded-lg active:bg-secondary"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => save(items.filter(x => x.id !== item.id))} className="p-2 rounded-lg active:bg-secondary"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm mt-8">Nenhum compromisso encontrado</p>}
      </div>
    </div>
  );
};

export default AgendaPage;
