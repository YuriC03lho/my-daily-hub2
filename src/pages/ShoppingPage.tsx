import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { loadData, saveData, generateId, Purchase, KEYS } from "@/lib/storage";

const STORES = ["Shopee", "Mercado Livre", "Amazon", "AliExpress", "Outro"];
const STATUSES: Purchase["status"][] = ["comprado", "enviado", "entregue"];
const statusColors: Record<string, string> = { comprado: "bg-blue-500/20 text-blue-300", enviado: "bg-amber-500/20 text-amber-300", entregue: "bg-emerald-500/20 text-emerald-300" };

const ShoppingPage = () => {
  const [items, setItems] = useState<Purchase[]>(() => loadData(KEYS.PURCHASES, []));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  // form
  const [productName, setProductName] = useState("");
  const [store, setStore] = useState("Shopee");
  const [value, setValue] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<Purchase["status"]>("comprado");
  const [notes, setNotes] = useState("");

  const save = (list: Purchase[]) => { setItems(list); saveData(KEYS.PURCHASES, list); };

  const resetForm = () => {
    setShowForm(false); setEditing(null);
    setProductName(""); setStore("Shopee"); setValue(""); setPurchaseDate(new Date().toISOString().slice(0, 10)); setStatus("comprado"); setNotes("");
  };

  const startEdit = (p: Purchase) => {
    setEditing(p); setProductName(p.productName); setStore(p.store); setValue(String(p.value)); setPurchaseDate(p.purchaseDate); setStatus(p.status); setNotes(p.notes); setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;
    const now = new Date().toISOString();
    if (editing) {
      save(items.map(it => it.id === editing.id ? { ...it, productName, store, value: parseFloat(value) || 0, purchaseDate, status, notes } : it));
    } else {
      save([{ id: generateId(), productName, store, value: parseFloat(value) || 0, purchaseDate, status, notes, createdAt: now }, ...items]);
    }
    resetForm();
  };

  const filtered = useMemo(() => {
    let list = items;
    if (search) list = list.filter(i => i.productName.toLowerCase().includes(search.toLowerCase()));
    if (filterMonth) list = list.filter(i => i.purchaseDate.slice(0, 7) === filterMonth);
    return list;
  }, [items, search, filterMonth]);

  const total = useMemo(() => filtered.reduce((s, i) => s + i.value, 0), [filtered]);

  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <div className="min-h-screen px-5 pt-14 pb-8 safe-bottom">
      <PageHeader title="Compras" />

      {/* search & filter */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar produto" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-36" />
      </div>

      {/* total */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="font-bold text-lg">R$ {total.toFixed(2)}</span>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-4 mb-4 flex flex-col gap-3 overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">{editing ? "Editar" : "Nova"} compra</span>
              <button type="button" onClick={resetForm}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <Input placeholder="Produto" value={productName} onChange={e => setProductName(e.target.value)} />
            <Select value={store} onValueChange={setStore}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STORES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" step="0.01" placeholder="Valor (R$)" value={value} onChange={e => setValue(e.target.value)} />
            <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
            <Select value={status} onValueChange={(v) => setStatus(v as Purchase["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Observações" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            <Button type="submit">{editing ? "Salvar" : "Adicionar"}</Button>
          </motion.form>
        )}
      </AnimatePresence>

      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full mb-4 rounded-xl" size="lg">
          <Plus className="w-5 h-5 mr-2" />Nova compra
        </Button>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-sm">{item.productName}</h3>
                <p className="text-muted-foreground text-xs">{item.store} · {fmtDate(item.purchaseDate)}</p>
              </div>
              <span className="font-bold text-sm">R$ {item.value.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusColors[item.status]}`}>{item.status}</span>
              <div className="flex gap-1">
                <button onClick={() => startEdit(item)} className="p-2 rounded-lg active:bg-secondary"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => save(items.filter(x => x.id !== item.id))} className="p-2 rounded-lg active:bg-secondary"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm mt-8">Nenhuma compra registrada</p>}
      </div>
    </div>
  );
};

export default ShoppingPage;
