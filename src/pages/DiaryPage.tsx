import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import { loadData, saveData, generateId, DiaryEntry, KEYS } from "@/lib/storage";

const DiaryPage = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>(() => loadData(KEYS.DIARY, []));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const [viewEntry, setViewEntry] = useState<DiaryEntry | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const save = (list: DiaryEntry[]) => { setEntries(list); saveData(KEYS.DIARY, list); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const now = new Date().toISOString();
    if (editing) {
      save(entries.map(en => en.id === editing.id ? { ...en, title, description, updatedAt: now } : en));
    } else {
      save([{ id: generateId(), title, description, createdAt: now, updatedAt: now }, ...entries]);
    }
    resetForm();
  };

  const resetForm = () => { setShowForm(false); setEditing(null); setTitle(""); setDescription(""); };

  const startEdit = (entry: DiaryEntry) => {
    setEditing(entry); setTitle(entry.title); setDescription(entry.description); setShowForm(true); setViewEntry(null);
  };

  const deleteEntry = (id: string) => save(entries.filter(e => e.id !== id));

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  if (viewEntry) {
    return (
      <div className="min-h-screen px-5 pt-14 pb-8 safe-bottom">
        <PageHeader title="Anotação" />
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-1">{viewEntry.title}</h2>
          <p className="text-muted-foreground text-xs mb-4">{fmtDate(viewEntry.createdAt)}</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{viewEntry.description}</p>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" className="flex-1" onClick={() => startEdit(viewEntry)}><Edit2 className="w-4 h-4 mr-2" />Editar</Button>
          <Button variant="destructive" className="flex-1" onClick={() => { deleteEntry(viewEntry.id); setViewEntry(null); }}><Trash2 className="w-4 h-4 mr-2" />Excluir</Button>
        </div>
        <Button variant="outline" className="w-full mt-2" onClick={() => setViewEntry(null)}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 pt-14 pb-8 safe-bottom">
      <PageHeader title="Anotações" />

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-4 mb-4 flex flex-col gap-3 overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">{editing ? "Editar" : "Nova"} anotação</span>
              <button type="button" onClick={resetForm}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
            <Textarea placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
            <Button type="submit">{editing ? "Salvar" : "Adicionar"}</Button>
          </motion.form>
        )}
      </AnimatePresence>

      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full mb-4 rounded-xl" size="lg">
          <Plus className="w-5 h-5 mr-2" />Nova anotação
        </Button>
      )}

      <div className="flex flex-col gap-3">
        {entries.map((entry, i) => (
          <motion.button
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewEntry(entry)}
            className="bg-card border border-border rounded-2xl p-4 text-left"
          >
            <h3 className="font-semibold text-sm mb-1">{entry.title}</h3>
            <p className="text-muted-foreground text-xs line-clamp-2 mb-2">{entry.description}</p>
            <p className="text-muted-foreground text-[11px]">{fmtDate(entry.createdAt)}</p>
          </motion.button>
        ))}
        {entries.length === 0 && <p className="text-center text-muted-foreground text-sm mt-8">Nenhuma anotação ainda</p>}
      </div>
    </div>
  );
};

export default DiaryPage;
