"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "olitec-recently-viewed";
const MAX = 12;

function read(): number[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id) => Number.isInteger(id)).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

/** Product ids the visitor viewed recently, newest first (this browser only). */
export function useRecentlyViewed() {
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => setIds(read()), []);

  const record = useCallback((id: number) => {
    const next = [id, ...read().filter((existing) => existing !== id)].slice(0, MAX);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode) — the feature simply stays empty.
    }
    setIds(next);
  }, []);

  return { ids, record };
}
