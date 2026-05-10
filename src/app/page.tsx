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
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { MarkdownRenderer } from '@/components/notetool/MarkdownRenderer';
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

  // ─── Resolve CSS variable to actual color value ---
  const resolveColor = (cssVar: string, fallback: string): string => {
    if (typeof window === 'undefined') return fallback;
    try {
      const el = document.documentElement;
      const computed = getComputedStyle(el).getPropertyValue(cssVar.replace(/^var\(--/, '').replace(/\)$/, ''));
      return computed.trim() || fallback;
    } catch {
      return fallback;
    }
  };

  // ─── Simple markdown-to-HTML converter for export ---
  const mdToHtml = (md: string): string => {
    // ── GFM pipe-table parser (must run BEFORE other replacements) ──
    const convertTables = (text: string): string => {
      const tableRegex = /(^|\n)(\|[^\n]+\|\n\|[\s:|-]+\|\n(?:\|[^\n]+\|\n)*)/g;
      return text.replace(tableRegex, (_match, prefix: string, tableBlock: string) => {
        const rows = tableBlock.trim().split('\n');
        if (rows.length < 2) return _match;

        const parseCells = (row: string) =>
          row.split('|').slice(1, -1).map(c => c.trim());

        const headerCells = parseCells(rows[0]);
        const sepCells = parseCells(rows[1]);
        const alignments = sepCells.map(cell => {
          const c = cell.trim();
          if (c.startsWith(':') && c.endsWith(':')) return 'center';
          if (c.endsWith(':')) return 'right';
          return 'left';
        });

        let html = '<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:0.9em;">';
        html += '<thead><tr style="background:rgba(240,165,0,0.12);border-bottom:2px solid rgba(240,165,0,0.4);">';
        headerCells.forEach((cell, i) => {
          const a = alignments[i] || 'left';
          html += `<th style="padding:8px 12px;text-align:${a};font-weight:600;font-size:0.85em;text-transform:uppercase;letter-spacing:0.05em;color:#f0a500;">${cell}</th>`;
        });
        html += '</tr></thead>';

        if (rows.length > 2) {
          html += '<tbody>';
          for (let r = 2; r < rows.length; r++) {
            const cells = parseCells(rows[r]);
            const bg = r % 2 === 0 ? 'rgba(28,35,48,0.5)' : 'transparent';
            html += `<tr style="border-bottom:1px solid rgba(48,54,61,0.6);background:${bg};">`;
            cells.forEach((cell, i) => {
              const a = alignments[i] || 'left';
              html += `<td style="padding:8px 12px;text-align:${a};">${cell}</td>`;
            });
            html += '</tr>';
          }
          html += '</tbody>';
        }
        html += '</table>';
        return prefix + html;
      });
    };

    const withTables = convertTables(md);

    return withTables
      // Code blocks (fenced) — preserve mermaid blocks for special handling
      .replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
        if (lang === 'mermaid') {
          return `<div class="mermaid-inline">${code.trim()}</div>`;
        }
        return `<pre><code class="lang-${lang}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
      })
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Headings
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Unordered lists
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Line breaks → paragraphs (wrap loose text)
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  };

  // ─── Check if any section contains mermaid diagrams ---
  const hasMermaidSections = (sections: NoteSection[]): boolean => {
    return sections.some(s => s.type === 'mermaid' || s.type === 'algorithm');
  };

  // ─── Check if any section contains images ---
  const hasImageSections = (sections: NoteSection[]): boolean => {
    return sections.some(s => {
      if (s.type === 'asset') {
        const asset = s.content as { type?: string } | null;
        return asset?.type === 'image';
      }
      return false;
    });
  };

  // ─── Render section content to HTML for export ---
  const sectionToExportHtml = (section: NoteSection): string => {
    const accent = isDark ? '#f0a500' : '#c27803';
    const muted = isDark ? '#8b949e' : '#78716c';
    const border = isDark ? '#30363d' : '#d0ccc5';
    const surface2 = isDark ? '#1c2330' : '#f8f6f1';

    switch (section.type) {
      case 'content': {
        const body = typeof section.content === 'string' ? mdToHtml(section.content) : '';
        return `<section class="note-section">
          <h2><span class="accent-bar"></span>${section.title || ''}</h2>
          <div class="prose-body">${body}</div>
        </section>`;
      }
      case 'mermaid':
      case 'algorithm': {
        const mermaidContent = section.content as { id?: string; title?: string; code?: string };
        const code = mermaidContent?.code || '';
        const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // Render as a mermaid div — Mermaid.js CDN will render it when the page opens
        return `<section class="note-section">
          ${section.title ? `<h2><span class="accent-bar"></span>${section.title}</h2>` : ''}
          <div class="mermaid-diagram-block">
            <div class="mermaid-diagram-label">Diagram: ${mermaidContent?.title || 'Flowchart'}</div>
            <div class="mermaid">${escapedCode}</div>
            <noscript>
              <pre class="mermaid-code-fallback">${escapedCode}</pre>
            </noscript>
          </div>
        </section>`;
      }
      case 'mcq': {
        const mcq = section.content as { question?: string; options?: string[]; correctIndex?: number; explanation?: string };
        const opts = (mcq.options || []).map((opt, i) =>
          `<li class="${i === mcq.correctIndex ? 'correct-option' : ''}">${String.fromCharCode(65 + i)}) ${opt}</li>`
        ).join('');
        return `<section class="note-section">
          ${section.title ? `<h2><span class="accent-bar accent-violet"></span>${section.title}</h2>` : ''}
          <div class="mcq-block">
            <p class="mcq-question">${mcq.question || ''}</p>
            <ul class="mcq-options">${opts}</ul>
            ${mcq.explanation ? `<div class="mcq-explanation"><strong>Explanation:</strong> ${mcq.explanation}</div>` : ''}
          </div>
        </section>`;
      }
      case 'flashcard': {
        const cards = Array.isArray(section.content) ? section.content : [];
        const cardsHtml = cards.map((c: any) =>
          `<div class="flashcard-item">
            <div class="flashcard-front"><strong>Q:</strong> ${c.front || ''}</div>
            <div class="flashcard-back"><strong>A:</strong> ${c.back || ''}</div>
          </div>`
        ).join('');
        return `<section class="note-section">
          ${section.title ? `<h2><span class="accent-bar accent-violet"></span>${section.title}</h2>` : ''}
          <div class="flashcard-list">${cardsHtml}</div>
        </section>`;
      }
      case 'tabs': {
        const tabData = section.content as { tabs?: { id?: string; label?: string; content?: string }[] };
        const tabs = (tabData?.tabs || []).map((t, i) =>
          `<div class="tab-item">
            <div class="tab-label">${t.label || `Tab ${i + 1}`}</div>
            <div class="tab-content">${typeof t.content === 'string' ? mdToHtml(t.content) : ''}</div>
          </div>`
        ).join('');
        return `<section class="note-section">
          ${section.title ? `<h2><span class="accent-bar"></span>${section.title}</h2>` : ''}
          <div class="tabs-block">${tabs}</div>
        </section>`;
      }
      case 'asset': {
        const asset = section.content as { id?: string; noteId?: string; filename?: string; type?: string; caption?: string; path?: string; url?: string; dataUrl?: string } | null;
        if (!asset) return '';
        const assetUrl = asset.dataUrl || asset.path || asset.url || '';
        const caption = asset.caption || asset.filename || '';
        if (asset.type === 'image' && assetUrl) {
          return `<section class="note-section">
            ${section.title ? `<h2><span class="accent-bar accent-orange"></span>${section.title}</h2>` : ''}
            <figure class="image-block">
              <img src="${assetUrl}" alt="${caption}" class="asset-image" />
              ${caption ? `<figcaption>${caption}</figcaption>` : ''}
            </figure>
          </section>`;
        }
        if (asset.type === 'pdf' && assetUrl) {
          return `<section class="note-section">
            ${section.title ? `<h2><span class="accent-bar accent-orange"></span>${section.title}</h2>` : ''}
            <div class="pdf-embed-block">
              <div class="pdf-embed-header">${asset.filename || 'PDF Document'}</div>
              <embed src="${assetUrl}" type="application/pdf" class="pdf-embed" />
            </div>
          </section>`;
        }
        // Fallback for other asset types
        return `<section class="note-section">
          ${section.title ? `<h2><span class="accent-bar accent-orange"></span>${section.title}</h2>` : ''}
          <div class="asset-block">
            <div class="asset-label">${asset.type?.toUpperCase() || 'ASSET'}: ${asset.filename || ''}</div>
            ${assetUrl ? `<a href="${assetUrl}" class="asset-download" download>Download ${asset.filename || 'file'}</a>` : ''}
          </div>
        </section>`;
      }
      case 'pdf-embed': {
        const pdf = section.content as { dataUrl?: string; filename?: string } | null;
        if (!pdf) return '';
        return `<section class="note-section">
          ${section.title ? `<h2><span class="accent-bar accent-orange"></span>${section.title}</h2>` : ''}
          <div class="pdf-embed-block">
            <div class="pdf-embed-header">${pdf.filename || 'PDF Document'}</div>
            ${pdf.dataUrl ? `<embed src="${pdf.dataUrl}" type="application/pdf" class="pdf-embed" />` : ''}
          </div>
        </section>`;
      }
      default: {
        const body = typeof section.content === 'string' ? mdToHtml(section.content) : JSON.stringify(section.content);
        return `<section class="note-section">
          ${section.title ? `<h2><span class="accent-bar"></span>${section.title}</h2>` : ''}
          <div class="prose-body">${body}</div>
        </section>`;
      }
    }
  };

  // ─── Generate the full standalone HTML document for export ---
  const generateExportHtml = (note: NoteData, forPrint: boolean = false): string => {
    const bg = forPrint ? '#ffffff' : (isDark ? '#0d1117' : '#f3f0eb');
    const surface = forPrint ? '#ffffff' : (isDark ? '#161b22' : '#ffffff');
    const surface2 = forPrint ? '#f5f5f5' : (isDark ? '#1c2330' : '#f8f6f1');
    const text = forPrint ? '#1c1917' : (isDark ? '#e6edf3' : '#1c1917');
    const muted = forPrint ? '#666666' : (isDark ? '#8b949e' : '#78716c');
    const accent = forPrint ? '#c27803' : (isDark ? '#f0a500' : '#c27803');
    const border = forPrint ? '#d0d0d0' : (isDark ? '#30363d' : '#d0ccc5');
    const correct = forPrint ? '#16a34a' : (isDark ? '#2ea043' : '#16a34a');
    const blue = '#3b82f6';
    const hasMermaid = hasMermaidSections(note.sections);

    const sectionsHtml = note.sections.map(s => sectionToExportHtml(s)).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${note.title}</title>
  ${hasMermaid ? `<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>` : ''}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: ${bg};
      color: ${text};
      line-height: 1.65;
      letter-spacing: 0.01em;
      max-width: 860px;
      margin: 0 auto;
      padding: 48px 24px;
    }
    .note-header { margin-bottom: 40px; border-bottom: 1px solid ${border}; padding-bottom: 24px; }
    .note-header h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 2em;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: ${text};
      margin-bottom: 8px;
    }
    .note-meta { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .note-meta .specialty {
      font-size: 13px;
      color: ${accent};
      background: ${surface2};
      padding: 3px 10px;
      border-radius: 6px;
      font-weight: 500;
    }
    .note-meta .date { font-size: 12px; color: ${muted}; }
    .note-section { margin-bottom: 36px; }
    .note-section h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.15em;
      font-weight: 700;
      color: ${text};
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid ${border};
    }
    .accent-bar {
      display: inline-block;
      width: 4px;
      height: 20px;
      border-radius: 2px;
      background: ${accent};
      flex-shrink: 0;
    }
    .accent-bar.accent-violet { background: #a78bfa; }
    .accent-bar.accent-orange { background: #fb923c; }
    .prose-body {
      padding-left: 12px;
      font-size: 15px;
    }
    .prose-body p { margin-bottom: 12px; }
    .prose-body strong { color: ${text}; font-weight: 600; }
    .prose-body em { font-style: italic; }
    .prose-body code {
      background: ${surface2};
      color: ${accent};
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
      font-size: 0.88em;
    }
    .prose-body pre {
      background: ${surface};
      border: 1px solid ${border};
      border-radius: 12px;
      padding: 16px;
      overflow-x: auto;
      margin: 16px 0;
    }
    .prose-body pre code {
      background: none;
      padding: 0;
      color: ${text};
    }
    .prose-body ul, .prose-body ol {
      padding-left: 24px;
      margin-bottom: 12px;
    }
    .prose-body li { margin-bottom: 4px; }
    .prose-body a { color: ${accent}; }
    .prose-body hr { border: none; border-top: 1px solid ${border}; margin: 20px 0; }
    .prose-body h1, .prose-body h2, .prose-body h3 { margin-top: 20px; margin-bottom: 8px; }
    /* Inline mermaid diagrams within markdown content */
    .mermaid-inline {
      background: ${surface};
      border: 1px solid ${border};
      border-radius: 12px;
      padding: 16px;
      margin: 16px 0;
    }
    /* Mermaid diagram blocks */
    .mermaid-diagram-block {
      background: ${surface};
      border: 1px solid ${border};
      border-radius: 12px;
      padding: 20px;
    }
    .mermaid-diagram-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${muted};
      margin-bottom: 12px;
      font-weight: 600;
    }
    .mermaid-diagram-block .mermaid {
      display: flex;
      justify-content: center;
    }
    .mermaid svg {
      max-width: 100%;
      height: auto;
    }
    .mermaid-code-fallback {
      font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
      font-size: 12px;
      color: ${blue};
      white-space: pre-wrap;
      word-break: break-word;
      background: none;
      border: none;
      padding: 0;
    }
    /* Images */
    .image-block {
      margin: 0;
    }
    .image-block .asset-image {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      border: 1px solid ${border};
      display: block;
    }
    .image-block figcaption {
      margin-top: 8px;
      font-size: 13px;
      color: ${muted};
      text-align: center;
    }
    /* PDF embeds */
    .pdf-embed-block {
      background: ${surface};
      border: 1px solid ${border};
      border-radius: 12px;
      overflow: hidden;
    }
    .pdf-embed-header {
      padding: 10px 16px;
      font-size: 12px;
      color: ${muted};
      border-bottom: 1px solid ${border};
      background: ${surface2};
    }
    .pdf-embed {
      width: 100%;
      height: 500px;
      border: none;
    }
    /* Other assets */
    .asset-block {
      background: ${surface};
      border: 1px solid ${border};
      border-radius: 12px;
      padding: 16px;
    }
    .asset-label {
      font-size: 12px;
      color: ${muted};
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .asset-download {
      display: inline-block;
      padding: 6px 14px;
      background: ${surface2};
      color: ${accent};
      border-radius: 8px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }
    .asset-download:hover { text-decoration: underline; }
    .mcq-block {
      background: ${surface};
      border: 1px solid ${border};
      border-radius: 12px;
      padding: 20px;
    }
    .mcq-question {
      font-size: 15px;
      font-weight: 600;
      color: ${text};
      margin-bottom: 12px;
    }
    .mcq-options { list-style: none; padding: 0; margin-bottom: 12px; }
    .mcq-options li {
      padding: 8px 12px;
      border-radius: 8px;
      margin-bottom: 4px;
      border: 1px solid ${border};
      font-size: 14px;
    }
    .mcq-options li.correct-option {
      border-color: ${correct};
      background: rgba(46, 160, 67, 0.1);
      color: ${correct};
    }
    .mcq-explanation {
      margin-top: 12px;
      padding: 12px;
      border-radius: 8px;
      background: ${surface2};
      font-size: 13px;
      color: ${muted};
    }
    .flashcard-list { display: grid; gap: 12px; }
    .flashcard-item {
      background: ${surface};
      border: 1px solid ${border};
      border-radius: 12px;
      overflow: hidden;
    }
    .flashcard-front {
      padding: 14px 16px;
      font-size: 14px;
      font-weight: 500;
      border-bottom: 1px solid ${border};
    }
    .flashcard-back {
      padding: 14px 16px;
      font-size: 14px;
      background: ${surface2};
      color: ${muted};
    }
    .tabs-block { display: grid; gap: 16px; }
    .tab-item {
      background: ${surface};
      border: 1px solid ${border};
      border-radius: 12px;
      overflow: hidden;
    }
    .tab-label {
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
      color: ${accent};
      border-bottom: 1px solid ${border};
      background: ${surface2};
    }
    .tab-content {
      padding: 16px;
      font-size: 14px;
    }
    .tab-content p { margin-bottom: 8px; }
    .export-footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid ${border};
      font-size: 11px;
      color: ${muted};
      text-align: center;
    }
    @media print {
      body { background: white !important; color: #1c1917 !important; padding: 20px; }
      .note-section h2 { border-bottom-color: #d0ccc5; }
      .mermaid-diagram-block, .mcq-block, .flashcard-item, .tab-item, .image-block, .pdf-embed-block { break-inside: avoid; }
      .pdf-embed { display: none; }
      .pdf-embed-header::after { content: ' (PDF — open HTML file to view)'; }
      .export-footer { display: none; }
    }
  </style>
</head>
<body>
  <div class="note-header">
    <h1>${note.title}</h1>
    <div class="note-meta">
      <span class="specialty">${note.specialty}</span>
      ${note.updatedAt ? `<span class="date">${new Date(note.updatedAt).toLocaleDateString()}</span>` : ''}
    </div>
  </div>
  ${sectionsHtml}
  <div class="export-footer">
    Exported from NoteTool — ${new Date().toLocaleDateString()}
  </div>
  ${hasMermaid ? `<script>
    mermaid.initialize({
      startOnLoad: true,
      theme: '${isDark ? 'dark' : 'default'}',
      themeVariables: {
        primaryColor: '${isDark ? '#1e3a5f' : '#dbeafe'}',
        primaryTextColor: '${isDark ? '#e2e8f0' : '#1e293b'}',
        primaryBorderColor: '${isDark ? '#2563eb' : '#3b82f6'}',
        lineColor: '${isDark ? '#64748b' : '#94a3b8'}',
        fontSize: '14px',
        ${isDark ? "mainBkg: '#1e3a5f'," : "mainBkg: '#dbeafe',"}
        edgeLabelBackground: 'transparent',
      },
      flowchart: { curve: 'basis', htmlLabels: false, padding: 20 }
    });
  </script>` : ''}
</body>
</html>`;
  };

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
      content = generateExportHtml(note, false);
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

  // ─── Export PDF — open HTML in new window and print ---
  const handleExportPDF = async () => {
    const note = activeNote;
    if (!note) return;
    try {
      const html = generateExportHtml(note, true);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          // Wait for Mermaid to render (if any) then auto-print
          const hasMermaid = hasMermaidSections(note.sections);
          const delay = hasMermaid ? 2000 : 300;
          setTimeout(() => {
            printWindow.print();
            // Revoke after a delay so the window can fully load
            setTimeout(() => URL.revokeObjectURL(url), 10000);
          }, delay);
        };
      } else {
        // Fallback: if popup blocked, download HTML and tell user
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.id}-print.html`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
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
                className="pl-3"
                style={{ fontSize: `${settings.fontSize}px` }}
              >
                <MarkdownRenderer content={typeof section.content === 'string' ? section.content : ''} />
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
                    'max-w-5xl mx-auto p-6'
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
