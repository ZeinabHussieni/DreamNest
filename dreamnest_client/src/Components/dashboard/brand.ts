function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export const Brand = {
  bgSoft: () => cssVar("--soft-bg", "#F2EAF7"),
  border: () => cssVar("--border", "rgba(0,0,0,0.06)"),

  text: () => cssVar("--text", "#1f1b2d"),
  muted: () => cssVar("--muted", "#746b84"),

  accent: () => cssVar("--purple-2", "#a48bff"),
  accent2: () => cssVar("--button-bg", "#49368F"),
  accent3: () => cssVar("--header-bg", "#F1DAFF"),

  ok: () => cssVar("--mark-done-color", "#4b3e88"), 
  warn: () => "#B7791F", 
};
