'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useNoteToolStore, type NoteData, type NoteSection } from '@/stores/notetool-store';
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
  Sun,
  Moon,
  Pencil,
  Check,
  Code2,
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
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
    updateSettings,
    globalPenActive,
    setGlobalPenActive,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    fullscreenView,
    setFullscreenView,
    fullscreenMermaidCode,
    pdfFile,
    setPdfFile,
    removeSectionFromNote,
    updateSectionInNote,
    updateNote,
    setMode,
  } = store;

  const isDark = settings.theme === 'dark';

  // ─── Seed demo notes on first load ---
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    // Deduplicate existing notes if any (fallback for legacy duplicates)
    const uniqueNotes = notes.filter((n, i) => notes.findIndex(m => m.id === n.id) === i);
    if (uniqueNotes.length !== notes.length) {
      // We found duplicates, let's clean them up (this is a bit hacky but safe)
      // Since we can't easily bulk update, we just rely on addNote's new filter logic
      // if we were to re-seed, but here we just need to wait for seeded check.
    }

    if (!seeded && notes.length === 0) {
      DEMO_NOTES.forEach((n) => addNote(n));
      queueMicrotask(() => setSeeded(true));
    }
  }, [seeded, notes, addNote]);

  // ─── When switching to annotate mode, activate global pen ---
  useEffect(() => {
    if (mode === 'annotate') {
      setGlobalPenActive(true);
    }
  }, [mode, setGlobalPenActive]);

  // ─── Get the active note ---
  const activeNote = notes.find((n) => n.id === activeNoteId) || acuteHeartFailureNote;

  // ─── Export logic ---
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
      content = `<!DOCTYPE html><html><head><title>${note.title}</title><style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:0 20px;color:var(--color-sb-text);background:var(--color-sb-bg);}h1{font-family:Georgia,serif;}h2{color:var(--color-sb-accent);}</style></head><body><h1>${note.title}</h1><p><em>${note.specialty}</em></p>${sectionsHtml}</body></html>`;
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

  // ─── Export PDF — capture live rendered DOM ---
  const handleExportPDF = async () => {
    const note = activeNote;
    if (!note) return;
    const bgColor = isDark ? 'var(--color-sb-bg)' : '#f3f0eb';
    // Capture the live rendered DOM — includes all section types
    const printRoot = document.getElementById('note-print-root') ?? document.body;
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(printRoot, {
        backgroundColor: bgColor,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      let yPos = 0;
      let remaining = imgH;
      let first = true;
      while (remaining > 0) {
        if (!first) pdf.addPage();
        first = false;
        const sliceH = Math.min(remaining, pageH);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.round((sliceH * canvas.width) / pageW);
        const ctx = sliceCanvas.getContext('2d');
        ctx?.drawImage(canvas, 0, Math.round((yPos * canvas.width) / pageW), canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
        pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageW, sliceH);
        yPos += sliceH;
        remaining -= sliceH;
      }
      pdf.save(`${note.id}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    }
    setExportDropdownOpen(false);
  };

  // ─── Export Anki ---
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

  // ─── Command Palette (Cmd+K) ---
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

  // ─── PDF Workspace ---
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

  // ─── Mindmap markdown — dynamically from active note ---
  const mindmapMarkdown = activeNote
    ? `# ${activeNote.title}\n` +
      activeNote.sections.map((s) => `## ${s.title}`).join('\n')
    : '# No note selected';

  // ─── Developer view raw content ---
  const devHtmlContent = `<div class="note-section">
  <h2 style="color: var(--color-sb-accent); border-bottom: 2px solid var(--color-sb-accent); padding-bottom: 8px;">
    Acute Heart Failure — Custom Interactive View
  </h2>
  <div style="background: var(--color-sb-surface2); padding: 16px; border-radius: 12px; margin: 12px 0;">
    <p style="color: var(--color-sb-muted);">This is the <strong style="color: var(--color-sb-accent);">Developer/Edit Mode</strong>.</p>
    <p style="color: var(--color-sb-muted);">Edit the HTML/JS on the left panel → see live preview on the right.</p>
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
    <tr style="background: var(--color-sb-surface3);">
      <th style="padding: 8px; text-align: left; color: var(--color-sb-accent); border: 1px solid var(--color-sb-border);">Parameter</th>
      <th style="padding: 8px; text-align: left; color: var(--color-sb-accent); border: 1px solid var(--color-sb-border);">Value</th>
    </tr>
    <tr>
      <td style="padding: 8px; color: var(--color-sb-muted); border: 1px solid var(--color-sb-border);">Killip Class</td>
      <td style="padding: 8px; color: var(--color-sb-accent); border: 1px solid var(--color-sb-border);">II</td>
    </tr>
    <tr style="background: var(--color-sb-surface2);">
      <td style="padding: 8px; color: var(--color-sb-muted); border: 1px solid var(--color-sb-border);">BNP</td>
      <td style="padding: 8px; color: var(--color-sb-accent); border: 1px solid var(--color-sb-border);">820 pg/mL</td>
    </tr>
  </table>
</div>`;

  // ─── Inline editing state ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditingText(content);
  };

  const saveEdit = (sectionId: string) => {
    updateSectionInNote(activeNoteId, sectionId, editingText);
    setEditingId(null);
  };

  // ─── Render a section ---
  const renderSection = (
    section: { id: string; title?: string; type: string; content: unknown; dynamic?: boolean }
  ) => {
    const isRemovable = section.dynamic === true;
    switch (section.type) {
      case 'content':
        return (
          <div key={section.id} className="space-y-2 relative group">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-sb-text)' }}>
              <div className="w-1 h-5 rounded-full" style={{ background: 'var(--color-sb-accent)' }} />
              {section.title}
            </h2>
            {editingId === section.id ? (
              <div className="pl-3 space-y-2">
                <textarea
                  autoFocus
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border p-3 font-mono text-xs resize-y"
                  style={{ background: 'var(--color-sb-surface2)', borderColor: 'var(--color-sb-border)', color: 'var(--color-sb-text)' }}
                />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(section.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-sb-accent)', color: isDark ? 'var(--color-sb-bg)' : '#fff' }}>
                    <Check className="h-3 w-3" />Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-sb-surface2)', color: 'var(--color-sb-muted)' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div
                className="pl-3 prose prose-sm max-w-none"
                style={{ fontSize: `${settings.fontSize}px`, color: 'var(--color-sb-text)' }}
              >
                <ReactMarkdown>{typeof section.content === 'string' ? section.content : ''}</ReactMarkdown>
              </div>
            )}
            <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {mode !== 'read' && editingId !== section.id && (
                <button onClick={() => startEdit(section.id, typeof section.content === 'string' ? section.content : '')} className="p-1 rounded-md" style={{ background: 'var(--color-sb-accent-dim)', color: 'var(--color-sb-accent)' }} title="Edit section"><Pencil className="h-3.5 w-3.5" /></button>
              )}
              {isRemovable && (
                <button onClick={() => removeSectionFromNote(activeNoteId, section.id)} className="p-1 rounded-md" style={{ background: 'var(--color-sb-wrong-bg)', color: 'var(--color-sb-wrong)' }} title="Remove section"><X className="h-3.5 w-3.5" /></button>
              )}
            </div>
          </div>
        );

      case 'algorithm':
      case 'mermaid':
        return (
          <div key={section.id} className="space-y-2 relative group">
            {section.title && (
              <h2 className="text-lg font-bold text-sb-text flex items-center gap-2">
                <div className="w-1 h-5 bg-sb-accent rounded-full" />
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
            {isRemovable && (
              <button onClick={() => removeSectionFromNote(activeNoteId, section.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md z-10" style={{ background: 'var(--color-sb-wrong-bg)', color: 'var(--color-sb-wrong)' }} title="Remove section"><X className="h-3.5 w-3.5" /></button>
            )}
          </div>
        );

      case 'tabs':
        return (
          <div key={section.id} className="space-y-2 relative group">
            <h2 className="text-lg font-bold text-sb-text flex items-center gap-2">
              <div className="w-1 h-5 bg-sb-accent rounded-full" />
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
            {isRemovable && (
              <button onClick={() => removeSectionFromNote(activeNoteId, section.id)} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md" style={{ background: 'var(--color-sb-wrong-bg)', color: 'var(--color-sb-wrong)' }} title="Remove section"><X className="h-3.5 w-3.5" /></button>
            )}
          </div>
        );

      case 'mcq':
        return (
          <div key={section.id} className="space-y-3 relative group">
            {section.title && (
              <h2 className="text-lg font-bold text-sb-text flex items-center gap-2">
                <div className="w-1 h-5 bg-sb-accent rounded-full" />
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
            {isRemovable && (
              <button onClick={() => removeSectionFromNote(activeNoteId, section.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md z-10" style={{ background: 'var(--color-sb-wrong-bg)', color: 'var(--color-sb-wrong)' }} title="Remove section"><X className="h-3.5 w-3.5" /></button>
            )}
          </div>
        );

      case 'flashcard':
        return (
          <div key={section.id} className="space-y-3 relative group">
            {section.title && (
              <h2 className="text-lg font-bold text-sb-text flex items-center gap-2">
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
            {isRemovable && (
              <button onClick={() => removeSectionFromNote(activeNoteId, section.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md z-10" style={{ background: 'var(--color-sb-wrong-bg)', color: 'var(--color-sb-wrong)' }} title="Remove section"><X className="h-3.5 w-3.5" /></button>
            )}
          </div>
        );

      case 'asset':
        return (
          <div key={section.id} className="space-y-2 relative group">
            <h2 className="text-lg font-bold text-sb-text flex items-center gap-2">
              <div className="w-1 h-5 bg-sb-accent rounded-full" />
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
            {isRemovable && (
              <button onClick={() => removeSectionFromNote(activeNoteId, section.id)} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md" style={{ background: 'var(--color-sb-wrong-bg)', color: 'var(--color-sb-wrong)' }} title="Remove section"><X className="h-3.5 w-3.5" /></button>
            )}
          </div>
        );

      case 'pdf-embed': {
        const pdf = section.content as { dataUrl: string; filename: string };
        return (
          <div key={section.id} className="space-y-2 relative group">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-sb-text)' }}>
              <div className="w-1 h-5 rounded-full bg-orange-500" />
              {section.title || pdf.filename}
            </h2>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-sb-border)' }}>
              <div className="flex items-center justify-between px-3 py-2" style={{ background: 'var(--color-sb-surface)' }}>
                <span className="text-xs" style={{ color: 'var(--color-sb-muted)' }}>{pdf.filename}</span>
                <a href={pdf.dataUrl} download={pdf.filename} className="text-xs" style={{ color: 'var(--color-sb-accent)' }}>↓ Download</a>
              </div>
              <embed src={pdf.dataUrl} type="application/pdf" className="w-full" style={{ height: '60vh' }} />
            </div>
            {isRemovable && (
              <button onClick={() => removeSectionFromNote(activeNoteId, section.id)} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md" style={{ background: 'var(--color-sb-wrong-bg)', color: 'var(--color-sb-wrong)' }} title="Remove"><X className="h-3.5 w-3.5" /></button>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ─── Render the note content ---
  const renderNoteContent = () => {
    const note = activeNote;
    if (!note) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <FileText className="h-12 w-12 text-sb-muted/20 mx-auto" />
            <p className="text-sm text-sb-muted">No note selected</p>
            <Button
              onClick={() => setNewNoteModalOpen(true)}
              className="bg-sb-accent hover:bg-[#d4940a] text-sb-bg rounded-xl"
            >
              Create New Synthesis
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 relative">
        <GlobalAnnotationOverlay />
        {/* ─── Note Header --- */}
        <div className="space-y-4">
          {/* Big serif title */}
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-sb-text serif-title leading-tight">
                {note.title}
              </h1>
              <p className="text-sm text-sb-muted mt-1">{note.summary}</p>
            </div>
          </div>

          {/* Breadcrumb-style badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-sb-accent/12 text-sb-accent border-sb-accent/20 text-[10px]">
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
            <Badge variant="outline" className="text-[10px] border-sb-border text-sb-muted font-mono">
              ID: {note.id}
            </Badge>
            {/* Note actions */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => duplicateNote(note.id)}
                className="h-6 w-6 rounded-md flex items-center justify-center text-sb-muted hover:text-sb-accent hover:bg-sb-surface2 transition-colors"
                title="Duplicate note"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={() => deleteNote(note.id)}
                className="h-6 w-6 rounded-md flex items-center justify-center text-sb-muted hover:text-sb-wrong hover:bg-sb-wrong/10 transition-colors"
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

        <Separator className="bg-sb-border/60" />

        {/* ─── Dissection View wrapper --- */}
        <DissectionView highYieldSummary={note.highYieldSummary}>
          <div className="space-y-8" id="note-print-root">
            {note.sections.map((section) => renderSection(section))}
          </div>
        </DissectionView>
      </div>
    );
  };

  // ─── Render view based on active panel ---
  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeScreen />;

      case 'notes':
        if (mode === 'developer') {
          return (
            <>
              {/* Normal note content in background */}
              {renderNoteContent()}
              
              {/* Full-screen Developer Overlay */}
              <div className="fixed inset-0 z-[100] bg-sb-bg flex flex-col p-4 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                       <Code2 className="h-5 w-5 text-sb-accent" />
                       <h2 className="text-lg font-bold text-sb-text">Developer Workspace</h2>
                     </div>
                     <Separator orientation="vertical" className="h-6 bg-sb-border" />
                     <TriModeSwitcher />
                   </div>
                   <div className="flex items-center gap-3">
                     <span className="text-xs text-sb-muted font-medium truncate max-w-[200px] hidden sm:block">
                       Editing: {activeNote.title}
                     </span>
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={() => setMode('read')}
                       className="text-sb-muted hover:text-sb-text gap-2"
                     >
                       <X className="h-4 w-4" />
                       Close
                     </Button>
                   </div>
                </div>
                <div className="flex-1 rounded-2xl border border-sb-border overflow-hidden bg-sb-surface shadow-2xl">
                  <DeveloperView 
                    sections={activeNote.sections.filter(s => s.type !== 'asset' && s.type !== 'pdf-embed')}
                    initialContent={(() => {
                      // Serialize metadata as YAML-like frontmatter
                      const metadata = [
                        '---',
                        `id: ${activeNote.id}`,
                        `title: ${activeNote.title}`,
                        `folder: ${activeNote.folder || ''}`,
                        `specialty: ${activeNote.specialty || ''}`,
                        `summary: ${activeNote.summary || ''}`,
                        `category: ${activeNote.category || ''}`,
                        '---',
                        ''
                      ].join('\n');

                      // Serialize only content/tabs/mermaid sections for editing
                      const sectionsMarkdown = activeNote.sections
                        .filter(s => s.type !== 'asset' && s.type !== 'pdf-embed')
                        .map(s => {
                          let inner = '';
                          if (s.type === 'content') inner = s.content as string;
                          else if (s.type === 'tabs') {
                            const data = s.content as { tabs: { label: string, content: string }[] };
                            inner = (data?.tabs || []).map(t => `### Tab: ${t.label}\n${t.content}`).join('\n\n');
                          } else if (s.type === 'mermaid' || s.type === 'algorithm') {
                            const data = s.content as { code: string };
                            inner = `\`\`\`mermaid\n${data?.code || ''}\n\`\`\``;
                          } else if (s.type === 'mcq') {
                            inner = JSON.stringify(s.content, null, 2);
                          } else {
                            inner = typeof s.content === 'string' ? s.content : JSON.stringify(s.content, null, 2);
                          }
                          return `## [${s.type}] ${s.title}\n${inner}`;
                        }).join('\n\n<!-- section-break -->\n\n');

                      return metadata + sectionsMarkdown;
                    })()} 
                    onContentChange={(newMarkdown) => {
                       // Parse metadata
                       const frontmatterMatch = newMarkdown.match(/^---\n([\s\S]*?)\n---\n/);
                       let metaUpdates: any = {};
                       let contentBody = newMarkdown;

                       if (frontmatterMatch) {
                         contentBody = newMarkdown.replace(frontmatterMatch[0], '');
                         const metaLines = frontmatterMatch[1].split('\n');
                         metaLines.forEach(line => {
                           const [key, ...val] = line.split(':');
                           if (key && val) metaUpdates[key.trim()] = val.join(':').trim();
                         });
                       }

                       // Parse the markdown back into sections
                       const sectionBlocks = contentBody.split('\n\n<!-- section-break -->\n\n');
                       const updatedSections: NoteSection[] = sectionBlocks.map((block, idx) => {
                         const lines = block.split('\n');
                         const headerLine = lines.find(l => l.startsWith('## [')) || '';
                         const typeMatch = headerLine.match(/## \[(.*)\] (.*)/);
                         
                         const type = typeMatch ? typeMatch[1] : 'content';
                         const title = typeMatch ? typeMatch[2] : 'Untitled Section';
                         
                         const headerIdx = lines.indexOf(headerLine);
                         let rawContent = lines.slice(headerIdx + 1).join('\n').trim();
                         
                         let finalContent: any = rawContent;
                         
                         if (type === 'tabs') {
                           // Robust Tab Parsing
                           const tabs: { id: string, label: string, content: string }[] = [];
                           const tabRegex = /### Tab:\s*(.*)\n([\s\S]*?)(?=\n### Tab:|$)/g;
                           let m;
                           while ((m = tabRegex.exec(rawContent)) !== null) {
                             tabs.push({ id: `tab-${tabs.length}`, label: m[1].trim(), content: m[2].trim() });
                           }
                           if (tabs.length === 0 && rawContent.trim()) {
                             tabs.push({ id: `tab-0`, label: 'General', content: rawContent.trim() });
                           }
                           finalContent = { tabs };
                         } else if (type === 'mermaid' || type === 'algorithm') {
                           const codeMatch = rawContent.match(/```mermaid\n([\s\S]*?)\n```/);
                           finalContent = { code: codeMatch ? codeMatch[1].trim() : rawContent, title };
                         } else if (type === 'mcq') {
                           try { finalContent = JSON.parse(rawContent); } catch(e) { finalContent = rawContent; }
                         }
                         
                         return {
                           id: activeNote.sections.filter(s => s.type !== 'asset' && s.type !== 'pdf-embed')[idx]?.id || `sec-${Date.now()}-${idx}`,
                           title,
                           type,
                           content: finalContent
                         } as NoteSection;
                       });
                       
                       // Merge back the sections that weren't editable (assets/pdfs)
                       const nonEditableSections = activeNote.sections.filter(s => s.type === 'asset' || s.type === 'pdf-embed');
                       updateNote(activeNote.id, { 
                         ...metaUpdates,
                         sections: [...updatedSections, ...nonEditableSections] 
                       });
                    }}
                  />
                </div>
              </div>
            </>
          );
        }
        return renderNoteContent();

      case 'library':
        return <MedLibrary />;

      case 'connectome':
        return (
          <ConnectomeView
            centerNode={activeNote.id}
            links={activeNote.links.map((l) => ({
              source: activeNote.id,
              target: l.targetId,
              relation: l.relation,
              label: l.label,
            }))}
          />
        );

      case 'mindmap':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div />
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-sb-muted hover:text-sb-accent gap-1.5"
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
                    ? 'border-sb-accent bg-sb-accent/5'
                    : 'border-sb-border hover:border-sb-muted/40'
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setPdfDragOver(true);
                }}
                onDragLeave={() => setPdfDragOver(false)}
                onDrop={handlePdfDrop}
              >
                <div className="text-center space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-sb-surface2 flex items-center justify-center">
                    <FileUp className="h-8 w-8 text-sb-muted/40" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-sb-text">
                      PDF-to-Synthesis Workspace
                    </h3>
                    <p className="text-xs text-sb-muted/60 mt-1">
                      Drop a PDF here or click to upload. Split-screen viewer with automatic
                      snippet extraction.
                    </p>
                  </div>
                  <label className="cursor-pointer">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-sb-border text-sb-muted hover:text-sb-accent hover:border-sb-accent/30 gap-2"
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
                    <Badge className="bg-sb-accent/12 text-sb-accent border-sb-accent/20 text-[10px]">
                      PDF Loaded
                    </Badge>
                    <span className="text-xs text-sb-muted truncate max-w-[200px]">
                      {pdfFile.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-sb-wrong hover:text-sb-wrong hover:bg-sb-wrong/10 gap-1.5"
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
                <div className="rounded-2xl border border-sb-border overflow-hidden bg-sb-surface">
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
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--color-sb-bg)', color: 'var(--color-sb-text)' }}>
      {/* ---
          HEADER — Notion-style: breadcrumb → mode → actions
          --- */}
      <header className="flex items-center justify-between px-3 py-1.5 border-b border-sb-border/60 glass-strong z-10">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-sb-muted min-w-0">
            <span className="truncate">{activeNote?.category || 'Notes'}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-sb-text font-medium truncate max-w-[180px]">
              {activeNote?.title || 'Untitled'}
            </span>
          </div>
          <Separator orientation="vertical" className="h-5 bg-sb-border hidden sm:block" />
          <TriModeSwitcher />
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-0.5">
          {/* Search (Cmd+K) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sb-muted hover:text-sb-text hover:bg-sb-surface2 gap-1"
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
              className="h-8 w-8 text-sb-muted hover:text-sb-text hover:bg-sb-surface2"
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
                  className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-sb-surface/95 backdrop-blur-xl border border-sb-border shadow-xl shadow-black/40 py-1 z-50"
                >
                  <button
                    className="w-full px-3 py-2 text-xs text-left text-sb-text hover:bg-sb-surface2 flex items-center gap-2"
                    onClick={() => handleExport('json')}
                  >
                    <FileText className="h-3.5 w-3.5 text-sb-muted" />
                    Export JSON
                  </button>
                  <button
                    className="w-full px-3 py-2 text-xs text-left text-sb-text hover:bg-sb-surface2 flex items-center gap-2"
                    onClick={() => handleExport('html')}
                  >
                    <FileText className="h-3.5 w-3.5 text-sb-muted" />
                    Export HTML
                  </button>
                  <button
                    className="w-full px-3 py-2 text-xs text-left text-sb-text hover:bg-sb-surface2 flex items-center gap-2"
                    onClick={handleExportPDF}
                  >
                    <FileText className="h-3.5 w-3.5 text-sb-muted" />
                    Export PDF
                  </button>
                  <button
                    className="w-full px-3 py-2 text-xs text-left text-sb-text hover:bg-sb-surface2 flex items-center gap-2"
                    onClick={handleExportAnki}
                  >
                    <FileText className="h-3.5 w-3.5 text-sb-muted" />
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
                ? 'text-sb-accent bg-sb-accent/10'
                : 'text-sb-muted hover:text-sb-text hover:bg-sb-surface2'
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
                : 'text-sb-muted hover:text-sb-text hover:bg-sb-surface2'
            )}
            onClick={() => setActiveView(activeView === 'ddx' ? 'notes' : 'ddx')}
            title="DDx Splitter"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-5 bg-sb-border" />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            style={{ color: 'var(--color-sb-muted)' }}
            onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sb-muted hover:text-sb-text hover:bg-sb-surface2"
            onClick={() => setSettingsModalOpen(true)}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Account */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sb-muted hover:text-sb-text hover:bg-sb-surface2"
            onClick={() => setAccountModalOpen(true)}
            title="Account"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ---
          MAIN CONTENT
          --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <main className="flex-1 overflow-auto" id="note-scroll-container">
              <div className="relative min-h-full">
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
                  className="text-[10px] border-sb-accent/30 text-sb-accent"
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
                  className="text-xs text-sb-muted hover:text-sb-accent"
                  onClick={() => setActiveView('notes')}
                >
                  Back to Note
                </Button>
              </div>
            )}

              {renderView()}
            </div>
          </div>
        </main>
      </ContextMenuTrigger>
          <ContextMenuContent
            style={{ background: 'var(--color-sb-surface)', borderColor: 'var(--color-sb-border)', color: 'var(--color-sb-text)' }}
            className="w-52 rounded-xl shadow-xl border text-xs"
          >
            <ContextMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => navigator.clipboard.writeText(activeNote?.title ?? '')}
            >
              <Copy className="h-3.5 w-3.5" style={{ color: 'var(--color-sb-muted)' }} />
              Copy Note Title
            </ContextMenuItem>
            <ContextMenuItem className="gap-2 cursor-pointer" onClick={() => activeNote && duplicateNote(activeNote.id)}>
              <FileText className="h-3.5 w-3.5" style={{ color: 'var(--color-sb-muted)' }} />
              Duplicate Note
            </ContextMenuItem>
            <ContextMenuSeparator style={{ background: 'var(--color-sb-border)' }} />
            <ContextMenuItem className="gap-2 cursor-pointer" onClick={() => handleExport('html')}>
              <Download className="h-3.5 w-3.5" style={{ color: 'var(--color-sb-muted)' }} />
              Export HTML
            </ContextMenuItem>
            <ContextMenuItem className="gap-2 cursor-pointer" onClick={handleExportPDF}>
              <Download className="h-3.5 w-3.5" style={{ color: 'var(--color-sb-muted)' }} />
              Export PDF
            </ContextMenuItem>
            <ContextMenuSeparator style={{ background: 'var(--color-sb-border)' }} />
            <ContextMenuItem className="gap-2 cursor-pointer" onClick={() => useNoteToolStore.getState().toggleDissection()}>
              <Scissors className="h-3.5 w-3.5" style={{ color: 'var(--color-sb-muted)' }} />
              Toggle Dissection
            </ContextMenuItem>
            <ContextMenuItem className="gap-2 cursor-pointer" onClick={() => setActiveView('ddx')}>
              <ArrowLeftRight className="h-3.5 w-3.5" style={{ color: 'var(--color-sb-muted)' }} />
              Open in DDx
            </ContextMenuItem>
            <ContextMenuSeparator style={{ background: 'var(--color-sb-border)' }} />
            <ContextMenuItem
              className="gap-2 cursor-pointer"
              style={{ color: 'var(--color-sb-wrong)' }}
              onClick={() => activeNote && deleteNote(activeNote.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Note
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* ─── CONTENT TOOLBAR PANEL --- */}
        <AnimatePresence>
          {contentToolbarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-l border-sb-border/60 bg-sb-bg overflow-y-auto overflow-hidden"
            >
              <div className="w-64 p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-sb-accent">Add Content</span>
                  <button
                    onClick={() => setContentToolbarOpen(false)}
                    className="h-5 w-5 rounded-md flex items-center justify-center text-sb-muted hover:text-sb-text hover:bg-sb-surface2"
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

      {/* ─── FLOATING "+ ADD CONTENT" BUTTON --- */}
      {!contentToolbarOpen && (
        <button
          onClick={() => setContentToolbarOpen(true)}
          className="fixed bottom-16 right-6 z-40 h-10 w-10 rounded-full bg-sb-accent hover:bg-[#d4940a] text-sb-bg shadow-lg shadow-[var(--color-sb-accent)]/30 flex items-center justify-center transition-all hover:scale-105 fab-bounce-in"
          title="Add Content"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      {/* ─── STATUS BAR --- */}
      <StatusBar />

      {/* ─── MODALS --- */}
      <SettingsModal />
      <NewNoteModal />
      <AccountModal />

      {/* ---
          COMMAND PALETTE (Cmd+K)
          --- */}
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
              <div className="rounded-2xl bg-sb-surface/90 backdrop-blur-2xl border border-sb-border/80 shadow-2xl shadow-black/60 overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-sb-border/60">
                  <Search className="h-4 w-4 text-sb-muted shrink-0" />
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
                    className="flex-1 bg-transparent text-sm text-sb-text placeholder:text-sb-muted/50 outline-none"
                  />
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sb-bg border border-sb-border text-[10px] text-sb-muted font-mono">
                    <Command className="h-2.5 w-2.5" />K
                  </kbd>
                </div>

                {/* Results */}
                <div className="max-h-72 overflow-y-auto py-1 custom-scrollbar">
                  {filteredNotes.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <p className="text-xs text-sb-muted/60">No notes found</p>
                    </div>
                  )}
                  {filteredNotes.map((note, idx) => (
                    <button
                      key={note.id}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        idx === clampedIndex
                          ? 'bg-sb-accent/10 text-sb-text'
                          : 'text-sb-muted hover:bg-sb-surface2'
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
                        <p className="text-[10px] text-sb-muted/60 truncate">
                          {note.specialty} · {note.category}
                        </p>
                      </div>
                      {note.tags.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1">
                          {note.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] px-1.5 py-0.5 rounded-full bg-sb-border/50 text-sb-muted"
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
                <div className="flex items-center justify-between px-4 py-2 border-t border-sb-border/40 text-[10px] text-sb-muted/50">
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

      {/* ---
          FULLSCREEN VIEW OVERLAY
          --- */}
      <AnimatePresence>
        {fullscreenView !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-sb-bg flex flex-col"
          >
            {/* Fullscreen Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-sb-border/60">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-sb-accent/30 text-sb-accent">
                  {fullscreenView === 'connectome'
                    ? 'Connectome'
                    : fullscreenView === 'mindmap'
                      ? 'Mindmap'
                      : fullscreenView === 'mermaid'
                        ? 'Flowchart'
                        : ''}
                </Badge>
                <span className="text-xs text-sb-muted">Fullscreen</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-sb-muted hover:text-sb-text gap-1.5"
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
              {fullscreenView === 'mermaid' && fullscreenMermaidCode && (
                <MermaidDiagram 
                  id="fullscreen-mermaid" 
                  title="Fullscreen Diagram" 
                  code={fullscreenMermaidCode} 
                  isFullScreen={true}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Annotation Overlay — Moved inside main scroll container in executions below */}
    </div>
  );
}
