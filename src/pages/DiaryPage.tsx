import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import { loadData, saveData, generateId, DiaryEntry, KEYS } from "@/lib/storage";
import { ConfirmDeleteDrawer } from "@/components/ConfirmDeleteDrawer";

const DiaryPage = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>(() => loadData(KEYS.DIARY, []));
  const [topics, setTopics] = useState<string[]>(() => loadData(KEYS.TOPICS, []));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const [viewEntry, setViewEntry] = useState<DiaryEntry | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const saveEntries = (list: DiaryEntry[]) => { setEntries(list); saveData(KEYS.DIARY, list); };
  const saveTopics = (list: string[]) => { setTopics(list); saveData(KEYS.TOPICS, list); };

  const addTopic = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!newTopic.trim()) return;
    if (topics.includes(newTopic.trim())) return;
    saveTopics([...topics, newTopic.trim()]);
    setNewTopic("");
  };

  const removeTopic = (t: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveTopics(topics.filter(x => x !== t));
  };

  const handleUseTopic = (t: string) => {
    setDescription(prev => prev + (prev.trim() ? "\n" : "") + t);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const now = new Date().toISOString();
    if (editing) {
      saveEntries(entries.map(en => en.id === editing.id ? { ...en, title, description, updatedAt: now } : en));
    } else {
      saveEntries([{ id: generateId(), title, description, createdAt: now, updatedAt: now }, ...entries]);
    }
    resetForm();
  };

  const resetForm = () => { setShowForm(false); setEditing(null); setTitle(""); setDescription(""); setNewTopic(""); };

  const startEdit = (entry: DiaryEntry) => {
    setEditing(entry); setTitle(entry.title); setDescription(entry.description); setShowForm(true); setViewEntry(null);
  };

  const deleteEntry = (id: string) => {
    saveEntries(entries.filter(e => e.id !== id));
    setDeleteTarget(null);
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const filtered = useMemo(() => {
    let list = entries;
    if (search) list = list.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase()));
    if (filterMonth) list = list.filter(e => e.createdAt.slice(0, 7) === filterMonth);
    return list;
  }, [entries, search, filterMonth]);

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
          <Button variant="destructive" className="flex-1" onClick={() => setDeleteTarget(viewEntry.id)}><Trash2 className="w-4 h-4 mr-2" />Excluir</Button>
        </div>
        <Button variant="outline" className="w-full mt-2" onClick={() => setViewEntry(null)}>Voltar</Button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen px-5 pt-14 pb-8 safe-bottom">
        <PageHeader title="Anotações" />

        {/* Filters */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar anotação" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-36" />
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-4 mb-4 flex flex-col gap-3 overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">{editing ? "Editar" : "Nova"} anotação</span>
                <button type="button" onClick={resetForm}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
              <Textarea placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
              
              {/* Topics Section */}
              <div className="flex flex-col gap-2 bg-secondary/30 p-3 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tópicos rápidos</span>
                <div className="flex flex-wrap gap-2">
                  {topics.map(t => (
                    <motion.div 
                      key={t} 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleUseTopic(t)}
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
                    onKeyDown={e => e.key === 'Enter' && addTopic(e)}
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
            <Plus className="w-5 h-5 mr-2" />Nova anotação
          </Button>
        )}

        <div className="flex flex-col gap-3">
          {filtered.map((entry, i) => (
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
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm mt-8">Nenhuma anotação encontrada</p>}
        </div>
      </div>

      <ConfirmDeleteDrawer 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteEntry(deleteTarget);
            setViewEntry(null);
          }
        }}
        title="Excluir anotação?"
        description="Esta anotação será removida permanentemente do seu histórico."
      />
    </>
  );
};

export default DiaryPage;
