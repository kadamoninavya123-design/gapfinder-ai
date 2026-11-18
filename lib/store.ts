export const KEYS = {
  material: "gf_material",
  topics: "gf_topics",
  attempts: "gf_attempts",
  reasons: "gf_reasons",
};

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}