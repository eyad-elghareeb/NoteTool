'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useNoteToolStore, type NoteData } from '@/stores/notetool-store';
import {
  acuteHeartFailureNote,
  copdExacerbationNote,
  lapCholeNote,
  akiNote,
} from '@/data/demo-notes/acute-heart-failure';
import { TriModeSwitcher } from '@/components/notetool/TriModeSwitcher';
import { Sidebar } from '@/components/notetool/Sidebar';
import { MermaidDiagram } from '@/components/notetool/MermaidDiagram';
import { MCQBlock } from '@/components/notetool/MCQBlock';
import { FlashcardBlock } from '@/components/notetool/FlashcardBlock';
import { DissectionView } from '@/components/notetool/DissectionView';
import { NoteTabs } from '@/components/notetool/NoteTabs';
import { AssetPlaceholder } from '@/components/notetool/AssetPlaceholder';
import { ConnectomeView } from '@/components/notetool/ConnectomeView';
import { MindmapView } from '@/components/notetool/MindmapView';
import { DDxSplitter } from '@/components/notetool/DDxSplitter';
import { ICDTagger } from '@/components/notetool/ICDTagger';
import { GlobalAnnotationOverlay } from '@/components/notetool/GlobalAnnotationOverlay';
import { DeveloperView } from '@/components/notetool/DeveloperView';
import { ContentToolbar } from '@/components/notetool/ContentToolbar';
import { MedLibrary } from '@/components/notetool/MedLibrary';
import { SettingsModal } from '@/components/notetool/SettingsModal';
import { NewNoteModal } from '@/components/notetool/NewNoteModal';
import { AccountModal } from '@/components/notetool/AccountModal';
import { StatusBar } from '@/components/notetool/StatusBar';
import { HomeScreen } from '@/components/notetool/HomeScreen';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Download,
  Settings,
  User,
  Scissors,
  ArrowLeftRight,
  Plus,
  X,
  ChevronRight,
  FileText,
  Copy,
  Trash2,
  Maximize2,
  Minimize2,
  Upload,
  FileUp,
  ChevronDown,
  Command,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Demo notes to seed the store
const DEMO_NOTES: NoteData[] = [
  acuteHeartFailureNote,
  copdExacerbationNote,
  lapCholeNote,
  akiNote,
];

