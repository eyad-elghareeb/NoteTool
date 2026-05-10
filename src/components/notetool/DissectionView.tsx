'use client';

import { useNoteToolStore } from '@/stores/notetool-store';
import { Badge } from '@/components/ui/badge';
import { Scissors, ChevronDown, ChevronUp, Zap, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DissectionViewProps {
  highYieldSummary: string[];
  children: React.ReactNode;
}

export function DissectionView({ highYieldSummary, children }: DissectionViewProps) {
  const { dissectionMode, toggleDissection } = useNoteToolStore();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-4">
      {/* Dissection Toggle — PoC pill style */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleDissection}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 border',
            dissectionMode
              ? 'bg-[#f0a500] text-[#0d1117] border-[#f0a500] shadow-lg shadow-[#f0a500]/20'
              : 'bg-[#1c2330]/50 text-[#8b949e] border-[#30363d] hover:text-[#e6edf3] hover:border-[#8b949e]'
          )}
        >
          <Maximize2 className="h-3.5 w-3.5" />
          {dissectionMode ? 'Dissection Mode' : 'Dissect Note'}
        </button>
        {dissectionMode && (
          <Badge variant="outline" className="text-[10px] border-[#f0a500]/30 text-[#f0a500] bg-[#f0a500]/8">
            <Zap className="h-3 w-3 mr-1" />
            High-Yield Summary
          </Badge>
        )}
      </div>

      <AnimatePresence mode="wait">
        {dissectionMode ? (
          <motion.div
            key="dissection"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* High-Yield Summary Card */}
            <div className="rounded-2xl border border-[#f0a500]/20 bg-[#f0a500]/5 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#f0a500]" />
                  <h3 className="text-sm font-bold text-[#f0a500]">High-Yield Summary</h3>
                </div>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-[10px] text-[#8b949e] hover:text-[#f0a500] flex items-center gap-1 transition-colors"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Collapse Full Note
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Show Full Note
                    </>
                  )}
                </button>
              </div>

              <ul className="space-y-2">
                {highYieldSummary.map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#f0a500]/15 text-[#f0a500] flex items-center justify-center text-[10px] font-mono mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[#e6edf3]/90 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Optionally show full note below */}
            {expanded && (
              <div className="opacity-50 blur-[0.5px] pointer-events-none select-none">
                {children}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
