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
  recipient: 'Para mim' | 'Para Mara' | 'Para Mãe' | string;
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

export interface MonthlyFinance {
  salary: number;
  vacation: number;
  extra: number;
  isOnVacation: boolean;
}

export interface HealthRecord {
  id: string;
  date: string;
  time: string;
  type: 'normal' | 'dor' | 'observacao' | 'outro' | 'caguei';
  text: string;
  intensity: number;
  bleeding?: boolean;
  dry?: boolean;
  createdAt: string;
}

export const KEYS = {
  DIARY: 'hub_diary',
  PURCHASES: 'hub_purchases',
  AGENDA: 'hub_agenda',
  HEALTH: '__sys_cache_v2',
  FINANCES: 'hub_finances_v2',
  LAST_UPDATE: 'hub_last_update',
  TOPICS: 'hub_diary_topics',
  AGENDA_TOPICS: 'hub_agenda_topics',
  HEALTH_TOPICS: 'hub_health_topics',
  BACKUP_SNAPSHOT: 'hub_backup_snapshot',
};

// Export all data as JSON
export function exportAllData(): string {
  const data = {
    diary: loadData(KEYS.DIARY, []),
    purchases: loadData(KEYS.PURCHASES, []),
    agenda: loadData(KEYS.AGENDA, []),
    health: loadData(KEYS.HEALTH, []),
    finances: loadData(KEYS.FINANCES, {}),
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
    if (data.finances) saveData(KEYS.FINANCES, data.finances);
    if (data.lastUpdate) saveData(KEYS.LAST_UPDATE, data.lastUpdate);
    return true;
  } catch {
    return false;
  }
}

// --- Smart Backup System ---

export interface BackupSnapshot {
  exportedAt: string; // ISO timestamp
  version: number;
  data: {
    diary: any[];
    purchases: any[];
    agenda: any[];
    health: any[];
    finances: Record<string, any>;
    lastUpdate: string;
  };
}

// Export: saves snapshot to localStorage AND downloads a fixed-name .json file
export function exportBackupSnapshot(): { snapshot: BackupSnapshot; json: string } {
  const snapshot: BackupSnapshot = {
    exportedAt: new Date().toISOString(),
    version: 2,
    data: {
      diary: loadData(KEYS.DIARY, []),
      purchases: loadData(KEYS.PURCHASES, []),
      agenda: loadData(KEYS.AGENDA, []),
      health: loadData(KEYS.HEALTH, []),
      finances: loadData(KEYS.FINANCES, {}),
      lastUpdate: loadData(KEYS.LAST_UPDATE, ''),
    },
  };
  const json = JSON.stringify(snapshot, null, 2);
  // Save internally so restore doesn't need file picker
  saveData(KEYS.BACKUP_SNAPSHOT, snapshot);
  return { snapshot, json };
}

// Restore: reads from internal snapshot in localStorage, validates age (max 90 days)
export type RestoreResult =
  | { ok: true }
  | { ok: false; reason: 'no_backup' }
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'too_old'; exportedAt: string; daysDiff: number };

