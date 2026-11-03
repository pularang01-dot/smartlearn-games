"use client";

import { useEffect } from "react";

export const MOTION_KEY = "slg:reduce-motion";

export function applyMotionPreference(reduce: boolean) {
  document.documentElement.dataset.reduceMotion = reduce ? "true" : "false";
}

/** Menerapkan preferensi "Kurangi animasi" yang disimpan di perangkat ini (preferensi UI non-sensitif). */
export function MotionPreference() {
  useEffect(() => {
    try {
      applyMotionPreference(localStorage.getItem(MOTION_KEY) === "1");
    } catch {
      /* localStorage tidak tersedia */
    }
  }, []);
  return null;
}
