import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, X, Search, DollarSign, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { loadData, saveData, generateId, Purchase, KEYS, seedPurchasesIfEmpty } from "@/lib/storage";

const STORES = ["Shopee", "Mercado Livre", "Amazon", "AliExpress", "Outro"];
const STATUSES: Purchase["status"][] = ["comprado", "enviado", "entregue"];
const statusColors: Record<string, string> = { comprado: "bg-blue-500/20 text-blue-600", enviado: "bg-amber-500/20 text-amber-600", entregue: "bg-emerald-500/20 text-emerald-600" };

const ShoppingPage = () => {
  const [items, setItems] = useState<Purchase[]>(() => seedPurchasesIfEmpty());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterPaid, setFilterPaid] = useState<"all" | "paid" | "unpaid">("all");
  const [salary, setSalary] = useState<number>(() => loadData(KEYS.SALARY, 1666));
  const [vacation, setVacation] = useState<number>(() => loadData(KEYS.VACATION, 0));
  const [extra, setExtra] = useState<number>(() => loadData(KEYS.EXTRA, 0));
  const [showSalary, setShowSalary] = useState(false);

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
      save([{ id: generateId(), productName, store, value: parseFloat(value) || 0, purchaseDate, status, paid: false, notes, createdAt: now }, ...items]);
    }
    resetForm();
  };

  const togglePaid = (id: string) => {
    save(items.map(it => it.id === id ? { ...it, paid: !it.paid } : it));
  };

  const filtered = useMemo(() => {
    let list = items;
    if (search) list = list.filter(i => i.productName.toLowerCase().includes(search.toLowerCase()));
    if (filterMonth) list = list.filter(i => i.purchaseDate.slice(0, 7) === filterMonth);
    if (filterPaid === "paid") list = list.filter(i => i.paid);
    if (filterPaid === "unpaid") list = list.filter(i => !i.paid);
    return list;
  }, [items, search, filterMonth, filterPaid]);

  const totalIncome = salary + vacation + extra;
  const totalUnpaid = useMemo(() => filtered.filter(i => !i.paid).reduce((s, i) => s + i.value, 0), [filtered]);
  const totalPaid = useMemo(() => filtered.filter(i => i.paid).reduce((s, i) => s + i.value, 0), [filtered]);
  const totalAll = totalPaid + totalUnpaid;
  const remaining = totalIncome - totalUnpaid;

  const unpaidItems = filtered.filter(i => !i.paid);
  const paidItems = filtered.filter(i => i.paid);

  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  const saveSalary = (v: string) => {
    const n = parseFloat(v) || 0;
    setSalary(n);
    saveData(KEYS.SALARY, n);
    saveData(KEYS.LAST_UPDATE, new Date().toISOString());
  };

  const saveVacation = (v: string) => {
    const n = parseFloat(v) || 0;
    setVacation(n);
    saveData(KEYS.VACATION, n);
    saveData(KEYS.LAST_UPDATE, new Date().toISOString());
  };

  const saveExtra = (v: string) => {
    const n = parseFloat(v) || 0;
    setExtra(n);
    saveData(KEYS.EXTRA, n);
    saveData(KEYS.LAST_UPDATE, new Date().toISOString());
  };

  const renderItem = (item: Purchase, i: number) => (
    <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className={`bg-card border border-border rounded-2xl p-4 ${item.paid ? "opacity-60" : ""}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold text-sm ${item.paid ? "line-through" : ""}`}>{item.productName}</h3>
          <p className="text-muted-foreground text-xs">{item.store} · {fmtDate(item.purchaseDate)}</p>
          {item.month && <p className="text-muted-foreground text-[10px]">{item.month}</p>}
        </div>
        <span className="font-bold text-sm shrink-0 ml-2">R$ {item.value.toFixed(2)}</span>
      </div>
      {item.notes && <p className="text-muted-foreground text-xs mb-2 line-clamp-1">{item.notes}</p>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusColors[item.status]}`}>{item.status}</span>
          <button onClick={() => togglePaid(item.id)} className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 ${item.paid ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
            <CheckCircle2 className="w-3 h-3" />
            {item.paid ? "Pago" : "A pagar"}
          </button>
        </div>
        <div className="flex gap-1">
          <button onClick={() => startEdit(item)} className="p-2 rounded-lg active:bg-secondary"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => save(items.filter(x => x.id !== item.id))} className="p-2 rounded-lg active:bg-secondary"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen px-5 pt-14 pb-8 safe-bottom">
      <PageHeader title="Compras" />

      {/* search & filters */}
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar produto" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-36" />
      </div>
      <div className="flex gap-2 mb-3">
        {(["all", "unpaid", "paid"] as const).map(f => (
          <button key={f} onClick={() => setFilterPaid(f)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterPaid === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
            {f === "all" ? "Todos" : f === "unpaid" ? "A Pagar" : "Pagos"}
          </button>
        ))}
      </div>

      {/* Salary & Summary */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setShowSalary(!showSalary)} className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="w-4 h-4 text-teal-500" /> Rendimentos
          </button>
          <div className="text-right">
            <span className="block font-bold text-sm text-teal-600">R$ {totalIncome.toFixed(2)}</span>
            {(vacation > 0 || extra > 0) && <span className="text-[10px] text-muted-foreground font-normal">Soma total dos rendimentos</span>}
          </div>
        </div>
        {showSalary && (
          <div className="flex flex-col gap-2 mb-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase ml-1">Salário Base</label>
              <Input type="number" step="0.01" value={salary} onChange={e => saveSalary(e.target.value)} placeholder="Salário" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase ml-1">Férias</label>
              <Input type="number" step="0.01" value={vacation} onChange={e => saveVacation(e.target.value)} placeholder="Valor Férias" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase ml-1">Outros / Extra</label>
              <Input type="number" step="0.01" value={extra} onChange={e => saveExtra(e.target.value)} placeholder="Outros ganhos" />
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-red-50 rounded-xl p-2 text-center">
            <p className="text-muted-foreground">A Pagar</p>
            <p className="font-bold text-red-600">R$ {totalUnpaid.toFixed(2)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2 text-center">
            <p className="text-muted-foreground">Já Pago</p>
            <p className="font-bold text-emerald-600">R$ {totalPaid.toFixed(2)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-2 text-center">
            <p className="text-muted-foreground">Total Geral</p>
            <p className="font-bold text-blue-600">R$ {totalAll.toFixed(2)}</p>
          </div>
          <div className={`rounded-xl p-2 text-center ${remaining >= 0 ? "bg-teal-50" : "bg-red-50"}`}>
            <p className="text-muted-foreground">Sobra Salário</p>
            <p className={`font-bold ${remaining >= 0 ? "text-teal-600" : "text-red-600"}`}>R$ {remaining.toFixed(2)}</p>
          </div>
        </div>
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

      {/* A Pagar */}
      {unpaidItems.length > 0 && filterPaid !== "paid" && (
        <>
          <h2 className="font-semibold text-sm text-red-600 mb-2">A Pagar ({unpaidItems.length})</h2>
          <div className="flex flex-col gap-3 mb-4">
            {unpaidItems.map((item, i) => renderItem(item, i))}
          </div>
        </>
      )}

      {/* Pagos */}
      {paidItems.length > 0 && filterPaid !== "unpaid" && (
        <>
          <h2 className="font-semibold text-sm text-emerald-600 mb-2">Pagos ({paidItems.length})</h2>
          <div className="flex flex-col gap-3">
            {paidItems.map((item, i) => renderItem(item, i))}
          </div>
        </>
      )}

      {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm mt-8">Nenhuma compra registrada</p>}
    </div>
  );
};

export default ShoppingPage;
