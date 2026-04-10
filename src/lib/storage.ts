// Generic localStorage helpers with type safety

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
  notes: string;
  createdAt: string;
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
  type: 'normal' | 'dor' | 'observacao' | 'outro';
  text: string;
  intensity: number;
  createdAt: string;
}

// Storage keys
export const KEYS = {
  DIARY: 'hub_diary',
  PURCHASES: 'hub_purchases',
  AGENDA: 'hub_agenda',
  HEALTH: '__sys_cache_v2', // obscure key for secret area
};
