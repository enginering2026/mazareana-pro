import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Universal descending sorter for financial records (Newest First).
 * - Primary: Compares dates (YYYY-MM-DD).
 * - Secondary (for same-day records): Compares exact createdAt ISO timestamps.
 * - Tertiary fallback: Extracts millisecond timestamps embedded in IDs (e.g., rev-xxx-1728420000000).
 */
export function sortByDateDesc<T extends { date?: string; rawDate?: string; createdAt?: string; id?: string }>(a: T, b: T): number {
  const dA = a.date || a.rawDate || '';
  const dB = b.date || b.rawDate || '';

  const timeDateA = dA ? new Date(dA).getTime() : 0;
  const timeDateB = dB ? new Date(dB).getTime() : 0;

  if (timeDateB !== timeDateA) {
    return timeDateB - timeDateA;
  }

  // Same day! Compare exact creation timestamps
  if (a.createdAt && b.createdAt) {
    const tA = new Date(a.createdAt).getTime();
    const tB = new Date(b.createdAt).getTime();
    if (tB !== tA) {
      return tB - tA;
    }
  } else if (b.createdAt) {
    return 1;
  } else if (a.createdAt) {
    return -1;
  }

  // Fallback: extract millisecond timestamp from generated ID
  const extractTs = (id?: string) => {
    if (!id) return 0;
    const parts = id.split('-');
    const last = parts[parts.length - 1];
    const n = Number(last);
    return isNaN(n) ? 0 : n;
  };

  const tsA = extractTs(a.id);
  const tsB = extractTs(b.id);
  if (tsB !== tsA) {
    return tsB - tsA;
  }

  return 0;
}
