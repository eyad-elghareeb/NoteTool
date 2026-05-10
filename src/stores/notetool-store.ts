import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Type Definitions ────────────────────────────────────────────────

export type AppMode = 'read' | 'annotate' | 'developer';
export type GlobalPenTool = 'pen' | 'highlight-text' | 'highlight-free' | 'sticky' | 'eraser';
export type ViewPanel = 'home' | 'notes' | 'library' | 'connectome' | 'ddx' | 'mindmap' | 'pdf-workspace';

export interface StickyNote {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  timestamp: number;
}

export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HighlightRegion {
  id: string;
  text: string;
  color: string;
  rangeInfo: {
    startContainerPath: string;
    startOffset: number;
    endContainerPath: string;
    endOffset: number;
  };
  rect: HighlightRect;
  rects: HighlightRect[];
}

export interface DrawingPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

export interface NoteSection {
  id: string;
  title: string;
  type: 'content' | 'mcq' | 'flashcard' | 'mermaid' | 'algorithm' | 'tabs' | 'asset';
  content: unknown;
}

export interface NoteData {
  id: string;
  title: string;
  category: string;
  specialty: string;
  summary: string;
  icd10Codes: string[];
  snomedCodes: string[];
  tags: string[];
  sections: NoteSection[];
  highYieldSummary: string[];
  links: { targetId: string; relation: string; label: string }[];
  ddxComparison?: { feature: string; [key: string]: string }[];
  createdAt: number;
  updatedAt: number;
}

export interface DynamicSection {
  id: string;
  type: 'content' | 'mcq' | 'flashcard' | 'mermaid' | 'tabs' | 'asset';
  title: string;
  content: unknown;
}

export interface MCQAnswerState {
  selected: number | null;
  revealed: boolean;
  flagged: boolean;
}

export interface FlashcardState {
  flipped: boolean;
}

interface Annotation {
  id: string;
  type: 'highlight' | 'sticky-note' | 'drawing';
  content: string;
  position: { x: number; y: number };
  color: string;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  specialty: string;
  institution: string;
  avatar: string;
}

export interface AppSettings {
  autoDissect: boolean;
  connectomeSync: boolean;
  fontSize: number;
  theme: 'dark' | 'light';
}

// ─── Note-specific annotation sets ───────────────────────────────────

export interface NoteAnnotations {
  stickyNotes: StickyNote[];
  highlightRegions: HighlightRegion[];
  drawingPaths: DrawingPath[];
}

// ─── Store Interface ─────────────────────────────────────────────────

interface NoteToolState {
  // Mode
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // Active view
  activeView: ViewPanel;
  setActiveView: (view: ViewPanel) => void;

  // Theme
  isDark: boolean;
  toggleTheme: () => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Dissection view
  dissectionMode: boolean;
  toggleDissection: () => void;

  // ─── Notes CRUD ────────────────────────────────────────────────────
  notes: NoteData[];
  addNote: (note: NoteData) => void;
  updateNote: (id: string, updates: Partial<NoteData>) => void;
  deleteNote: (id: string) => void;
  duplicateNote: (id: string) => void;
  activeNoteId: string;
  setActiveNoteId: (id: string) => void;

  // ─── Account / Profile ─────────────────────────────────────────────
  userProfile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;

  // ─── Settings ──────────────────────────────────────────────────────
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // ─── Annotations (legacy) ──────────────────────────────────────────
  annotations: Annotation[];
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;

  // ─── Per-note Annotations ──────────────────────────────────────────
  annotationsPerNote: Record<string, NoteAnnotations>;
  setAnnotationsForNote: (noteId: string, annotations: NoteAnnotations) => void;

  // DDx Splitter
  ddxLeftNoteId: string | null;
  ddxRightNoteId: string | null;
  setDdxNotes: (left: string | null, right: string | null) => void;

  // Developer mode
  developerCode: string;
  setDeveloperCode: (code: string) => void;

  // MCQ state (legacy)
  revealedMCQs: Set<string>;
  revealMCQ: (id: string) => void;
  resetMCQs: () => void;

