'use client';

import { useState, useRef, useCallback } from 'react';
import { useNoteToolStore } from '@/stores/notetool-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  User,
  Save,
  FileDown,
  FileUp,
  Trash2,
  Brain,
  Cloud,
  FileText,
  BookOpen,
  Layers,
  PenTool,
  MessageSquare,
} from 'lucide-react';

// ─── Stat Card (declared outside render to avoid state reset) ──────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#0d1117] border border-[#30363d] p-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#8b949e] truncate">{label}</p>
        <p className="text-lg font-semibold text-[#e6edf3] leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Integration Card (declared outside render) ────────────────────────

function IntegrationCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-[#0d1117] border border-[#30363d] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0a500]/10">
        <Icon className="h-5 w-5 text-[#f0a500]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-medium text-[#e6edf3]">{title}</h4>
          <Badge className="bg-[#f0a500]/15 text-[#f0a500] border-[#f0a500]/30 text-[10px] px-1.5 py-0">
            Coming Soon
          </Badge>
        </div>
        <p className="mt-1 text-xs text-[#8b949e] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export function AccountModal() {
  const {
    accountModalOpen,
    setAccountModalOpen,
    userProfile,
    updateProfile,
    notes,
    addNote,
    clearAllAnnotations,
    stickyNotes,
    highlightRegions,
    drawingPaths,
    mcqAnswers,
    flashcardStates,
    dynamicSections,
  } = useNoteToolStore();

  const [name, setName] = useState(userProfile.name);
  const [specialty, setSpecialty] = useState(userProfile.specialty);
  const [institution, setInstitution] = useState(userProfile.institution);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get initials for avatar
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSave = () => {
    updateProfile({ name, specialty, institution });
    setAccountModalOpen(false);
  };

  // ─── Content Stats ────────────────────────────────────────────────────
  const totalMCQs = notes.reduce(
    (acc, n) => acc + n.sections.filter((s) => s.type === 'mcq').length,
    0
  );
  const totalFlashcards = notes.reduce(
    (acc, n) => acc + n.sections.filter((s) => s.type === 'flashcard').length,
    0
  );
  const totalAnnotations =
    stickyNotes.length + highlightRegions.length + drawingPaths.length;

  // ─── Export All Notes ─────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      notes,
      mcqAnswers,
      flashcardStates,
      dynamicSections,
      userProfile,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `surgicalbrain-notes-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [notes, mcqAnswers, flashcardStates, dynamicSections, userProfile]);

  // ─── Import Notes ─────────────────────────────────────────────────────
  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.notes && Array.isArray(data.notes)) {
            data.notes.forEach((note: Parameters<typeof addNote>[0]) => {
              addNote(note);
            });
          }
        } catch {
          // Silently ignore invalid JSON
        }
      };
      reader.readAsText(file);
      // Reset input so the same file can be re-imported
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [addNote]
  );

  // ─── Clear All Data ───────────────────────────────────────────────────
  const handleClearAll = useCallback(() => {
    clearAllAnnotations();
    setClearDialogOpen(false);
  }, [clearAllAnnotations]);

  return (
    <Dialog open={accountModalOpen} onOpenChange={setAccountModalOpen}>
      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#e6edf3] flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-[#f0a500]" />
            Account
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="bg-[#0d1117] border border-[#30363d] w-full h-9 p-[3px] rounded-lg">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-[#f0a500]/15 data-[state=active]:text-[#f0a500] data-[state=active]:border-[#f0a500]/30 text-[#8b949e] text-xs rounded-md transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="data-[state=active]:bg-[#f0a500]/15 data-[state=active]:text-[#f0a500] data-[state=active]:border-[#f0a500]/30 text-[#8b949e] text-xs rounded-md transition-colors"
            >
              <Layers className="h-3.5 w-3.5" />
              Content
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="data-[state=active]:bg-[#f0a500]/15 data-[state=active]:text-[#f0a500] data-[state=active]:border-[#f0a500]/30 text-[#8b949e] text-xs rounded-md transition-colors"
            >
              <Brain className="h-3.5 w-3.5" />
              Integrations
            </TabsTrigger>
          </TabsList>

          {/* ─── Profile Tab ──────────────────────────────────────────── */}
          <TabsContent value="profile" className="mt-4">
            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[#f0a500] flex items-center justify-center text-[#0d1117] font-bold text-xl shadow-lg shadow-[#f0a500]/20">
                  {initials || 'DR'}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label className="text-[#8b949e] text-xs">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] rounded-xl placeholder:text-[#8b949e]/50"
                />
              </div>

              {/* Specialty */}
              <div className="space-y-2">
                <Label className="text-[#8b949e] text-xs">Specialty</Label>
                <Input
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Cardiology"
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] rounded-xl placeholder:text-[#8b949e]/50"
                />
              </div>

              {/* Institution */}
              <div className="space-y-2">
                <Label className="text-[#8b949e] text-xs">Institution</Label>
                <Input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="General Hospital"
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] rounded-xl placeholder:text-[#8b949e]/50"
                />
              </div>
            </div>
          </TabsContent>

          {/* ─── Content Management Tab ───────────────────────────────── */}
          <TabsContent value="content" className="mt-4">
            <div className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={BookOpen}
                  label="Total Notes"
                  value={notes.length}
                  color="#f0a500"
                />
                <StatCard
                  icon={Brain}
                  label="Total MCQs"
                  value={totalMCQs}
                  color="#58a6ff"
                />
                <StatCard
                  icon={Layers}
                  label="Total Flashcards"
                  value={totalFlashcards}
                  color="#3fb950"
                />
                <StatCard
                  icon={PenTool}
                  label="Annotations"
                  value={totalAnnotations}
                  color="#bc8cff"
                />
              </div>

              <Separator className="bg-[#30363d]" />

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <Button
                  onClick={handleExport}
                  className="w-full bg-[#0d1117] hover:bg-[#161b22] border border-[#30363d] text-[#e6edf3] rounded-xl h-10 justify-start gap-2.5"
                >
                  <FileDown className="h-4 w-4 text-[#3fb950]" />
                  Export All Notes
                </Button>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-[#0d1117] hover:bg-[#161b22] border border-[#30363d] text-[#e6edf3] rounded-xl h-10 justify-start gap-2.5"
                >
                  <FileUp className="h-4 w-4 text-[#58a6ff]" />
                  Import Notes
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />

                <Button
                  onClick={() => setClearDialogOpen(true)}
                  className="w-full bg-[#0d1117] hover:bg-[#161b22] border border-[#30363d] text-[#e6edf3] rounded-xl h-10 justify-start gap-2.5"
                >
                  <Trash2 className="h-4 w-4 text-[#f85149]" />
                  Clear All Data
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ─── Integrations Tab ─────────────────────────────────────── */}
          <TabsContent value="integrations" className="mt-4">
            <div className="space-y-3">
              <IntegrationCard
                icon={MessageSquare}
                title="Anki Export"
                description="Export your flashcards directly to Anki decks with spaced repetition scheduling. Supports cloze deletions and image occlusion."
              />
              <IntegrationCard
                icon={Cloud}
                title="Cloud Sync"
                description="Sync your notes, annotations, and progress across all your devices. Automatic backup with version history."
              />
              <IntegrationCard
                icon={FileText}
                title="PDF Auto-Synthesize"
                description="Upload PDFs and let AI automatically extract structured notes, generate MCQs, and create flashcards from the content."
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" className="text-[#8b949e] rounded-xl">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            className="bg-[#f0a500] hover:bg-[#d4940a] text-[#0d1117] font-semibold rounded-xl"
          >
            <Save className="h-4 w-4 mr-1.5" />
            Save Profile
          </Button>
        </DialogFooter>

        {/* ─── Clear All Confirmation Dialog ─────────────────────────── */}
        <AlertDialog
          open={clearDialogOpen}
          onOpenChange={setClearDialogOpen}
        >
          <AlertDialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#e6edf3]">
                Clear All Data?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[#8b949e]">
                This will permanently remove all your sticky notes, highlights,
                and drawings. Your clinical notes will not be affected. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] hover:bg-[#161b22] rounded-xl">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAll}
                className="bg-[#f85149] hover:bg-[#da3633] text-white border-none rounded-xl"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