export default function Home() {
  const store = useNoteToolStore();
  const {
    mode,
    activeView,
    activeNoteId,
    dissectionMode,
    dynamicSections,
    removeDynamicSection,
    contentToolbarOpen,
    setContentToolbarOpen,
    notes,
    addNote,
    setActiveView,
    setSettingsModalOpen,
    setAccountModalOpen,
    setNewNoteModalOpen,
    duplicateNote,
    deleteNote,
    settings,
    // ─── New store fields ────────────────────────────
    globalPenActive,
    setGlobalPenActive,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    fullscreenView,
    setFullscreenView,
    pdfFile,
    setPdfFile,
  } = store;

  // ─── Seed demo notes on first load ──────────────────────────────────
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (!seeded && notes.length === 0) {
      DEMO_NOTES.forEach((n) => addNote(n));
      queueMicrotask(() => setSeeded(true));
    }
  }, [seeded, notes.length, addNote]);

  // ─── When switching to annotate mode, activate global pen ───────────
  useEffect(() => {
    if (mode === 'annotate') {
      setGlobalPenActive(true);
    }
  }, [mode, setGlobalPenActive]);

  // ─── Get the active note ────────────────────────────────────────────
  const activeNote = notes.find((n) => n.id === activeNoteId) || acuteHeartFailureNote;

  // ─── Export logic ───────────────────────────────────────────────────
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const handleExport = (format: 'json' | 'html') => {
    const note = activeNote;
    if (!note) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(note, null, 2);
      filename = `${note.id}.json`;
      mimeType = 'application/json';
    } else {
      const sectionsHtml = note.sections
        .map(
          (s) =>
            `<section><h2>${s.title}</h2><div>${typeof s.content === 'string' ? s.content : JSON.stringify(s.content)}</div></section>`
        )
        .join('\n');
      content = `<!DOCTYPE html><html><head><title>${note.title}</title><style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:0 20px;color:#e6edf3;background:#0d1117;}h1{font-family:Georgia,serif;}h2{color:#f0a500;}</style></head><body><h1>${note.title}</h1><p><em>${note.specialty}</em></p>${sectionsHtml}</body></html>`;
      filename = `${note.id}.html`;
      mimeType = 'text/html';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
  };

  // ─── Export PDF ─────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    const note = activeNote;
    if (!note) return;

    // Create a temporary container with styled content
    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;left:-9999px;top:0;width:794px;padding:40px;background:#0d1117;color:#e6edf3;font-family:system-ui;';

    // Build HTML content from note
    container.innerHTML = `<h1 style="color:#f0a500;font-size:24px;margin-bottom:8px;">${note.title}</h1>
      <p style="color:#8b949e;font-size:14px;margin-bottom:20px;">${note.specialty} • ${note.category}</p>
      <hr style="border-color:#30363d;margin-bottom:20px;"/>
      ${note.sections.map(s => {
        if (s.type === 'content') return `<h2 style="color:#f0a500;font-size:18px;margin:20px 0 10px;">${s.title}</h2><div style="color:#e6edf3;font-size:14px;line-height:1.6;">${typeof s.content === 'string' ? s.content : ''}</div>`;
        return '';
      }).join('')}
      <div style="margin-top:30px;padding-top:10px;border-top:1px solid #30363d;color:#8b949e;font-size:11px;">Exported from SurgicalBrain NoteTool</div>`;

    document.body.appendChild(container);

    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(container, { backgroundColor: '#0d1117', scale: 2 });
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${note.id}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
    setExportDropdownOpen(false);
  };

  // ─── Export Anki ────────────────────────────────────────────────────
  const handleExportAnki = () => {
    const note = activeNote;
    if (!note) return;

    // Collect all flashcard sections AND MCQ sections as Anki cards
    const cards: { front: string; back: string; tags: string[] }[] = [];
    note.sections.forEach(s => {
      if (s.type === 'flashcard' && Array.isArray(s.content)) {
        (s.content as any[]).forEach((card: any) => {
          cards.push({ front: card.front, back: card.back, tags: card.tags || [] });
        });
      }
      // Convert MCQs to Anki cards: question as front, correct answer + explanation as back
      if (s.type === 'mcq' && typeof s.content === 'object' && s.content !== null) {
        const mcq = s.content as { id: string; question: string; options: string[]; correctIndex: number; explanation: string };
        const correctAnswer = mcq.options[mcq.correctIndex] || '';
        const optionsList = mcq.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n');
        cards.push({
          front: `${mcq.question}\n\n${optionsList}`,
          back: `**Correct: ${String.fromCharCode(65 + mcq.correctIndex)}) ${correctAnswer}**\n\n${mcq.explanation}`,
          tags: ['mcq', note.specialty.toLowerCase().replace(/\s+/g, '-')],
        });
      }
    });

    if (cards.length === 0) {
      alert('No flashcards or MCQs found in this note to export.');
      setExportDropdownOpen(false);
      return;
    }

    // CSV format with headers for better Anki import compatibility
    const escapeCsv = (val: string) => {
      if (val.includes('"') || val.includes(',') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };
    const csvHeader = '"Front","Back","Tags"';
    const csvRows = cards.map(c =>
      `${escapeCsv(c.front)},${escapeCsv(c.back)},${escapeCsv(c.tags.join(' '))}`
    );
    const csv = [csvHeader, ...csvRows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.id}-anki.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
  };

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    if (exportDropdownOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [exportDropdownOpen]);

  // ─── Command Palette (Cmd+K) ────────────────────────────────────────
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(0);

  // Filter notes by search query
  const filteredNotes = searchQuery.trim()
    ? notes.filter((n) => {
        const q = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.specialty.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
    : notes;

  // Clamp selected index into bounds (derived, no setState in render)
  const clampedIndex = Math.min(searchSelectedIndex, Math.max(0, filteredNotes.length - 1));

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [searchOpen, setSearchOpen, setSearchQuery]);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [searchOpen]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchSelectedIndex((prev) => Math.min(prev + 1, filteredNotes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredNotes[clampedIndex]) {
        store.setActiveNoteId(filteredNotes[clampedIndex].id);
        setActiveView('notes');
        setSearchOpen(false);
        setSearchQuery('');
      }
    }
  };

  // ─── PDF Workspace ──────────────────────────────────────────────────
  const [pdfDragOver, setPdfDragOver] = useState(false);
  const [pdfIframeUrl, setPdfIframeUrl] = useState<string | null>(null);

  const handlePdfUpload = useCallback(
    (file: File) => {
      if (file.type !== 'application/pdf') return;
      if (pdfIframeUrl) URL.revokeObjectURL(pdfIframeUrl);
      const url = URL.createObjectURL(file);
      setPdfIframeUrl(url);
      setPdfFile(file);
    },
    [setPdfFile, pdfIframeUrl]
  );

  const handlePdfDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setPdfDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handlePdfUpload(file);
    },
    [handlePdfUpload]
  );

  const handlePdfFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handlePdfUpload(file);
    },
    [handlePdfUpload]
  );

  // ─── Mindmap markdown content ───────────────────────────────────────
  const mindmapMarkdown = `# Acute Heart Failure
## Pathophysiology
### Systolic Dysfunction
### Diastolic Dysfunction
### Volume Overload
## Clinical Features
### Left-sided HF
### Right-sided HF
### Killip Classification
## Management
### Acute (LMNOP)
#### IV Furosemide
#### IV GTN
#### O2
### Post-stabilization
#### ACEi/ARB
#### Beta-blockers
#### MRA (Spironolactone)
## Investigations
### BNP/NT-proBNP
### Echocardiography
### Chest X-ray
### ECG
## DDx
### COPD
### PE
### Pneumonia`;

  // ─── Developer view raw content ─────────────────────────────────────
  const devHtmlContent = `<div class="note-section">
  <h2 style="color: #f0a500; border-bottom: 2px solid #f0a500; padding-bottom: 8px;">
    Acute Heart Failure — Custom Interactive View
  </h2>
  <div style="background: #1c2330; padding: 16px; border-radius: 12px; margin: 12px 0;">
    <p style="color: #8b949e;">This is the <strong style="color: #f0a500;">Developer/Edit Mode</strong>.</p>
    <p style="color: #8b949e;">Edit the HTML/JS on the left panel → see live preview on the right.</p>
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
    <tr style="background: #222a36;">
      <th style="padding: 8px; text-align: left; color: #f0a500; border: 1px solid #30363d;">Parameter</th>
      <th style="padding: 8px; text-align: left; color: #f0a500; border: 1px solid #30363d;">Value</th>
    </tr>
    <tr>
      <td style="padding: 8px; color: #8b949e; border: 1px solid #30363d;">Killip Class</td>
      <td style="padding: 8px; color: #f0a500; border: 1px solid #30363d;">II</td>
    </tr>
    <tr style="background: #1c2330;">
      <td style="padding: 8px; color: #8b949e; border: 1px solid #30363d;">BNP</td>
      <td style="padding: 8px; color: #f0a500; border: 1px solid #30363d;">820 pg/mL</td>
    </tr>
  </table>
</div>`;

  // ─── Render a section ───────────────────────────────────────────────
  const renderSection = (
    section: { id: string; title?: string; type: string; content: unknown },
    isDynamic = false
  ) => {
    switch (section.type) {
      case 'content':
        return (
          <div key={section.id} className="space-y-2 relative group">
            <h2 className="text-lg font-bold text-[#e6edf3] flex items-center gap-2">
              <div className="w-1 h-5 bg-[#f0a500] rounded-full" />
              {section.title}
            </h2>
            <div
              className="pl-3 prose prose-sm max-w-none text-[#e6edf3]/85"
              style={{ fontSize: `${settings.fontSize}px` }}
            >
              <ReactMarkdown>
                {typeof section.content === 'string' ? section.content : ''}
              </ReactMarkdown>
            </div>
            {isDynamic && (
              <button
                onClick={() => removeDynamicSection(section.id)}
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-[#da3633]/10 text-[#da3633] hover:bg-[#da3633]/20"
                title="Remove section"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );

      case 'algorithm':
      case 'mermaid':
        return (
          <div key={section.id} className="space-y-2 relative group">
            {section.title && (
              <h2 className="text-lg font-bold text-[#e6edf3] flex items-center gap-2">
                <div className="w-1 h-5 bg-[#f0a500] rounded-full" />
                {section.title}
              </h2>
            )}
            {typeof section.content === 'object' &&
              section.content !== null &&
              'code' in (section.content as Record<string, unknown>) && (
                <MermaidDiagram
                  id={(section.content as { id: string }).id}
                  title={(section.content as { title: string }).title}
                  code={(section.content as { code: string }).code}
                />
              )}
            {isDynamic && (
              <button
                onClick={() => removeDynamicSection(section.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-[#da3633]/10 text-[#da3633] hover:bg-[#da3633]/20 z-10"
                title="Remove section"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );

      case 'tabs':
        return (
          <div key={section.id} className="space-y-2 relative group">
            <h2 className="text-lg font-bold text-[#e6edf3] flex items-center gap-2">
              <div className="w-1 h-5 bg-[#f0a500] rounded-full" />
              {section.title}
            </h2>
            {typeof section.content === 'object' &&
              section.content !== null &&
              'tabs' in (section.content as Record<string, unknown>) && (
                <NoteTabs
                  data={
                    section.content as {
                      tabs: { id: string; label: string; content: string }[];
                    }
                  }
                />
              )}
            {isDynamic && (
              <button
                onClick={() => removeDynamicSection(section.id)}
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-[#da3633]/10 text-[#da3633] hover:bg-[#da3633]/20"
                title="Remove section"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );

      case 'mcq':
        return (
          <div key={section.id} className="space-y-3 relative group">
            {section.title && (
              <h2 className="text-lg font-bold text-[#e6edf3] flex items-center gap-2">
                <div className="w-1 h-5 bg-[#f0a500] rounded-full" />
                {section.title}
              </h2>
            )}
            {typeof section.content === 'object' &&
              section.content !== null &&
              'question' in (section.content as Record<string, unknown>) && (
                <MCQBlock
                  data={
                    section.content as {
                      id: string;
                      question: string;
                      options: string[];
                      correctIndex: number;
                      explanation: string;
                    }
                  }
                  mode={mode}
                />
              )}
            {isDynamic && (
              <button
                onClick={() => removeDynamicSection(section.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-[#da3633]/10 text-[#da3633] hover:bg-[#da3633]/20 z-10"
                title="Remove section"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );

      case 'flashcard':
        return (
          <div key={section.id} className="space-y-3 relative group">
            {section.title && (
              <h2 className="text-lg font-bold text-[#e6edf3] flex items-center gap-2">
                <div className="w-1 h-5 bg-violet-500 rounded-full" />
                {section.title}
              </h2>
            )}
            {Array.isArray(section.content) && section.content.length > 0 && (
              <FlashcardBlock
                cards={
                  section.content as {
                    id: string;
                    type: 'cloze' | 'image-occlusion';
                    front: string;
                    back: string;
                    tags: string[];
                  }[]
                }
                mode={mode}
              />
            )}
            {isDynamic && (
              <button
                onClick={() => removeDynamicSection(section.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-[#da3633]/10 text-[#da3633] hover:bg-[#da3633]/20 z-10"
                title="Remove section"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );

      case 'asset':
        return (
          <div key={section.id} className="space-y-2 relative group">
            <h2 className="text-lg font-bold text-[#e6edf3] flex items-center gap-2">
              <div className="w-1 h-5 bg-[#f0a500] rounded-full" />
              {section.title}
            </h2>
            {typeof section.content === 'object' &&
              section.content !== null &&
              'filename' in (section.content as Record<string, unknown>) && (
                <AssetPlaceholder
                  data={
                    section.content as {
                      id: string;
                      noteId: string;
                      filename: string;
                      type: 'image' | 'pdf' | 'video';
                      caption: string;
                      path: string;
                    }
                  }
                />
              )}
            {isDynamic && (
              <button
                onClick={() => removeDynamicSection(section.id)}
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-[#da3633]/10 text-[#da3633] hover:bg-[#da3633]/20"
                title="Remove section"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Render the note content ────────────────────────────────────────
  const renderNoteContent = () => {
    const note = activeNote;
    if (!note) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <FileText className="h-12 w-12 text-[#8b949e]/20 mx-auto" />
            <p className="text-sm text-[#8b949e]">No note selected</p>
            <Button
              onClick={() => setNewNoteModalOpen(true)}
              className="bg-[#f0a500] hover:bg-[#d4940a] text-[#0d1117] rounded-xl"
            >
              Create New Synthesis
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* ─── Note Header ──────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Big serif title */}
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#e6edf3] serif-title leading-tight">
                {note.title}
              </h1>
              <p className="text-sm text-[#8b949e] mt-1">{note.summary}</p>
            </div>
          </div>

          {/* Breadcrumb-style badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-[#f0a500]/12 text-[#f0a500] border-[#f0a500]/20 text-[10px]">
              {note.category}
            </Badge>
            {note.ddxComparison && (
              <Badge
                variant="outline"
                className="text-[10px] border-rose-500/30 text-rose-400 cursor-pointer hover:bg-rose-500/10"
                onClick={() => setActiveView('ddx')}
              >
                <ArrowLeftRight className="h-3 w-3 mr-1" />
                DDx
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e] font-mono">
              ID: {note.id}
            </Badge>
            {/* Note actions */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => duplicateNote(note.id)}
                className="h-6 w-6 rounded-md flex items-center justify-center text-[#8b949e] hover:text-[#f0a500] hover:bg-[#1c2330] transition-colors"
                title="Duplicate note"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={() => deleteNote(note.id)}
                className="h-6 w-6 rounded-md flex items-center justify-center text-[#8b949e] hover:text-[#da3633] hover:bg-[#da3633]/10 transition-colors"
                title="Delete note"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* ICD/SNOMED Tags */}
          <ICDTagger
            icd10Codes={note.icd10Codes}
            snomedCodes={note.snomedCodes}
            specialty={note.specialty}
            tags={note.tags}
          />
        </div>

        <Separator className="bg-[#30363d]/60" />

        {/* ─── Dissection View wrapper ──────────────────────────── */}
        <DissectionView highYieldSummary={note.highYieldSummary}>
          <div className="space-y-8">
            {/* Static Content Sections */}
            {note.sections.map((section) => renderSection(section))}

            {/* Dynamic Content Sections (added by user) */}
            {dynamicSections.length > 0 && (
              <>
                <Separator className="bg-[#30363d]/60" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge
                      variant="outline"
                      className="text-[10px] border-violet-500/40 text-violet-400"
                    >
                      Dynamic Content
                    </Badge>
                    <span className="text-xs text-[#8b949e]">
                      {dynamicSections.length} section{dynamicSections.length !== 1 ? 's' : ''} added
                    </span>
                  </div>
                  <div className="space-y-6">
                    {dynamicSections.map((section) => renderSection(section, true))}
                  </div>
                </div>
              </>
            )}
          </div>
        </DissectionView>
      </div>
    );
  };

  // ─── Render view based on active panel ──────────────────────────────
  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeScreen />;

      case 'notes':
        if (mode === 'developer') {
          return (
            <div className="h-full flex gap-4">
              {/* Main content area */}
              <div className="flex-1 min-w-0 overflow-auto">
                <div className="max-w-5xl mx-auto">{renderNoteContent()}</div>
              </div>
              {/* Developer side panel */}
              <div className="w-96 flex-shrink-0 hidden lg:block">
                <div className="h-full rounded-2xl border border-[#30363d] overflow-hidden">
                  <DeveloperView initialContent={devHtmlContent} />
                </div>
              </div>
            </div>
          );
        }
        return renderNoteContent();

      case 'library':
        return <MedLibrary />;

      case 'connectome':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div />
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#8b949e] hover:text-[#f0a500] gap-1.5"
                onClick={() => setFullscreenView('connectome')}
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Fullscreen
              </Button>
            </div>
            <ConnectomeView
              centerNode={activeNote.id}
              links={activeNote.links.map((l) => ({
                source: activeNote.id,
                target: l.targetId,
                relation: l.relation,
                label: l.label,
              }))}
            />
          </div>
        );

      case 'mindmap':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div />
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#8b949e] hover:text-[#f0a500] gap-1.5"
                onClick={() => setFullscreenView('mindmap')}
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Fullscreen
              </Button>
            </div>
            <MindmapView markdown={mindmapMarkdown} />
          </div>
        );

      case 'ddx':
        return (
          <DDxSplitter
            leftTitle={activeNote.title}
            rightTitle="COPD Exacerbation"
            rows={activeNote.ddxComparison || []}
          />
        );

      case 'pdf-workspace':
        return (
          <div className="space-y-4">
            {!pdfFile ? (
              <div
                className={cn(
                  'flex flex-col items-center justify-center h-[60vh] rounded-2xl border-2 border-dashed transition-all duration-200',
                  pdfDragOver
                    ? 'border-[#f0a500] bg-[#f0a500]/5'
                    : 'border-[#30363d] hover:border-[#8b949e]/40'
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setPdfDragOver(true);
                }}
                onDragLeave={() => setPdfDragOver(false)}
                onDrop={handlePdfDrop}
              >
                <div className="text-center space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-[#1c2330] flex items-center justify-center">
                    <FileUp className="h-8 w-8 text-[#8b949e]/40" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#e6edf3]">
                      PDF-to-Synthesis Workspace
                    </h3>
                    <p className="text-xs text-[#8b949e]/60 mt-1">
                      Drop a PDF here or click to upload. Split-screen viewer with automatic
                      snippet extraction.
                    </p>
                  </div>
                  <label className="cursor-pointer">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#30363d] text-[#8b949e] hover:text-[#f0a500] hover:border-[#f0a500]/30 gap-2"
                      asChild
                    >
                      <span>
                        <Upload className="h-3.5 w-3.5" />
                        Choose PDF
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handlePdfFileInput}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#f0a500]/12 text-[#f0a500] border-[#f0a500]/20 text-[10px]">
                      PDF Loaded
                    </Badge>
                    <span className="text-xs text-[#8b949e] truncate max-w-[200px]">
                      {pdfFile.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-[#da3633] hover:text-[#da3633] hover:bg-[#da3633]/10 gap-1.5"
                    onClick={() => {
                      setPdfFile(null);
                      if (pdfIframeUrl) {
                        URL.revokeObjectURL(pdfIframeUrl);
                        setPdfIframeUrl(null);
                      }
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
                <div className="rounded-2xl border border-[#30363d] overflow-hidden bg-[#161b22]">
                  <iframe
                    src={pdfIframeUrl || ''}
                    className="w-full h-[70vh]"
                    title="PDF Viewer"
                  />
                </div>
              </div>
            )}
          </div>
        );

      default:
        return renderNoteContent();
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0d1117] text-[#e6edf3]">
      {/* ═════════════════════════════════════════════════════════════════
          HEADER — Notion-style: breadcrumb → mode → actions
          ═════════════════════════════════════════════════════════════════ */}
      <header className="flex items-center justify-between px-3 py-1.5 border-b border-[#30363d]/60 glass-strong z-10">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#8b949e] min-w-0">
            <span className="truncate">{activeNote?.category || 'Notes'}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-[#e6edf3] font-medium truncate max-w-[180px]">
              {activeNote?.title || 'Untitled'}
            </span>
          </div>
          <Separator orientation="vertical" className="h-5 bg-[#30363d] hidden sm:block" />
          <TriModeSwitcher />
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-0.5">
          {/* Search (Cmd+K) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2330] gap-1"
            onClick={() => setSearchOpen(true)}
            title="Search (⌘K)"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2330]"
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              title="Export"
            >
              <Download className="h-4 w-4" />
            </Button>
            <AnimatePresence>
              {exportDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#161b22]/95 backdrop-blur-xl border border-[#30363d] shadow-xl shadow-black/40 py-1 z-50"
                >
                  <button
                    className="w-full px-3 py-2 text-xs text-left text-[#e6edf3] hover:bg-[#1c2330] flex items-center gap-2"
                    onClick={() => handleExport('json')}
                  >
                    <FileText className="h-3.5 w-3.5 text-[#8b949e]" />
                    Export JSON
                  </button>
                  <button
                    className="w-full px-3 py-2 text-xs text-left text-[#e6edf3] hover:bg-[#1c2330] flex items-center gap-2"
                    onClick={() => handleExport('html')}
                  >
                    <FileText className="h-3.5 w-3.5 text-[#8b949e]" />
                    Export HTML
                  </button>
                  <button
                    className="w-full px-3 py-2 text-xs text-left text-[#e6edf3] hover:bg-[#1c2330] flex items-center gap-2"
                    onClick={handleExportPDF}
                  >
                    <FileText className="h-3.5 w-3.5 text-[#8b949e]" />
                    Export PDF
                  </button>
                  <button
                    className="w-full px-3 py-2 text-xs text-left text-[#e6edf3] hover:bg-[#1c2330] flex items-center gap-2"
                    onClick={handleExportAnki}
                  >
                    <FileText className="h-3.5 w-3.5 text-[#8b949e]" />
                    Export Anki
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dissection Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              dissectionMode
                ? 'text-[#f0a500] bg-[#f0a500]/10'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2330]'
            )}
            onClick={() => useNoteToolStore.getState().toggleDissection()}
            title="Dissect Note"
          >
            <Scissors className="h-4 w-4" />
          </Button>

          {/* DDx Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              activeView === 'ddx'
                ? 'text-rose-400 bg-rose-500/10'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2330]'
            )}
            onClick={() => setActiveView(activeView === 'ddx' ? 'notes' : 'ddx')}
            title="DDx Splitter"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-5 bg-[#30363d]" />

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2330]"
            onClick={() => setSettingsModalOpen(true)}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Account */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2330]"
            onClick={() => setAccountModalOpen(true)}
            title="Account"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════════
          MAIN CONTENT
          ═════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div
            className={cn(
              'max-w-5xl mx-auto p-6',
              mode === 'read' && 'max-w-4xl'
            )}
          >
            {/* View label for non-notes views */}
            {activeView !== 'home' && activeView !== 'notes' && activeView !== 'library' && (
              <div className="mb-4 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] border-[#f0a500]/30 text-[#f0a500]"
                >
                  {activeView === 'connectome'
                    ? 'Connectome View'
                    : activeView === 'ddx'
                      ? 'DDx Splitter'
                      : activeView === 'mindmap'
                        ? 'Mindmap View'
                        : activeView === 'pdf-workspace'
                          ? 'PDF Workspace'
                          : ''}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#8b949e] hover:text-[#f0a500]"
                  onClick={() => setActiveView('notes')}
                >
                  Back to Note
                </Button>
              </div>
            )}

            {renderView()}
          </div>
        </main>

        {/* ─── CONTENT TOOLBAR PANEL ────────────────────────────── */}
        <AnimatePresence>
          {contentToolbarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-l border-[#30363d]/60 bg-[#0d1117] overflow-y-auto overflow-hidden"
            >
              <div className="w-64 p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#f0a500]">Add Content</span>
                  <button
                    onClick={() => setContentToolbarOpen(false)}
                    className="h-5 w-5 rounded-md flex items-center justify-center text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2330]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <ContentToolbar />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── FLOATING "+ ADD CONTENT" BUTTON ──────────────────────────── */}
      {!contentToolbarOpen && (
        <button
          onClick={() => setContentToolbarOpen(true)}
          className="fixed bottom-16 right-6 z-40 h-10 w-10 rounded-full bg-[#f0a500] hover:bg-[#d4940a] text-[#0d1117] shadow-lg shadow-[#f0a500]/30 flex items-center justify-center transition-all hover:scale-105 fab-bounce-in"
          title="Add Content"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      {/* ─── STATUS BAR ──────────────────────────────────────────────── */}
      <StatusBar />

      {/* ─── MODALS ──────────────────────────────────────────────────── */}
      <SettingsModal />
      <NewNoteModal />
      <AccountModal />

      {/* ═════════════════════════════════════════════════════════════════
          COMMAND PALETTE (Cmd+K)
          ═════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {searchOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[9000] bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
            />

            {/* Palette */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[9001] w-full max-w-lg"
            >
              <div className="rounded-2xl bg-[#161b22]/90 backdrop-blur-2xl border border-[#30363d]/80 shadow-2xl shadow-black/60 overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[#30363d]/60">
                  <Search className="h-4 w-4 text-[#8b949e] shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchSelectedIndex(0);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search notes by title, specialty, or tags..."
                    className="flex-1 bg-transparent text-sm text-[#e6edf3] placeholder:text-[#8b949e]/50 outline-none"
                  />
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[10px] text-[#8b949e] font-mono">
                    <Command className="h-2.5 w-2.5" />K
                  </kbd>
                </div>

                {/* Results */}
                <div className="max-h-72 overflow-y-auto py-1 custom-scrollbar">
                  {filteredNotes.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <p className="text-xs text-[#8b949e]/60">No notes found</p>
                    </div>
                  )}
                  {filteredNotes.map((note, idx) => (
                    <button
                      key={note.id}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        idx === clampedIndex
                          ? 'bg-[#f0a500]/10 text-[#e6edf3]'
                          : 'text-[#8b949e] hover:bg-[#1c2330]'
                      )}
                      onClick={() => {
                        store.setActiveNoteId(note.id);
                        setActiveView('notes');
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      onMouseEnter={() => setSearchSelectedIndex(idx)}
                    >
                      <FileText className="h-4 w-4 shrink-0 opacity-50" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{note.title}</p>
                        <p className="text-[10px] text-[#8b949e]/60 truncate">
                          {note.specialty} · {note.category}
                        </p>
                      </div>
                      {note.tags.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1">
                          {note.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#30363d]/50 text-[#8b949e]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-[#30363d]/40 text-[10px] text-[#8b949e]/50">
                  <span>
                    {filteredNotes.length} result{filteredNotes.length !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      ↑↓ Navigate
                    </span>
                    <span>↵ Open</span>
                    <span>Esc Close</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════════
          FULLSCREEN VIEW OVERLAY
          ═════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {fullscreenView !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[#0d1117] flex flex-col"
          >
            {/* Fullscreen Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d]/60">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-[#f0a500]/30 text-[#f0a500]">
                  {fullscreenView === 'connectome'
                    ? 'Connectome'
                    : fullscreenView === 'mindmap'
                      ? 'Mindmap'
                      : fullscreenView === 'mermaid'
                        ? 'Flowchart'
                        : ''}
                </Badge>
                <span className="text-xs text-[#8b949e]">Fullscreen</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#8b949e] hover:text-[#e6edf3] gap-1.5"
                onClick={() => setFullscreenView('none')}
              >
                <Minimize2 className="h-3.5 w-3.5" />
                Exit Fullscreen
              </Button>
            </div>

            {/* Fullscreen Content */}
            <div className="flex-1 overflow-auto p-6">
              {fullscreenView === 'connectome' && (
                <ConnectomeView
                  centerNode={activeNote.id}
                  links={activeNote.links.map((l) => ({
                    source: activeNote.id,
                    target: l.targetId,
                    relation: l.relation,
                    label: l.label,
                  }))}
                />
              )}
              {fullscreenView === 'mindmap' && <MindmapView markdown={mindmapMarkdown} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════════
          GLOBAL ANNOTATION OVERLAY — fixed, on top of everything
          ═════════════════════════════════════════════════════════════════ */}
      <GlobalAnnotationOverlay />
    </div>
  );
}
