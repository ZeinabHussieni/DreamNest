import { useCallback, useEffect, useRef, useState } from "react";

export default function useNotificationBell() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const toggleOpen = useCallback(() => setOpen(v => !v), []);
  const close = useCallback(() => setOpen(false), []);


  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open, close]);

 
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);


  const onItemKey = useCallback(
    (e: React.KeyboardEvent<HTMLElement>, handler: () => void) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handler();
      }
    },
    []
  );

  return { open, toggleOpen, close, rootRef, onItemKey };
}