  // Flashcard state (legacy)
  flippedCards: Set<string>;
  flipCard: (id: string) => void;
  resetCards: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // ─── Annotation Canvas State ───────────────────────────────────────
  annotateTool: 'highlight' | 'sticky' | 'drawing' | 'eraser' | null;
  setAnnotateTool: (tool: 'highlight' | 'sticky' | 'drawing' | 'eraser' | null) => void;

  // ─── Global Pen Overlay State ──────────────────────────────────────
  globalPenActive: boolean;
  setGlobalPenActive: (active: boolean) => void;
  globalPenTool: 'pen' | 'highlight-text' | 'highlight-free' | 'sticky' | 'eraser' | null;
  setGlobalPenTool: (tool: 'pen' | 'highlight-text' | 'highlight-free' | 'sticky' | 'eraser' | null) => void;
  highlightColor: string;
  setHighlightColor: (color: string) => void;
  drawingColor: string;
  setDrawingColor: (color: string) => void;
  drawingBrushSize: number;
  setDrawingBrushSize: (size: number) => void;
  stickyNotes: StickyNote[];
  addStickyNote: (note: StickyNote) => void;
  updateStickyNote: (id: string, updates: Partial<StickyNote>) => void;
  removeStickyNote: (id: string) => void;
  highlightRegions: HighlightRegion[];
  addHighlightRegion: (region: HighlightRegion) => void;
  removeHighlightRegion: (id: string) => void;
  drawingPaths: DrawingPath[];
  addDrawingPath: (path: DrawingPath) => void;
  removeDrawingPath: (id: string) => void;
  clearAllAnnotations: () => void;

  // Dynamic note sections
  dynamicSections: DynamicSection[];
  addDynamicSection: (section: DynamicSection) => void;
  removeDynamicSection: (id: string) => void;

  // MCQ answer states per question
  mcqAnswers: Record<string, MCQAnswerState>;
  setMCQAnswer: (id: string, state: Partial<MCQAnswerState>) => void;
  resetMCQAnswer: (id: string) => void;
  resetAllMCQAnswers: () => void;

  // Flashcard flip states
  flashcardStates: Record<string, FlashcardState>;
  setFlashcardFlipped: (id: string, flipped: boolean) => void;
  resetAllFlashcards: () => void;

  // Content toolbar open state
  contentToolbarOpen: boolean;
  setContentToolbarOpen: (open: boolean) => void;

  // Modals
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  newNoteModalOpen: boolean;
  setNewNoteModalOpen: (open: boolean) => void;
  accountModalOpen: boolean;
  setAccountModalOpen: (open: boolean) => void;

  // ─── Fullscreen View ──────────────────────────────────────────────
  fullscreenView: 'none' | 'connectome' | 'mermaid' | 'mindmap';
  setFullscreenView: (view: 'none' | 'connectome' | 'mermaid' | 'mindmap') => void;

  // ─── PDF Workspace ───────────────────────────────────────────────
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  pdfPageNum: number;
  setPdfPageNum: (page: number) => void;

