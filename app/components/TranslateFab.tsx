"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { TranslatePanel } from "./TranslatePanel";

export function TranslateFab() {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the panel is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={open ? "translate-fab translate-fab--open" : "translate-fab"}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "번역 닫기" : "번역 열기"}
        aria-expanded={open}
      >
        <Languages size={20} aria-hidden="true" />
        <span className="translate-fab__label">번역</span>
      </button>
      <TranslatePanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
