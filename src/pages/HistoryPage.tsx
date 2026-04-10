import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ShoppingCart, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { loadData, KEYS, DiaryEntry, Purchase, AgendaItem } from "@/lib/storage";

interface HistoryItem {
  id: string;
  type: "diary" | "purchase" | "agenda";
  title: string;
  subtitle: string;
  date: string;
}

const icons = { diary: BookOpen, purchase: ShoppingCart, agenda: Calendar };
const labels = { diary: "Anotação", purchase: "Compra", agenda: "Agenda" };
const colors = { diary: "text-teal-600", purchase: "text-blue-600", agenda: "text-violet-600" };

const HistoryPage = () => {
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterType, setFilterType] = useState<"all" | "diary" | "purchase" | "agenda">("all");

  const allItems = useMemo<HistoryItem[]>(() => {
    const diary: DiaryEntry[] = loadData(KEYS.DIARY, []);
    const purchases: Purchase[] = loadData(KEYS.PURCHASES, []);
    const agenda: AgendaItem[] = loadData(KEYS.AGENDA, []);

    const all: HistoryItem[] = [
      ...diary.map(d => ({ id: d.id, type: "diary" as const, title: d.title, subtitle: d.description.slice(0, 60), date: d.createdAt })),
      ...purchases.map(p => ({ id: p.id, type: "purchase" as const, title: p.productName, subtitle: `${p.store} · R$ ${p.value.toFixed(2)}`, date: p.createdAt })),
      ...agenda.map(a => ({ id: a.id, type: "agenda" as const, title: a.title, subtitle: `${a.date} ${a.time}`, date: a.createdAt })),
    ];

    return all.sort((a, b) => b.date.localeCompare(a.date));
  }, []);

  const filtered = useMemo(() => {
    let list = allItems;
    if (search) list = list.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));
    if (filterMonth) list = list.filter(i => i.date.slice(0, 7) === filterMonth);
    if (filterType !== "all") list = list.filter(i => i.type === filterType);
    return list;
  }, [allItems, search, filterMonth, filterType]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen px-5 pt-14 pb-8 safe-bottom">
      <PageHeader title="Histórico Geral" />

      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-36" />
      </div>
      <div className="flex gap-2 mb-3">
        {(["all", "diary", "purchase", "agenda"] as const).map(f => (
          <button key={f} onClick={() => setFilterType(f)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterType === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
            {f === "all" ? "Todos" : f === "diary" ? "Notas" : f === "purchase" ? "Compras" : "Agenda"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((item, i) => {
          const Icon = icons[item.type];
          return (
            <motion.div key={item.id + item.type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${colors[item.type]}`} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] text-muted-foreground">{labels[item.type]}</span>
                </div>
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-muted-foreground text-xs line-clamp-1">{item.subtitle}</p>
                <p className="text-muted-foreground text-[11px] mt-1">{fmtDate(item.date)}</p>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm mt-8">Nenhum registro encontrado</p>}
      </div>
    </div>
  );
};

export default HistoryPage;
