'use client';

import { useNoteToolStore, type AppMode } from '@/stores/notetool-store';
import { BookOpen, PenTool, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const modes: { id: AppMode; label: string; icon: React.ReactNode }[] = [
  { id: 'read', label: 'READ', icon: <BookOpen className="h-3.5 w-3.5" /> },
  { id: 'annotate', label: 'ANNOTATE', icon: <PenTool className="h-3.5 w-3.5" /> },
  { id: 'developer', label: 'DEVELOPER', icon: <Code2 className="h-3.5 w-3.5" /> },
];

export function TriModeSwitcher() {
  const { mode, setMode } = useNoteToolStore();

  return (
    <div className="flex items-center rounded-full bg-[#1c2330]/50 p-1 border border-[#30363d]/50">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={cn(
            'relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-semibold tracking-widest transition-all duration-200',
            mode === m.id
              ? 'text-[#0d1117]'
              : 'text-[#8b949e] hover:text-[#e6edf3]'
          )}
        >
          {mode === m.id && (
            <motion.div
              layoutId="activeMode"
              className="absolute inset-0 rounded-full bg-[#f0a500] shadow-lg shadow-[#f0a500]/25"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            {m.icon}
            <span className="hidden sm:inline">{m.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
