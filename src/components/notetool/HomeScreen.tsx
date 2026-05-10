'use client';

import { useNoteToolStore } from '@/stores/notetool-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  BookOpen,
  Upload,
  Plus,
  Zap,
  Brain,
  Activity,
  ChevronRight,
  Lightbulb,
  Target,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function HomeScreen() {
  const { notes, setActiveView, setNewNoteModalOpen, setPdfFile, setActiveNoteId } = useNoteToolStore();

  // Compute stats
  const specialties = new Set(notes.map((n) => n.specialty));
  const recentNotes = [...notes]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 4);

  // Count total flashcards across all notes
  const totalFlashcards = notes.reduce((count, note) => {
    return count + note.sections.reduce((secCount, section) => {
      if (section.type === 'flashcard' && Array.isArray(section.content)) {
        return secCount + section.content.length;
      }
      return secCount;
    }, 0);
  }, 0);

  return (
    <div className="space-y-8">
      {/* ═════════════════════════════════════════════════════════════════
          Welcome Hero Section
          ═════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-[#30363d]/60 bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117] p-8">
        {/* Decorative accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0a500]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#f0a500]/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#f0a500] flex items-center justify-center shadow-lg shadow-[#f0a500]/20">
              <Brain className="h-7 w-7 text-[#0d1117]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#e6edf3] tracking-tight">
                SurgicalBrain
              </h1>
              <p className="text-sm text-[#8b949e]">
                Dissect · Map · Act · Connect
              </p>
            </div>
          </div>
          <p className="text-base text-[#8b949e] max-w-xl leading-relaxed">
            Your medical knowledge synthesis engine. Transform complex clinical information into
            structured, interconnected, and actionable knowledge.
          </p>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          Quick Stats
          ═════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          value={notes.length}
          label="Syntheses"
          color="#f0a500"
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          value={specialties.size}
          label="Specialties"
          color="#22c55e"
        />
        <StatCard
          icon={<Zap className="h-5 w-5" />}
          value={totalFlashcards}
          label="Flashcards"
          color="#a855f7"
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          value={notes.reduce((c, n) => c + n.sections.filter((s) => s.type === 'mcq').length, 0)}
          label="MCQs"
          color="#06b6d4"
        />
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          Quick Actions
          ═════════════════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-[#e6edf3] mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#f0a500]" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ActionCard
            icon={<Plus className="h-5 w-5" />}
            title="Create New Synthesis"
            description="Start a new medical knowledge synthesis"
            onClick={() => setNewNoteModalOpen(true)}
            color="#f0a500"
          />
          <ActionCard
            icon={<BookOpen className="h-5 w-5" />}
            title="Open Library"
            description="Browse medical references and resources"
            onClick={() => setActiveView('library')}
            color="#22c55e"
          />
          <ActionCard
            icon={<Upload className="h-5 w-5" />}
            title="Upload PDF"
            description="Extract knowledge from medical PDFs"
            onClick={() => setActiveView('pdf-workspace')}
            color="#06b6d4"
          />
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          Recent Notes
          ═════════════════════════════════════════════════════════════════ */}
      {recentNotes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#e6edf3] mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#8b949e]" />
            Recent Activity
          </h2>
          <div className="space-y-2">
            {recentNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => {
                  setActiveNoteId(note.id);
                  setActiveView('notes');
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#30363d]/50 bg-[#161b22]/50 hover:bg-[#161b22] hover:border-[#f0a500]/20 transition-all duration-150 text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#1c2330] flex items-center justify-center shrink-0 group-hover:bg-[#f0a500]/10 transition-colors">
                  <FileText className="h-4 w-4 text-[#8b949e] group-hover:text-[#f0a500] transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#e6edf3] truncate group-hover:text-[#f0a500] transition-colors">
                    {note.title}
                  </p>
                  <p className="text-xs text-[#8b949e] truncate">{note.specialty} · {note.category}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e]">
                    {note.sections.length} sections
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-[#30363d] group-hover:text-[#f0a500] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          Getting Started
          ═════════════════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-[#e6edf3] mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-[#f0a500]" />
          Getting Started
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TipCard
            step="1"
            title="Create a Synthesis"
            description="Start by creating a new note synthesis. Add clinical content, algorithms, and flashcards to build your medical knowledge base."
          />
          <TipCard
            step="2"
            title="Use Three Modes"
            description="Switch between Read (consume), Annotate (mark up), and Developer (customize) modes using the mode switcher in the header."
          />
          <TipCard
            step="3"
            title="Explore the Connectome"
            description="Visualize relationships between your notes in the knowledge graph. Link related conditions and build your differential diagnosis network."
          />
          <TipCard
            step="4"
            title="Active Recall Practice"
            description="Use flashcards and MCQs embedded in each synthesis for spaced repetition. Export to Anki for mobile study sessions."
          />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function StatCard({ icon, value, label, color }: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-[#30363d]/50 bg-[#161b22]/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs text-[#8b949e]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[#e6edf3]">{value}</p>
    </div>
  );
}

function ActionCard({ icon, title, description, onClick, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-4 rounded-xl border border-[#30363d]/50 bg-[#161b22]/50 hover:bg-[#161b22] hover:border-[#30363d] transition-all duration-150 text-left group"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors"
        style={{ backgroundColor: `${color}10`, color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-[#e6edf3] group-hover:text-[#f0a500] transition-colors">{title}</p>
        <p className="text-xs text-[#8b949e] mt-0.5">{description}</p>
      </div>
    </button>
  );
}

function TipCard({ step, title, description }: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 p-4 rounded-xl border border-[#30363d]/50 bg-[#161b22]/50">
      <div className="w-7 h-7 rounded-full bg-[#f0a500]/10 text-[#f0a500] text-xs font-bold flex items-center justify-center shrink-0">
        {step}
      </div>
      <div>
        <p className="text-sm font-medium text-[#e6edf3]">{title}</p>
        <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