  // ─── Command Palette Search ──────────────────────────────────────
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

// ─── Store Creation ──────────────────────────────────────────────────

export const useNoteToolStore = create<NoteToolState>()(
  persist(
    (set, get) => ({
      // Mode
      mode: 'read' as AppMode,
      setMode: (mode) => set({ mode }),

      // Active view
      activeView: 'home' as ViewPanel,
      setActiveView: (view) => set({ activeView: view }),

      // Theme
      isDark: true,
      toggleTheme: () => set((s) => ({ isDark: !s.isDark })),

      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      // Dissection view
      dissectionMode: false,
      toggleDissection: () => set((s) => ({ dissectionMode: !s.dissectionMode })),

      // ─── Notes CRUD ──────────────────────────────────────────────
      notes: [],
      addNote: (note) => set((s) => ({ notes: [...s.notes, note] })),
      updateNote: (id, updates) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
          ),
        })),
      deleteNote: (id) =>
        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id),
          activeNoteId: s.activeNoteId === id ? (s.notes[0]?.id || 'acute-heart-failure') : s.activeNoteId,
        })),
      duplicateNote: (id) => {
        const state = get();
        const original = state.notes.find((n) => n.id === id);
        if (!original) return;
        const newId = `${original.id}-copy-${Date.now()}`;
        const copy: NoteData = {
          ...original,
          id: newId,
          title: `${original.title} (Copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ notes: [...s.notes, copy] }));
      },
      activeNoteId: 'acute-heart-failure',
      setActiveNoteId: (id) => {
        // Save current annotations to per-note storage before switching
        const state = get();
        const currentAnnotations: NoteAnnotations = {
          stickyNotes: state.stickyNotes,
          highlightRegions: state.highlightRegions,
          drawingPaths: state.drawingPaths,
        };
        set((s) => ({
          activeNoteId: id,
          annotationsPerNote: {
            ...s.annotationsPerNote,
            [s.activeNoteId]: currentAnnotations,
          },
          // Load new note's annotations
          stickyNotes: s.annotationsPerNote[id]?.stickyNotes || [],
          highlightRegions: s.annotationsPerNote[id]?.highlightRegions || [],
          drawingPaths: s.annotationsPerNote[id]?.drawingPaths || [],
        }));
      },

      // ─── Account / Profile ────────────────────────────────────────
      userProfile: {
        name: 'Dr. Surgeon',
        specialty: 'Cardiology',
        institution: 'General Hospital',
        avatar: '',
      },
      updateProfile: (updates) =>
        set((s) => ({ userProfile: { ...s.userProfile, ...updates } })),

      // ─── Settings ─────────────────────────────────────────────────
      settings: {
        autoDissect: false,
        connectomeSync: true,
        fontSize: 15,
        theme: 'dark' as const,
      },
      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),

      // ─── Annotations (legacy) ─────────────────────────────────────
      annotations: [],
      addAnnotation: (annotation) =>
        set((s) => ({ annotations: [...s.annotations, annotation] })),
      removeAnnotation: (id) =>
        set((s) => ({ annotations: s.annotations.filter((a) => a.id !== id) })),
      clearAnnotations: () => set({ annotations: [] }),

      // ─── Per-note Annotations ─────────────────────────────────────
      annotationsPerNote: {},
      setAnnotationsForNote: (noteId, annotations) =>
        set((s) => ({
          annotationsPerNote: { ...s.annotationsPerNote, [noteId]: annotations },
        })),

      // DDx
      ddxLeftNoteId: null,
      ddxRightNoteId: null,
      setDdxNotes: (left, right) =>
        set({ ddxLeftNoteId: left, ddxRightNoteId: right }),

      // Developer
      developerCode: '',
      setDeveloperCode: (code) => set({ developerCode: code }),

      // MCQ (legacy)
      revealedMCQs: new Set<string>(),
      revealMCQ: (id) =>
        set((s) => {
          const next = new Set(s.revealedMCQs);
          next.add(id);
          return { revealedMCQs: next };
        }),
      resetMCQs: () => set({ revealedMCQs: new Set<string>() }),

      // Flashcard (legacy)
      flippedCards: new Set<string>(),
      flipCard: (id) =>
        set((s) => {
          const next = new Set(s.flippedCards);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { flippedCards: next };
        }),
      resetCards: () => set({ flippedCards: new Set<string>() }),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      // ─── Annotation Canvas ────────────────────────────────────────
      annotateTool: null,
      setAnnotateTool: (tool) => set({ annotateTool: tool }),

      // ─── Global Pen Overlay ────────────────────────────────────────
      globalPenActive: false,
      setGlobalPenActive: (active) => set({ globalPenActive: active }),
      globalPenTool: 'pen' as GlobalPenTool,
      setGlobalPenTool: (tool) => set({ globalPenTool: tool }),
      highlightColor: '#f0a500',
      setHighlightColor: (color) => set({ highlightColor: color }),
      drawingColor: '#f0a500',
      setDrawingColor: (color) => set({ drawingColor: color }),
      drawingBrushSize: 3,
      setDrawingBrushSize: (size) => set({ drawingBrushSize: size }),

      stickyNotes: [],
      addStickyNote: (note) =>
        set((s) => ({ stickyNotes: [...s.stickyNotes, note] })),
      updateStickyNote: (id, updates) =>
        set((s) => ({
          stickyNotes: s.stickyNotes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        })),
      removeStickyNote: (id) =>
        set((s) => ({ stickyNotes: s.stickyNotes.filter((n) => n.id !== id) })),

      highlightRegions: [],
      addHighlightRegion: (region) =>
        set((s) => ({ highlightRegions: [...s.highlightRegions, region] })),
      removeHighlightRegion: (id) =>
        set((s) => ({
          highlightRegions: s.highlightRegions.filter((r) => r.id !== id),
        })),

      drawingPaths: [],
      addDrawingPath: (path) =>
        set((s) => ({ drawingPaths: [...s.drawingPaths, path] })),
      removeDrawingPath: (id) =>
        set((s) => ({ drawingPaths: s.drawingPaths.filter((p) => p.id !== id) })),

      clearAllAnnotations: () =>
        set({
          stickyNotes: [],
          highlightRegions: [],
          drawingPaths: [],
        }),

      // Dynamic sections
      dynamicSections: [],
      addDynamicSection: (section) =>
        set((s) => ({ dynamicSections: [...s.dynamicSections, section] })),
      removeDynamicSection: (id) =>
        set((s) => ({
          dynamicSections: s.dynamicSections.filter((sec) => sec.id !== id),
        })),

      // MCQ answers
      mcqAnswers: {},
      setMCQAnswer: (id, answerState) =>
        set((s) => ({
          mcqAnswers: {
            ...s.mcqAnswers,
            [id]: { selected: null, revealed: false, flagged: false, ...answerState },
          },
        })),
      resetMCQAnswer: (id) =>
        set((s) => ({
          mcqAnswers: {
            ...s.mcqAnswers,
            [id]: { selected: null, revealed: false, flagged: false },
          },
        })),
      resetAllMCQAnswers: () => set({ mcqAnswers: {} }),

      // Flashcard states
      flashcardStates: {},
      setFlashcardFlipped: (id, flipped) =>
        set((s) => ({
          flashcardStates: {
            ...s.flashcardStates,
            [id]: { flipped },
          },
        })),
      resetAllFlashcards: () => set({ flashcardStates: {} }),

      // Content toolbar
      contentToolbarOpen: false,
      setContentToolbarOpen: (open) => set({ contentToolbarOpen: open }),

      // Modals
      settingsModalOpen: false,
      setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
      newNoteModalOpen: false,
      setNewNoteModalOpen: (open) => set({ newNoteModalOpen: open }),
      accountModalOpen: false,
      setAccountModalOpen: (open) => set({ accountModalOpen: open }),

      // ─── Fullscreen View ─────────────────────────────────────────
      fullscreenView: 'none' as const,
      setFullscreenView: (view) => set({ fullscreenView: view }),

      // ─── PDF Workspace ──────────────────────────────────────────
      pdfFile: null,
      setPdfFile: (file) => set({ pdfFile: file }),
      pdfPageNum: 1,
      setPdfPageNum: (page) => set({ pdfPageNum: page }),

      // ─── Command Palette Search ─────────────────────────────────
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    {
      name: 'notetool-storage',
      // Only persist certain fields
      partialize: (state) => ({
        notes: state.notes,
        userProfile: state.userProfile,
        settings: state.settings,
        activeNoteId: state.activeNoteId,
        annotationsPerNote: state.annotationsPerNote,
        dynamicSections: state.dynamicSections,
        isDark: state.isDark,
        sidebarOpen: state.sidebarOpen,
        mcqAnswers: state.mcqAnswers,
        flashcardStates: state.flashcardStates,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
