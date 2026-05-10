'use client';

import { useState } from 'react';
import { useNoteToolStore } from '@/stores/notetool-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Clock,
  ArrowRight,
  Plus,
  Heart,
  Wind,
  Scissors,
  Activity,
  Library,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const SPECIALTY_COLORS: Record<string, string> = {
  Cardiology: 'bg-rose-500/12 text-rose-400 border-rose-500/20',
  'Respiratory Medicine': 'bg-sky-500/12 text-sky-400 border-sky-500/20',
  Nephrology: 'bg-violet-500/12 text-violet-400 border-violet-500/20',
  'General Surgery': 'bg-amber-500/12 text-amber-400 border-amber-500/20',
  Neurology: 'bg-orange-500/12 text-orange-400 border-orange-500/20',
  'GI Medicine': 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20',
};

const SPECIALTY_ICONS: Record<string, React.ReactNode> = {
  Cardiology: <Heart className="h-4 w-4" />,
  'Respiratory Medicine': <Wind className="h-4 w-4" />,
  Nephrology: <Activity className="h-4 w-4" />,
  'General Surgery': <Scissors className="h-4 w-4" />,
};

export function MedLibrary() {
  const { notes, setActiveNoteId, setActiveView, setNewNoteModalOpen } = useNoteToolStore();
  const [search, setSearch] = useState('');

  const filteredNotes = notes.filter(
    (n) =>
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.specialty.toLowerCase().includes(search.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenNote = (noteId: string) => {
    setActiveNoteId(noteId);
    setActiveView('notes');
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 rounded-full bg-sb-accent" />
        <div>
          <h2 className="text-xl font-bold text-sb-text serif-title">MedLibrary</h2>
          <p className="text-xs text-sb-muted mt-0.5">Curated medical syntheses — browse &amp; contribute</p>
        </div>
        <Library className="h-5 w-5 text-sb-accent ml-auto" />
      </div>

      {/* ─── Search ──────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sb-muted" />
        <Input
          placeholder="Search library by title, specialty, or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 pl-10 bg-sb-surface border-sb-border text-sb-text placeholder:text-sb-muted rounded-xl"
        />
      </div>

      {/* ─── Card Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map((note, idx) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="hover-lift"
          >
            <div className="rounded-2xl border border-sb-border bg-sb-surface p-5 space-y-3 group">
              {/* Category badge + read time */}
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] border',
                    SPECIALTY_COLORS[note.specialty] || 'bg-sb-surface2 text-sb-muted border-sb-border'
                  )}
                >
                  {SPECIALTY_ICONS[note.specialty] && (
                    <span className="mr-1">{SPECIALTY_ICONS[note.specialty]}</span>
                  )}
                  {note.specialty}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] text-sb-muted">
                  <Clock className="h-3 w-3" />
                  ~{Math.max(3, note.sections.length * 2)} min
                </div>
              </div>

              {/* Title */}
              <h3 className="text-sm font-bold text-sb-text group-hover:text-sb-accent transition-colors serif-title leading-snug">
                {note.title}
              </h3>

              {/* Summary */}
              <p className="text-xs text-sb-muted line-clamp-2 leading-relaxed">
                {note.summary}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {note.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[9px] border-sb-border text-sb-muted bg-sb-surface2 h-5 px-1.5"
                  >
                    {tag}
                  </Badge>
                ))}
                {note.tags.length > 3 && (
                  <Badge
                    variant="outline"
                    className="text-[9px] border-sb-border text-sb-muted bg-sb-surface2 h-5 px-1.5"
                  >
                    +{note.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Open Synthesis button */}
              <Button
                size="sm"
                onClick={() => handleOpenNote(note.id)}
                className="w-full bg-sb-accent/10 text-sb-accent border border-sb-accent/20 hover:bg-sb-accent/20 rounded-xl h-8 text-xs font-medium"
                variant="outline"
              >
                Open Synthesis
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </motion.div>
        ))}

        {/* ─── Contribute Synthesis Placeholder ───────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: filteredNotes.length * 0.05 }}
        >
          <button
            onClick={() => setNewNoteModalOpen(true)}
            className="w-full h-full min-h-[240px] rounded-2xl border-2 border-dashed border-sb-border bg-sb-surface/30 flex flex-col items-center justify-center gap-3 text-sb-muted hover:border-sb-accent/40 hover:text-sb-accent transition-all duration-200 p-5"
          >
            <div className="w-12 h-12 rounded-full bg-sb-surface2 flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Contribute Synthesis</p>
              <p className="text-[10px] mt-1">Create a new medical knowledge synthesis</p>
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