export function restoreFromSnapshot(): RestoreResult {
  try {
    const snapshot = loadData<BackupSnapshot | null>(KEYS.BACKUP_SNAPSHOT, null);
    if (!snapshot || !snapshot.exportedAt) {
      return { ok: false, reason: 'no_backup' };
    }
    const exportedAt = new Date(snapshot.exportedAt);
    const daysDiff = Math.floor((Date.now() - exportedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      return { ok: false, reason: 'too_old', exportedAt: snapshot.exportedAt, daysDiff };
    }
    const { data } = snapshot;
    if (data.diary) saveData(KEYS.DIARY, data.diary);
    if (data.purchases) saveData(KEYS.PURCHASES, data.purchases);
    if (data.agenda) saveData(KEYS.AGENDA, data.agenda);
    if (data.health) saveData(KEYS.HEALTH, data.health);
    if (data.finances) saveData(KEYS.FINANCES, data.finances);
    if (data.lastUpdate) saveData(KEYS.LAST_UPDATE, data.lastUpdate);
    // Update backup timestamp
    exportBackupSnapshot();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

// Check if a backup snapshot exists and how old it is
export function getBackupInfo(): { exists: boolean; exportedAt?: string; daysDiff?: number } {
  const snapshot = loadData<BackupSnapshot | null>(KEYS.BACKUP_SNAPSHOT, null);
  if (!snapshot?.exportedAt) return { exists: false };
  const daysDiff = Math.floor((Date.now() - new Date(snapshot.exportedAt).getTime()) / (1000 * 60 * 60 * 24));
  return { exists: true, exportedAt: snapshot.exportedAt, daysDiff };
}

// Seed purchases from Excel data (only if empty)
export function seedPurchasesIfEmpty(): Purchase[] {
  const existing = loadData<Purchase[]>(KEYS.PURCHASES, []);
  if (existing.length > 0) return existing;

  const items: Purchase[] = [
    // Janeiro 2026
    { id: generateId(), productName: "Recarga Celular Mensal", store: "Outro", value: 20, purchaseDate: "2026-01-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-01-01T00:00:00Z", month: "Janeiro 2026" },
    { id: generateId(), productName: "Faculdade", store: "Outro", value: 234, purchaseDate: "2026-01-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-01-01T00:00:00Z", month: "Janeiro 2026" },
    { id: generateId(), productName: "Netflix", store: "Outro", value: 40, purchaseDate: "2026-01-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-01-01T00:00:00Z", month: "Janeiro 2026" },
    { id: generateId(), productName: "Amazon Prime", store: "Amazon", value: 19.90, purchaseDate: "2026-01-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-01-01T00:00:00Z", month: "Janeiro 2026" },
    { id: generateId(), productName: "Maquina de Lavar da vó ❤️👵", store: "Outro", value: 40, purchaseDate: "2026-01-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-01-01T00:00:00Z", month: "Janeiro 2026" },
    { id: generateId(), productName: "Casa + Ração 20KG Gatas + Areia", store: "Outro", value: 660, purchaseDate: "2026-01-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-01-01T00:00:00Z", month: "Janeiro 2026" },
    { id: generateId(), productName: "Empréstimo Picpay", store: "Outro", value: 63, purchaseDate: "2026-01-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-01-01T00:00:00Z", month: "Janeiro 2026" },
    // Fevereiro 2026
    { id: generateId(), productName: "Recarga Celular Mensal", store: "Outro", value: 20, purchaseDate: "2026-02-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Faculdade", store: "Outro", value: 470, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "a mara me ajudou a pagar a parcela", recipient: "Para mim", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Claro TV Streaming", store: "Outro", value: 69, purchaseDate: "2026-02-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Cartão Nubank", store: "Outro", value: 126, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Empréstimo Picpay", store: "Outro", value: 40, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Maquina de Lavar da vó ❤️👵", store: "Outro", value: 40, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Casa + Ração 20KG Gatas + Areia", store: "Outro", value: 360, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "a minha mãe me ajudou com -300 reais do aluguel", recipient: "Para mim", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Cambio Logitech ML", store: "Mercado Livre", value: 44.15, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Volante Logitech Amazon", store: "Amazon", value: 199, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    { id: generateId(), productName: "Dinheiro Extra ML", store: "Mercado Livre", value: 87.90, purchaseDate: "2026-02-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-02-01T00:00:00Z", month: "Fevereiro 2026" },
    // Março 2026
    { id: generateId(), productName: "Recarga Celular Mensal", store: "Outro", value: 20, purchaseDate: "2026-03-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Faculdade Jamais", store: "Outro", value: 660, purchaseDate: "2026-03-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Claro TV Streaming", store: "Outro", value: 69, purchaseDate: "2026-03-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Cartão Nubank", store: "Outro", value: 695, purchaseDate: "2026-03-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Empréstimo Picpay", store: "Outro", value: 29, purchaseDate: "2026-03-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Volante Logitech Amazon", store: "Amazon", value: 199, purchaseDate: "2026-03-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Maquina de Lavar da vó ❤️👵", store: "Outro", value: 40, purchaseDate: "2026-03-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Casa + Ração 20KG Gatas + Areia", store: "Outro", value: 450, purchaseDate: "2026-03-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Cambio Logitech ML", store: "Mercado Livre", value: 19.81, purchaseDate: "2026-03-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    { id: generateId(), productName: "Jeitto", store: "Outro", value: 313, purchaseDate: "2026-03-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-03-01T00:00:00Z", month: "Março 2026" },
    // AMB (Abril/Maio/Agosto) 2026
    { id: generateId(), productName: "Recarga Celular Mensal", store: "Outro", value: 20, purchaseDate: "2026-04-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Consulta", store: "Outro", value: 199, purchaseDate: "2026-04-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Empréstimo Picpay", store: "Outro", value: 60, purchaseDate: "2026-04-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Volante Logitech Amazon (Separado restante de 199 no Caixa)", store: "Amazon", value: 300, purchaseDate: "2026-04-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Maquina de Lavar da vó ❤️👵", store: "Outro", value: 70, purchaseDate: "2026-04-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Cambio Logitech ML", store: "Mercado Livre", value: 41, purchaseDate: "2026-04-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Estacio", store: "Outro", value: 60, purchaseDate: "2026-04-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Jeitto", store: "Outro", value: 373, purchaseDate: "2026-04-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    { id: generateId(), productName: "Gatas", store: "Outro", value: 180, purchaseDate: "2026-04-01", status: "entregue", paid: true, notes: "", recipient: "Para mim", createdAt: "2026-04-01T00:00:00Z", month: "AMB 2026" },
    // Junho 2026
    { id: generateId(), productName: "Recarga Celular Mensal", store: "Outro", value: 20, purchaseDate: "2026-06-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-06-01T00:00:00Z", month: "Junho 2026" },
    { id: generateId(), productName: "Claro TV Streaming", store: "Outro", value: 70, purchaseDate: "2026-06-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-06-01T00:00:00Z", month: "Junho 2026" },
    { id: generateId(), productName: "Cartão Nubank", store: "Outro", value: 520, purchaseDate: "2026-06-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-06-01T00:00:00Z", month: "Junho 2026" },
    { id: generateId(), productName: "Volante Logitech Amazon", store: "Amazon", value: 199, purchaseDate: "2026-06-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-06-01T00:00:00Z", month: "Junho 2026" },
    { id: generateId(), productName: "Casa + Ração 20KG Gatas + Areia", store: "Outro", value: 330, purchaseDate: "2026-06-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-06-01T00:00:00Z", month: "Junho 2026" },
    { id: generateId(), productName: "Cambio Logitech ML", store: "Mercado Livre", value: 19.81, purchaseDate: "2026-06-01", status: "entregue", paid: false, notes: "", recipient: "Para mim", createdAt: "2026-06-01T00:00:00Z", month: "Junho 2026" },
  ];

  saveData(KEYS.PURCHASES, items);
  return items;
}
