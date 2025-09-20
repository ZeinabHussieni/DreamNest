import dayjs from "dayjs";

export type MonthCounts = Record<string, number>;
export function sortMonthKeys(keys: string[]): string[] {
  const uniq: string[] = [];
  for (const k of keys) {
    if (k && !uniq.includes(k)) uniq.push(k);
  }
  return uniq.sort((a, b) =>
    dayjs(a + "-01").valueOf() - dayjs(b + "-01").valueOf()
  );
}

export function toBarSeries(obj: MonthCounts) {
  return Object.entries(obj)
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));
}

export function mergeMonthSeries(a: MonthCounts, b: MonthCounts) {
  const months = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort();
  return months.map((m) => ({ month: m, a: a[m] || 0, b: b[m] || 0 }));
}

export function stack3(a: MonthCounts, b: MonthCounts, c: MonthCounts) {
  const months = Array.from(new Set([...Object.keys(a), ...Object.keys(b), ...Object.keys(c)])).sort();
  return months.map((m) => ({ month: m, a: a[m] || 0, b: b[m] || 0, c: c[m] || 0 }));
}