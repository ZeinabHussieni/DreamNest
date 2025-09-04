import { useEffect, useRef, useState } from "react";

export default function useDropdown<T extends HTMLElement = HTMLDivElement>() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<T | null>(null);

  const toggleDropdown = () => setIsOpen(v => !v);
  const closeDropdown = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!dropdownRef.current) return;
      if (target && dropdownRef.current.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  return { isOpen, toggleDropdown, closeDropdown, dropdownRef } as const;
}
