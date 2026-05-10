# SurgicalBrain NoteTool — Agent Definitions & Architecture Guide

## Project Codename: SurgicalBrain (The Universal Medical Synthesis Engine)

> **"The Surgeon's Mind" Philosophy: Dissect → Map → Act → Connect**

> SurgicalBrain is a local-first, medical-grade knowledge synthesis platform
> designed for clinicians, residents, and medical students. It combines
> structured note-taking, interactive clinical algorithms, active-recall
> testing, visual diagram building, and a knowledge graph (the "Connectome")
> into a single desktop-ready application.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Agent Roles](#3-agent-roles)
4. [Data Model](#4-data-model)
5. [Tri-Mode State Machine](#5-tri-mode-state-machine)
6. [Feature Documentation](#6-feature-documentation)
7. [Mermaid Rendering Pipeline](#7-mermaid-rendering-pipeline)
8. [Export Pipeline](#8-export-pipeline)
9. [Known Issues & Gotchas](#9-known-issues--gotchas)
10. [Electron Portable Build Guide](#10-electron-portable-build-guide)
11. [Development Workflow](#11-development-workflow)
12. [Keyboard Shortcuts](#12-keyboard-shortcuts)
13. [Component API Reference](#13-component-api-reference)
14. [State Management Patterns](#14-state-management-patterns)
15. [CSS Architecture Deep Dive](#15-css-architecture-deep-dive)
16. [Error Handling & Resilience](#16-error-handling--resilience)
17. [Performance Optimization Guide](#17-performance-optimization-guide)
18. [Accessibility Guidelines](#18-accessibility-guidelines)
19. [Testing Strategy](#19-testing-strategy)
20. [Deployment & CI/CD](#20-deployment--cicd)
21. [Troubleshooting Guide](#21-troubleshooting-guide)
22. [Recent Fixes & Changelog](#22-recent-fixes--changelog)
23. [Contributing Guidelines](#23-contributing-guidelines)

---

## 1. Project Overview

### Codename
**SurgicalBrain** — The Universal Medical Synthesis Engine

### Philosophy
**"The Surgeon's Mind"** — every feature follows a four-step cognitive cycle:

| Step | Meaning | Implementation |
|------|---------|---------------|
| **Dissect** | Break down complex topics into high-yield components | Dissection View, collapsible sections, high-yield summaries |
| **Map** | Visualize relationships between concepts | Connectome graph (D3.js), Mermaid algorithms, Markmap mindmaps, MermaidMakerGUI |
| **Act** | Test and reinforce knowledge through active recall | MCQ blocks (SBA format), flashcard blocks (cloze / image-occlusion) |
| **Connect** | Link topics across specialties via the knowledge graph | Note links, ICD-10/SNOMED tagging, DDx Splitter, folders |

### Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js (App Router) | 16.x | SSR/SSG, routing, API routes |
| Language | TypeScript | 5.x | Type safety across the entire codebase |
| Styling | Tailwind CSS | 4.x | Utility-first CSS with custom design tokens |
| Component Library | shadcn/ui | Latest | Pre-built, accessible UI primitives (New York style) |
| State Management | Zustand | 5.x | Client-side global state with `persist` middleware |
| Visualization | D3.js | 7.x | Connectome force-directed graph |
| Diagrams | Mermaid.js | 11.x | Clinical algorithm flowcharts |
| Mindmaps | Markmap | 0.18.x | Interactive collapsible mindmaps |
| Zoom/Pan | react-zoom-pan-pinch | 3.x | Mermaid preview zoom, diagram interaction |
| PDF Capture | html2canvas + jsPDF | — | PDF export via DOM screenshot |
| Animation | Framer Motion | 12.x | Page transitions, micro-interactions, modal animations |
| Icons | Lucide React | 0.525+ | Consistent icon system |
| Database | Prisma ORM (SQLite) | 6.x | Optional server-side persistence |
| Desktop | Electron | — | Cross-platform portable build (see §10) |

### Design Principles

1. **Local-First**: All core functionality works offline. No network dependency for CRUD operations.
2. **Medical-Grade Typography**: 15–16px base, 1.65 line-height, generous paragraph spacing, serif headings.
3. **Semantic Color**: Amber (#f0a500) = clinical action, Red (#da3633) = critical/danger, Green (#2ea043) = safe/correct.
4. **Non-Destructive Annotations**: Highlights, drawings, and sticky notes are stored separately from base content.
5. **Active Recall > Passive Reading**: Every note prompts the learner to think, not just consume.
6. **Atomicity**: Writes are atomic — never leave a note in a partially-saved state.
7. **Progressive Complexity**: Content is layered — Dissection View for rapid review, full sections for deep study, MCQ/flashcards for active recall.

---

## 2. Architecture Overview

### Full Directory Tree

```
/home/z/my-project/
├── AGENTS.md                              # This file — agent definitions & architecture guide
├── AI_SYNTHESIS_GUIDE.md                  # AI skill definition & serialization guide
├── README.md                              # Project documentation
├── Caddyfile                              # Gateway reverse proxy config
├── package.json                           # Dependencies, scripts, metadata
├── next.config.ts                         # Next.js config (standalone output)
├── tailwind.config.ts                     # Tailwind theme extensions
├── tsconfig.json                          # TypeScript configuration
├── components.json                        # shadcn/ui component registry
├── postcss.config.mjs                     # PostCSS with Tailwind plugin
├── eslint.config.mjs                      # ESLint flat config
├── bun.lock                               # Bun lockfile
│
├── prisma/
│   └── schema.prisma                      # Prisma schema (SQLite)
│
├── db/
│   └── custom.db                          # SQLite database file
│
├── public/
│   ├── logo.svg                           # SurgicalBrain logo
│   └── robots.txt                         # Search engine directives
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root layout: Geist fonts, dark theme, Toaster
│   │   ├── page.tsx                       # Main application shell — single-page app (2015 lines)
│   │   ├── globals.css                    # Design tokens, glassmorphism, prose system, animations (1145 lines)
│   │   └── api/
│   │       └── route.ts                   # API route (placeholder)
│   │
│   ├── components/
│   │   ├── ui/                            # shadcn/ui primitives (50+ components)
│   │   │   ├── accordion.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── aspect-ratio.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── command.tsx                # Command palette base (cmdk)
│   │   │   ├── context-menu.tsx
│   │   │   ├── dialog.tsx                 # ⚠️ Auto-generates X button — use showCloseButton={false}
│   │   │   ├── drawer.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── hover-card.tsx
│   │   │   ├── input-otp.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── resizable.tsx              # Split-pane panels
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── toggle-group.tsx
│   │   │   ├── toggle.tsx
│   │   │   └── tooltip.tsx
│   │   │
│   │   └── notetool/                      # SurgicalBrain domain components
│   │       ├── AccountModal.tsx           # User profile editing modal
│   │       ├── AnnotateCanvas.tsx         # Canvas overlay for annotations (legacy)
│   │       ├── AssetPlaceholder.tsx       # Image/PDF asset placeholder cards
│   │       ├── ConnectomeView.tsx         # D3.js force-directed knowledge graph
│   │       ├── ContentToolbar.tsx         # Add-content sidebar panel (7 tools + diagram builder)
│   │       ├── DDxSplitter.tsx            # Side-by-side differential diagnosis comparison
│   │       ├── DeveloperView.tsx          # Split-pane WYSIWYG + raw HTML editor
│   │       ├── DissectionView.tsx         # High-Yield Summary collapsible wrapper
│   │       ├── FlashcardBlock.tsx         # Cloze & Image Occlusion flashcards with 3D flip
│   │       ├── GlobalAnnotationOverlay.tsx # Global pen overlay (works across entire app)
│   │       ├── HomeScreen.tsx             # Home dashboard with folders, recent notes, quick actions
│   │       ├── ICDTagger.tsx             # ICD-10/SNOMED code tag badges
│   │       ├── MCQBlock.tsx              # Interactive SBA question block with reveal
│   │       ├── MarkdownRenderer.tsx      # Markdown renderer with Mermaid code block detection
│   │       ├── MedLibrary.tsx            # Medical library browser panel
│   │       ├── MermaidDiagram.tsx        # Clinical algorithm Mermaid.js renderer with zoom
│   │       ├── MermaidMakerGUI.tsx       # Visual flow-based diagram builder (34KB)
│   │       ├── MindmapView.tsx           # Markmap collapsible mindmap renderer
│   │       ├── NewNoteModal.tsx          # Create new synthesis note modal
│   │       ├── NoteTabs.tsx             # Tabbed interface for multi-content sections
│   │       ├── PdfWorkspace.tsx          # PDF-to-Synthesis split-screen viewer
│   │       ├── SettingsModal.tsx         # Application settings modal
│   │       ├── Sidebar.tsx              # Obsidian-style sidebar with note navigation & folders
│   │       ├── StatusBar.tsx            # Minimized bottom status bar
│   │       ├── ThemeSync.tsx            # Theme synchronization across components
│   │       └── TriModeSwitcher.tsx      # Read / Annotate / Developer mode toggle
│   │
│   ├── stores/
│   │   └── notetool-store.ts            # Zustand global state (persisted to localStorage, 607 lines)
│   │
│   ├── lib/
│   │   ├── db.ts                        # Prisma client singleton
│   │   └── utils.ts                     # Utility functions (cn, etc.)
│   │
│   ├── hooks/
│   │   ├── use-toast.ts                 # Toast notification hook
│   │   └── use-mobile.ts               # Mobile detection hook
│   │
│   └── data/
│       └── demo-notes/
│           └── acute-heart-failure.ts   # Demo notes: AHF, COPD, Lap Chole, AKI
│
├── assets/                               # Media assets directory
│   └── {Note_ID}/                        # Per-note asset subdirectories
│       └── (images, PDFs, videos)
│
├── download/                             # Pre-built download artifacts
│   ├── README.md
│   └── SurgicalBrain-NoteTool.zip
│
├── upload/                               # Uploaded/imported files
│   ├── Quiz.html
│   ├── notetool.zip
│   ├── LibTool.zip
│   └── notetool_extracted/              # Original Vite project source (reference)
│
├── examples/
│   └── websocket/
│       ├── server.ts                    # WebSocket server example
│       └── frontend.tsx                 # WebSocket client example
│
└── electron/                             # Electron wrapper (see §10)
    ├── main.ts                          # Electron main process
    └── preload.ts                       # Context bridge / preload script
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BROWSER / ELECTRON RENDERER                      │
│                                                                         │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────────────────┐   │
│  │  User    │───▶│  Zustand Store   │───▶│  React Components        │   │
│  │ Actions  │    │  (notetool-store)│    │  (page.tsx + notetool/)  │   │
│  └──────────┘    └────────┬─────────┘    └──────────────────────────┘   │
│                           │                                             │
│                    persist middleware (partialize)                       │
│                           │                                             │
│                    ┌──────▼──────┐                                      │
│                    │ localStorage│  ← Auto-saved: notes, folders,       │
│                    │  (v2 key)   │    userProfile, settings,            │
│                    └─────────────┘    activeNoteId, annotations,        │
│                                       sidebarOpen, mcq/flashcard state │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Global Annotation Overlay (GlobalAnnotationOverlay.tsx)         │   │
│  │  ┌─────────┐ ┌──────────────┐ ┌───────────┐ ┌───────────────┐  │   │
│  │  │  Pen    │ │ Text Highlight│ │ Free      │ │  Sticky Notes │  │   │
│  │  │ Drawing │ │ (DOM ranges)  │ │ Highlight │ │  (draggable)  │  │   │
│  │  └─────────┘ └──────────────┘ └───────────┘ └───────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Export Pipeline                                                 │   │
│  │  ┌──────────┐  ┌───────────┐  ┌────────────────────────────┐   │   │
│  │  │ JSON     │  │ HTML      │  │ PDF (html2canvas + jsPDF)  │   │   │
│  │  │ Export   │  │ Export    │  │ Requires CSS var() → hex   │   │   │
│  │  └──────────┘  └───────────┘  └────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐    ┌──────────────────────────────┐
│  Next.js API Routes (optional)  │    │  Prisma + SQLite (optional)  │
│  src/app/api/route.ts           │◀──▶│  src/lib/db.ts               │
└──────────────────────────────────┘    └──────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  ELECTRON MAIN PROCESS (desktop only)                                    │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────────────┐  │
│  │ BrowserWindow │   │  IPC Handlers    │   │  File System Access    │  │
│  │ (main.ts)    │──▶│  (read/write/    │──▶│  /assets/{Note_ID}/    │  │
│  │              │   │   dialog/exports)│   │  /notes/*.json         │  │
│  └──────────────┘   └──────────────────┘   └────────────────────────┘  │
│                                                                         │
│  ┌──────────────┐                                                       │
│  │ preload.ts   │  contextBridge.exposeInMainWorld → safe APIs          │
│  └──────────────┘                                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
<RootLayout>                         ← layout.tsx (Geist fonts, dark, Toaster)
  └─ <Home>                         ← page.tsx (main application shell)
       ├─ <header>                  ← Breadcrumb, TriModeSwitcher, action buttons
       │    ├─ <TriModeSwitcher>    ← Read / Annotate / Developer toggle
       │    ├─ Search Button        ← Opens Command Palette (Cmd+K)
       │    ├─ Pen Toggle           ← GlobalAnnotationOverlay switch
       │    ├─ Export Dropdown      ← JSON / HTML / PDF export
       │    ├─ Dissection Toggle    ← DissectionView switch
       │    ├─ DDx Toggle           ← DDx Splitter switch
       │    ├─ Add Content Button   ← ContentToolbar panel
       │    ├─ Settings Button      ← SettingsModal
       │    └─ Account Button       ← AccountModal
       │
       ├─ <div flex>
       │    ├─ <Sidebar>           ← Note list, folders, view switcher, library
       │    └─ <main>
       │         ├─ [home view]    → HomeScreen (dashboard, folder cards, recent notes)
       │         │
       │         ├─ [notes view]   ← renderNoteContent()
       │         │    ├─ <ICDTagger>
       │         │    ├─ <DissectionView>
       │         │    │    └─ <NoteSection>*  ← renderSection() per type
       │         │    │         ├─ content → MarkdownRenderer → ReactMarkdown
       │         │    │         ├─ mermaid/algorithm → MermaidDiagram
       │         │    │         ├─ tabs → NoteTabs
       │         │    │         ├─ mcq → MCQBlock
       │         │    │         ├─ flashcard → FlashcardBlock
       │         │    │         ├─ asset → AssetPlaceholder
       │         │    │         └─ pdf-embed → <embed> tag
       │         │    └─ <DeveloperView>   (if mode === 'developer')
       │         │
       │         ├─ [library view]  → MedLibrary
       │         ├─ [connectome]    → ConnectomeView
       │         ├─ [mindmap]       → MindmapView
       │         ├─ [ddx]           → DDxSplitter
       │         └─ [pdf-workspace] → PdfWorkspace
       │
       ├─ <ContentToolbar>          ← Animated slide-in panel (7 tools)
       │    └─ <MermaidMakerGUI>    ← Full-screen diagram builder (opened from toolbar)
       ├─ <GlobalAnnotationOverlay> ← Transparent canvas over entire app
       ├─ <SettingsModal>           ← Dialog
       ├─ <NewNoteModal>            ← Dialog
       ├─ <AccountModal>            ← Dialog
       ├─ <StatusBar>               ← Bottom status bar
       ├─ <ThemeSync>               ← Theme synchronization
       └─ <Command Palette>         ← Cmd+K overlay
```

---

## 3. Agent Roles

### [The Architect]

**Scope:** File structure, data persistence, Electron IPC, local CRUD logic, store design.

**Responsibilities:**
- Maintain the project directory structure and ensure consistent naming conventions across all modules.
- Design and implement the local-first data persistence layer using Zustand + localStorage (web) and structured JSON files on the filesystem (Electron).
- Manage the Electron wrapper configuration for cross-platform desktop deployment (Windows/macOS/Linux).
- Implement IPC (Inter-Process Communication) bridges between the renderer and main process in Electron.
- Design the asset storage convention: `/assets/{Note_ID}/image_01.png` and enforce strict file-system mapping.
- Ensure all data operations follow a local-first paradigm — no network dependency for core functionality.
- Define the Note schema (frontmatter + body + metadata) and version it properly.
- Own the Zustand store structure: state shape, actions, persistence config, `partialize` selection.
- Manage the Next.js configuration (`next.config.ts`) for both web and Electron targets.
- Design and maintain the folders system for note organization.
- Implement per-note section CRUD operations (`addSectionToNote`, `removeSectionFromNote`, `updateSectionInNote`).

**File Ownership:**
| File | Responsibility |
|------|---------------|
| `src/stores/notetool-store.ts` | Zustand global state, all interfaces, persist config |
| `src/lib/db.ts` | Prisma client singleton |
| `src/lib/utils.ts` | Utility functions |
| `src/data/demo-notes/acute-heart-failure.ts` | Demo note data and schema exemplar |
| `src/app/api/route.ts` | API route scaffolding |
| `src/app/layout.tsx` | Root layout with providers |
| `src/app/page.tsx` | Main application shell and orchestrator |
| `next.config.ts` | Next.js build configuration |
| `prisma/schema.prisma` | Database schema |
| `electron/main.ts` | Electron main process (future) |
| `electron/preload.ts` | Context bridge (future) |

**Design Principles:**
- Every note is a self-contained unit with its own directory, HTML/JSON body, and assets subfolder.
- Data integrity over convenience — always validate before write.
- Atomic writes: never leave a note in a partially-saved state.
- The store is the single source of truth — all components read from and write to the store.
- Annotations are stored per-note via `annotationsPerNote` to enable switching without loss.
- The store uses `partialize` to persist only essential fields to localStorage, avoiding bloat.
- Folders are a lightweight organizational layer — notes can exist without a folder.
- Per-note section CRUD allows dynamic content addition without separate `dynamicSections` array.

---

### [The Stylist]

**Scope:** Unified, professional "Medical-Grade" CSS system — high legibility, clean spacing, accessibility.

**Responsibilities:**
- Maintain and extend the design token system (colors, typography, spacing, radii) in `globals.css`.
- Enforce a consistent visual language across all three Tri-Mode interfaces.
- Ensure WCAG AA compliance for all text contrast ratios, especially in the Read-Only "Clean-Room" mode.
- Design high-contrast dark mode optimized for low-light clinical environments (night rounds).
- Create and maintain component-specific style overrides for medical content:
  - Mermaid diagram theming (clinical color palette, edge label transparency fix)
  - MCQ/Flashcard card styles with clear visual hierarchy
  - Annotate mode canvas overlay styles
  - MermaidMakerGUI step builder styles with flow layout
- Implement responsive breakpoints for tablet (rounds) and desktop (study) use cases.
- Maintain a "Medical-Grade" typographic scale: 15px base, 1.65 line-height, generous paragraph spacing.
- Own all CSS animation definitions (Framer Motion supplements, not replaces).
- Maintain glassmorphism utility classes and Obsidian-style sidebar aesthetics.
- Fix CSS rendering bugs in Mermaid: black boxes on edge labels (`fill: transparent !important`), arrowhead markers.

**File Ownership:**
| File | Responsibility |
|------|---------------|
| `src/app/globals.css` | Design tokens, CSS custom properties, global styles, animations |
| `src/components/notetool/GlobalAnnotationOverlay.tsx` | Annotation canvas overlay styles |
| `src/components/notetool/Sidebar.tsx` | Obsidian-style sidebar aesthetics |
| `src/components/notetool/StatusBar.tsx` | Minimized status bar styles |
| `src/components/notetool/TriModeSwitcher.tsx` | Mode toggle visual states |
| `src/components/notetool/MermaidMakerGUI.tsx` | Diagram builder step flow styles |
| `tailwind.config.ts` | Tailwind theme extensions |

**Design Token Reference Table:**

| Token | Value | Usage |
|-------|-------|-------|
| `--color-sb-bg` | `#0d1117` | App background (GitHub dark) |
| `--color-sb-surface` | `#161b22` | Card/panel background |
| `--color-sb-surface2` | `#1c2330` | Elevated surface |
| `--color-sb-surface3` | `#222a36` | Highest elevation surface |
| `--color-sb-border` | `#30363d` | Border color |
| `--color-sb-accent` | `#f0a500` | Primary accent (amber/gold) |
| `--color-sb-text` | `#e6edf3` | Primary text |
| `--color-sb-muted` | `#8b949e` | Secondary/muted text |
| `--color-sb-correct` | `#2ea043` | Correct answer indicator |
| `--color-sb-wrong` | `#da3633` | Wrong answer / critical indicator |
| `--color-clinical-accent` | `#f0a500` | Clinical action color |
| `--color-alert-critical` | `#da3633` | Danger/critical findings |
| `--color-alert-caution` | `#f0a500` | Caution/moderate severity |
| `--color-alert-safe` | `#2ea043` | Safe/normal/reassuring |
| `--color-annotate-highlight` | `rgba(240,165,0,0.3)` | Highlight overlay color |
| `--color-cardiac` | `#f43f5e` | Cardiology specialty color |
| `--color-respiratory` | `#38bdf8` | Respiratory specialty color |
| `--color-renal` | `#a78bfa` | Nephrology specialty color |
| `--color-neuro` | `#fb923c` | Neurology specialty color |
| `--color-gi` | `#4ade80` | GI specialty color |
| `--color-surgical` | `#f0a500` | Surgery specialty color |

**Color Palette Reference:**

```
┌──────────────────────────────────────────────────────────────┐
│  SURFACE LAYER                                               │
│  ██████ #0d1117  BG          ██████ #161b22  Surface 1      │
│  ██████ #1c2330  Surface 2   ██████ #222a36  Surface 3      │
│  ██████ #30363d  Border                                              │
├──────────────────────────────────────────────────────────────┤
│  TEXT LAYER                                                   │
│  ██████ #e6edf3  Primary     ██████ #8b949e  Muted           │
├──────────────────────────────────────────────────────────────┤
│  ACCENT LAYER                                                 │
│  ██████ #f0a500  Amber/Gold  ██████ #ffc844  Amber Light    │
├──────────────────────────────────────────────────────────────┤
│  SEMANTIC LAYER                                               │
│  ██████ #2ea043  Correct     ██████ #da3633  Wrong/Critical  │
├──────────────────────────────────────────────────────────────┤
│  SPECIALTY LAYER                                              │
│  ██████ #f43f5e  Cardiac     ██████ #38bdf8  Respiratory     │
│  ██████ #a78bfa  Renal       ██████ #fb923c  Neuro           │
│  ██████ #4ade80  GI          ██████ #f0a500  Surgical        │
└──────────────────────────────────────────────────────────────┘
```

**CSS Class Conventions:**
- `.glass` / `.glass-strong` — Glassmorphism backgrounds with backdrop-filter blur
- `.glass-panel` / `.glass-panel-strong` — Frosted glass card panels
- `.prose` — Medical-grade typography for markdown content
- `.serif-title` — Georgia/serif font for note titles
- `.read-mode-text` — High-contrast enhancement for Read mode
- `.flashcard-container` / `.flashcard-inner` — 3D flip animation
- `.annotation-highlight` — Non-destructive highlight overlay
- `.sticky-note-shadow` — Sticky note drop shadow
- `.hover-lift` — Card hover animation
- `.notion-hover` — Subtle Notion-style hover effect
- `.obsidian-sidebar-item` — Sidebar list items with active indicator bar
- `.command-palette` — Floating search overlay
- `.fullscreen-view` — Immersive fullscreen for Connectome/Mermaid/Mindmap
- `.minimized-statusbar` — Bottom status bar
- `.pulse-gold` / `.pulse-green` — Status indicator animations
- `.logo-glow` — SB logo glow animation
- `.fab-bounce-in` — Floating action button entrance animation
- `.color-swatch` — Color picker swatch styles
- `.mcq-option-key` — MCQ option letter key badge
- `.explanation-expand` — MCQ explanation slide-in animation
- `.edgeLabel` — Mermaid edge labels (requires `fill: transparent !important`)

---

### [The Clinical Strategist]

**Scope:** MCQ templates, clinical algorithms, educational principles, content quality.

**Responsibilities:**
- Design MCQ block templates following the "Single Best Answer" (SBA) format standard in medical examinations.
- Ensure all clinical algorithms in Mermaid diagrams follow established guideline pathways (e.g., NICE, AHA/ACC, ESC).
- Create Flashcard templates that implement Active Recall and Spaced Repetition principles:
  - Cloze deletion cards for key facts (drug mechanisms, diagnostic criteria).
  - Image Occlusion cards for anatomy and radiology (identify structures on labeled images).
- Validate that clinical decision trees in interactive notes reflect current best practices.
- Design the "Dissection View" logic: define what constitutes a "High-Yield Summary" vs. textbook detail.
- Ensure the DDx (Differential Diagnosis) Splitter comparison tables highlight discriminating features, not just listing symptoms.
- Implement ICD-10/SNOMED CT tagging schemas for professional-grade indexing.
- Review all demo note content for clinical accuracy and educational value.
- Design the `highYieldSummary` bullet point format: each bullet must be self-contained and actionable.
- Define MermaidMakerGUI presets (Clinical Pathway, Decision Tree, Protocol) for common clinical patterns.

**File Ownership:**
| File | Responsibility |
|------|---------------|
| `src/components/notetool/MCQBlock.tsx` | Interactive MCQ with reveal explanation |
| `src/components/notetool/FlashcardBlock.tsx` | Cloze & Image Occlusion flashcards |
| `src/components/notetool/MermaidDiagram.tsx` | Clinical algorithm renderer |
| `src/components/notetool/DDxSplitter.tsx` | Differential diagnosis comparison |
| `src/components/notetool/DissectionView.tsx` | High-yield summary collapser |
| `src/components/notetool/ICDTagger.tsx` | ICD-10/SNOMED code tag display |
| `src/components/notetool/NoteTabs.tsx` | Multi-tab content (e.g., Pathophys vs Pharm) |
| `src/components/notetool/ContentToolbar.tsx` | Add-content panel |
| `src/components/notetool/MedLibrary.tsx` | Medical library browser |
| `src/data/demo-notes/acute-heart-failure.ts` | Demo note content and clinical data |

**SBA Format Standards:**

Each MCQ must follow this structure:
1. **Clinical Vignette**: A realistic patient presentation with age, sex, relevant history, key vital signs, and examination findings.
2. **Stem Question**: "What is the most appropriate…" / "Which of the following is the most likely…" / "What is the next best step in management?"
3. **Options**: 5 options (A–E), with one clearly best answer. Distractors must be plausible.
4. **Explanation**: Mandatory detailed explanation that:
   - States the correct answer and why
   - Explains why each distractor is wrong
   - References clinical guidelines or key trials where applicable
   - Uses the "teaching not testing" principle

**Active Recall / Spaced Repetition Guidelines:**

| Card Type | Format | Example |
|-----------|--------|---------|
| **Cloze Deletion** | `___` blanks in a statement | "The first-line diuretic in AHF is ___ (1-2x oral dose)" |
| **Image Occlusion** | Identify structures on labeled images | "Label the structure at the arrow on this CXR" |
| **Key Fact** | Front: question, Back: answer | "BNP <100 effectively rules out ___" → "Heart failure" |

**High-Yield Summary Guidelines:**
- Each bullet ≤ 120 characters
- Must be self-contained (understandable without context)
- Must use active voice and definitive language
- Must include specific numbers where relevant (BNP thresholds, drug doses, mortality rates)
- Order: definition → key features → classification → management → investigations → pearls

---

### [The Asset Manager]

**Scope:** Image/PDF embedding, file-system mapping, media handling, export pipeline.

**Responsibilities:**
- Implement the asset resolution pipeline: `Note_ID → /assets/{Note_ID}/filename.ext`.
- Design the PDF-to-Synthesis Workspace: split-screen PDF viewer with highlight-to-snippet extraction.
- Handle image embedding with proper lazy loading, zoom controls, and caption management.
- Create placeholder components for assets not yet uploaded (e.g., "Upload Chest X-ray here").
- Manage the Annotate mode canvas layer for non-destructive overlays on images and text.
- Implement export schemas for flashcards (Anki-compatible format).
- Handle drag-and-drop asset insertion into notes.
- Manage the PDF workspace file upload flow (File object → Object URL → iframe).
- Ensure asset cleanup on note deletion (revoke Object URLs, remove files).
- Own the export pipeline: JSON, HTML, and PDF export implementations.
- Ensure PDF export correctly resolves CSS `var()` functions to hex colors before html2canvas capture.

**File Ownership:**
| File | Responsibility |
|------|---------------|
| `src/components/notetool/AssetPlaceholder.tsx` | Image/PDF asset placeholders |
| `src/components/notetool/PdfWorkspace.tsx` | PDF-to-Synthesis split screen |
| `src/components/notetool/AnnotateCanvas.tsx` | Non-destructive annotation layer (legacy) |
| `src/components/notetool/GlobalAnnotationOverlay.tsx` | Global pen overlay (current) |
| `src/app/page.tsx` (export functions) | JSON, HTML, PDF export logic |

**Asset Naming Conventions:**

| Asset Type | Prefix | Example |
|-----------|--------|---------|
| Chest X-ray | `cxr_` | `cxr_01.png`, `cxr_pulmonary_edema.png` |
| ECG | `ecg_` | `ecg_02.svg` |
| CT Scan | `ct_` | `ct_head_01.png` |
| MRI | `mri_` | `mri_brain_01.png` |
| Ultrasound | `us_` | `us_abdominal_01.png` |
| Pathology | `path_` | `path_histo_01.png` |
| Clinical Photo | `photo_` | `photo_rash_01.jpg` |
| PDF Document | `doc_` | `doc_guideline_01.pdf` |
| Video | `vid_` | `vid_procedure_01.mp4` |

**Supported Formats:**

| Category | Extensions | Max Size |
|----------|-----------|----------|
| Images | `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp` | 50 MB |
| Documents | `.pdf` | 100 MB |
| Video | `.mp4`, `.webm` | 500 MB |

**Export Formats:**
| Format | Method | Output |
|--------|--------|--------|
| JSON | `JSON.stringify(note, null, 2)` | Full note data with all sections, MCQs, flashcards |
| HTML | `sectionToExportHtml()` + `mdToHtml()` | Readable standalone HTML document with dark theme |
| PDF | `html2canvas` + `jsPDF` | PDF document captured from rendered DOM |

---

### [The Diagram Builder]

**Scope:** Visual flowchart builder, Mermaid code generation, step-based editing, zoom/pan integration.

**Responsibilities:**
- Design and maintain the MermaidMakerGUI component — a visual step-based flowchart builder that generates valid Mermaid code.
- Implement the `FlowStep` and `Branch` data model for representing flow diagrams.
- Build and maintain the `stepsToMermaid()` code generation function that converts step arrays to valid `graph TD` Mermaid syntax.
- Create and maintain preset templates (Clinical Pathway, Decision Tree, Protocol) for common clinical patterns.
- Integrate `react-zoom-pan-pinch` (TransformWrapper) for zoom/pan in the Mermaid preview panel. **CRITICAL**: Use `setTransform(x, y, scale)` — never `zoomTo()` which does not exist on the API.
- Implement branch management for decision steps (up to 5 branches per decision node).
- Handle insert-between step logic with proper flow reconnection.
- Ensure the live Mermaid preview renders correctly with the medical dark theme.
- Own the MermaidDiagram component configuration: `htmlLabels: false`, `curve: 'basis'`, `padding: 20`, custom theme variables.
- Maintain CSS fixes for Mermaid rendering: transparent edge label backgrounds, correct arrowhead markers.
- Ensure `embedded` prop works correctly for inline vs fullscreen Mermaid rendering.

**File Ownership:**
| File | Responsibility |
|------|---------------|
| `src/components/notetool/MermaidMakerGUI.tsx` | Visual flow-based diagram builder (34KB) |
| `src/components/notetool/MermaidDiagram.tsx` | Clinical algorithm renderer with zoom controls |
| `src/components/notetool/MarkdownRenderer.tsx` | Markdown renderer with Mermaid code block detection |
| `src/app/globals.css` (Mermaid CSS fixes) | Edge label transparency, arrowhead fixes |

**Step Kind Configuration:**

| Kind | Label | Medical Term | Mermaid Shape | Color |
|------|-------|-------------|---------------|-------|
| `start` | Start | Entry Point | `(...)` rounded | Emerald |
| `process` | Process | Action / Step | `[...]` rectangle | Blue |
| `decision` | Decision | If / Branch | `{...}` diamond | Amber |
| `milestone` | Milestone | Checkpoint | `([...])` stadium | Violet |
| `end` | End | Outcome | `(...)` rounded | Rose |

**Preset Templates:**
1. **Clinical Pathway** — A risk-stratified pathway with high/low branches converging on re-evaluation
2. **Decision Tree** — A diagnostic algorithm with lab/imaging decision points
3. **Protocol** — A sequential treatment protocol with a response decision and escalation loop

**Mermaid Configuration:**
```typescript
const mermaidConfig = {
  theme: 'dark',
  htmlLabels: false,        // CRITICAL: prevents black-box rendering artifacts
  flowchart: {
    curve: 'basis',          // Smooth curved edges
    padding: 20,             // Comfortable spacing around nodes
  },
  themeVariables: {
    primaryColor: '#1c2330',
    primaryTextColor: '#e6edf3',
    primaryBorderColor: '#f0a500',
    lineColor: '#8b949e',
    secondaryColor: '#222a36',
    tertiaryColor: '#0d1117',
  },
};
```

**Integration Flow:**
When saving, the builder calls `onSave({ code, title })` which creates a `NoteSection`:
```typescript
const section: NoteSection = {
  id: generateId(),
  type: 'mermaid',
  title: data.title || 'Flowchart',
  content: { id: generateId(), title: data.title || 'Flowchart', code: data.code.trim() },
  dynamic: true,
};
addSectionToNote(activeNoteId, section);
```

---

## 4. Data Model

### Complete TypeScript Interfaces

```typescript
// ─── Core Types ──────────────────────────────────────────────────

type AppMode = 'read' | 'annotate' | 'developer';

type GlobalPenTool = 'pen' | 'highlight-text' | 'highlight-free' | 'sticky' | 'eraser' | 'pan';

type ViewPanel = 'home' | 'notes' | 'library' | 'connectome' | 'ddx' | 'mindmap' | 'pdf-workspace';

// ─── Note Data ───────────────────────────────────────────────────

interface NoteData {
  id: string;                       // e.g., 'acute-heart-failure'
  title: string;                    // e.g., 'Acute Heart Failure Management'
  category: string;                 // e.g., 'Cardiology'
  specialty: string;                // e.g., 'Cardiology'
  summary: string;                  // One-line clinical summary
  icd10Codes: string[];             // e.g., ['I50.0', 'I50.1', 'I50.9']
  snomedCodes: string[];            // e.g., ['42343007', '266275004']
  tags: string[];                   // e.g., ['heart-failure', 'emergency', 'pharmacology']
  folder?: string;                  // Optional folder assignment, e.g., 'Cardiology'
  sections: NoteSection[];          // Ordered content sections
  highYieldSummary: string[];       // Bullet points for Dissection View
  links: NoteLink[];                // Connections to other notes (the Connectome)
  ddxComparison?: DdxRow[];         // Differential diagnosis comparison table
  createdAt: number;                // Unix timestamp (ms)
  updatedAt: number;                // Unix timestamp (ms)
}

interface NoteLink {
  targetId: string;                 // Target note ID
  relation: string;                 // e.g., 'differential-diagnosis', 'via-RAA-system'
  label: string;                    // e.g., 'COPD Exacerbation', 'Cardiorenal Syndrome'
}

interface DdxRow {
  feature: string;                  // e.g., 'Breath sound character'
  [key: string]: string;            // Dynamic keys for each condition being compared
}

// ─── Note Section ────────────────────────────────────────────────

interface NoteSection {
  id: string;                       // e.g., 'overview', 'clinical-algorithm'
  title: string;                    // Section heading
  type: 'content' | 'mcq' | 'flashcard' | 'mermaid' | 'algorithm' | 'tabs' | 'asset' | 'pdf-embed';
  content: unknown;                 // Typed by section type (see below)
  dynamic?: boolean;                // true = user-added at runtime, shows remove/edit buttons
}

// ─── MCQ Data ────────────────────────────────────────────────────

interface MCQData {
  id: string;                       // e.g., 'ahf-mcq-1'
  question: string;                 // Clinical vignette + stem question
  options: string[];                // Array of 4-8 options (A–E most common)
  correctIndex: number;             // Zero-based index of correct answer
  explanation: string;              // Detailed explanation (markdown)
}

interface MCQAnswerState {
  selected: number | null;          // Currently selected option index
  revealed: boolean;                // Whether explanation is shown
  flagged: boolean;                 // User flag for review
}

// ─── Flashcard Data ──────────────────────────────────────────────

interface FlashcardData {
  id: string;                       // e.g., 'fc-1'
  type: 'cloze' | 'image-occlusion';
  front: string;                    // Question / cloze statement
  back: string;                     // Answer / revealed content
  tags: string[];                   // e.g., ['pharmacology', 'emergency']
}

interface FlashcardState {
  flipped: boolean;                 // Whether card is showing the back
}

// ─── Mermaid / Algorithm Data ────────────────────────────────────

interface MermaidData {
  id: string;                       // e.g., 'ahf-algorithm'
  title: string;                    // Algorithm title
  code: string;                     // Mermaid.js syntax (graph TD, flowchart, etc.)
}

// ─── Flow Step Data (MermaidMakerGUI) ────────────────────────────

type StepKind = 'start' | 'process' | 'decision' | 'milestone' | 'end';

interface FlowStep {
  id: string;
  kind: StepKind;
  label: string;
  branches: Branch[];               // For decisions: outgoing branches
  nextId: string | null;            // ID of the next step in main flow
}

interface Branch {
  id: string;
  label: string;                    // e.g. "Yes", "Abnormal", "High Risk"
  targetId: string | null;          // null = not connected yet
}

// ─── Asset Reference ─────────────────────────────────────────────

interface AssetRef {
  id: string;                       // e.g., 'cxr-01'
  noteId: string;                   // Parent note ID
  filename: string;                 // e.g., 'cxr_pulmonary_edema.png'
  type: 'image' | 'video';         // Media type
  caption: string;                  // Descriptive caption
  url?: string;                     // External URL or base64 data URL
  path?: string;                    // Internal path
  dataUrl?: string;                 // Base64-encoded data URL (for uploaded files)
}

// ─── PDF Embed Data ──────────────────────────────────────────────

interface PdfEmbedData {
  dataUrl: string;                  // Base64 data URL of the PDF
  filename: string;                 // Display filename
  noteId: string;                   // ID of the parent note
}

// ─── Tab Data ────────────────────────────────────────────────────

interface TabData {
  tabs: { id: string; label: string; content: string }[];
}

// ─── Annotation Data ─────────────────────────────────────────────

interface StickyNote {
  id: string;
  x: number;                        // Position X (px)
  y: number;                        // Position Y (px)
  text: string;                     // Note content
  color: string;                    // Background color
  timestamp: number;                // Creation time
}

interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HighlightRegion {
  id: string;
  text: string;                     // Highlighted text content
  color: string;                    // Highlight color
  rangeInfo: {
    startContainerPath: string;     // DOM path to start container
    startOffset: number;
    endContainerPath: string;       // DOM path to end container
    endOffset: number;
  };
  rect: HighlightRect;             // Primary bounding rect
  rects: HighlightRect[];          // All rects (for multi-line highlights)
}

interface DrawingPath {
  id: string;
  points: { x: number; y: number }[];  // Drawing coordinates
  color: string;                        // Stroke color
  strokeWidth: number;                  // Stroke width in px
}

interface NoteAnnotations {
  stickyNotes: StickyNote[];
  highlightRegions: HighlightRegion[];
  drawingPaths: DrawingPath[];
}

// ─── User Profile & Settings ─────────────────────────────────────

interface UserProfile {
  name: string;                     // e.g., 'Dr. Surgeon'
  specialty: string;                // e.g., 'Cardiology'
  institution: string;              // e.g., 'General Hospital'
  avatar: string;                   // Avatar URL or data URI
}

interface AppSettings {
  autoDissect: boolean;             // Auto-enable Dissection View
  connectomeSync: boolean;          // Sync Connectome links
  fontSize: number;                 // Base font size (px)
  theme: 'dark' | 'light';         // Theme preference
  annotationToolbarPosition: 'top' | 'bottom' | 'left' | 'right';  // Toolbar position
}
```

### Store State Documentation

The Zustand store (`notetool-store.ts`, 607 lines) is the single source of truth for the entire application. It uses `persist` middleware with `localStorage` and selective `partialize`.

**Storage Key:** `notetool-storage-v2` (versioned — bumping this key clears stale data)

**Persisted Fields (via `partialize`):**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `notes` | `NoteData[]` | `[]` | All note data (seeded from demo) |
| `folders` | `string[]` | `['Cardiology', 'Surgery', 'Nephrology', 'Emergency']` | Folder names for organization |
| `userProfile` | `UserProfile` | `{ name: 'Dr. Surgeon', ... }` | User profile |
| `settings` | `AppSettings` | `{ autoDissect: false, ... }` | App settings |
| `activeNoteId` | `string` | `'acute-heart-failure'` | Currently viewed note |
| `annotationsPerNote` | `Record<string, NoteAnnotations>` | `{}` | Per-note annotation storage |
| `sidebarOpen` | `boolean` | `true` | Sidebar visibility |
| `mcqAnswers` | `Record<string, MCQAnswerState>` | `{}` | Per-question answer state |
| `flashcardStates` | `Record<string, FlashcardState>` | `{}` | Per-card flip state |

**Non-Persisted Fields (reset on reload):**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `AppMode` | `'read'` | Current tri-mode |
| `activeView` | `ViewPanel` | `'home'` | Current view panel (default: home dashboard) |
| `dissectionMode` | `boolean` | `false` | Dissection view toggle |
| `globalPenActive` | `boolean` | `false` | Global pen overlay |
| `globalPenTool` | `GlobalPenTool` | `'pan'` | Current pen tool |
| `stickyNotes` | `StickyNote[]` | `[]` | Current note sticky notes |
| `highlightRegions` | `HighlightRegion[]` | `[]` | Current note highlights |
| `drawingPaths` | `DrawingPath[]` | `[]` | Current note drawings |
| `contentToolbarOpen` | `boolean` | `false` | Content toolbar panel |
| `searchOpen` | `boolean` | `false` | Command palette |
| `searchQuery` | `string` | `''` | Search query text |
| `fullscreenView` | `'none' \| 'connectome' \| 'mermaid' \| 'mindmap'` | `'none'` | Fullscreen visualization |
| `fullscreenMermaidCode` | `string` | `''` | Code for fullscreen Mermaid |
| `pdfFile` | `File \| null` | `null` | Loaded PDF file |
| `pdfPageNum` | `number` | `1` | Current PDF page |
| `developerCode` | `string` | `''` | Developer mode HTML code |
| `settingsModalOpen` | `boolean` | `false` | Settings modal |
| `newNoteModalOpen` | `boolean` | `false` | New note modal |
| `accountModalOpen` | `boolean` | `false` | Account modal |
| `highlightColor` | `string` | `'var(--color-sb-accent)'` | Highlight overlay color |
| `drawingColor` | `string` | `'var(--color-sb-accent)'` | Drawing pen color |
| `drawingBrushSize` | `number` | `3` | Pen brush size in px |

**Key Store Actions:**

| Action | Signature | Description |
|--------|-----------|-------------|
| `setMode` | `(mode: AppMode) => void` | Switch tri-mode |
| `setActiveView` | `(view: ViewPanel) => void` | Switch view panel |
| `addNote` | `(note: NoteData) => void` | Create new note (prevents duplicate IDs) |
| `updateNote` | `(id: string, updates: Partial<NoteData>) => void` | Update note fields (auto-sets `updatedAt`) |
| `deleteNote` | `(id: string) => void` | Delete note (falls back to first note) |
| `duplicateNote` | `(id: string) => void` | Clone note with `(Copy)` suffix and new ID |
| `setActiveNoteId` | `(id: string) => void` | Switch active note (saves/loads annotations) |
| `addFolder` | `(name: string) => void` | Add folder (deduped) |
| `renameFolder` | `(oldName: string, newName: string) => void` | Rename folder + update notes in it |
| `deleteFolder` | `(name: string, deleteNotes?: boolean) => void` | Delete folder, optionally its notes |
| `moveNoteToFolder` | `(noteId: string, folderName: string) => void` | Move note to folder |
| `addSectionToNote` | `(noteId: string, section: NoteSection) => void` | Append section to note |
| `removeSectionFromNote` | `(noteId: string, sectionId: string) => void` | Remove section from note |
| `updateSectionInNote` | `(noteId: string, sectionId: string, content: unknown) => void` | Update section content |
| `addStickyNote` | `(note: StickyNote) => void` | Add sticky note |
| `addHighlightRegion` | `(region: HighlightRegion) => void` | Add text highlight |
| `addDrawingPath` | `(path: DrawingPath) => void` | Add drawing stroke |
| `clearAllAnnotations` | `() => void` | Clear all current annotations |
| `setMCQAnswer` | `(id: string, state: Partial<MCQAnswerState>) => void` | Update MCQ answer (merges with existing) |
| `resetMCQAnswer` | `(id: string) => void` | Reset single MCQ answer |
| `resetAllMCQAnswers` | `() => void` | Reset all MCQ answers |
| `setFlashcardFlipped` | `(id: string, flipped: boolean) => void` | Flip flashcard |
| `resetAllFlashcards` | `() => void` | Reset all flashcard states |
| `setGlobalPenActive` | `(active: boolean) => void` | Toggle pen overlay |
| `setFullscreenView` | `(view: ...) => void` | Enter/exit fullscreen visualization |
| `setAnnotationsForNote` | `(noteId: string, annotations: NoteAnnotations) => void` | Set annotations for a note |

**Store Design Notes:**
- `setActiveNoteId` saves current annotations to `annotationsPerNote[currentId]` before switching, then loads the target note's annotations from `annotationsPerNote[targetId]`. This ensures annotation preservation across note switches.
- `addNote` filters existing notes by ID first to prevent duplicates (upsert behavior).
- `setMCQAnswer` uses `Object.assign` to merge partial updates with existing state, preserving unmodified fields.
- Legacy `revealedMCQs` (Set) and `flippedCards` (Set) exist for backward compatibility but new code should use `mcqAnswers` and `flashcardStates` Records instead.

---

## 5. Tri-Mode State Machine

### Mode Diagram

```
                    ┌─────────────────────────────────┐
                    │         Tri-Mode States          │
                    └─────────────────────────────────┘

    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │  READ MODE   │◄───────►│ ANNOTATE MODE│◄───────►│ DEVELOPER    │
    │  (Clean Room)│         │ (Canvas Layer)│         │  MODE        │
    └──────┬───────┘         └──────┬───────┘         └──────┬───────┘
           │                        │                        │
           ▼                        ▼                        ▼
    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │ • High contrast│       │ • Transparent│         │ • Split-pane │
    │ • No editing  │         │   canvas over│         │   WYSIWYG +  │
    │ • MCQ attempt │         │   content    │         │   raw HTML   │
    │   allowed     │         │ • Sticky     │         │ • Live sync  │
    │ • Optimized   │         │   notes      │         │   both panes │
    │   for scanning│         │ • Text & free│         │ • Custom JS  │
    │               │         │   highlights │         │   insertion  │
    │               │         │ • Drawing    │         │ • Developer  │
    │               │         │   pen        │         │   side panel │
    └──────────────┘         └──────────────┘         └──────────────┘
```

### Mode Transition Rules

| From | To | Trigger | Side Effects |
|------|----|---------|-------------|
| Read | Annotate | User clicks "Annotate" in TriModeSwitcher | `globalPenActive` set to `true`, canvas overlay activated |
| Annotate | Read | User clicks "Read" in TriModeSwitcher | `globalPenActive` set to `false`, canvas preserved |
| Annotate | Developer | User clicks "Developer" in TriModeSwitcher | `globalPenActive` set to `false`, developer panel opens |
| Developer | Annotate | User clicks "Annotate" in TriModeSwitcher | `globalPenActive` set to `true`, developer panel closes |
| Developer | Read | User clicks "Read" in TriModeSwitcher | Developer panel closes |
| Any | Read | `Ctrl+1` | — |
| Any | Annotate | `Ctrl+2` | `globalPenActive = true` |
| Any | Developer | `Ctrl+3` | Developer panel opens |

### Mode Behaviors in Detail

#### Read Mode (Clean Room)
- **Purpose**: Rapid scanning during clinical rounds, focused study.
- **Content rendering**: Maximum contrast, anti-aliased text (`read-mode-text`), narrower content width (`max-w-4xl`).
- **Interactivity**: MCQs can still be attempted and answered. Flashcards can still be flipped. All other editing is disabled.
- **Visual cues**: No annotation indicators, no edit handles, no developer panel.
- **Cursor**: Default cursor throughout.

#### Annotate Mode (Canvas Layer)
- **Purpose**: Non-destructive markup of clinical content.
- **Overlay behavior**: A transparent canvas layer overlays the entire application (not just the note content). This enables annotation on ANY part of the UI — sidebar, header, MCQ options, diagrams, etc.
- **Available tools**:
  - **Pen**: Free-form drawing on canvas overlay.
  - **Text Highlight** (`highlight-text`): Select DOM text ranges and apply colored highlight.
  - **Free Highlight** (`highlight-free`): Free-form highlight brush (rectangular overlay).
  - **Sticky Notes**: Draggable, editable sticky notes positioned anywhere.
  - **Eraser**: Remove individual annotations by clicking them.
  - **Pan** (`pan`): Pan/scroll the canvas without drawing.
- **Storage**: Annotations are stored per-note in `annotationsPerNote`. When switching notes, current annotations are saved and the target note's annotations are loaded.
- **Visual cues**: Amber border outline on annotated areas, custom cursor per tool.
- **Non-destructive**: Annotations never modify the base note content. They are overlaid and stored separately.

#### Developer/Edit Mode (Split-Pane)
- **Purpose**: Advanced editing with WYSIWYG preview and raw HTML/JS insertion.
- **Layout**: Main note content on the left (full width), Developer side panel on the right (`w-96`, hidden on mobile).
- **Developer panel**: Contains a code editor for raw HTML/JS and a live preview that renders the code in real-time.
- **Synchronization**: Changes in the code editor are reflected in the preview panel immediately.
- **Custom logic**: Users can insert custom interactive JavaScript (e.g., interactive parameter tables, dynamic calculators).
- **Note content**: The main note area continues to display normally; the developer panel is supplementary.

### Global Annotation Overlay Behavior

The `GlobalAnnotationOverlay` component renders ABOVE the entire application UI (z-index: 50+). It is NOT limited to the note content area. This is a deliberate design choice — clinicians need to annotate anywhere, including:
- Over Mermaid diagrams
- Over Connectome visualizations
- Over MCQ question text
- Over sidebar navigation
- Over PDF workspace

When `globalPenActive` is `true`:
1. The overlay canvas captures all pointer events.
2. The current tool determines the cursor style and interaction mode.
3. Annotations are drawn/highlighted/stuck relative to the viewport.
4. The overlay respects the current annotation color and brush size settings.

When `globalPenActive` is `false`:
1. The overlay becomes transparent to pointer events (`pointer-events: none`).
2. Existing annotations remain visible but are non-interactive.
3. Normal UI interaction (clicking buttons, scrolling, etc.) is restored.

---

## 6. Feature Documentation

### 6.1 Home Screen Dashboard

**Component**: `HomeScreen.tsx`
**Store fields**: `activeView`, `notes`, `folders`

The Home Screen is the default landing view (`activeView === 'home'`). It provides a dashboard overview of the user's medical knowledge library with quick access to folders, recent notes, and creation tools.

**Features:**
- Folder cards showing note counts per specialty area
- Recent notes list with specialty badges and quick-open
- Quick action buttons: New Note, Import, Browse Library
- Overview statistics: total notes, folders, MCQs attempted
- Specialty distribution visualization

### 6.2 Global Pen Overlay

**Component**: `GlobalAnnotationOverlay.tsx`
**Store fields**: `globalPenActive`, `globalPenTool`, `highlightColor`, `drawingColor`, `drawingBrushSize`

The Global Pen Overlay is the universal annotation system that works across the entire application. It is NOT tied to a specific view or content area.

**Features:**
- Works in any mode (primarily used in Annotate mode, but can be activated in any mode).
- Six tools: Pen, Text Highlight, Free Highlight, Sticky Notes, Eraser, Pan.
- Custom cursors per tool (SVG data URIs).
- Color picker for highlight and drawing colors.
- Adjustable brush size for pen tool.
- Per-note annotation storage with automatic save/restore on note switch.
- All annotations are non-destructive — they never modify the underlying note data.

**Interaction Flow:**
1. User activates Pen Overlay (header button or Ctrl+Shift+P).
2. Floating annotation toolbar appears with tool selection.
3. User selects tool and color.
4. Annotations are captured on the canvas overlay.
5. User deactivates Pen Overlay to resume normal interaction.
6. Annotations persist in `annotationsPerNote` and survive page reloads.

### 6.3 Dual Highlighter

**Two highlight modes:**

1. **Text Highlight** (`highlight-text` tool):
   - User selects text using standard mouse drag.
   - The DOM range is captured and stored as a `HighlightRegion`.
   - A colored overlay is rendered at the exact text position using the range's `getClientRects()`.
   - Range info (container path + offsets) enables re-rendering after DOM changes.
   - Works on any text content: markdown, MCQ options, sidebar items.

2. **Free-form Highlight** (`highlight-free` tool):
   - User paints a rectangular highlight overlay using mouse drag.
   - No DOM text selection required — works on images, diagrams, empty space.
   - Stored as a `HighlightRegion` with viewport-relative coordinates.
   - Useful for highlighting diagram nodes, image regions, or visual patterns.

### 6.4 PDF Upload & Integration

**Component**: `PdfWorkspace.tsx`
**Store fields**: `pdfFile`, `pdfPageNum`

**Features:**
- Drag-and-drop PDF upload zone with visual feedback.
- File picker alternative for upload.
- PDF rendered in native browser `<iframe>` viewer.
- Page number tracking via `pdfPageNum`.
- PDF metadata display (filename, loaded indicator).
- Remove PDF button (revokes Object URL to prevent memory leaks).
- Visual states: empty upload zone → drag-over → loaded with viewer.

**Integration Points:**
- PDF workspace is accessible as a view panel (`activeView === 'pdf-workspace'`).
- In Annotate mode, the Global Pen Overlay can annotate over the PDF viewer.
- PDFs can also be embedded inline via `pdf-embed` section type with base64 data URL.

### 6.5 Command Palette Search (Cmd+K)

**Implemented in**: `page.tsx` (inline)
**Store fields**: `searchOpen`, `searchQuery`

**Features:**
- Activated by `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux).
- Floating overlay with blur backdrop (`command-palette` CSS class).
- Text input with instant filtering.
- Searches across: note title, specialty, category, and tags.
- Keyboard navigation: Arrow Up/Down to navigate, Enter to select, Escape to close.
- Selected note becomes active and view switches to `'notes'`.
- Auto-focus on input when opened.
- Results show note title, category badge, and specialty.

### 6.6 Fullscreen Connectome/Mermaid Views

**Store field**: `fullscreenView`, `fullscreenMermaidCode`
**CSS class**: `fullscreen-view`

**Supported fullscreen visualizations:**

| View | Component | Fullscreen trigger |
|------|-----------|-------------------|
| Connectome | `ConnectomeView` | Button in connectome view header |
| Mermaid | `MermaidDiagram` | Expand button on any Mermaid diagram |
| Mindmap | `MindmapView` | Button in mindmap view header |

**Behavior:**
- Fixed position overlay with z-index 90.
- Covers entire viewport with dark background.
- Animated entrance (`fullscreenIn` keyframe).
- Header bar with title and close button (`Minimize2` icon).
- Content area fills remaining space.
- Press `Escape` or click close button to exit.
- In Annotate mode, Global Pen Overlay works on top of fullscreen views.

### 6.7 Content Creation Toolbar

**Component**: `ContentToolbar.tsx`
**Store field**: `contentToolbarOpen`

**Features:**
- Animated slide-in panel from the right side.
- Provides seven quick-add tools:

| Tool | Section Type | Icon | Description |
|------|-------------|------|-------------|
| Add Section | `content` | FileText | Markdown content with title |
| Add MCQ | `mcq` | HelpCircle | Clinical vignette with options and explanation |
| Add Flashcard | `flashcard` | Layers | Cloze or image-occlusion flashcard |
| Diagram Builder | `mermaid` | Activity | Opens MermaidMakerGUI (full-screen) |
| Add Tab Group | `tabs` | Columns3 | Comma-separated tab names with auto-generated IDs |
| Add Asset | `asset` | ImagePlus | Image/video upload or URL |
| Embed PDF | `pdf-embed` | FileUp | PDF file upload as base64 |

- Added sections are appended to the note's `sections[]` array with `dynamic: true`.
- Dynamic sections have a hover-reveal delete button (X icon).
- Toggle via header "+" button or floating action button (FAB) at bottom-right.
- FAB has bounce-in animation when content toolbar is closed.
- **Dialog integration**: Uses `showCloseButton={false}` on shadcn/ui DialogContent to prevent auto-generated X from overlapping custom header buttons.

### 6.8 Developer GUI Tools

**Component**: `DeveloperView.tsx`
**Activated when**: `mode === 'developer'`

**Features:**
- Split-pane layout: main note content (left) + developer panel (right, `w-96`).
- Code editor for raw HTML/JS input.
- Live preview pane that renders the HTML in real-time.
- Synchronized editing — changes in code instantly reflected in preview.
- Supports custom interactive elements (dynamic tables, calculators, visualizations).
- Panel is hidden on mobile screens (`hidden lg:block`).
- Initial content provides a demo HTML template with clinical parameter table.

### 6.9 Folders & Organization

**Store fields**: `folders`, `moveNoteToFolder`, `addFolder`, `renameFolder`, `deleteFolder`

**Features:**
- Default folders: Cardiology, Surgery, Nephrology, Emergency.
- Create new folders via sidebar or settings.
- Rename folders (propagates to all notes in the folder).
- Delete folders with option to delete contained notes or unassign them.
- Drag notes between folders in sidebar.
- Notes without a folder appear in "Unfiled" section.
- Folder assignment persisted via `note.folder` field.

### 6.10 Markdown Rendering

**Component**: `MarkdownRenderer.tsx`

**Features:**
- Renders markdown content with full GFM support via `react-markdown`.
- Detects `mermaid` fenced code blocks and renders them as MermaidDiagram components.
- Supports all standard markdown: headings, bold, italic, lists, tables, blockquotes, images, links, inline code.
- Medical-grade typography via `.prose` CSS class.
- Integrates with DissectionView for high-yield summary rendering.

---

## 7. Mermaid Rendering Pipeline

### Configuration

All Mermaid diagrams in NoteTool use a custom medical dark theme configuration:

```typescript
const mermaidConfig = {
  startOnLoad: false,
  theme: 'dark',
  htmlLabels: false,              // CRITICAL: prevents black-box artifacts on edge labels
  flowchart: {
    curve: 'basis',               // Smooth curved edges
    padding: 20,                  // Comfortable spacing around nodes
    useMaxWidth: true,
  },
  themeVariables: {
    primaryColor: '#1c2330',      // Surface 2
    primaryTextColor: '#e6edf3',  // Primary text
    primaryBorderColor: '#f0a500', // Amber accent
    lineColor: '#8b949e',         // Muted gray
    secondaryColor: '#222a36',    // Surface 3
    tertiaryColor: '#0d1117',     // Background
    fontFamily: 'Geist, system-ui, sans-serif',
    fontSize: '14px',
  },
};
```

### Critical CSS Fixes

The following CSS overrides are required for correct Mermaid rendering in the dark theme:

```css
/* Edge labels: transparent background to prevent black rectangles */
.edgeLabel {
  fill: transparent !important;
  background-color: transparent !important;
}
.edgeLabel p {
  background-color: transparent !important;
}

/* Arrowhead markers: correct fill */
.marker {
  fill: #8b949e !important;
}

/* Node styling for medical theme */
.node rect,
.node circle,
.node polygon {
  stroke-width: 2px;
}
```

### MermaidDiagram Component

**Props:**
```typescript
interface MermaidDiagramProps {
  code: string;           // Mermaid.js syntax
  title?: string;         // Display title
  embedded?: boolean;     // true = inline, false = with zoom controls
}
```

**Zoom Controls:**
- Uses `react-zoom-pan-pinch` TransformWrapper
- **CRITICAL**: Use `setTransform(positionX, positionY, newScale)` for programmatic zoom — do NOT use `zoomTo()` which does not exist on the API.
- Zoom in/out buttons in the header bar
- Reset button to return to default view
- Fullscreen expand button

### MermaidMakerGUI Integration

The MermaidMakerGUI component is a full-screen diagram builder opened from the Content Toolbar. It provides:

1. **Step-based editing**: Build flow diagrams by adding steps (start, process, decision, milestone, end)
2. **Inline editing**: Click any step label to edit in-place
3. **Insert between**: Hover between two steps to reveal insert buttons for each step kind
4. **Branch management**: Decision steps show branch labels with connect/disconnect controls (up to 5 branches)
5. **Live preview**: Right panel shows real-time Mermaid rendering with zoom controls
6. **Code panel**: Bottom panel shows the raw Mermaid code for manual editing
7. **Preset templates**: Quick-start with Clinical Pathway, Decision Tree, or Protocol patterns

**Save Integration:**
```typescript
const handleSave = (data: { code: string; title: string }) => {
  const section: NoteSection = {
    id: `mermaid-${Date.now()}`,
    type: 'mermaid',
    title: data.title || 'Flowchart',
    content: {
      id: `algo-${Date.now()}`,
      title: data.title || 'Flowchart',
      code: data.code.trim(),
    },
    dynamic: true,
  };
  addSectionToNote(activeNoteId, section);
};
```

---

## 8. Export Pipeline

### Overview

SurgicalBrain supports three export formats: JSON, HTML, and PDF. All exports are triggered from the Download dropdown in the header.

### JSON Export

**Method**: `JSON.stringify(note, null, 2)`
**Output**: Full `NoteData` object serialized as pretty-printed JSON with 2-space indent.

```typescript
const exportJSON = () => {
  const note = notes.find(n => n.id === activeNoteId);
  if (!note) return;
  const blob = new Blob([JSON.stringify(note, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${note.id}.json`);
};
```

### HTML Export

**Method**: `sectionToExportHtml()` + `mdToHtml()`
**Output**: Standalone HTML document with dark theme styling.

**Pipeline:**
1. Build HTML header with embedded CSS (dark theme, GitHub dark colors, serif headings, amber accent)
2. For each section, call `sectionToExportHtml(section)` which renders:
   - `content` → Convert markdown to HTML via `mdToHtml()`, wrap in styled div
   - `mcq` → Render question, options, and explanation in styled card
   - `flashcard` → Render front/back cards in grid layout
   - `mermaid` → Include mermaid.js CDN script and render diagram
   - `tabs` → Render tabbed content with JavaScript tab switching
   - `asset` → Render `<img>` or `<video>` with caption
   - `pdf-embed` → Render `<embed>` element with filename header
3. Build HTML footer with closing tags
4. Create Blob and download

**`mdToHtml()` Conversion:**
- Headings → `<h1>` through `<h6>`
- Bold → `<strong>`
- Italic → `<em>`
- Inline code → `<code>`
- Unordered lists → `<ul><li>`
- Ordered lists → `<ol><li>`
- Tables (GFM) → `<table><thead><tbody>`
- Blockquotes → `<blockquote>`
- Images → `<img>`
- Links → `<a>`
- Fenced code blocks → `<pre><code>`

### PDF Export

**Method**: `html2canvas` + `jsPDF`
**Output**: PDF document captured from the rendered DOM.

**Critical Requirements:**
- `html2canvas` **cannot parse CSS `var()` functions** — attempting to capture elements styled with CSS custom properties will throw `Error: Attempting to parse an unsupported color function 'var'`.
- Before PDF capture, a DOM pre-processing step must resolve all CSS variables to their computed hex color values.

**PDF Export Flow:**
1. Pre-capture: Walk the DOM and replace all CSS `var()` references with computed hex colors
2. Render: `html2canvas(element, { scale: 2, useCORS: true, logging: false })`
3. Generate: `jsPDF('p', 'mm', 'a4')` and add the canvas as an image
4. Post-capture: Restore original CSS variable references
5. Download the PDF

**Pre-capture CSS Resolution (Critical):**
```typescript
// Before capture: resolve CSS variables to hex
const elements = document.querySelectorAll('[style*="var("]');
elements.forEach(el => {
  const computed = window.getComputedStyle(el);
  // Replace var() with computed color values
});

// After capture: restore var() references
```

---

## 9. Known Issues & Gotchas

### Critical API Gotchas

| Issue | Component | Solution |
|-------|-----------|----------|
| `zoomTo()` is not a function | MermaidDiagram, MermaidMakerGUI | Use `setTransform(positionX, positionY, scale)` from react-zoom-pan-pinch |
| `html2canvas` crashes with `var()` | PDF export | Pre-resolve all CSS `var()` to hex colors before capture |
| shadcn/ui Dialog auto-generates X button | ContentToolbar | Use `showCloseButton={false}` on DialogContent and add custom close button |

### Mermaid Rendering Gotchas

| Issue | Cause | Solution |
|-------|-------|----------|
| Black boxes on edge labels | `htmlLabels: true` renders foreign objects | Set `htmlLabels: false` in Mermaid config |
| Opaque rectangles behind edge text | Default `.edgeLabel` fill | CSS: `.edgeLabel { fill: transparent !important; }` |
| Arrowhead markers invisible | Theme variable mismatch | CSS: `.marker { fill: #8b949e !important; }` |

### Store Gotchas

| Issue | Detail |
|-------|--------|
| Storage key versioning | Key is `notetool-storage-v2` — bumping this key clears all persisted data |
| `partialize` is selective | Only `notes, folders, userProfile, settings, activeNoteId, annotationsPerNote, sidebarOpen, mcqAnswers, flashcardStates` are persisted |
| No `isDark` in store | Dark mode is managed by ThemeSync component, not a store field |
| No `dynamicSections` in store | Dynamic sections are stored inline in `note.sections[]` with `dynamic: true` flag |
| Legacy Sets still exist | `revealedMCQs` (Set) and `flippedCards` (Set) exist but new code should use `mcqAnswers`/`flashcardStates` Records |
| `setActiveNoteId` side effects | Switching notes saves current annotations and loads target note's annotations |

### CSS Gotchas

| Issue | Solution |
|-------|----------|
| CSS `var()` in PDF export | Must resolve to hex before html2canvas capture |
| Glassmorphism `backdrop-filter` | Not supported in all browsers; provide fallback background |
| `@media print` | PDF embeds and Mermaid diagrams may need special print styles |

---

## 10. Electron Portable Build Guide

This section provides **complete, step-by-step instructions** for packaging SurgicalBrain as a cross-platform desktop application using Electron and electron-builder.

### Prerequisites

| Requirement | Minimum Version | Installation |
|-------------|----------------|--------------|
| Node.js | 20+ | `nvm install 20 && nvm use 20` |
| bun | 1.x | `curl -fsSL https://bun.sh/install \| bash` |
| Git | 2.x | System package manager |
| OS-specific build tools | — | Windows: VS Build Tools; macOS: Xcode CLT; Linux: build-essential |

### Step 1: Install Electron Dependencies

```bash
cd /home/z/my-project
bun add -D electron electron-builder concurrently wait-on
```

**Packages installed:**
| Package | Purpose |
|---------|---------|
| `electron` | Chromium + Node.js runtime for desktop apps |
| `electron-builder` | Builds portable installers for Windows/macOS/Linux |
| `concurrently` | Runs Next.js dev server and Electron simultaneously |
| `wait-on` | Waits for dev server to be ready before launching Electron |

### Step 2: Create Electron Main Process

Create `electron/main.ts`:

```typescript
// electron/main.ts — SurgicalBrain Electron Main Process
import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'SurgicalBrain NoteTool',
    backgroundColor: '#0d1117',
    darkTheme: true,
    titleBarStyle: 'hiddenInset',
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: false,
      allowRunningInsecureContent: false,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '..', 'out', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Custom application menu
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'SurgicalBrain',
      submenu: [
        { role: 'about', label: 'About SurgicalBrain' },
        { type: 'separator' },
        { role: 'settings', label: 'Preferences', accelerator: 'CmdOrCtrl+,' },
        { type: 'separator' },
        { role: 'hide', label: 'Hide SurgicalBrain' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit SurgicalBrain' },
      ],
    },
    {
      label: 'File',
      submenu: [
        { label: 'New Synthesis', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu:new-note') },
        { label: 'Open Note...', accelerator: 'CmdOrCtrl+O', click: () => handleOpenNote() },
        { type: 'separator' },
        { label: 'Export JSON', accelerator: 'CmdOrCtrl+Shift+E', click: () => mainWindow?.webContents.send('menu:export-json') },
        { label: 'Export HTML', accelerator: 'CmdOrCtrl+Shift+H', click: () => mainWindow?.webContents.send('menu:export-html') },
        { type: 'separator' },
        { label: 'Import PDF...', accelerator: 'CmdOrCtrl+I', click: () => handleImportPDF() },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Read Mode', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.webContents.send('menu:mode', 'read') },
        { label: 'Annotate Mode', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.webContents.send('menu:mode', 'annotate') },
        { label: 'Developer Mode', accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.webContents.send('menu:mode', 'developer') },
        { type: 'separator' },
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+B', click: () => mainWindow?.webContents.send('menu:toggle-sidebar') },
        { label: 'Command Palette', accelerator: 'CmdOrCtrl+K', click: () => mainWindow?.webContents.send('menu:search') },
        { type: 'separator' },
        { role: 'toggleDevTools' }, { role: 'togglefullscreen' }, { role: 'reload' }, { role: 'forceReload' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ─── IPC Handlers ────────────────────────────────────────────────

async function handleOpenNote() {
  if (!mainWindow) return;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'SurgicalBrain Notes', extensions: ['json'] }],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
    try {
      const note = JSON.parse(raw);
      mainWindow.webContents.send('import:note', note);
    } catch (err) {
      dialog.showErrorBox('Import Error', `Failed to parse note: ${(err as Error).message}`);
    }
  }
}

async function handleImportPDF() {
  if (!mainWindow) return;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    mainWindow.webContents.send('import:pdf', result.filePaths[0]);
  }
}

async function handleExportNote(format: 'json' | 'html' | 'pdf') {
  if (!mainWindow) return;
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `synthesis-note.${format === 'json' ? 'json' : format === 'html' ? 'html' : 'pdf'}`,
    filters: [
      { name: format.toUpperCase(), extensions: [format === 'json' ? 'json' : format === 'html' ? 'html' : 'pdf'] },
    ],
  });
  if (!result.canceled && result.filePath) {
    mainWindow.webContents.send('export:save', { format, path: result.filePath });
  }
}

// ─── IPC Registration ────────────────────────────────────────────

ipcMain.handle('dialog:open-note', handleOpenNote);
ipcMain.handle('dialog:import-pdf', handleImportPDF);
ipcMain.handle('dialog:export-note', (_, format: 'json' | 'html' | 'pdf') => handleExportNote(format));
ipcMain.handle('fs:read-file', (_, filePath: string) => fs.readFileSync(filePath, 'utf-8'));
ipcMain.handle('fs:write-file', (_, filePath: string, content: string) => fs.writeFileSync(filePath, content));
ipcMain.handle('fs:read-dir', (_, dirPath: string) => fs.readdirSync(dirPath));

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

### Step 3: Create Preload Script

Create `electron/preload.ts`:

```typescript
// electron/preload.ts — Context Bridge / Preload Script
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openNote: () => ipcRenderer.invoke('dialog:open-note'),
  importPDF: () => ipcRenderer.invoke('dialog:import-pdf'),
  exportNote: (format: 'json' | 'html' | 'pdf') => ipcRenderer.invoke('dialog:export-note', format),
  readFile: (path: string) => ipcRenderer.invoke('fs:read-file', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:write-file', path, content),
  readDir: (path: string) => ipcRenderer.invoke('fs:read-dir', path),

  // Menu event listeners
  onMenuNewNote: (callback: () => void) => ipcRenderer.on('menu:new-note', callback),
  onMenuMode: (callback: (mode: string) => void) => ipcRenderer.on('menu:mode', (_, mode) => callback(mode)),
  onMenuToggleSidebar: (callback: () => void) => ipcRenderer.on('menu:toggle-sidebar', callback),
  onMenuSearch: (callback: () => void) => ipcRenderer.on('menu:search', callback),
  onMenuExport: (callback: (format: string) => void) => ipcRenderer.on('menu:export', (_, format) => callback(format)),

  // Import listeners
  onImportNote: (callback: (note: any) => void) => ipcRenderer.on('import:note', (_, note) => callback(note)),
  onImportPDF: (callback: (path: string) => void) => ipcRenderer.on('import:pdf', (_, path) => callback(path)),
  onExportSave: (callback: (data: { format: string; path: string }) => void) =>
    ipcRenderer.on('export:save', (_, data) => callback(data)),
});
```

### Step 4: Update package.json Scripts

Add the following scripts to `package.json`:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "dev": "next dev",
    "dev:electron": "concurrently \"next dev\" \"wait-on http://localhost:3000 && electron .\"",
    "build": "next build",
    "build:electron": "next build && electron-builder",
    "electron:compile": "tsc -p electron/tsconfig.json",
    "dist": "npm run build && npm run electron:compile && electron-builder"
  }
}
```

### Step 5: Configure electron-builder

Add to `package.json`:

```json
{
  "build": {
    "appId": "com.surgicalbrain.notetool",
    "productName": "SurgicalBrain NoteTool",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "out/**/*",
      "electron/main.js",
      "electron/preload.js"
    ],
    "mac": {
      "target": ["dmg", "zip"],
      "category": "public.app-category.medical",
      "icon": "public/logo.svg"
    },
    "win": {
      "target": ["nsis", "portable"],
      "icon": "public/logo.svg"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "category": "Education",
      "icon": "public/logo.svg"
    }
  }
}
```

### Step 6: Build and Package

```bash
# Development (web + Electron simultaneously)
bun run dev:electron

# Production build
bun run dist

# Output: dist-electron/ directory with platform-specific installers
```

---

## 11. Development Workflow

### Local Development

```bash
cd /home/z/my-project
bun install          # Install dependencies
bun run dev          # Start Next.js dev server on localhost:3000
```

### Build for Production

```bash
bun run build        # Next.js production build
bun start            # Start production server
```

### Code Conventions

| Convention | Rule |
|-----------|------|
| Component files | PascalCase: `MermaidDiagram.tsx` |
| Store | Single file: `notetool-store.ts` with all interfaces and actions |
| CSS | Custom properties in `globals.css`, utility classes via Tailwind |
| Types | Exported from store file, co-located with related interfaces |
| Section types | Union type: `'content' \| 'mcq' \| 'flashcard' \| 'mermaid' \| 'algorithm' \| 'tabs' \| 'asset' \| 'pdf-embed'` |
| IDs | `lowercase-kebab-case` for note IDs and section IDs |
| Dynamic sections | Use `dynamic: true` flag on NoteSection |
| Dialogs | Use `showCloseButton={false}` + custom close button to prevent overlap |
| Zoom/pan | Use `setTransform()` — never `zoomTo()` |

### Git Workflow

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `dev` | Development and feature work |
| `feature/*` | Individual features |

### Testing Checklist

Before submitting changes, verify:
- [ ] All section types render correctly (content, mcq, flashcard, mermaid, tabs, asset, pdf-embed)
- [ ] Mermaid diagrams render without black boxes on edge labels
- [ ] Zoom controls work with `setTransform()` (not `zoomTo()`)
- [ ] PDF export doesn't crash with CSS `var()` errors
- [ ] HTML export produces valid standalone document
- [ ] JSON export includes all note data
- [ ] MCQ answer state persists across note switches
- [ ] Flashcard flip state persists across note switches
- [ ] Annotations save/load correctly when switching notes
- [ ] MermaidMakerGUI generates valid Mermaid code
- [ ] Content toolbar dialogs don't have overlapping close buttons
- [ ] Home screen displays correctly as default view
- [ ] Folders work: create, rename, delete, move notes

---

## 12. Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+1` | Switch to Read Mode | Global |
| `Ctrl+2` | Switch to Annotate Mode | Global |
| `Ctrl+3` | Switch to Developer Mode | Global |
| `Ctrl+K` | Open Command Palette | Global |
| `Ctrl+B` | Toggle Sidebar | Global |
| `Ctrl+Shift+P` | Toggle Pen Overlay | Global |
| `Ctrl+N` | New Note | Global (Electron) |
| `Ctrl+O` | Open Note | Global (Electron) |
| `Ctrl+Shift+E` | Export JSON | Global (Electron) |
| `Ctrl+Shift+H` | Export HTML | Global (Electron) |
| `Escape` | Close fullscreen / modal / palette | Context-dependent |
| `Enter` | Select in command palette | When palette open |
| `↑` / `↓` | Navigate command palette results | When palette open |

---

## 13. Component API Reference

This section provides the complete API reference for every domain component in the SurgicalBrain NoteTool. Each component entry documents its props interface, key behaviors, store dependencies, and integration points.

### 13.1 MermaidDiagram

**File**: `src/components/notetool/MermaidDiagram.tsx`

```typescript
interface MermaidDiagramProps {
  code: string;           // Mermaid.js syntax (required)
  title?: string;         // Display title shown in header bar
  embedded?: boolean;     // true = inline (no zoom controls), false = with zoom controls (default)
}
```

**Key Behaviors:**
- Renders Mermaid.js diagrams using `mermaid.render()` with a unique ID per instance to prevent SVG ID collisions.
- Uses `react-zoom-pan-pinch` `TransformWrapper` for zoom/pan when `embedded` is false.
- **CRITICAL**: Programmatic zoom must use `transformRef.current.setTransform(x, y, scale)` — the `zoomTo()` method does NOT exist on the TransformWrapper API and will throw a runtime error.
- Zoom controls: Zoom In (+), Zoom Out (-), Reset, and Fullscreen expand buttons in the header.
- Fullscreen mode uses the `fullscreenView` store field with value `'mermaid'` and stores the code in `fullscreenMermaidCode`.
- The Mermaid configuration is hardcoded: `htmlLabels: false`, `curve: 'basis'`, `padding: 20`, dark theme with custom medical colors.

**Store Dependencies:** `fullscreenView`, `fullscreenMermaidCode`, `setFullscreenView`

**Known Issues:**
- Edge labels render as black rectangles if `htmlLabels` is `true` or if `.edgeLabel { fill: transparent !important }` CSS override is missing.
- `zoomTo()` is NOT a valid method on `react-zoom-pan-pinch` TransformWrapper — always use `setTransform()`.

---

### 13.2 MermaidMakerGUI

**File**: `src/components/notetool/MermaidMakerGUI.tsx` (~34KB)

```typescript
interface MermaidMakerGUIProps {
  onSave: (data: { code: string; title: string }) => void;
  onClose: () => void;
  initialCode?: string;    // Pre-fill with existing Mermaid code for editing
  initialTitle?: string;   // Pre-fill diagram title
}
```

**Key Behaviors:**
- Full-screen diagram builder with split layout: step editor (left) and live preview (right).
- Step-based flow editing with five step kinds: `start`, `process`, `decision`, `milestone`, `end`.
- Inline label editing: click any step label to edit it in-place.
- Insert-between: hover between two steps to reveal insert buttons for each step kind.
- Branch management for decision steps: up to 5 branches per decision, each with a label and optional target step connection.
- Live Mermaid preview using `MermaidDiagram` with `embedded={true}` in the right panel.
- Code panel at the bottom shows the raw generated Mermaid code and allows manual editing.
- Three preset templates: Clinical Pathway, Decision Tree, Protocol.
- The sidebar containing the step list is scrollable independently from the preview panel.

**Data Model:**
```typescript
type StepKind = 'start' | 'process' | 'decision' | 'milestone' | 'end';

interface FlowStep {
  id: string;
  kind: StepKind;
  label: string;
  branches: Branch[];
  nextId: string | null;
}

interface Branch {
  id: string;
  label: string;
  targetId: string | null;
}
```

**Save Integration:**
When the user clicks Save, the builder calls `onSave({ code, title })`. The parent component creates a `NoteSection`:
```typescript
const section: NoteSection = {
  id: `mermaid-${Date.now()}`,
  type: 'mermaid',
  title: data.title || 'Flowchart',
  content: { id: `algo-${Date.now()}`, title: data.title || 'Flowchart', code: data.code.trim() },
  dynamic: true,
};
addSectionToNote(activeNoteId, section);
```

**Store Dependencies:** `activeNoteId`, `addSectionToNote`

---

### 13.3 MCQBlock

**File**: `src/components/notetool/MCQBlock.tsx`

```typescript
interface MCQBlockProps {
  data: MCQData;            // { id, question, options, correctIndex, explanation }
  sectionId: string;        // Parent section ID for answer state tracking
}
```

**Key Behaviors:**
- Renders a clinical vignette with numbered options (A, B, C, D, E...).
- User clicks an option to select it; the selected option is highlighted with an amber border.
- A "Reveal Answer" button appears after selection. Clicking it shows the correct answer (green highlight) and the explanation.
- The explanation slides in with an animation (`explanation-expand` CSS class).
- Answer state (selected, revealed, flagged) is persisted per-question in `mcqAnswers` Record in the store.
- Supports 2-8 options with add/remove in the Content Toolbar form.
- Each option has a letter key badge (`mcq-option-key` CSS class) showing A, B, C, etc.

**Store Dependencies:** `mcqAnswers`, `setMCQAnswer`, `resetMCQAnswer`

---

### 13.4 FlashcardBlock

**File**: `src/components/notetool/FlashcardBlock.tsx`

```typescript
interface FlashcardBlockProps {
  cards: FlashcardData[];    // Array of { id, type, front, back, tags }
  sectionId: string;         // Parent section ID
}
```

**Key Behaviors:**
- Renders a deck of flashcards with 3D flip animation (`flashcard-container` / `flashcard-inner` CSS classes).
- Click a card to flip between front (question/cloze) and back (answer).
- `cloze` type: front contains `___` blanks that are revealed on flip.
- `image-occlusion` type: front shows a prompt about identifying a structure, back reveals the label.
- Navigation arrows allow cycling through the deck.
- Flip state is persisted per-card in `flashcardStates` Record.
- A "Reset All" button resets all cards in the deck to the front side.

**Store Dependencies:** `flashcardStates`, `setFlashcardFlipped`, `resetAllFlashcards`

---

### 13.5 GlobalAnnotationOverlay

**File**: `src/components/notetool/GlobalAnnotationOverlay.tsx`

```typescript
interface GlobalAnnotationOverlayProps {
  // No props — reads entirely from Zustand store
}
```

**Key Behaviors:**
- Renders a transparent canvas overlay above the ENTIRE application (z-index: 50+), not just the note content.
- When `globalPenActive` is true, the overlay captures all pointer events.
- When `globalPenActive` is false, the overlay becomes transparent to pointer events (`pointer-events: none`), and existing annotations remain visible but non-interactive.
- Six tools: `pen` (free drawing), `highlight-text` (DOM range selection), `highlight-free` (rectangular overlay), `sticky` (draggable notes), `eraser` (remove annotations by clicking), `pan` (scroll without drawing).
- Custom SVG cursors per tool (embedded as data URIs).
- Annotation colors and brush size are configurable via the floating annotation toolbar.
- All annotations are stored per-note in `annotationsPerNote` and persist across page reloads.
- When switching notes (`setActiveNoteId`), current annotations are saved and the target note's annotations are loaded.

**Store Dependencies:** `globalPenActive`, `globalPenTool`, `highlightColor`, `drawingColor`, `drawingBrushSize`, `stickyNotes`, `highlightRegions`, `drawingPaths`, `addStickyNote`, `addHighlightRegion`, `addDrawingPath`, `clearAllAnnotations`, `annotationsPerNote`, `setAnnotationsForNote`

---

### 13.6 ConnectomeView

**File**: `src/components/notetool/ConnectomeView.tsx`

```typescript
interface ConnectomeViewProps {
  // No props — reads notes and links from store
}
```

**Key Behaviors:**
- D3.js force-directed graph visualization of the knowledge graph.
- Nodes represent notes, colored by specialty (using `--color-cardiac`, `--color-respiratory`, etc.).
- Edges represent `NoteLink` connections, with dash patterns varying by `relation` type.
- Hover a node to see note title and summary tooltip.
- Click a node to navigate to that note (`setActiveNoteId` + `setActiveView('notes')`).
- Supports fullscreen mode via `setFullscreenView('connectome')`.
- Force simulation parameters: charge strength, link distance, center force.

**Store Dependencies:** `notes`, `activeNoteId`, `setActiveNoteId`, `setActiveView`, `fullscreenView`, `setFullscreenView`

---

### 13.7 MarkdownRenderer

**File**: `src/components/notetool/MarkdownRenderer.tsx`

```typescript
interface MarkdownRendererProps {
  content: string;           // Markdown string to render
}
```

**Key Behaviors:**
- Uses `react-markdown` with `remarkGfm` plugin for full GitHub Flavored Markdown support.
- Detects fenced code blocks with `mermaid` language tag and renders them as inline `MermaidDiagram` components with `embedded={true}`.
- Medical-grade typography via the `.prose` CSS class.
- Supports all standard markdown features: headings, bold, italic, lists, tables, blockquotes, images, links, inline code, and HTML `<div>` blocks with inline styles.
- Images are rendered with lazy loading and proper alt text.

---

### 13.8 ContentToolbar

**File**: `src/components/notetool/ContentToolbar.tsx`

```typescript
interface ContentToolbarProps {
  // No external props — manages internal form state
}
```

**Key Behaviors:**
- Animated slide-in panel from the right side of the screen.
- Provides seven quick-add tools: Add Section, Add MCQ, Add Flashcard, Diagram Builder, Add Tab Group, Add Asset, Embed PDF.
- Each tool opens a dialog form specific to the section type. Dialogs use `showCloseButton={false}` to prevent shadcn/ui's auto-generated X button from overlapping custom header buttons.
- Added sections are appended with `dynamic: true` flag, which enables hover-reveal delete buttons in the note view.
- The Diagram Builder tool opens the full-screen `MermaidMakerGUI` component.
- Toggle via header "+" button or the floating action button (FAB) at the bottom-right corner.
- FAB has a bounce-in animation (`fab-bounce-in` CSS class) when the toolbar is closed.

**Store Dependencies:** `contentToolbarOpen`, `activeNoteId`, `addSectionToNote`

---

### 13.9 Sidebar

**File**: `src/components/notetool/Sidebar.tsx`

```typescript
interface SidebarProps {
  // No external props — reads from store
}
```

**Key Behaviors:**
- Obsidian-style sidebar with note navigation, folder organization, and view switching.
- Displays a list of all notes grouped by folder, with an "Unfiled" section for notes without a folder.
- Active note is highlighted with an amber indicator bar (`.obsidian-sidebar-item` CSS class).
- Folder management: create, rename, and delete folders via inline controls.
- Note filtering by folder and search.
- View switcher buttons at the bottom: Notes, Library, Connectome, Mindmap, DDx, PDF Workspace.
- Collapsible via the `sidebarOpen` store field.

**Store Dependencies:** `notes`, `folders`, `activeNoteId`, `sidebarOpen`, `setActiveNoteId`, `setActiveView`, `addFolder`, `renameFolder`, `deleteFolder`, `moveNoteToFolder`

---

### 13.10 HomeScreen

**File**: `src/components/notetool/HomeScreen.tsx`

```typescript
interface HomeScreenProps {
  // No external props — reads from store
}
```

**Key Behaviors:**
- Default landing view when `activeView === 'home'`.
- Displays folder cards showing note counts per specialty area with specialty color coding.
- Shows recent notes list with specialty badges and quick-open functionality.
- Provides quick action buttons: New Note, Import, Browse Library.
- Overview statistics: total notes, total folders, MCQs attempted, flashcards reviewed.
- Specialty distribution visualization showing the breakdown of notes by medical specialty.

**Store Dependencies:** `notes`, `folders`, `activeNoteId`, `setActiveNoteId`, `setActiveView`, `mcqAnswers`

---

### 13.11 DDxSplitter

**File**: `src/components/notetool/DDxSplitter.tsx`

```typescript
interface DDxSplitterProps {
  // No external props — reads ddxComparison from active note
}
```

**Key Behaviors:**
- Side-by-side differential diagnosis comparison table.
- Each row represents a clinical feature (e.g., "Onset", "Fever", "CXR Pattern").
- Columns represent different conditions being compared.
- Cells are color-coded: green for supporting evidence, red for contradicting evidence, neutral for equivocal findings.
- Designed to highlight discriminating features that distinguish between diagnoses, not just listing shared symptoms.
- Accessible via the DDx toggle in the header or by setting `activeView === 'ddx'`.

**Store Dependencies:** `notes`, `activeNoteId`

---

### 13.12 DissectionView

**File**: `src/components/notetool/DissectionView.tsx`

```typescript
interface DissectionViewProps {
  summary: string[];         // Array of high-yield bullet points
  children: React.ReactNode; // Full note content (sections)
}
```

**Key Behaviors:**
- Wraps the full note content and provides a collapsible "High-Yield Summary" panel at the top.
- When active, shows only the high-yield bullet points in a condensed, scannable format.
- Each bullet is ≤120 characters, self-contained, and uses active voice with specific numbers.
- Toggle between "Dissected" (summary only) and "Full" (all sections) views.
- The toggle is controlled by the `dissectionMode` store field.
- Design philosophy: progressive complexity — start with high-yield facts, expand for deep study.

**Store Dependencies:** `dissectionMode`

---

### 13.13 DeveloperView

**File**: `src/components/notetool/DeveloperView.tsx`

```typescript
interface DeveloperViewProps {
  // No external props — reads from store
}
```

**Key Behaviors:**
- Split-pane layout: main note content (left, full width) + developer panel (right, `w-96`).
- Code editor for raw HTML/JS input in the developer panel.
- Live preview pane renders the HTML in real-time with synchronized updates.
- Supports custom interactive elements like dynamic tables, calculators, and visualizations.
- The panel is hidden on mobile screens (`hidden lg:block`).
- Initial content provides a demo HTML template with a clinical parameter table.
- The developer code is stored in the `developerCode` store field.

**Store Dependencies:** `developerCode`, `mode`

---

### 13.14 NoteTabs

**File**: `src/components/notetool/NoteTabs.tsx`

```typescript
interface NoteTabsProps {
  data: TabData;              // { tabs: { id, label, content }[] }
}
```

**Key Behaviors:**
- Renders a tabbed interface for organizing information into parallel categories.
- Each tab has a label button and markdown content area.
- The first tab is active by default.
- Tab labels must be unique within the section.
- Tab content is rendered using `MarkdownRenderer`.
- Common use cases: splitting investigations into Bedside / Laboratory / Advanced Imaging tabs, or Pathophysiology / Pharmacology / Clinical tabs.

---

### 13.15 MindmapView

**File**: `src/components/notetool/MindmapView.tsx`

```typescript
interface MindmapViewProps {
  // No external props — reads from store
}
```

**Key Behaviors:**
- Renders an interactive collapsible mindmap using Markmap library.
- Converts the active note's content into a hierarchical mindmap structure.
- Nodes are collapsible/expandable by clicking.
- Supports fullscreen mode via `setFullscreenView('mindmap')`.
- Color-coded nodes based on heading level and section type.

**Store Dependencies:** `notes`, `activeNoteId`, `fullscreenView`, `setFullscreenView`

---

## 14. State Management Patterns

### 14.1 Zustand Store Architecture

The entire application state is managed through a single Zustand store defined in `src/stores/notetool-store.ts` (~607 lines). This store serves as the single source of truth and uses the `persist` middleware with selective `partialize` to control what gets written to localStorage.

**Storage Key:** `notetool-storage-v2` — this is versioned; bumping the key will clear all persisted data, which is useful for schema migrations.

### 14.2 Persisted vs Transient State

A critical architectural decision is the split between persisted and transient state:

**Persisted State** (survives page reload via localStorage):
- `notes` — Full note data array with all sections, MCQs, flashcards, and Mermaid code
- `folders` — Folder names and organization
- `userProfile` — User profile (name, specialty, institution, avatar)
- `settings` — Application settings (autoDissect, connectomeSync, fontSize, theme, annotationToolbarPosition)
- `activeNoteId` — Currently viewed note ID
- `annotationsPerNote` — Per-note annotation storage (sticky notes, highlights, drawings)
- `sidebarOpen` — Sidebar visibility
- `mcqAnswers` — Per-question answer state (selected, revealed, flagged)
- `flashcardStates` — Per-card flip state

**Transient State** (resets on page reload):
- `mode` — Current tri-mode (read/annotate/developer)
- `activeView` — Current view panel
- `dissectionMode` — Dissection view toggle
- `globalPenActive` — Global pen overlay toggle
- `globalPenTool` — Current pen tool
- `contentToolbarOpen` — Content toolbar panel toggle
- `searchOpen` / `searchQuery` — Command palette state
- `fullscreenView` / `fullscreenMermaidCode` — Fullscreen visualization state
- `pdfFile` / `pdfPageNum` — PDF workspace state
- `developerCode` — Developer mode HTML code
- `settingsModalOpen` / `newNoteModalOpen` / `accountModalOpen` — Modal visibility

### 14.3 Action Patterns

Store actions follow these patterns:

**Simple Setter:** Direct field update
```typescript
setMode: (mode) => set({ mode }),
setActiveView: (view) => set({ activeView: view }),
```

**Update with Side Effects:** Field update + auto-timestamp
```typescript
updateNote: (id, updates) => set((state) => ({
  notes: state.notes.map(n =>
    n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
  ),
})),
```

**Save-Load Pattern:** Annotation preservation on note switch
```typescript
setActiveNoteId: (id) => set((state) => {
  // Save current annotations
  const currentAnnotations: NoteAnnotations = {
    stickyNotes: state.stickyNotes,
    highlightRegions: state.highlightRegions,
    drawingPaths: state.drawingPaths,
  };
  const currentId = state.activeNoteId;

  // Load target note's annotations
  const targetAnnotations = state.annotationsPerNote[id] || {
    stickyNotes: [], highlightRegions: [], drawingPaths: [],
  };

  return {
    activeNoteId: id,
    ...targetAnnotations,
    annotationsPerNote: {
      ...state.annotationsPerNote,
      [currentId]: currentAnnotations,
    },
  };
}),
```

**Merge Update Pattern:** Partial state merge for MCQ/flashcard
```typescript
setMCQAnswer: (id, partial) => set((state) => ({
  mcqAnswers: {
    ...state.mcqAnswers,
    [id]: { ...state.mcqAnswers[id], ...partial },
  },
})),
```

**Upsert Pattern:** Add note with duplicate prevention
```typescript
addNote: (note) => set((state) => ({
  notes: [...state.notes.filter(n => n.id !== note.id), note],
})),
```

### 14.4 Store Anti-Patterns to Avoid

1. **Never read from localStorage directly** — always use the Zustand store. Direct localStorage access bypasses reactivity.
2. **Never store derived state** — compute derived values (e.g., note count, filtered lists) in components using selectors.
3. **Never mutate state directly** — always use `set()` with spread operators or immutable updates.
4. **Avoid storing large base64 data in persisted fields** — asset data URLs can bloat localStorage (5-10MB limit). Consider IndexedDB for large assets.
5. **Don't use legacy Sets** — `revealedMCQs` and `flippedCards` Sets exist for backward compatibility but new code should use `mcqAnswers` and `flashcardStates` Records.

---

## 15. CSS Architecture Deep Dive

### 15.1 Design Token System

All colors, spacing, and typography are defined as CSS custom properties in `globals.css`. These tokens power both the Tailwind utility classes and direct CSS references throughout the application. The token system is organized in layers: surface, text, accent, semantic, and specialty colors.

**Token Resolution for Exports:**
The PDF export pipeline (using `html2canvas`) cannot parse CSS `var()` functions. Before capturing the DOM, all CSS variable references must be resolved to their computed hex values. The resolution is done by walking the DOM, reading `window.getComputedStyle()`, and temporarily replacing `var()` references with the computed values. After capture, the original values are restored.

### 15.2 Glassmorphism System

The application uses a glassmorphism visual language for panels and overlays, defined by four CSS classes:

| Class | Effect | Usage |
|-------|--------|-------|
| `.glass` | Semi-transparent background + `backdrop-filter: blur(8px)` | General overlays |
| `.glass-strong` | Higher opacity + `backdrop-filter: blur(16px)` | Important panels |
| `.glass-panel` | Frosted glass card with border | Card containers |
| `.glass-panel-strong` | Stronger frosted effect | Elevated panels |

**Browser Compatibility Note:** `backdrop-filter` is not supported in all browsers. Provide a fallback solid background for unsupported browsers using `@supports not (backdrop-filter: blur(1px))`.

### 15.3 Prose Typography System

The `.prose` class applies medical-grade typography optimized for clinical content readability:

- **Base font size**: 15-16px with 1.65 line-height for optimal reading speed in clinical contexts.
- **Font family**: Geist for body text, Georgia/serif for headings (`.serif-title`).
- **Paragraph spacing**: Generous `margin-bottom: 1.5em` to clearly separate clinical concepts.
- **Table styling**: Clean borders with alternating row colors for readability of clinical data tables.
- **Blockquote styling**: Left amber border (`4px solid #f0a500`) with subtle background for clinical pearls.
- **Code blocks**: Dark background with monospace font and comfortable padding.

### 15.4 Animation System

Animations are defined in CSS and supplemented by Framer Motion for more complex transitions:

| Animation | CSS Class | Duration | Usage |
|-----------|-----------|----------|-------|
| Card hover lift | `.hover-lift` | 200ms | Note cards, folder cards |
| Notion-style hover | `.notion-hover` | 150ms | Sidebar items, list rows |
| 3D card flip | `.flashcard-inner` | 600ms | Flashcard flip animation |
| MCQ explanation slide | `.explanation-expand` | 300ms | MCQ answer reveal |
| Fullscreen entrance | `fullscreenIn` | 250ms | Connectome/Mermaid/Mindmap fullscreen |
| Pulse gold | `.pulse-gold` | 2000ms loop | Active indicators |
| Pulse green | `.pulse-green` | 2000ms loop | Success indicators |
| Logo glow | `.logo-glow` | 3000ms loop | SB logo ambient effect |
| FAB bounce-in | `.fab-bounce-in` | 400ms | Floating action button entrance |

### 15.5 Responsive Breakpoints

| Breakpoint | Width | Target Device | Use Case |
|------------|-------|---------------|----------|
| `sm` | 640px | Mobile (landscape) | Minimal view, single column |
| `md` | 768px | Tablet | Rounds mode, split view |
| `lg` | 1024px | Small desktop | Full layout, developer panel hidden |
| `xl` | 1280px | Desktop | Full layout, developer panel visible |
| `2xl` | 1536px | Large monitor | Maximum content width |

---

## 16. Error Handling & Resilience

### 16.1 Error Boundaries

The application should implement React Error Boundaries at the following levels:
- **Root level**: Catches any unhandled render errors and displays a fallback UI with a "Reload" button.
- **Section level**: Each note section renders independently; a rendering error in one section should not crash the entire note view.
- **Mermaid level**: Mermaid syntax errors should be caught and display a "Diagram Syntax Error" fallback instead of crashing the component.

### 16.2 Common Error Scenarios

| Error | Cause | Resolution |
|-------|-------|------------|
| `zoomTo is not a function` | Using wrong `react-zoom-pan-pinch` API | Replace with `setTransform(x, y, scale)` |
| `Attempting to parse an unsupported color function 'var'` | `html2canvas` cannot parse CSS variables | Pre-resolve `var()` to hex colors before capture |
| Black boxes on Mermaid arrows | `htmlLabels: true` or missing CSS fix | Set `htmlLabels: false` and add `.edgeLabel { fill: transparent !important }` |
| `localStorage` quota exceeded | Large base64 assets in notes | Use IndexedDB for large assets or compress data |
| Mermaid render timeout | Invalid Mermaid syntax | Validate syntax, catch render errors, show fallback |
| Stale store data after schema change | Old localStorage format | Bump storage key version (`notetool-storage-v3`) |
| Dialog X button overlap | shadcn/ui auto-generates close button | Use `showCloseButton={false}` on DialogContent |

### 16.3 Graceful Degradation

- **Mermaid failure**: If Mermaid rendering fails, display the raw code block with a "Syntax Error" badge.
- **PDF export failure**: If html2canvas fails, fall back to a simpler DOM-to-HTML export without the CSS variable resolution step.
- **Missing note data**: If a referenced note ID doesn't exist (e.g., Connectome link to a deleted note), show a "Note not found" placeholder instead of crashing.
- **Annotation recovery**: If annotation data is corrupted, clear the specific note's annotations rather than crashing the entire app.

---

## 17. Performance Optimization Guide

### 17.1 React Rendering Optimization

- **Memoize expensive components**: `MermaidDiagram`, `ConnectomeView`, and `MindmapView` should be wrapped with `React.memo()` to prevent unnecessary re-renders when parent state changes.
- **Use Zustand selectors**: Instead of subscribing to the entire store, use fine-grained selectors: `useNoteToolStore(s => s.activeNoteId)` instead of `useNoteToolStore()`.
- **Lazy load heavy components**: `MermaidMakerGUI` (34KB) and `ConnectomeView` should be lazy-loaded with `React.lazy()` and `Suspense`.
- **Virtualize long lists**: When a note has many sections (10+), consider using a virtualized list for the section renderer.

### 17.2 Mermaid Performance

- **Debounce preview rendering**: The MermaidMakerGUI live preview should debounce Mermaid re-renders (300ms) to avoid excessive SVG regeneration on every keystroke.
- **Reuse Mermaid instances**: When possible, update existing Mermaid diagrams instead of destroying and recreating them.
- **Limit diagram complexity**: Very large Mermaid diagrams (50+ nodes) may cause rendering lag. Consider splitting complex algorithms into multiple smaller diagrams.

### 17.3 localStorage Performance

- **Partialize persistence**: Only essential fields are persisted via `partialize`. Transient state (modals, toolbar, search) is not stored, keeping the localStorage payload small.
- **Batch updates**: Multiple store updates in rapid succession (e.g., section CRUD) should be batched into a single `set()` call to reduce localStorage writes.
- **Monitor storage size**: Use `navigator.storage.estimate()` to track localStorage usage and warn when approaching the 5-10MB limit.

### 17.4 Export Performance

- **PDF export**: `html2canvas` with `scale: 2` produces high-quality output but is CPU-intensive. Consider showing a progress indicator during export.
- **HTML export**: The string-building approach is efficient but should be optimized for large notes with many sections.
- **JSON export**: `JSON.stringify` is fast but may produce very large strings for notes with base64-embedded assets.

---

## 18. Accessibility Guidelines

### 18.1 WCAG AA Compliance

All text in the application must meet WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text). The dark theme colors are specifically chosen to exceed these thresholds:

| Text Type | Foreground | Background | Contrast Ratio |
|-----------|-----------|------------|----------------|
| Primary text | `#e6edf3` | `#0d1117` | 13.5:1 (AAA) |
| Muted text | `#8b949e` | `#0d1117` | 5.6:1 (AA) |
| Accent text | `#f0a500` | `#0d1117` | 8.2:1 (AAA) |
| Correct indicator | `#2ea043` | `#0d1117` | 5.0:1 (AA) |
| Wrong indicator | `#da3633` | `#0d1117` | 5.3:1 (AA) |

### 18.2 Keyboard Navigation

- All interactive elements must be reachable via `Tab` key navigation.
- The Command Palette (`Ctrl+K`) provides keyboard-driven navigation to any note.
- MCQ options should be selectable via keyboard (arrow keys + Enter).
- Flashcards should be flippable via keyboard (Space or Enter).
- Fullscreen views should be closeable via `Escape`.
- Custom keyboard shortcuts must not conflict with browser or assistive technology shortcuts.

### 18.3 Screen Reader Support

- All interactive elements must have accessible labels (`aria-label` or visible text).
- Mermaid diagrams should have an `aria-label` describing the clinical algorithm.
- MCQ options should use `role="radio"` with appropriate grouping.
- Flashcards should announce their state (front/back) via `aria-live` regions.
- Annotation tools should announce the current tool via `aria-label`.

### 18.4 Motion and Animation

- Respect `prefers-reduced-motion` media query. Disable animations when the user has this preference set.
- Flashcard flip animations should have a CSS fallback that simply toggles visibility without the 3D transform.
- Pulse animations (`.pulse-gold`, `.pulse-green`) should be paused when reduced motion is preferred.

---

## 19. Testing Strategy

### 19.1 Unit Testing

| Layer | Framework | Coverage Target |
|-------|-----------|----------------|
| Store actions | Vitest | 90% |
| Utility functions | Vitest | 80% |
| Data transformations | Vitest | 85% |
| Mermaid code generation | Vitest | 80% |

**Key test scenarios for the store:**
- `addNote` prevents duplicate IDs (upsert behavior)
- `setActiveNoteId` saves current annotations and loads target annotations
- `setMCQAnswer` merges partial updates correctly
- `updateNote` auto-sets `updatedAt` timestamp
- `deleteNote` falls back to first note if deleting the active note
- `deleteFolder` correctly handles notes within the folder

### 19.2 Component Testing

| Component | Framework | Key Assertions |
|-----------|-----------|----------------|
| MermaidDiagram | React Testing Library + Vitest | Renders SVG, zoom controls work, `setTransform` not `zoomTo` |
| MCQBlock | React Testing Library + Vitest | Option selection, answer reveal, state persistence |
| FlashcardBlock | React Testing Library + Vitest | Card flip, navigation, reset |
| ContentToolbar | React Testing Library + Vitest | All 7 tools create correct section types |

### 19.3 Integration Testing

**Critical integration test scenarios:**
1. Create a new note via `NewNoteModal` → verify it appears in sidebar → verify it can be selected
2. Add sections via Content Toolbar → verify each section type renders correctly → verify dynamic sections can be removed
3. Build a diagram in MermaidMakerGUI → save it → verify it appears as a Mermaid section → verify it renders
4. Answer MCQ questions → switch notes → switch back → verify answer state persisted
5. Annotate in Annotate mode → switch notes → switch back → verify annotations preserved
6. Export to JSON → import back → verify data integrity
7. Export to HTML → open in browser → verify standalone readability
8. Export to PDF → verify no CSS variable crash → verify visual fidelity

### 19.4 Visual Regression Testing

For components with complex visual output (Mermaid diagrams, Connectome graph, flashcard flip), consider:
- Screenshot comparison testing using Playwright or Percy
- SVG snapshot testing for Mermaid diagram output
- CSS-inheritance validation to catch theme breakage

---

## 20. Deployment & CI/CD

### 20.1 Build Pipeline

```
Source Code → TypeScript Compilation → Next.js Build → Static Export → Deploy
```

**Build commands:**
```bash
bun install              # Install dependencies
bun run build            # Next.js production build
bun start                # Start production server
```

**Electron build:**
```bash
bun run dist             # Build + compile Electron + package for distribution
```

### 20.2 Environment Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | No | Application URL for CORS and redirects |
| `DATABASE_URL` | No | SQLite connection string (Prisma) |
| `NODE_ENV` | Yes | `development` or `production` |

### 20.3 Pre-Deployment Checklist

- [ ] All TypeScript compilation passes with no errors
- [ ] All section types render correctly in production build
- [ ] Mermaid diagrams render without black boxes
- [ ] PDF export does not crash with CSS `var()` errors
- [ ] HTML export produces valid standalone document
- [ ] localStorage persistence works correctly
- [ ] No console errors in production build
- [ ] Performance audit: Lighthouse score > 80
- [ ] Accessibility audit: WCAG AA compliance
- [ ] Mobile responsiveness verified

### 20.4 Monitoring

- Track localStorage usage and warn when approaching limits
- Monitor Mermaid rendering errors and fallback rates
- Track export success/failure rates
- Monitor note creation and section usage patterns

---

## 21. Troubleshooting Guide

### 21.1 Common User-Reported Issues

**"My annotations disappeared"**
- Check if `activeNoteId` changed — annotations are stored per-note in `annotationsPerNote`.
- If the note was deleted and recreated, the old annotations are orphaned.
- Check browser console for localStorage write failures (quota exceeded).

**"The diagram shows black squares"**
- Verify `htmlLabels: false` is set in the Mermaid configuration.
- Check that `.edgeLabel { fill: transparent !important }` CSS override is present in `globals.css`.
- This is a known Mermaid.js rendering bug that is mitigated by these two settings.

**"Export to PDF crashes with 'var()' error"**
- This happens when the DOM contains elements styled with CSS custom properties.
- The PDF export must pre-resolve all CSS variables to hex colors before calling `html2canvas`.
- If the resolution step fails, try simplifying the note content or using HTML export instead.

**"Zoom buttons don't work on diagrams"**
- The `zoomTo()` method does NOT exist on `react-zoom-pan-pinch` TransformWrapper.
- All zoom operations must use `setTransform(positionX, positionY, newScale)`.
- If encountering this error, the component needs to be updated to use `setTransform()`.

**"Dialog close button overlaps with other buttons"**
- shadcn/ui Dialog auto-generates an X close button that can overlap with custom header buttons.
- Use `showCloseButton={false}` on `DialogContent` and add a custom close button in the dialog header.

### 21.2 Development Environment Issues

**"Next.js dev server is slow"**
- Large components (`page.tsx` at 2015 lines, `MermaidMakerGUI.tsx` at 34KB) slow down HMR.
- Consider splitting large components into smaller modules.
- Use `next.config.ts` `turbo` mode for faster development builds.

**"localStorage data corruption"**
- If the store schema changes between versions, old localStorage data may be incompatible.
- Solution: Bump the storage key version (e.g., `notetool-storage-v3`) to force a fresh start.
- Consider adding a migration system for schema changes.

**"Mermaid rendering flickers"**
- Multiple Mermaid instances on the same page can cause ID collisions in generated SVGs.
- Ensure each `mermaid.render()` call uses a unique ID (e.g., `mermaid-${Date.now()}-${index}`).

---

## 22. Recent Fixes & Changelog

### v0.5.0 — Current

**Mermaid Rendering Fixes:**
- Fixed black boxes appearing on Mermaid arrow edge labels by setting `htmlLabels: false` in Mermaid config
- Added `.edgeLabel { fill: transparent !important }` CSS override to prevent opaque backgrounds on edge labels
- Fixed arrowhead markers with `.marker { fill: #8b949e !important }` CSS override

**Zoom/Pan Fixes:**
- Fixed `zoomTo is not a function` runtime error by replacing all `zoomTo()` calls with `setTransform(positionX, positionY, newScale)`
- Updated MermaidDiagram and MermaidMakerGUI to use the correct `react-zoom-pan-pinch` API

**MermaidMakerGUI UI Fixes:**
- Fixed spacing between insert-between step buttons (checkpoint, outcome, if) that were crammed together and overlapping
- Fixed X button overlapping header buttons by using `showCloseButton={false}` and custom close button
- Made the step list sidebar scrollable independently from the preview panel
- Removed dead space at the bottom of the Mermaid preview area

**Export Pipeline Fixes:**
- Fixed PDF export crash with `Error: Attempting to parse an unsupported color function 'var'` by implementing DOM pre-capture CSS variable resolution
- Rewrote HTML export to produce standalone readable HTML documents similar to Read mode
- PDF export now resolves all CSS `var()` functions to computed hex colors before html2canvas capture, then restores original values after capture

**Annotation Overlay Fixes:**
- Fixed annotation overlay spacing and interaction issues
- Fixed pen tool cursor display

### v0.4.0

- Added MermaidMakerGUI visual flow-based diagram builder
- Added Content Toolbar with 7 section creation tools
- Added Home Screen dashboard
- Added folder organization system
- Added Connectome knowledge graph view
- Added DDx Splitter comparison table

### v0.3.0

- Added Tri-Mode state machine (Read / Annotate / Developer)
- Added Global Annotation Overlay with 6 tools
- Added MarkdownRenderer with Mermaid code block detection
- Added MCQ and Flashcard interactive blocks

### v0.2.0

- Initial Zustand store with localStorage persistence
- Basic note CRUD operations
- Sidebar navigation
- Dark theme with medical-grade typography

### v0.1.0

- Project scaffolding with Next.js App Router
- Basic page layout and routing
- shadcn/ui component integration

---

## 23. Contributing Guidelines

### 23.1 Code Style

| Convention | Rule | Example |
|-----------|------|---------|
| Component files | PascalCase `.tsx` | `MermaidDiagram.tsx` |
| Store | Single file with all interfaces | `notetool-store.ts` |
| CSS | Custom properties in `globals.css`, utility classes via Tailwind | `--color-sb-accent` |
| Types | Exported from store, co-located | `export type AppMode = ...` |
| Section types | Union type in store | `'content' \| 'mcq' \| ...` |
| IDs | `lowercase-kebab-case` | `acute-heart-failure` |
| Dynamic sections | Flag with `dynamic: true` | `{ ..., dynamic: true }` |
| Dialogs | `showCloseButton={false}` | `<DialogContent showCloseButton={false}>` |
| Zoom/pan | `setTransform()` only | Never `zoomTo()` |

### 23.2 Pull Request Checklist

- [ ] TypeScript compiles without errors
- [ ] All section types render correctly
- [ ] Mermaid diagrams render without black boxes
- [ ] Zoom controls work with `setTransform()` (not `zoomTo()`)
- [ ] PDF export doesn't crash with CSS `var()` errors
- [ ] HTML export produces valid standalone document
- [ ] MCQ answer state persists across note switches
- [ ] Flashcard flip state persists across note switches
- [ ] Annotations save/load correctly when switching notes
- [ ] MermaidMakerGUI generates valid Mermaid code
- [ ] No overlapping dialog close buttons
- [ ] Responsive layout works on tablet and desktop
- [ ] No new console errors in production build

### 23.3 Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Scopes:** `mermaid`, `export`, `store`, `mcq`, `flashcard`, `annotate`, `sidebar`, `connectome`, `builder`, `ui`

**Examples:**
```
fix(mermaid): resolve black boxes on edge labels with htmlLabels:false
fix(export): resolve CSS var() crash in PDF export
feat(builder): add insert-between step buttons to MermaidMakerGUI
refactor(store): migrate from revealedMCQs Set to mcqAnswers Record
```

### 23.4 File Change Impact Analysis

Before modifying any file, consider its impact radius:

| File Changed | Impact | Required Testing |
|-------------|--------|-----------------|
| `notetool-store.ts` | Global — all components | Full regression test |
| `page.tsx` | Shell — all views | Navigation, rendering, export |
| `globals.css` | Visual — all components | Theme, Mermaid, typography |
| `MermaidDiagram.tsx` | Diagram rendering | All Mermaid views, builder |
| `MermaidMakerGUI.tsx` | Diagram builder | Builder, preview, save flow |
| `MCQBlock.tsx` | MCQ interaction | Answer state, persistence |
| `FlashcardBlock.tsx` | Flashcard interaction | Flip state, persistence |
| `GlobalAnnotationOverlay.tsx` | Annotation system | All annotation tools, persistence |
| `ContentToolbar.tsx` | Content creation | All 7 section types |
