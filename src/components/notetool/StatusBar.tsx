'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNoteToolStore } from '@/stores/notetool-store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function StatusBar() {
  const { userProfile, activeNoteId, notes, setActiveView } = useNoteToolStore();

  const activeNote = notes.find((n) => n.id === activeNoteId);
  const linkCount = activeNote?.links?.length ?? 0;

  // ─── Auto-hide logic ────────────────────────────────────────────
  const [visible, setVisible] = useState(true);
  const hoveringRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule auto-hide (only calls setState from async callback)
  const scheduleHide = useCallback((delay: number) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!hoveringRef.current) setVisible(false);
    }, delay);
  }, []);

  // Initial auto-hide after 3 seconds
  useEffect(() => {
    scheduleHide(3000);
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [scheduleHide]);

  // Re-show when activeNoteId changes — use a key-based approach
  // by listening for activeNoteId and scheduling a show + re-hide
  const prevNoteIdRef = useRef(activeNoteId);
  useEffect(() => {
    if (prevNoteIdRef.current !== activeNoteId) {
      prevNoteIdRef.current = activeNoteId;
      // Use microtask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setVisible(true);
        scheduleHide(3000);
      });
    }
  }, [activeNoteId, scheduleHide]);

  // Show bar on hover at bottom edge
  const handleMouseEnter = useCallback(() => {
    hoveringRef.current = true;
    setVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoveringRef.current = false;
    scheduleHide(1500);
  }, [scheduleHide]);

  return (
    <>
      {/* ─── Invisible hover zone at bottom of screen ─────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 h-8 z-40"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-hidden="true"
      />

      {/* ─── Status Bar ───────────────────────────────────────────── */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'h-[28px] flex items-center px-4 gap-3',
              'bg-sb-bg/70 backdrop-blur-md border-t border-sb-border/40',
              'select-none'
            )}
          >
            {/* Green dot + Online */}
            <div className="flex items-center gap-1.5">
              <div className="w-[5px] h-[5px] rounded-full bg-sb-correct animate-pulse" />
              <span className="text-[9px] font-medium text-sb-muted tracking-wide">Online</span>
            </div>

            {/* Separator */}
            <div className="w-px h-2.5 bg-sb-border/60" />

            {/* Specialty */}
            <span className="text-[9px] text-[#484f58]">
              {userProfile.specialty}
            </span>

            {/* Separator */}
            <div className="w-px h-2.5 bg-sb-border/60" />

            {/* Links */}
            <button
              onClick={() => setActiveView('connectome')}
              className="flex items-center gap-1 text-[#484f58] hover:text-sb-accent transition-colors"
            >
              <span className="text-[9px]">{linkCount} links</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
