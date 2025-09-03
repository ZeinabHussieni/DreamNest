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


export function mergeMonthSeries(a: MonthCounts, b: MonthCounts) {
  const keys = sortMonthKeys([...Object.keys(a || {}), ...Object.keys(b || {})]);
  return keys.map((k) => ({
    month: k,
    a: a?.[k] ?? 0,
    b: b?.[k] ?? 0,
  }));
}

export function toBarSeries(src: MonthCounts) {
  const keys = sortMonthKeys(Object.keys(src || {}));
  return keys.map((k) => ({ month: k, value: src[k] ?? 0 }));
}
