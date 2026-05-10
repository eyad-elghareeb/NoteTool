'use client';

import { useEffect, useState } from "react";
import { useNoteToolStore } from "@/stores/notetool-store";

export function ThemeSync() {
  const settings = useNoteToolStore((s) => s.settings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const isDark = settings.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme, mounted]);

  return null;
}
