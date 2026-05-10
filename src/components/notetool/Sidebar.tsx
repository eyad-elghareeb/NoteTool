'use client';

import { useMemo, useCallback, useState } from 'react';
import { useNoteToolStore, type ViewPanel } from '@/stores/notetool-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  BookOpen,
  Network,
  Plus,
  Search,
  PanelLeft,
  PanelLeftClose,
  Heart,
  Wind,
  Scissors,
  Zap,
  FileText,
  Library,
  Link2,
  Activity,
  Brain,
  X,
  Home,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  MoreVertical,
  Trash2,
  Copy,
  Edit2,
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── View Items ─────────────────────────────────────────────────────

const knowledgeBaseItems: { id: ViewPanel; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'home', label: 'Home', icon: <Home className="h-4 w-4" />, description: 'Dashboard' },
  { id: 'notes', label: 'Active Synthesis', icon: <FileText className="h-4 w-4" />, description: 'Current note view' },
  { id: 'library', label: 'MedLibrary', icon: <Library className="h-4 w-4" />, description: 'Medical references' },
  { id: 'connectome', label: 'Connectome', icon: <Network className="h-4 w-4" />, description: 'Knowledge graph' },
];

// ─── Specialty Icon Map ─────────────────────────────────────────────

const specialtyIconMap: Record<string, { icon: React.ReactNode; color: string }> = {
  cardio: { icon: <Heart className="h-3.5 w-3.5" />, color: 'text-rose-400' },
  cardiac: { icon: <Heart className="h-3.5 w-3.5" />, color: 'text-rose-400' },
  respiratory: { icon: <Wind className="h-3.5 w-3.5" />, color: 'text-sky-400' },
  pulm: { icon: <Wind className="h-3.5 w-3.5" />, color: 'text-sky-400' },
  nephro: { icon: <Activity className="h-3.5 w-3.5" />, color: 'text-violet-400' },
  renal: { icon: <Activity className="h-3.5 w-3.5" />, color: 'text-violet-400' },
  surg: { icon: <Scissors className="h-3.5 w-3.5" />, color: 'text-amber-400' },
  neuro: { icon: <Brain className="h-3.5 w-3.5" />, color: 'text-purple-400' },
  default: { icon: <Zap className="h-3.5 w-3.5" />, color: 'text-emerald-400' },
};

function getSpecialtyIcon(specialty: string) {
  const s = specialty.toLowerCase();
  for (const [key, val] of Object.entries(specialtyIconMap)) {
    if (key !== 'default' && s.includes(key)) {
      return <span className={val.color}>{val.icon}</span>;
    }
  }
  return <span className={specialtyIconMap.default.color}>{specialtyIconMap.default.icon}</span>;
}

// ─── Section Label ──────────────────────────────────────────────────

