/**
 * Session invité — pas de compte, identité persistée dans localStorage.
 * Le guest_id survit aux refresh / fermetures du navigateur.
 *
 * TTL : 12h glissantes. Chaque appel à getGuestId() rafraîchit le timestamp.
 * Au-delà, l'identité est régénérée (table également libérée).
 */
const GUEST_ID_KEY = "ljst_guest_id";
const GUEST_TS_KEY = "ljst_guest_ts";
const TABLE_NUMBER_KEY = "ljst_table_number";
const TABLE_TOKEN_KEY = "ljst_table_token";
const TABLE_NAME_KEY = "ljst_table_name";

const TTL_MS = 12 * 60 * 60 * 1000; // 12 heures

const uuid = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const touch = () => {
  try { localStorage.setItem(GUEST_TS_KEY, String(Date.now())); } catch {}
};

const isExpired = (): boolean => {
  try {
    const raw = localStorage.getItem(GUEST_TS_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts > TTL_MS;
  } catch {
    return false;
  }
};

const purgeSession = () => {
  try {
    localStorage.removeItem(GUEST_ID_KEY);
    localStorage.removeItem(GUEST_TS_KEY);
    localStorage.removeItem(TABLE_NUMBER_KEY);
    localStorage.removeItem(TABLE_TOKEN_KEY);
    localStorage.removeItem(TABLE_NAME_KEY);
  } catch {}
};

export const getGuestId = (): string => {
  try {
    if (isExpired()) purgeSession();
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    touch();
    return id;
  } catch {
    return uuid();
  }
};

export const getTableNumber = (): number | null => {
  try {
    const raw = localStorage.getItem(TABLE_NUMBER_KEY);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

export const setTableNumber = (n: number) => {
  try { localStorage.setItem(TABLE_NUMBER_KEY, String(n)); touch(); } catch {}
};

export const getTableToken = (): string | null => {
  try { return localStorage.getItem(TABLE_TOKEN_KEY); } catch { return null; }
};

export const setTableToken = (t: string) => {
  try { localStorage.setItem(TABLE_TOKEN_KEY, t); touch(); } catch {}
};

export const getTableName = (): string | null => {
  try { return localStorage.getItem(TABLE_NAME_KEY); } catch { return null; }
};

export const setTableName = (name: string | null) => {
  try {
    if (name && name.trim()) localStorage.setItem(TABLE_NAME_KEY, name.trim());
    else localStorage.removeItem(TABLE_NAME_KEY);
    touch();
  } catch {}
};

/**
 * Renvoie le label affichable d'une table : nom personnalisé si présent,
 * sinon "Table N". Utilisé partout côté client + admin pour rester cohérent.
 */
export const formatTableLabel = (
  number: number | null | undefined,
  name?: string | null,
): string => {
  if (name && name.trim()) return name.trim();
  if (number == null) return "Table";
  return `Table ${number}`;
};
