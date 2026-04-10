import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, X, Search, DollarSign, CheckCircle2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { loadData, saveData, generateId, Purchase, KEYS, seedPurchasesIfEmpty, MonthlyFinance } from "@/lib/storage";
import { ConfirmDeleteDrawer } from "@/components/ConfirmDeleteDrawer";

const STORES = ["Shopee", "Mercado Livre", "Amazon", "AliExpress", "Outro"];
const statusColors: Record<string, string> = { comprado: "bg-blue-500/20 text-blue-600", enviado: "bg-amber-500/20 text-amber-600", entregue: "bg-emerald-500/20 text-emerald-600" };

const ShoppingPage = () => {
  const [items, setItems] = useState<Purchase[]>(() => seedPurchasesIfEmpty());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7)); // Default to current month
  const [filterPaid, setFilterPaid] = useState<"all" | "paid" | "unpaid">("all");
  
  // Finances keyed by month (YYYY-MM)
  const [allFinances, setAllFinances] = useState<Record<string, MonthlyFinance>>(() => loadData(KEYS.FINANCES, {}));
  const [showSalary, setShowSalary] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // form states
  const [productName, setProductName] = useState("");
  const [store, setStore] = useState("Shopee");
  const [value, setValue] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recipient, setRecipient] = useState<string>("Para mim");
  const [notes, setNotes] = useState("");

  const save = (list: Purchase[]) => { setItems(list); saveData(KEYS.PURCHASES, list); };

  // Get current finance based on filterMonth
  const activeMonthKey = filterMonth || new Date().toISOString().slice(0, 7);
  const currentFinance = allFinances[activeMonthKey] || { salary: 1666, vacation: 0, extra: 0, isOnVacation: false };

  const updateFinance = (updates: Partial<MonthlyFinance>) => {
    const newFinances = { ...allFinances, [activeMonthKey]: { ...currentFinance, ...updates } };
    setAllFinances(newFinances);
    saveData(KEYS.FINANCES, newFinances);
    saveData(KEYS.LAST_UPDATE, new Date().toISOString());
  };

  const resetForm = () => {
    setShowForm(false); setEditing(null);
    setProductName(""); setStore("Shopee"); setValue(""); setPurchaseDate(new Date().toISOString().slice(0, 10)); setNotes(""); setRecipient("Para mim");
  };

  const startEdit = (p: Purchase) => {
    setEditing(p); setProductName(p.productName); setStore(p.store); setValue(String(p.value)); setPurchaseDate(p.purchaseDate); setNotes(p.notes); setRecipient(p.recipient); setShowForm(true);
  };

  const fmtMonthLabel = (dateStr: string) => {
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const d = new Date(dateStr + "T00:00:00");
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;
    const now = new Date().toISOString();
    const val = parseFloat(value) || 0;
    if (editing) {
      save(items.map(it => it.id === editing.id ? { ...it, productName, store, value: val, purchaseDate, notes, recipient } : it));
    } else {
      save([{ id: generateId(), productName, store, value: val, purchaseDate, status: "comprado", paid: false, notes, recipient, createdAt: now, month: fmtMonthLabel(purchaseDate) }, ...items]);
    }
    saveData(KEYS.LAST_UPDATE, now);
    resetForm();
  };

  const togglePaid = (id: string) => {
    save(items.map(it => it.id === id ? { ...it, paid: !it.paid } : it));
    saveData(KEYS.LAST_UPDATE, new Date().toISOString());
  };

  const filtered = useMemo(() => {
    let list = items;
    if (search) list = list.filter(i => i.productName.toLowerCase().includes(search.toLowerCase()));
    if (filterMonth) list = list.filter(i => i.purchaseDate.slice(0, 7) === filterMonth);
    if (filterPaid === "paid") list = list.filter(i => i.paid);
    if (filterPaid === "unpaid") list = list.filter(i => !i.paid);
    return list;
  }, [items, search, filterMonth, filterPaid]);

  // CALCULATION LOGIC: Salary + (Vacation IF active) + Extra
  const totalIncome = currentFinance.salary + (currentFinance.isOnVacation ? currentFinance.vacation : 0) + currentFinance.extra;
  const totalUnpaid = useMemo(() => filtered.filter(i => !i.paid).reduce((s, i) => s + i.value, 0), [filtered]);
  const totalPaid = useMemo(() => filtered.filter(i => i.paid).reduce((s, i) => s + i.value, 0), [filtered]);
  const totalAll = totalPaid + totalUnpaid;
  const remaining = totalIncome - totalAll;

  const unpaidItems = filtered.filter(i => !i.paid);
  const paidItems = filtered.filter(i => i.paid);

  // Helper to get 5th business day
  const payday = useMemo(() => {
    const [y, m] = activeMonthKey.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    let count = 0;
    while (count < 5 && d.getMonth() === m - 1) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) count++;
      if (count < 5) d.setDate(d.getDate() + 1);
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }, [activeMonthKey]);

  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  const renderItem = (item: Purchase, i: number) => (
    <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className={`bg-card border border-border rounded-2xl p-4 shadow-sm ${item.paid ? "opacity-60" : "bg-white"}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold text-sm ${item.paid ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.productName}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium uppercase">{item.store}</span>
            <span className="text-[10px] bg-teal-50 text-teal-600 border border-teal-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">{item.recipient}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-sm block">R$ {item.value.toFixed(2)}</span>
          <span className="text-[10px] text-muted-foreground">{fmtDate(item.purchaseDate)}</span>
        </div>
      </div>
      {item.notes && <p className="text-muted-foreground text-[11px] mb-3 line-clamp-2 italic leading-tight">"{item.notes}"</p>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => togglePaid(item.id)} className={`text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all ${item.paid ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-sm"}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {item.paid ? "PAGO" : "A PAGAR"}
          </button>
        </div>
        <div className="flex gap-1">
          <button onClick={() => startEdit(item)} className="p-2 rounded-xl hover:bg-secondary transition-colors"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => setDeleteTarget(item.id)} className="p-2 rounded-xl hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen px-5 pt-14 pb-12 safe-bottom bg-[#f8fafc]">
      <PageHeader title="Compras" />

      {/* search & filters */}
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-12 bg-white rounded-2xl shadow-sm border-slate-200 focus:ring-teal-500" />
        </div>
        <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-[140px] h-12 bg-white rounded-2xl shadow-sm border-slate-200" />
      </div>
      
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
        {(["all", "unpaid", "paid"] as const).map(f => (
          <button key={f} onClick={() => setFilterPaid(f)} className={`text-[11px] uppercase font-bold px-4 py-2 rounded-full border transition-all whitespace-nowrap ${filterPaid === f ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white border-slate-200 text-muted-foreground hover:bg-slate-50"}`}>
            {f === "all" ? "Tudo" : f === "unpaid" ? "A Pagar" : "Pagos"}
          </button>
        ))}
      </div>
       {/* Financial Overview Card */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-[2.5rem] p-5 mb-6 text-white shadow-xl shadow-teal-900/10 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-teal-100 text-[10px] font-bold uppercase tracking-widest mb-1">Pagamento (5º Útil)</span>
            <span className="text-2xl font-black">{payday}</span>
          </div>
          <div className="flex flex-col items-end">
            <button 
              onClick={() => setShowSalary(!showSalary)} 
              className="flex flex-col items-end gap-0.5 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-[9px] font-black tracking-widest hover:bg-white/30 transition-all border border-white/10 group mb-1"
            >
              <span className="text-teal-100 flex items-center gap-1">RENDIMENTOS <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showSalary ? "rotate-180" : ""}`} /></span>
              <span className="text-white text-[11px]">{fmtMonthLabel(activeMonthKey + "-01")}</span>
            </button>
            <div className="text-right">
              <span className="text-[10px] text-teal-100 uppercase font-bold tracking-widest block mb-0.5">Saldo Líquido</span>
              <span className="text-lg font-black opacity-80">R$ {totalIncome.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {showSalary && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-4 mb-5 p-5 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-teal-100 tracking-widest ml-1 block">Salário Base</label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={currentFinance.salary !== undefined ? currentFinance.salary : ""} 
                    onChange={e => updateFinance({ salary: e.target.value === "" ? 0 : Number(e.target.value) })} 
                    className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm rounded-xl focus:bg-white/20 pl-8" 
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-100 text-[10px] font-bold">R$</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-teal-100 tracking-widest ml-1 block">Renda Extra</label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={currentFinance.extra !== undefined ? currentFinance.extra : ""} 
                    onChange={e => updateFinance({ extra: e.target.value === "" ? 0 : Number(e.target.value) })} 
                    className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm rounded-xl focus:bg-white/20 pl-8" 
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-100 text-[10px] font-bold">R$</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-6 pt-4 border-t border-white/10">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] uppercase font-black text-teal-100 tracking-widest ml-1 block">Valor das Férias</label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={currentFinance.vacation !== undefined ? currentFinance.vacation : ""} 
                    onChange={e => updateFinance({ vacation: e.target.value === "" ? 0 : Number(e.target.value) })} 
                    className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm rounded-xl focus:bg-white/20 pl-8" 
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-100 text-[10px] font-bold">R$</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[9px] uppercase font-black text-teal-100 tracking-widest">Estou de Férias?</span>
                <button 
                  onClick={() => updateFinance({ isOnVacation: !currentFinance.isOnVacation })}
                  className={`w-16 h-8 rounded-full transition-all relative shadow-inner ${currentFinance.isOnVacation ? "bg-white" : "bg-black/20"}`}
                >
                  <div className={`absolute top-1.5 w-5 h-5 rounded-full transition-all duration-300 shadow-md ${currentFinance.isOnVacation ? "left-9 bg-teal-600" : "left-1.5 bg-white"}`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 p-3.5 rounded-3xl border border-white/10 backdrop-blur-sm">
            <span className="text-teal-100 block text-[9px] uppercase font-black mb-1 tracking-widest">A Pagar</span>
            <span className="font-extrabold text-lg text-red-100">R$ {totalUnpaid.toFixed(2)}</span>
          </div>
          <div className="bg-white/15 p-3.5 rounded-3xl border border-white/10 backdrop-blur-sm">
            <span className="text-teal-100 block text-[9px] uppercase font-black mb-1 tracking-widest">Sobra Livre</span>
            <span className={`font-extrabold text-lg ${remaining >= 0 ? "text-white" : "text-orange-200"}`}>R$ {remaining.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-[2rem] p-5 mb-6 flex flex-col gap-4 shadow-xl shadow-slate-200/50">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">{editing ? "Editar" : "Nova"} Compra</h2>
              <button type="button" onClick={resetForm} className="bg-slate-100 p-1.5 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Produto" value={productName} onChange={e => setProductName(e.target.value)} required className="h-12 rounded-2xl border-slate-200" />
              <Select value={store} onValueChange={setStore}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl">{STORES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Input type="number" step="0.01" placeholder="0.00" value={value} onChange={e => setValue(e.target.value)} required className="h-12 pl-8 rounded-2xl border-slate-200" />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
              </div>
              <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required className="h-12 rounded-2xl border-slate-200" /> 
            </div>

            <div className="pt-1">
              <label className="text-[10px] uppercase font-black text-slate-400 ml-1 mb-2 block tracking-widest">Para quem?</label>
              <div className="flex gap-2">
                {["Para mim", "Para Mara", "Para Mãe"].map(r => (
                  <button key={r} type="button" onClick={() => setRecipient(r)} 
                    className={`flex-1 py-2.5 text-[10px] font-black rounded-[0.8rem] border-2 transition-all duration-300 ${recipient === r ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300"}`}>
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <Textarea placeholder="Observações (opcional)" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="resize-none rounded-2xl border-slate-200 text-xs italic" />
            
            <Button type="submit" className="w-full h-14 rounded-2xl font-black text-xs tracking-widest bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20 uppercase">
              {editing ? "Salvar Alterações" : "Adicionar à Lista"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full mb-6 rounded-2xl h-14 font-black text-xs tracking-[0.2em] bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all" size="lg">
          <Plus className="w-5 h-5 mr-1" />NOVA COMPRA
        </Button>
      )}

      {/* Lists Grouped by Status */}
      <div className="space-y-6">
        {unpaidItems.length > 0 && filterPaid !== "paid" && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Pendentes ({unpaidItems.length})</h2>
            </div>
            <div className="flex flex-col gap-3">
              {unpaidItems.map((item, i) => renderItem(item, i))}
            </div>
          </div>
        )}

        {paidItems.length > 0 && filterPaid !== "unpaid" && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <h2 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Liquidados ({paidItems.length})</h2>
            </div>
            <div className="flex flex-col gap-3">
              {paidItems.map((item, i) => renderItem(item, i))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white/50 rounded-[3rem] border border-dashed border-slate-200">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
              <Search className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-400 text-xs font-bold leading-relaxed">NADA ENCONTRADO<br/><span className="font-medium opacity-50">Tente buscar outro termo ou filtro</span></p>
          </div>
        )}
      </div>

      <ConfirmDeleteDrawer
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => save(items.filter(x => x.id !== deleteTarget))}
        title="Excluir compra?"
        description="Essa ação não pode ser desfeita. A compra será removida permanentemente."
      />
    </div>
  );
};

export default ShoppingPage;
