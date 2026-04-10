import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { loadData, saveData, generateId, HealthRecord, KEYS } from "@/lib/storage";

const TYPES: { value: HealthRecord["type"]; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "dor", label: "Dor" },
  { value: "observacao", label: "Observação" },
  { value: "outro", label: "Outro" },
];

const SecretHealthPage = () => {
  const [records, setRecords] = useState<HealthRecord[]>(() => loadData(KEYS.HEALTH, []));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HealthRecord | null>(null);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [type, setType] = useState<HealthRecord["type"]>("normal");
  const [text, setText] = useState("");
  const [intensity, setIntensity] = useState(0);

  const save = (list: HealthRecord[]) => { setRecords(list); saveData(KEYS.HEALTH, list); };

  const resetForm = () => { setShowForm(false); setEditing(null); setType("normal"); setText(""); setIntensity(0); };

  const startEdit = (r: HealthRecord) => {
    setEditing(r); setType(r.type); setText(r.text); setIntensity(r.intensity); setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    if (editing) {
      save(records.map(r => r.id === editing.id ? { ...r, type, text, intensity } : r));
    } else {
      save([{
        id: generateId(), type, text, intensity,
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        createdAt: now.toISOString(),
      }, ...records]);
    }
    resetForm();
  };

  const filtered = useMemo(() => {
    let list = records;
    if (search) list = list.filter(r => r.text.toLowerCase().includes(search.toLowerCase()));
    if (filterDate) list = list.filter(r => r.date === filterDate);
    return list;
  }, [records, search, filterDate]);

  const typeLabel = (t: string) => TYPES.find(x => x.value === t)?.label || t;
  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <div className="min-h-screen px-5 pt-14 pb-8 safe-bottom">
      <PageHeader title="Registros" />

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
            <Select value={type} onValueChange={(v) => setType(v as HealthRecord["type"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Descrição" value={text} onChange={e => setText(e.target.value)} rows={3} />
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
              </div>
              <span className="text-[11px] text-muted-foreground">{fmtDate(rec.date)} · {rec.time}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap line-clamp-3">{rec.text}</p>
            <div className="flex justify-end gap-1 mt-2">
              <button onClick={() => startEdit(rec)} className="p-2 rounded-lg active:bg-secondary"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
              <button onClick={() => save(records.filter(x => x.id !== rec.id))} className="p-2 rounded-lg active:bg-secondary"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm mt-8">Nenhum registro</p>}
      </div>
    </div>
  );
};

export default SecretHealthPage;
