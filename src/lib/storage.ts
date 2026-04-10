export function loadData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveData<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Types
export interface DiaryEntry {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  productName: string;
  store: string;
  value: number;
  purchaseDate: string;
  status: 'comprado' | 'enviado' | 'entregue';
  paid: boolean;
  notes: string;
  createdAt: string;
  month?: string; // e.g. "Janeiro 2026"
}

export interface AgendaItem {
  id: string;
  title: string;
  date: string;
  time: string;
  notes: string;
  completed: boolean;
  createdAt: string;
}

export interface HealthRecord {
  id: string;
  date: string;
  time: string;
  type: 'normal' | 'dor' | 'observacao' | 'outro' | 'caguei';
  text: string;
  intensity: number;
  bleeding?: boolean;
  createdAt: string;
}

export const KEYS = {
  DIARY: 'hub_diary',
  PURCHASES: 'hub_purchases',
  AGENDA: 'hub_agenda',
  HEALTH: '__sys_cache_v2',
  SALARY: 'hub_salary',
  VACATION: 'hub_vacation',
  LAST_UPDATE: 'hub_last_update',
};

// Export all data as JSON
export function exportAllData(): string {
  const data = {
    diary: loadData(KEYS.DIARY, []),
    purchases: loadData(KEYS.PURCHASES, []),
    agenda: loadData(KEYS.AGENDA, []),
    health: loadData(KEYS.HEALTH, []),
    salary: loadData(KEYS.SALARY, 0),
    vacation: loadData(KEYS.VACATION, 0),
    lastUpdate: loadData(KEYS.LAST_UPDATE, ''),
  };
  return JSON.stringify(data, null, 2);
}

// Import data from JSON
export function importAllData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.diary) saveData(KEYS.DIARY, data.diary);
    if (data.purchases) saveData(KEYS.PURCHASES, data.purchases);
    if (data.agenda) saveData(KEYS.AGENDA, data.agenda);
    if (data.health) saveData(KEYS.HEALTH, data.health);
    if (data.salary !== undefined) saveData(KEYS.SALARY, data.salary);
    if (data.vacation !== undefined) saveData(KEYS.VACATION, data.vacation);
    if (data.lastUpdate) saveData(KEYS.LAST_UPDATE, data.lastUpdate);
    return true;
  } catch {
    return false;
  }
}

