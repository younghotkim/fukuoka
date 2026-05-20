"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "yj-fukuoka-translate-favorites-v1";
const MAX = 200;

export type FavoriteSource = "translate" | "alt" | "suggest" | "reply" | "photo";

export type FavoriteItem = {
  id: string;
  ja: string;
  ko: string;
  hangulReading?: string;
  romaji?: string;
  tone?: string;
  source: FavoriteSource;
  context?: string;
  createdAt: number;
};

function isFavorite(value: unknown): value is FavoriteItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.ja === "string" &&
    typeof v.ko === "string" &&
    typeof v.source === "string" &&
    typeof v.createdAt === "number"
  );
}

function makeId(): string {
  return `fav_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function load(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isFavorite);
  } catch {
    return [];
  }
}

function persist(items: FavoriteItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    // localStorage quota / disabled
  }
}

// Dedup key — lowercase + collapsed whitespace, JA+KO pair.
function favKey(ja: string, ko: string): string {
  const norm = (s: string) =>
    s.normalize("NFKC").toLowerCase().replace(/[\s　]+/g, " ").trim();
  return `${norm(ja)}::${norm(ko)}`;
}

export function useFavorites() {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    setItems(load());
  }, []);

  // Cross-tab sync so multiple panel instances stay aligned.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setItems(load());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const has = useCallback(
    (ja: string, ko: string) => {
      const k = favKey(ja, ko);
      return items.some((it) => favKey(it.ja, it.ko) === k);
    },
    [items]
  );

  const add = useCallback(
    (entry: Omit<FavoriteItem, "id" | "createdAt">): boolean => {
      let added = false;
      setItems((cur) => {
        const k = favKey(entry.ja, entry.ko);
        if (cur.some((it) => favKey(it.ja, it.ko) === k)) return cur;
        added = true;
        const next: FavoriteItem[] = [
          { ...entry, id: makeId(), createdAt: Date.now() },
          ...cur
        ];
        persist(next);
        return next;
      });
      return added;
    },
    []
  );

  const remove = useCallback((id: string) => {
    setItems((cur) => {
      const next = cur.filter((it) => it.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const toggle = useCallback(
    (entry: Omit<FavoriteItem, "id" | "createdAt">) => {
      setItems((cur) => {
        const k = favKey(entry.ja, entry.ko);
        const existing = cur.find((it) => favKey(it.ja, it.ko) === k);
        if (existing) {
          const next = cur.filter((it) => it.id !== existing.id);
          persist(next);
          return next;
        }
        const next: FavoriteItem[] = [
          { ...entry, id: makeId(), createdAt: Date.now() },
          ...cur
        ];
        persist(next);
        return next;
      });
    },
    []
  );

  const clear = useCallback(() => {
    setItems([]);
    persist([]);
  }, []);

  return { items, add, remove, toggle, has, clear };
}
