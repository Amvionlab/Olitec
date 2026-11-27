"use client";

import { useEffect } from "react";

/**
 * Decorative animations (banner motion, power dots, the sun) start only once the page has
 * loaded and the browser is idle, so they never compete with the first paint on phones.
 * Adds `motion-ready` to <html>; globals.css keeps those animations paused until then.
 */
export function MotionReady() {
  useEffect(() => {
    const root = document.documentElement;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const start = () => {
      timer = setTimeout(() => {
        if (w.requestIdleCallback) w.requestIdleCallback(() => root.classList.add("motion-ready"), { timeout: 1500 });
        else root.classList.add("motion-ready");
      }, 1800);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      if (timer) clearTimeout(timer);
    };
  }, []);
  return null;
}