// Seed purchases from Excel data (only if empty)
export function seedPurchasesIfEmpty(): Purchase[] {
  const existing = loadData<Purchase[]>(KEYS.PURCHASES, []);
  if (existing.length > 0) return existing;

  const items: Purchase[] = [
    // Janeiro 2026
    { id: generateId(), productName: "Recarga Celular Mensal", store: "Outro", value: 20, purchaseDate: "2026-01-01", status: "entregue", paid: false, notes: "", createdAt: "2026-01-01T00:00:00Z", month: "Janeiro 2026" },
    { id: generateId(), productName: "Faculdade", store: "Outro", value: 234, purchaseDate: "2026-01-01", status: "entregue", paid: false, notes: "", createdAt: "2026-01-01T00:00:00Z", month: "Janeiro 2026" },
    { id: generateId(), productName: "Netflix", store: "Outro", value: 40, purchaseDate: "2026-01-01", status: "entregue", paid: true, notes: "", createdAt: "2026-01-01T00:00:00Z", month: "Janeiro 2026" },
    { id: generateId(), productName: "Amazon Prime", store: "Amazon", value: 19.90, purchaseDate: "2026-01-01", status: "entregue", paid: true, notes: "", createdAt: "2026-01-01T00:00:00Z", month: "Janeiro 2026" },
    { id: generateId(), productName: "Maquina de Lavar da vó ❤️👵", store: "Outro", value: 40, purchaseDate: "2026-01-01", status: "entregue", paid: true, notes: "", createdAt: "2026-01-01T00:00:00Z", month: "Janeiro 2026" },
    { id: generateId(), productName: "Casa + Ração 20KG Gatas + Areia", store: "Outro", value: 660, purchaseDate: "2026-01-01", status: "entregue", paid: true, notes: "", createdAt: "2026-01-01T00:00:00Z", month: "Janeiro 2026" },
    { id: generateId(), productName: "Empréstimo Picpay", store: "Outro", value: 63, purchaseDate: "2026-01-01", status: "entregue", paid: true, notes: "", createdAt: "2026-01-01T00:00:00Z", month: "Janeiro 2026" },
    // Fevereiro 2026
    { id: generateId(), productName: "Recarga Celular Mensal", store: "Outro", value: 20, purchaseDate: "2026-02-01", status: "entregue", paid: false, notes: "", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Faculdade", store: "Outro", value: 470, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "a mara me ajudou a pagar a parcela", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Claro TV Streaming", store: "Outro", value: 69, purchaseDate: "2026-02-01", status: "entregue", paid: false, notes: "", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Cartão Nubank", store: "Outro", value: 126, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Empréstimo Picpay", store: "Outro", value: 40, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Maquina de Lavar da vó ❤️👵", store: "Outro", value: 40, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Casa + Ração 20KG Gatas + Areia", store: "Outro", value: 360, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "a minha mãe me ajudou com -300 reais do aluguel", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Cambio Logitech ML", store: "Mercado Livre", value: 44.15, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Volante Logitech Amazon", store: "Amazon", value: 199, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Dinheiro Extra ML", store: "Mercado Livre", value: 87.90, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    // Março 2026
    { id: generateId(), productName: "Recarga Celular Mensal", store: "Outro", value: 20, purchaseDate: "2026-03-01", status: "entregue", paid: false, notes: "", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Faculdade Jamais", store: "Outro", value: 660, purchaseDate: "2026-03-01", status: "entregue", paid: true, notes: "", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Claro TV Streaming", store: "Outro", value: 69, purchaseDate: "2026-03-01", status: "entregue", paid: true, notes: "", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Cartão Nubank", store: "Outro", value: 695, purchaseDate: "2026-03-01", status: "entregue", paid: true, notes: "", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Empréstimo Picpay", store: "Outro", value: 29, purchaseDate: "2026-03-01", status: "entregue", paid: true, notes: "", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Volante Logitech Amazon", store: "Amazon", value: 199, purchaseDate: "2026-03-01", status: "entregue", paid: false, notes: "", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Maquina de Lavar da vó ❤️👵", store: "Outro", value: 40, purchaseDate: "2026-03-01", status: "entregue", paid: true, notes: "", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Casa + Ração 20KG Gatas + Areia", store: "Outro", value: 450, purchaseDate: "2026-03-01", status: "entregue", paid: true, notes: "", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Cambio Logitech ML", store: "Mercado Livre", value: 19.81, purchaseDate: "2026-03-01", status: "entregue", paid: true, notes: "", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Jeitto", store: "Outro", value: 313, purchaseDate: "2026-03-01", status: "entregue", paid: false, notes: "", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    // AMB (Abril/Maio/Agosto) 2026
    { id: generateId(), productName: "Recarga Celular Mensal", store: "Outro", value: 20, purchaseDate: "2026-04-01", status: "entregue", paid: false, notes: "", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Consulta", store: "Outro", value: 199, purchaseDate: "2026-04-01", status: "entregue", paid: true, notes: "", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Empréstimo Picpay", store: "Outro", value: 60, purchaseDate: "2026-04-01", status: "entregue", paid: true, notes: "", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Volante Logitech Amazon (Separado restante de 199 no Caixa)", store: "Amazon", value: 300, purchaseDate: "2026-04-01", status: "entregue", paid: false, notes: "", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Maquina de Lavar da vó ❤️👵", store: "Outro", value: 70, purchaseDate: "2026-04-01", status: "entregue", paid: false, notes: "", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Cambio Logitech ML", store: "Mercado Livre", value: 41, purchaseDate: "2026-04-01", status: "entregue", paid: true, notes: "", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Estacio", store: "Outro", value: 60, purchaseDate: "2026-04-01", status: "entregue", paid: true, notes: "", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Jeitto", store: "Outro", value: 373, purchaseDate: "2026-04-01", status: "entregue", paid: true, notes: "", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Gatas", store: "Outro", value: 180, purchaseDate: "2026-04-01", status: "entregue", paid: true, notes: "", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    // Junho 2026
    { id: generateId(), productName: "Recarga Celular Mensal", store: "Outro", value: 20, purchaseDate: "2026-06-01", status: "entregue", paid: false, notes: "", createdAt: "2026-06-01T00:00:00Z", month: "Junho 2026" },
    { id: generateId(), productName: "Claro TV Streaming", store: "Outro", value: 70, purchaseDate: "2026-06-01", status: "entregue", paid: false, notes: "", createdAt: "2026-06-01T00:00:00Z", month: "Junho 2026" },
    { id: generateId(), productName: "Cartão Nubank", store: "Outro", value: 520, purchaseDate: "2026-06-01", status: "entregue", paid: false, notes: "", createdAt: "2026-06-01T00:00:00Z", month: "Junho 2026" },
    { id: generateId(), productName: "Volante Logitech Amazon", store: "Amazon", value: 199, purchaseDate: "2026-06-01", status: "entregue", paid: false, notes: "", createdAt: "2026-06-01T00:00:00Z", month: "Junho 2026" },
    { id: generateId(), productName: "Casa + Ração 20KG Gatas + Areia", store: "Outro", value: 330, purchaseDate: "2026-06-01", status: "entregue", paid: false, notes: "", createdAt: "2026-06-01T00:00:00Z", month: "Junho 2026" },
    { id: generateId(), productName: "Cambio Logitech ML", store: "Mercado Livre", value: 19.81, purchaseDate: "2026-06-01", status: "entregue", paid: false, notes: "", createdAt: "2026-06-01T00:00:00Z", month: "Junho 2026" },
  ];

  saveData(KEYS.PURCHASES, items);
  return items;
}