function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center justify-between px-2 mb-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sb-muted">
        {children}
      </span>
      {count !== undefined && (
        <span className="text-[9px] tabular-nums text-sb-muted bg-sb-surface2 rounded px-1.5 py-0.5 leading-none">
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Main Sidebar ───────────────────────────────────────────────────

export function Sidebar() {
  const {
    sidebarOpen,
    toggleSidebar,
    activeView,
    setActiveView,
    activeNoteId,
    setActiveNoteId,
    searchQuery,
    setSearchQuery,
    notes,
    setNewNoteModalOpen,
    folders: storeFolders,
    addFolder,
    renameFolder,
    deleteFolder,
    moveNoteToFolder,
    duplicateNote,
    deleteNote,
  } = useNoteToolStore();

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ 'Uncategorized': true });
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [deleteFolderNotes, setDeleteFolderNotes] = useState(false);

  // ─── Filtered Notes (search by title, specialty, tags, content) ──
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter((n) => {
      if (n.title.toLowerCase().includes(q)) return true;
      if (n.specialty.toLowerCase().includes(q)) return true;
      if (n.tags.some((t) => t.toLowerCase().includes(q))) return true;
      // Search in section content
      if (n.summary && n.summary.toLowerCase().includes(q)) return true;
      if (n.sections.some((sec) => {
        if (typeof sec.content === 'string') return sec.content.toLowerCase().includes(q);
        try {
          return JSON.stringify(sec.content).toLowerCase().includes(q);
        } catch {
          return false;
        }
      })) return true;
      return false;
    });
  }, [notes, searchQuery]);
  
  const folders = useMemo(() => {
    return filteredNotes.reduce((acc, note) => {
      const folder = note.folder || 'Uncategorized';
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(note);
      return acc;
    }, {} as Record<string, typeof notes>);
  }, [filteredNotes]);

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  // ─── Linked Notes for active note ────────────────────────────────
  const activeNote = notes.find((n) => n.id === activeNoteId);
  const linkedNotes = useMemo(() => {
    if (!activeNote?.links?.length) return [];
    return activeNote.links
      .map((link) => {
        const targetNote = notes.find((n) => n.id === link.targetId);
        return {
          ...link,
          targetTitle: targetNote?.title || link.label,
        };
      });
  }, [activeNote, notes]);

  // ─── Note click handler ──────────────────────────────────────────
  const handleNoteClick = useCallback((noteId: string) => {
    setActiveNoteId(noteId);
    setActiveView('notes');
  }, [setActiveNoteId, setActiveView]);

  // ─── Clear search ────────────────────────────────────────────────
  const clearSearch = useCallback(() => setSearchQuery(''), [setSearchQuery]);

  return (
    <motion.div
      initial={false}
      animate={{ width: sidebarOpen ? 272 : 48 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col border-r border-sb-border bg-sb-bg overflow-hidden flex-shrink-0 relative"
    >
      {/* ═══════════════ EXPANDED STATE ═══════════════ */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* ─── Header ──────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-3 h-11 border-b border-sb-border/50 flex-shrink-0">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-md bg-sb-accent flex items-center justify-center flex-shrink-0 shadow-sm shadow-[var(--color-sb-accent)]/20">
                  <span className="text-sb-bg text-[10px] font-black tracking-tight">SB</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-[13px] font-bold text-sb-text leading-tight truncate">NoteTool</h2>
                  <p className="text-[8px] text-sb-muted uppercase tracking-[0.15em] leading-tight">Synthesis Engine</p>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                className="h-7 w-7 flex-shrink-0 rounded-md flex items-center justify-center text-sb-muted hover:text-sb-text hover:bg-sb-surface2 transition-colors"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            {/* ─── Search ──────────────────────────────────────────── */}
            <div className="px-3 pt-2 pb-1 flex-shrink-0">
              <div className="relative group">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sb-muted group-focus-within:text-sb-accent transition-colors" />
                <Input
                  placeholder="Search notes, tags, content…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 pl-7 pr-7 text-[11px] bg-sb-surface border-sb-border text-sb-text placeholder:text-[#484f58] rounded-md focus:border-sb-accent/40 focus:ring-1 focus:ring-sb-accent/20 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded flex items-center justify-center text-sb-muted hover:text-sb-text hover:bg-sb-border transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* ─── Scrollable Content ──────────────────────────────── */}
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="px-3 pb-3 space-y-3">

                {/* ── Knowledge Base ────────────────────────────────── */}
                <div>
                  <SectionLabel>Knowledge Base</SectionLabel>
                  <div className="space-y-px">
                    {knowledgeBaseItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={cn(
                          'w-full flex items-center gap-2.5 rounded-md px-2 py-[7px] text-[11px] transition-all duration-100 relative group',
                          activeView === item.id
                            ? 'text-sb-accent bg-sb-accent/8'
                            : 'text-sb-muted hover:bg-sb-surface hover:text-sb-text'
                        )}
                      >
                        {/* Left accent bar for active item */}
                        <div
                          className={cn(
                            'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-150',
                            activeView === item.id
                              ? 'h-4 bg-sb-accent'
                              : 'h-0 bg-transparent group-hover:h-2 group-hover:bg-sb-border'
                          )}
                        />
                        <span className={cn(
                          'transition-colors',
                          activeView === item.id ? 'text-sb-accent' : 'text-sb-muted group-hover:text-sb-text'
                        )}>
                          {item.icon}
                        </span>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Divider ──────────────────────────────────────── */}
                <div className="h-px bg-sb-border/50" />

                {/* ── Local Archives ────────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <SectionLabel count={filteredNotes.length}>
                      Local Archives
                    </SectionLabel>
                    <button 
                      onClick={() => setIsAddingFolder(true)}
                      className="p-1 hover:text-sb-accent text-sb-muted transition-colors"
                      title="New Folder"
                    >
                      <FolderPlus className="h-3 w-3" />
                    </button>
                  </div>

                  {isAddingFolder && (
                    <div className="px-2 mb-2 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                      <Input
                        autoFocus
                        placeholder="Folder name..."
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (newFolderName.trim()) {
                              addFolder(newFolderName.trim());
                              setNewFolderName('');
                              setIsAddingFolder(false);
                            }
                          } else if (e.key === 'Escape') {
                            setIsAddingFolder(false);
                            setNewFolderName('');
                          }
                        }}
                        className="h-6 text-[10px] bg-sb-surface border-sb-border"
                      />
                      <button 
                        onClick={() => {
                          if (newFolderName.trim()) {
                            addFolder(newFolderName.trim());
                            setNewFolderName('');
                            setIsAddingFolder(false);
                          }
                        }}
                        className="text-sb-accent"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setIsAddingFolder(false)} className="text-sb-muted">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-px">
                    {/* Ensure all folders from store are shown even if empty */}
                    {[...new Set([...storeFolders, ...Object.keys(folders)])].map((folderName) => {
                      const folderNotes = folders[folderName] || [];
                      return (
                        <div key={folderName} className="space-y-px">
                          <ContextMenu>
                            <ContextMenuTrigger>
                              <button 
                                onClick={() => toggleFolder(folderName)}
                                className="w-full flex items-center gap-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sb-muted hover:text-sb-text transition-colors group"
                              >
                                {expandedFolders[folderName] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                <FolderOpen className={cn("h-3 w-3 transition-colors", folderNotes.length > 0 ? "text-sb-accent/50" : "text-sb-muted/30")} />
                                <span className="truncate flex-1 text-left">{folderName}</span>
                                <span className="text-[8px] font-normal opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                                  {folderNotes.length}
                                </span>
                              </button>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="bg-sb-surface border-sb-border text-sb-text">
                              <ContextMenuItem onClick={() => setFolderToDelete(folderName)} className="text-sb-wrong hover:text-sb-wrong hover:bg-sb-wrong/10">
                                <Trash2 className="h-3 w-3 mr-2" /> Delete Folder
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>

                          {expandedFolders[folderName] && (
                            <div className="space-y-px ml-1 border-l border-sb-border/50 pl-1">
                              {folderNotes.map((note) => (
                                <ContextMenu key={note.id}>
                                  <ContextMenuTrigger>
                                    <button
                                      onClick={() => handleNoteClick(note.id)}
                                      className={cn(
                                        'w-full flex items-center gap-2.5 rounded-md px-2 py-[7px] text-[11px] transition-all duration-100 relative group text-left',
                                        activeNoteId === note.id
                                          ? 'text-sb-accent bg-sb-accent/8'
                                          : 'text-sb-muted hover:bg-sb-surface hover:text-sb-text'
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-150',
                                          activeNoteId === note.id
                                            ? 'h-4 bg-sb-accent'
                                            : 'h-0 bg-transparent group-hover:h-2 group-hover:bg-sb-border'
                                        )}
                                      />
                                      <span className="flex-shrink-0">{getSpecialtyIcon(note.specialty)}</span>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium truncate leading-tight">{note.title}</p>
                                        <p className="text-[9px] text-[#484f58] truncate leading-tight mt-0.5">{note.specialty}</p>
                                      </div>
                                    </button>
                                  </ContextMenuTrigger>
                                  <ContextMenuContent className="bg-sb-surface border-sb-border text-sb-text">
                                    <ContextMenuItem onClick={() => duplicateNote(note.id)}>
                                      <Copy className="h-3 w-3 mr-2" /> Duplicate
                                    </ContextMenuItem>
                                    <ContextMenuSub>
                                      <ContextMenuSubTrigger>
                                        <FolderOpen className="h-3 w-3 mr-2" /> Move to Folder
                                      </ContextMenuSubTrigger>
                                      <ContextMenuSubContent className="bg-sb-surface border-sb-border text-sb-text">
                                        {storeFolders.filter(f => f !== folderName).map(f => (
                                          <ContextMenuItem key={f} onClick={() => moveNoteToFolder(note.id, f)}>
                                            {f}
                                          </ContextMenuItem>
                                        ))}
                                        <ContextMenuItem onClick={() => moveNoteToFolder(note.id, '')}>
                                          Uncategorized
                                        </ContextMenuItem>
                                      </ContextMenuSubContent>
                                    </ContextMenuSub>
                                    <ContextMenuSeparator className="bg-sb-border" />
                                    <ContextMenuItem onClick={() => deleteNote(note.id)} className="text-sb-wrong hover:text-sb-wrong hover:bg-sb-wrong/10">
                                      <Trash2 className="h-3 w-3 mr-2" /> Delete Note
                                    </ContextMenuItem>
                                  </ContextMenuContent>
                                </ContextMenu>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {filteredNotes.length === 0 && (
                      <div className="px-2 py-4 text-center">
                        <p className="text-[10px] text-[#484f58]">
                          {searchQuery ? 'No matching notes' : 'No notes yet'}
                        </p>
                        {searchQuery && (
                          <button
                            onClick={clearSearch}
                            className="text-[10px] text-sb-accent hover:underline mt-1"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Divider ──────────────────────────────────────── */}
                <div className="h-px bg-sb-border/50" />

                {/* ── Author Tools ──────────────────────────────────── */}
                <div>
                  <SectionLabel>Author Tools</SectionLabel>
                  <button
                    onClick={() => setNewNoteModalOpen(true)}
                    className="w-full flex items-center gap-2 rounded-md px-2 py-[7px] text-[11px] font-medium text-sb-accent bg-sb-accent/8 border border-sb-accent/15 hover:bg-sb-accent/15 hover:border-sb-accent/25 transition-all duration-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Synthesis
                  </button>
                </div>

                {/* ── Linked Dissections ───────────────────────────── */}
                {linkedNotes.length > 0 && (
                  <>
                    <div className="h-px bg-sb-border/50" />
                    <div>
                      <SectionLabel count={linkedNotes.length}>
                        Linked Dissections
                      </SectionLabel>
                      <div className="space-y-px">
                        {linkedNotes.map((link) => (
                          <button
                            key={link.targetId}
                            onClick={() => handleNoteClick(link.targetId)}
                            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] text-sb-muted hover:bg-sb-surface hover:text-sb-text transition-all duration-100 text-left group"
                          >
                            <Link2 className="h-3 w-3 text-sb-border group-hover:text-sb-muted flex-shrink-0 transition-colors" />
                            <span className="truncate flex-1">{link.targetTitle}</span>
                            <span className="text-[8px] text-[#484f58] bg-sb-surface2 rounded px-1 py-0.5 leading-none flex-shrink-0 group-hover:text-sb-muted transition-colors">
                              {link.relation}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>

            {/* ─── Bottom Status ───────────────────────────────────── */}
            <div className="flex-shrink-0 px-3 py-2 border-t border-sb-border/50">
              <div className="flex items-center gap-1.5 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-sb-correct animate-pulse" />
                <span className="text-[9px] text-[#484f58]">Engine Online</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ COLLAPSED STATE ═══════════════ */}
      <AnimatePresence mode="wait">
        {!sidebarOpen && (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center py-2 flex-1 overflow-hidden"
          >
            {/* ─── Open Sidebar Button ─────────────────────────────── */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-sb-muted hover:text-sb-text hover:bg-sb-surface2 transition-colors mb-2"
                  aria-label="Expand sidebar"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-sb-surface2 text-sb-text border-sb-border text-[10px]">
                Expand sidebar
              </TooltipContent>
            </Tooltip>

            {/* ─── Knowledge Base Icons ────────────────────────────── */}
            <div className="flex flex-col items-center gap-0.5">
              {knowledgeBaseItems.map((item) => (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveView(item.id)}
                      className={cn(
                        'h-8 w-8 rounded-md flex items-center justify-center transition-all duration-100 relative',
                        activeView === item.id
                          ? 'text-sb-accent bg-sb-accent/10'
                          : 'text-sb-muted hover:bg-sb-surface2 hover:text-sb-text'
                      )}
                    >
                      {/* Left accent bar for active */}
                      {activeView === item.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-sb-accent" />
                      )}
                      {item.icon}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-sb-surface2 text-sb-text border-sb-border text-[10px]">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* ─── Divider ─────────────────────────────────────────── */}
            <div className="w-5 h-px bg-sb-border/50 my-2" />

            {/* ─── Note Count / Quick Access ───────────────────────── */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    setActiveView('notes');
                    toggleSidebar();
                  }}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-sb-muted hover:bg-sb-surface2 hover:text-sb-text transition-colors relative"
                >
                  <FileText className="h-4 w-4" />
                  {notes.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-sb-accent text-sb-bg text-[7px] font-bold flex items-center justify-center">
                      {notes.length}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-sb-surface2 text-sb-text border-sb-border text-[10px]">
                {notes.length} notes — click to open
              </TooltipContent>
            </Tooltip>

            {/* ─── New Note ────────────────────────────────────────── */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setNewNoteModalOpen(true)}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-sb-accent bg-sb-accent/8 hover:bg-sb-accent/15 transition-colors mt-0.5"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-sb-surface2 text-sb-text border-sb-border text-[10px]">
                New Synthesis
              </TooltipContent>
            </Tooltip>

            {/* ─── Spacer ──────────────────────────────────────────── */}
            <div className="flex-1" />

            {/* ─── Bottom Indicator ─────────────────────────────────── */}
            <div className="w-1.5 h-1.5 rounded-full bg-sb-correct animate-pulse mb-1" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Folder Deletion Confirmation */}
      <AlertDialog open={!!folderToDelete} onOpenChange={() => setFolderToDelete(null)}>
        <AlertDialogContent className="bg-sb-surface border-sb-border text-sb-text">
          <AlertDialogHeader>
            <AlertDialogTitle className="serif-title">Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription className="text-sb-muted">
              Are you sure you want to delete the folder <strong>"{folderToDelete}"</strong>?
              <div className="mt-4 flex items-center gap-2 text-sb-text">
                <Checkbox 
                  id="delete-notes" 
                  checked={deleteFolderNotes} 
                  onCheckedChange={(checked) => setDeleteFolderNotes(!!checked)}
                />
                <label htmlFor="delete-notes" className="text-xs font-medium cursor-pointer">
                  Also delete all notes inside this folder
                </label>
              </div>
              {!deleteFolderNotes && (
                <p className="mt-2 text-[10px] text-sb-accent/70 italic">
                  Note: If unchecked, notes will be moved to "Uncategorized".
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-sb-bg border-sb-border hover:bg-sb-surface2">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (folderToDelete) {
                  deleteFolder(folderToDelete, deleteFolderNotes);
                  setFolderToDelete(null);
                  setDeleteFolderNotes(false);
                }
              }}
              className="bg-sb-wrong text-white hover:bg-sb-wrong/90"
            >
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
