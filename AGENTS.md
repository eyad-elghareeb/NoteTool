# SurgicalBrain NoteTool — Agent Definitions & Architecture Guide

## Project Codename: SurgicalBrain (The Universal Medical Synthesis Engine)

> **"The Surgeon's Mind" Philosophy: Dissect → Map → Act → Connect**

> SurgicalBrain is a local-first, medical-grade knowledge synthesis platform
> designed for clinicians, residents, and medical students. It combines
> structured note-taking, interactive clinical algorithms, active-recall
> testing, and a visual knowledge graph (the "Connectome") into a single
> desktop-ready application.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Agent Roles](#3-agent-roles)
4. [Data Model](#4-data-model)
5. [Tri-Mode State Machine](#5-tri-mode-state-machine)
6. [Feature Documentation](#6-feature-documentation)
7. [Electron Portable Build Guide](#7-electron-portable-build-guide)
8. [Development Workflow](#8-development-workflow)
9. [Keyboard Shortcuts](#9-keyboard-shortcuts)

---

## 1. Project Overview

### Codename
**SurgicalBrain** — The Universal Medical Synthesis Engine

### Philosophy
**"The Surgeon's Mind"** — every feature follows a four-step cognitive cycle:

| Step | Meaning | Implementation |
|------|---------|---------------|
| **Dissect** | Break down complex topics into high-yield components | Dissection View, collapsible sections, high-yield summaries |
| **Map** | Visualize relationships between concepts | Connectome graph (D3.js), Mermaid algorithms, Markmap mindmaps |
| **Act** | Test and reinforce knowledge through active recall | MCQ blocks (SBA format), flashcard blocks (cloze / image-occlusion) |
| **Connect** | Link topics across specialties via the knowledge graph | Note links, ICD-10/SNOMED tagging, DDx Splitter |

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
| Animation | Framer Motion | 12.x | Page transitions, micro-interactions, modal animations |
| Icons | Lucide React | 0.525+ | Consistent icon system |
| Database | Prisma ORM (SQLite) | 6.x | Optional server-side persistence |
| Desktop | Electron | — | Cross-platform portable build (see §7) |

### Design Principles

1. **Local-First**: All core functionality works offline. No network dependency for CRUD operations.
2. **Medical-Grade Typography**: 15–16px base, 1.65 line-height, generous paragraph spacing, serif headings.
3. **Semantic Color**: Amber (#f0a500) = clinical action, Red (#da3633) = critical/danger, Green (#2ea043) = safe/correct.
4. **Non-Destructive Annotations**: Highlights, drawings, and sticky notes are stored separately from base content.
5. **Active Recall > Passive Reading**: Every note prompts the learner to think, not just consume.
6. **Atomicity**: Writes are atomic — never leave a note in a partially-saved state.

---

## 2. Architecture Overview

### Full Directory Tree

```
/home/z/my-project/
├── AGENTS.md                              # This file — agent definitions & architecture guide
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
│   │   ├── page.tsx                       # Main application shell — single-page app
│   │   ├── globals.css                    # Design tokens, glassmorphism, prose system, animations
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
│   │   │   ├── dialog.tsx
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
│   │       ├── ContentToolbar.tsx         # Add-content sidebar panel (MCQ, flashcard, etc.)
│   │       ├── DDxSplitter.tsx            # Side-by-side differential diagnosis comparison
│   │       ├── DeveloperView.tsx          # Split-pane WYSIWYG + raw HTML editor
│   │       ├── DissectionView.tsx         # High-Yield Summary collapsible wrapper
│   │       ├── FlashcardBlock.tsx         # Cloze & Image Occlusion flashcards with 3D flip
│   │       ├── GlobalAnnotationOverlay.tsx # Global pen overlay (works across entire app)
│   │       ├── ICDTagger.tsx             # ICD-10/SNOMED code tag badges
│   │       ├── MCQBlock.tsx              # Interactive SBA question block with reveal
│   │       ├── MedLibrary.tsx            # Medical library browser panel
│   │       ├── MermaidDiagram.tsx        # Clinical algorithm Mermaid.js renderer
│   │       ├── MindmapView.tsx           # Markmap collapsible mindmap renderer
│   │       ├── NewNoteModal.tsx          # Create new synthesis note modal
│   │       ├── NoteTabs.tsx             # Tabbed interface for multi-content sections
│   │       ├── PdfWorkspace.tsx          # PDF-to-Synthesis split-screen viewer
│   │       ├── SettingsModal.tsx         # Application settings modal
│   │       ├── Sidebar.tsx              # Obsidian-style sidebar with note navigation
│   │       ├── StatusBar.tsx            # Minimized bottom status bar
│   │       └── TriModeSwitcher.tsx      # Read / Annotate / Developer mode toggle
│   │
│   ├── stores/
│   │   └── notetool-store.ts            # Zustand global state (persisted to localStorage)
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
└── electron/                             # Electron wrapper (see §7)
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
│                    persist middleware                                    │
│                           │                                             │
│                    ┌──────▼──────┐                                      │
│                    │ localStorage│  ← Auto-saved on every state change  │
│                    └─────────────┘                                      │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Global Annotation Overlay (GlobalAnnotationOverlay.tsx)         │   │
│  │  ┌─────────┐ ┌──────────────┐ ┌───────────┐ ┌───────────────┐  │   │
│  │  │  Pen    │ │ Text Highlight│ │ Free      │ │  Sticky Notes │  │   │
│  │  │ Drawing │ │ (DOM ranges)  │ │ Highlight │ │  (draggable)  │  │   │
│  │  └─────────┘ └──────────────┘ └───────────┘ └───────────────┘  │   │
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
       │    ├─ Search Button        ← Opens Command Palette
       │    ├─ Pen Toggle           ← GlobalAnnotationOverlay switch
       │    ├─ Export Dropdown      ← JSON / HTML export
       │    ├─ Dissection Toggle    ← DissectionView switch
       │    ├─ DDx Toggle           ← DDx Splitter switch
       │    ├─ Add Content Button   ← ContentToolbar panel
       │    ├─ Settings Button      ← SettingsModal
       │    └─ Account Button       ← AccountModal
       │
       ├─ <div flex>
       │    ├─ <Sidebar>           ← Note list, view switcher, library
       │    └─ <main>
       │         ├─ [notes view]   ← renderNoteContent()
       │         │    ├─ <ICDTagger>
       │         │    ├─ <DissectionView>
       │         │    │    └─ <NoteSection>*  ← renderSection() per type
       │         │    │         ├─ content → ReactMarkdown
       │         │    │         ├─ mermaid/algorithm → MermaidDiagram
       │         │    │         ├─ tabs → NoteTabs
       │         │    │         ├─ mcq → MCQBlock
       │         │    │         ├─ flashcard → FlashcardBlock
       │         │    │         └─ asset → AssetPlaceholder
       │         │    └─ <DeveloperView>   (if mode === 'developer')
       │         │
       │         ├─ [library view]  → MedLibrary
       │         ├─ [connectome]    → ConnectomeView
       │         ├─ [mindmap]       → MindmapView
       │         ├─ [ddx]           → DDxSplitter
       │         └─ [pdf-workspace] → PDF upload/iframe viewer
       │
       ├─ <ContentToolbar>          ← Animated slide-in panel
       ├─ <GlobalAnnotationOverlay> ← Transparent canvas over entire app
       ├─ <SettingsModal>           ← Dialog
       ├─ <NewNoteModal>            ← Dialog
       ├─ <AccountModal>            ← Dialog
       ├─ <StatusBar>               ← Bottom status bar
       └─ <Command Palette>         ← Cmd+K overlay
```

---

## 3. Agent Roles

### [The Architect]

**Scope:** File structure, data persistence, Electron IPC, local CRUD logic.

**Responsibilities:**
- Maintain the project directory structure and ensure consistent naming conventions across all modules.
- Design and implement the local-first data persistence layer using Zustand + localStorage (web) and structured JSON files on the filesystem (Electron).
- Manage the Electron wrapper configuration for cross-platform desktop deployment (Windows/macOS/Linux).
- Implement IPC (Inter-Process Communication) bridges between the renderer and main process in Electron.
- Design the asset storage convention: `/assets/{Note_ID}/image_01.png` and enforce strict file-system mapping.
- Ensure all data operations follow a local-first paradigm — no network dependency for core functionality.
- Define the Note schema (frontmatter + body + metadata) and version it properly.
- Own the Zustand store structure: state shape, actions, persistence config.
- Manage the Next.js configuration (`next.config.ts`) for both web and Electron targets.

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

---

### [The Stylist]

**Scope:** Unified, professional "Medical-Grade" CSS system — high legibility, clean spacing, accessibility.

**Responsibilities:**
- Maintain and extend the design token system (colors, typography, spacing, radii) in `globals.css`.
- Enforce a consistent visual language across all three Tri-Mode interfaces.
- Ensure WCAG AA compliance for all text contrast ratios, especially in the Read-Only "Clean-Room" mode.
- Design high-contrast dark mode optimized for low-light clinical environments (night rounds).
- Create and maintain component-specific style overrides for medical content:
  - Mermaid diagram theming (clinical color palette)
  - MCQ/Flashcard card styles with clear visual hierarchy
  - Annotate mode canvas overlay styles
- Implement responsive breakpoints for tablet (rounds) and desktop (study) use cases.
- Maintain a "Medical-Grade" typographic scale: 15px base, 1.65 line-height, generous paragraph spacing.
- Own all CSS animation definitions (Framer Motion supplements, not replaces).
- Maintain glassmorphism utility classes and Obsidian-style sidebar aesthetics.

**File Ownership:**
| File | Responsibility |
|------|---------------|
| `src/app/globals.css` | Design tokens, CSS custom properties, global styles, animations |
| `src/components/notetool/GlobalAnnotationOverlay.tsx` | Annotation canvas overlay styles |
| `src/components/notetool/Sidebar.tsx` | Obsidian-style sidebar aesthetics |
| `src/components/notetool/StatusBar.tsx` | Minimized status bar styles |
| `src/components/notetool/TriModeSwitcher.tsx` | Mode toggle visual states |
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

**Scope:** Image/PDF embedding, file-system mapping, media handling, export.

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

**File Ownership:**
| File | Responsibility |
|------|---------------|
| `src/components/notetool/AssetPlaceholder.tsx` | Image/PDF asset placeholders |
| `src/components/notetool/PdfWorkspace.tsx` | PDF-to-Synthesis split screen |
| `src/components/notetool/AnnotateCanvas.tsx` | Non-destructive annotation layer (legacy) |
| `src/components/notetool/GlobalAnnotationOverlay.tsx` | Global pen overlay (current) |

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

**PDF Workspace Flow:**
1. User drops/selects PDF file → `handlePdfUpload()`
2. File validated (`type === 'application/pdf'`)
3. Object URL created via `URL.createObjectURL(file)`
4. PDF displayed in `<iframe>` with full browser-native PDF viewer
5. Store updated: `pdfFile`, `pdfPageNum`
6. On removal: Object URL revoked to prevent memory leaks

**Export Formats:**
| Format | Method | Output |
|--------|--------|--------|
| JSON | `JSON.stringify(note, null, 2)` | Full note data with all sections, MCQs, flashcards |
| HTML | Template with styled sections | Readable standalone HTML document with dark theme |

---

## 4. Data Model

### Complete TypeScript Interfaces

```typescript
// ─── Core Types ──────────────────────────────────────────────────

type AppMode = 'read' | 'annotate' | 'developer';

type GlobalPenTool = 'pen' | 'text-highlight' | 'free-highlight' | 'sticky' | 'eraser';

type ViewPanel = 'notes' | 'library' | 'connectome' | 'ddx' | 'mindmap' | 'pdf-workspace';

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
  sections: NoteSection[];          // Ordered content sections
  highYieldSummary: string[];       // Bullet points for Dissection View
  links: NoteLink[];                // Connections to other notes (the Connectome)
  ddxComparison?: DdxRow[];         // Differential diagnosis comparison table
  createdAt: number;                // Unix timestamp
  updatedAt: number;                // Unix timestamp
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
  type: 'content' | 'mcq' | 'flashcard' | 'mermaid' | 'algorithm' | 'tabs' | 'asset';
  content: unknown;                 // Typed by section type (see below)
}

// ─── MCQ Data ────────────────────────────────────────────────────

interface MCQData {
  id: string;                       // e.g., 'ahf-mcq-1'
  question: string;                 // Clinical vignette + stem question
  options: string[];                // Array of 5 options (A–E)
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

// ─── Asset Reference ─────────────────────────────────────────────

interface AssetRef {
  id: string;                       // e.g., 'cxr-01'
  noteId: string;                   // Parent note ID
  filename: string;                 // e.g., 'cxr_pulmonary_edema.png'
  type: 'image' | 'pdf' | 'video';
  caption: string;                  // Descriptive caption
  path: string;                     // Resolved: /assets/{noteId}/{filename}
}

// ─── Tab Data ────────────────────────────────────────────────────

interface TabData {
  tabs: { id: string; label: string; content: string }[];
}

// ─── Dynamic Section (user-added) ────────────────────────────────

interface DynamicSection {
  id: string;
  type: 'content' | 'mcq' | 'flashcard' | 'mermaid' | 'tabs' | 'asset';
  title: string;
  content: unknown;
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
}
```

### Store State Documentation

The Zustand store (`notetool-store.ts`) is the single source of truth for the entire application. It uses `persist` middleware with `localStorage` and selective `partialize`.

**Persisted Fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `notes` | `NoteData[]` | `[]` | All note data (seeded from demo) |
| `userProfile` | `UserProfile` | `{ name: 'Dr. Surgeon', ... }` | User profile |
| `settings` | `AppSettings` | `{ autoDissect: false, ... }` | App settings |
| `activeNoteId` | `string` | `'acute-heart-failure'` | Currently viewed note |
| `annotationsPerNote` | `Record<string, NoteAnnotations>` | `{}` | Per-note annotation storage |
| `dynamicSections` | `DynamicSection[]` | `[]` | User-added content sections |
| `isDark` | `boolean` | `true` | Dark mode flag |
| `sidebarOpen` | `boolean` | `true` | Sidebar visibility |
| `mcqAnswers` | `Record<string, MCQAnswerState>` | `{}` | Per-question answer state |
| `flashcardStates` | `Record<string, FlashcardState>` | `{}` | Per-card flip state |

**Non-Persisted Fields (reset on reload):**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `AppMode` | `'read'` | Current tri-mode |
| `activeView` | `ViewPanel` | `'notes'` | Current view panel |
| `dissectionMode` | `boolean` | `false` | Dissection view toggle |
| `globalPenActive` | `boolean` | `false` | Global pen overlay |
| `globalPenTool` | `GlobalPenTool` | `'pen'` | Current pen tool |
| `stickyNotes` | `StickyNote[]` | `[]` | Current note sticky notes |
| `highlightRegions` | `HighlightRegion[]` | `[]` | Current note highlights |
| `drawingPaths` | `DrawingPath[]` | `[]` | Current note drawings |
| `contentToolbarOpen` | `boolean` | `false` | Content toolbar panel |
| `searchOpen` | `boolean` | `false` | Command palette |
| `searchQuery` | `string` | `''` | Search query text |
| `fullscreenView` | `'none' \| 'connectome' \| 'mermaid' \| 'mindmap'` | `'none'` | Fullscreen visualization |
| `pdfFile` | `File \| null` | `null` | Loaded PDF file |
| `pdfPageNum` | `number` | `1` | Current PDF page |
| `developerCode` | `string` | `''` | Developer mode HTML code |
| `settingsModalOpen` | `boolean` | `false` | Settings modal |
| `newNoteModalOpen` | `boolean` | `false` | New note modal |
| `accountModalOpen` | `boolean` | `false` | Account modal |

**Key Store Actions:**

| Action | Signature | Description |
|--------|-----------|-------------|
| `setMode` | `(mode: AppMode) => void` | Switch tri-mode |
| `setActiveView` | `(view: ViewPanel) => void` | Switch view panel |
| `addNote` | `(note: NoteData) => void` | Create new note |
| `updateNote` | `(id: string, updates: Partial<NoteData>) => void` | Update note fields |
| `deleteNote` | `(id: string) => void` | Delete note (falls back to first note) |
| `duplicateNote` | `(id: string) => void` | Clone note with `(Copy)` suffix |
| `setActiveNoteId` | `(id: string) => void` | Switch active note (saves/loads annotations) |
| `addStickyNote` | `(note: StickyNote) => void` | Add sticky note |
| `addHighlightRegion` | `(region: HighlightRegion) => void` | Add text highlight |
| `addDrawingPath` | `(path: DrawingPath) => void` | Add drawing stroke |
| `clearAllAnnotations` | `() => void` | Clear all current annotations |
| `addDynamicSection` | `(section: DynamicSection) => void` | Add content block |
| `removeDynamicSection` | `(id: string) => void` | Remove content block |
| `setMCQAnswer` | `(id: string, state: Partial<MCQAnswerState>) => void` | Update MCQ answer |
| `setFlashcardFlipped` | `(id: string, flipped: boolean) => void` | Flip flashcard |
| `setGlobalPenActive` | `(active: boolean) => void` | Toggle pen overlay |
| `setFullscreenView` | `(view: ...) => void` | Enter/exit fullscreen visualization |

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
  - **Text Highlight**: Select DOM text ranges and apply colored highlight.
  - **Free Highlight**: Free-form highlight brush (rectangular overlay).
  - **Sticky Notes**: Draggable, editable sticky notes positioned anywhere.
  - **Eraser**: Remove individual annotations by clicking them.
- **Storage**: Annotations are stored per-note in `annotationsPerNote`. When switching notes, current annotations are saved and the target note's annotations are loaded.
- **Visual cues**: Amber border outline on annotated areas (`annotate-mode-active .annotate-overlay::before`), custom cursor per tool.
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

### 6.1 Global Pen Overlay

**Component**: `GlobalAnnotationOverlay.tsx`
**Store fields**: `globalPenActive`, `globalPenTool`, `highlightColor`, `drawingColor`, `drawingBrushSize`

The Global Pen Overlay is the universal annotation system that works across the entire application. It is NOT tied to a specific view or content area.

**Features:**
- Works in any mode (primarily used in Annotate mode, but can be activated in any mode).
- Five tools: Pen (free-form drawing), Text Highlight (DOM range selection), Free Highlight (brush highlight), Sticky Notes (draggable text), Eraser (remove annotations).
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

### 6.2 Dual Highlighter

**Two highlight modes:**

1. **Text Highlight** (`text-highlight` tool):
   - User selects text using standard mouse drag.
   - The DOM range is captured and stored as a `HighlightRegion`.
   - A colored overlay is rendered at the exact text position using the range's `getClientRects()`.
   - Range info (container path + offsets) enables re-rendering after DOM changes.
   - Works on any text content: markdown, MCQ options, sidebar items.

2. **Free-form Highlight** (`free-highlight` tool):
   - User paints a rectangular highlight overlay using mouse drag.
   - No DOM text selection required — works on images, diagrams, empty space.
   - Stored as a `HighlightRegion` with viewport-relative coordinates.
   - Useful for highlighting diagram nodes, image regions, or visual patterns.

### 6.3 PDF Upload & Integration

**Component**: `PdfWorkspace.tsx` (embedded in `page.tsx` as `pdf-workspace` view)
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
- Future: highlight-to-snippet extraction from PDF content.

### 6.4 Command Palette Search (Cmd+K)

**Implemented in**: `page.tsx` (inline, not a separate component)
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

### 6.5 Fullscreen Connectome/Mermaid Views

**Store field**: `fullscreenView`
**CSS class**: `fullscreen-view`

**Supported fullscreen visualizations:**

| View | Component | Fullscreen trigger |
|------|-----------|-------------------|
| Connectome | `ConnectomeView` | Button in connectome view header |
| Mermaid | `MermaidDiagram` | (future) |
| Mindmap | `MindmapView` | Button in mindmap view header |

**Behavior:**
- Fixed position overlay with z-index 90.
- Covers entire viewport with dark background.
- Animated entrance (`fullscreenIn` keyframe).
- Header bar with title and close button (`Minimize2` icon).
- Content area fills remaining space.
- Press `Escape` or click close button to exit.
- In Annotate mode, Global Pen Overlay works on top of fullscreen views.

### 6.6 Content Creation Toolbar

**Component**: `ContentToolbar.tsx`
**Store field**: `contentToolbarOpen`

**Features:**
- Animated slide-in panel from the right side (256px wide).
- Provides quick-add buttons for content types:
  - Text Section (content)
  - MCQ Question
  - Flashcard Deck
  - Mermaid Algorithm
  - Asset Placeholder
  - Tabbed Content
- Added sections appear under "Dynamic Content" with a violet badge.
- Dynamic sections have a hover-reveal delete button (X icon).
- Toggle via header "+" button or floating action button (FAB) at bottom-right.
- FAB has bounce-in animation when content toolbar is closed.

### 6.7 Developer GUI Tools

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

### 6.8 Account & Content Management

**Account Modal** (`AccountModal.tsx`):
- Edit user profile: name, specialty, institution.
- Avatar display (placeholder for future upload).
- Profile data persisted in store (`userProfile`).

**New Note Modal** (`NewNoteModal.tsx`):
- Create new synthesis notes.
- Form fields: title, category, specialty, summary.
- New notes added to store with `addNote()`.

**Note Management** (inline in `page.tsx`):
- Duplicate note (Copy icon) — clones with `(Copy)` suffix and new timestamp.
- Delete note (Trash icon) — removes from store; if active note deleted, falls back to first note.
- Note switching via sidebar click.

### 6.9 PDF Download/Export

**Implemented in**: `page.tsx` (`handleExport` function)

**Export Formats:**

| Format | Output | Styling |
|--------|--------|---------|
| JSON | Full `NoteData` object serialized | Pretty-printed with 2-space indent |
| HTML | Standalone HTML document | Dark theme (GitHub dark colors), serif headings, amber accent |

**Export Flow:**
1. User clicks Download button in header.
2. Dropdown menu appears with "Export JSON" and "Export HTML" options.
3. On selection, content is generated and a Blob is created.
4. Blob URL is generated and programmatically downloaded.
5. URL is revoked after download to free memory.

**Future exports**: PDF (via html2pdf.js or Puppeteer), Anki deck (.apkg), Markdown (.md).

---

## 7. Electron Portable Build Guide

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
    titleBarStyle: 'hiddenInset',       // macOS: traffic lights inset
    frame: true,                         // Windows/Linux: native frame
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,            // SECURITY: isolate renderer
      nodeIntegration: false,            // SECURITY: no Node in renderer
      sandbox: false,                    // Required for some IPC operations
      webviewTag: false,                 // SECURITY: disable webview
      allowRunningInsecureContent: false, // SECURITY: no mixed content
    },
  });

  // ─── Load the app ──────────────────────────────────────────────
  const isDev = !app.isPackaged;

  if (isDev) {
    // Development: load from Next.js dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: load from static export
    const indexPath = path.join(__dirname, '..', 'out', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  // ─── Window lifecycle ──────────────────────────────────────────
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // ─── Custom application menu ───────────────────────────────────
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
        {
          label: 'New Synthesis',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:new-note'),
        },
        {
          label: 'Open Note...',
          accelerator: 'CmdOrCtrl+O',
          click: () => handleOpenNote(),
        },
        { type: 'separator' },
        {
          label: 'Export JSON',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => mainWindow?.webContents.send('menu:export-json'),
        },
        {
          label: 'Export HTML',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => mainWindow?.webContents.send('menu:export-html'),
        },
        { type: 'separator' },
        {
          label: 'Import PDF...',
          accelerator: 'CmdOrCtrl+I',
          click: () => handleImportPDF(),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Read Mode',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow?.webContents.send('menu:mode', 'read'),
        },
        {
          label: 'Annotate Mode',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow?.webContents.send('menu:mode', 'annotate'),
        },
        {
          label: 'Developer Mode',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow?.webContents.send('menu:mode', 'developer'),
        },
        { type: 'separator' },
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow?.webContents.send('menu:toggle-sidebar'),
        },
        {
          label: 'Command Palette',
          accelerator: 'CmdOrCtrl+K',
          click: () => mainWindow?.webContents.send('menu:search'),
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { role: 'togglefullscreen' },
        { role: 'reload' },
        { role: 'forceReload' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ─── IPC Handlers ────────────────────────────────────────────────

// Read a file from the filesystem
ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    const resolvedPath = path.resolve(filePath);
    const content = await fs.promises.readFile(resolvedPath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Write a file to the filesystem
ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
  try {
    const resolvedPath = path.resolve(filePath);
    const dir = path.dirname(resolvedPath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(resolvedPath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Open a file dialog
ipcMain.handle('dialog:openFile', async (_event, options: Electron.OpenDialogOptions) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Notes', extensions: ['json', 'html', 'md'] },
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'] },
      { name: 'PDFs', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    ...options,
  });
  return result;
});

// Save a file dialog
ipcMain.handle('dialog:saveFile', async (_event, options: Electron.SaveDialogOptions) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: 'HTML', extensions: ['html'] },
      { name: 'Markdown', extensions: ['md'] },
    ],
    ...options,
  });
  return result;
});

// Open note handler
async function handleOpenNote() {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'SurgicalBrain Notes', extensions: ['json'] }],
    title: 'Open Note',
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const content = await fs.promises.readFile(filePath, 'utf-8');
    mainWindow?.webContents.send('note:opened', { filePath, content });
  }
}

// Import PDF handler
async function handleImportPDF() {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
    title: 'Import PDF',
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const buffer = await fs.promises.readFile(filePath);
    mainWindow?.webContents.send('pdf:imported', {
      filePath,
      data: buffer.toString('base64'),
      name: path.basename(filePath),
    });
  }
}

// Get app data path
ipcMain.handle('app:getDataPath', () => {
  return app.getPath('userData');
});

// Get documents path
ipcMain.handle('app:getDocumentsPath', () => {
  return app.getPath('documents');
});

// ─── App Lifecycle ───────────────────────────────────────────────

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
```

### Step 3: Create Preload Script

Create `electron/preload.ts`:

```typescript
// electron/preload.ts — SurgicalBridge: Safe IPC Context Bridge
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected APIs via contextBridge — these are the ONLY APIs
// available to the renderer process. No direct Node.js access.

export interface ElectronAPI {
  // File System Operations
  fs: {
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  };

  // Native Dialog Operations
  dialog: {
    openFile: (options?: Record<string, unknown>) => Promise<{ canceled: boolean; filePaths: string[] }>;
    saveFile: (options?: Record<string, unknown>) => Promise<{ canceled: boolean; filePath: string }>;
  };

  // App Path Operations
  paths: {
    getDataPath: () => Promise<string>;
    getDocumentsPath: () => Promise<string>;
  };

  // Menu event listeners (from main process)
  onMenuAction: (channel: string, callback: (...args: unknown[]) => void) => () => void;
}

contextBridge.exposeInMainWorld('electronAPI', {
  // ─── File System ────────────────────────────────────────────────
  fs: {
    readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  },

  // ─── Dialogs ────────────────────────────────────────────────────
  dialog: {
    openFile: (options?: Record<string, unknown>) => ipcRenderer.invoke('dialog:openFile', options),
    saveFile: (options?: Record<string, unknown>) => ipcRenderer.invoke('dialog:saveFile', options),
  },

  // ─── Paths ──────────────────────────────────────────────────────
  paths: {
    getDataPath: () => ipcRenderer.invoke('app:getDataPath'),
    getDocumentsPath: () => ipcRenderer.invoke('app:getDocumentsPath'),
  },

  // ─── Menu Actions (main → renderer) ────────────────────────────
  onMenuAction: (channel: string, callback: (...args: unknown[]) => void) => {
    const validChannels = [
      'menu:new-note',
      'menu:export-json',
      'menu:export-html',
      'menu:mode',
      'menu:toggle-sidebar',
      'menu:search',
      'note:opened',
      'pdf:imported',
    ];

    if (!validChannels.includes(channel)) {
      console.warn(`[SurgicalBridge] Blocked invalid IPC channel: ${channel}`);
      return () => {};
    }

    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      callback(...args);
    };

    ipcRenderer.on(channel, subscription);

    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
} as ElectronAPI);

// Type declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

### Step 4: Update package.json

Add the following to your `package.json`:

```json
{
  "name": "surgicalbrain-notetool",
  "version": "1.0.0",
  "description": "SurgicalBrain — The Universal Medical Synthesis Engine",
  "main": "electron/main.js",
  "scripts": {
    "dev": "next dev -p 3000 2>&1 | tee dev.log",
    "dev:electron": "concurrently \"wait-on http://localhost:3000 && electron .\" \"next dev -p 3000\"",
    "build": "next build",
    "build:static": "next build",
    "build:electron": "tsc -p electron/tsconfig.json && next build && electron-builder",
    "build:electron:win": "tsc -p electron/tsconfig.json && next build && electron-builder --win",
    "build:electron:mac": "tsc -p electron/tsconfig.json && next build && electron-builder --mac",
    "build:electron:linux": "tsc -p electron/tsconfig.json && next build && electron-builder --linux",
    "lint": "eslint .",
    "db:push": "prisma db push",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset"
  },
  "build": {
    "appId": "com.surgicalbrain.notetool",
    "productName": "SurgicalBrain NoteTool",
    "directories": {
      "output": "dist-electron",
      "buildResources": "electron/build"
    },
    "files": [
      "electron/main.js",
      "electron/preload.js",
      "out/**/*",
      "public/**/*",
      "assets/**/*"
    ],
    "extraResources": [
      {
        "from": "assets",
        "to": "assets"
      }
    ],
    "win": {
      "target": [
        {
          "target": "portable",
          "arch": ["x64"]
        },
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "icon": "electron/build/icon.ico",
      "artifactName": "SurgicalBrain-NoteTool-${version}-${arch}.${ext}"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "installerIcon": "electron/build/icon.ico",
      "uninstallerIcon": "electron/build/icon.ico",
      "installerHeaderIcon": "electron/build/icon.ico"
    },
    "portable": {
      "artifactName": "SurgicalBrain-NoteTool-Portable-${version}.${ext}"
    },
    "mac": {
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        },
        {
          "target": "zip",
          "arch": ["x64", "arm64"]
        }
      ],
      "icon": "electron/build/icon.icns",
      "category": "public.app-category.medical",
      "artifactName": "SurgicalBrain-NoteTool-${version}-${arch}.${ext}",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "electron/build/entitlements.mac.plist",
      "entitlementsInherit": "electron/build/entitlements.mac.plist"
    },
    "dmg": {
      "background": "electron/build/background.png",
      "contents": [
        { "x": 130, "y": 220 },
        { "x": 410, "y": 220, "type": "link", "path": "/Applications" }
      ]
    },
    "linux": {
      "target": [
        {
          "target": "AppImage",
          "arch": ["x64"]
        },
        {
          "target": "deb",
          "arch": ["x64"]
        },
        {
          "target": "tar.gz",
          "arch": ["x64"]
        }
      ],
      "icon": "electron/build",
      "category": "Education",
      "artifactName": "SurgicalBrain-NoteTool-${version}-${arch}.${ext}"
    },
    "appImage": {
      "artifactName": "SurgicalBrain-NoteTool-${version}-${arch}.AppImage"
    }
  }
}
```

### Step 5: Build Next.js for Electron

Update `next.config.ts` for static export (required for packaged Electron builds):

```typescript
import type { NextConfig } from "next";

const isElectron = process.env.ELECTRON_BUILD === 'true';

const nextConfig: NextConfig = {
  // For Electron portable builds, use static export
  output: isElectron ? 'export' : 'standalone',

  // Disable image optimization for static export
  images: isElectron ? {
    unoptimized: true,
  } : undefined,

  // Ensure trailing slashes for static hosting
  trailingSlash: isElectron ? true : undefined,

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
```

**Build command for Electron:**
```bash
ELECTRON_BUILD=true next build
```

This outputs static HTML/CSS/JS to the `out/` directory instead of the standalone server.

### Step 6: Create Portable Build

#### electron-builder.yml (alternative to package.json config)

Create `electron-builder.yml`:

```yaml
# electron-builder.yml — SurgicalBrain Electron Builder Configuration
appId: com.surgicalbrain.notetool
productName: SurgicalBrain NoteTool
copyright: Copyright © 2025 SurgicalBrain

directories:
  output: dist-electron
  buildResources: electron/build

files:
  - electron/main.js
  - electron/preload.js
  - out/**/*
  - public/**/*
  - assets/**/*

extraResources:
  - from: assets
    to: assets

# ─── Windows ──────────────────────────────────────────────────────
win:
  target:
    - target: portable
      arch:
        - x64
    - target: nsis
      arch:
        - x64
  icon: electron/build/icon.ico
  artifactName: SurgicalBrain-NoteTool-${version}-${arch}.${ext}

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  installerIcon: electron/build/icon.ico
  uninstallerIcon: electron/build/icon.ico
  installerHeaderIcon: electron/build/icon.ico

portable:
  artifactName: SurgicalBrain-NoteTool-Portable-${version}.${ext}

# ─── macOS ────────────────────────────────────────────────────────
mac:
  target:
    - target: dmg
      arch:
        - x64
        - arm64
    - target: zip
      arch:
        - x64
        - arm64
  icon: electron/build/icon.icns
  category: public.app-category.medical
  artifactName: SurgicalBrain-NoteTool-${version}-${arch}.${ext}
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: electron/build/entitlements.mac.plist
  entitlementsInherit: electron/build/entitlements.mac.plist

dmg:
  background: electron/build/background.png
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications

# ─── Linux ────────────────────────────────────────────────────────
linux:
  target:
    - target: AppImage
      arch:
        - x64
    - target: deb
      arch:
        - x64
    - target: tar.gz
      arch:
        - x64
  icon: electron/build
  category: Education
  artifactName: SurgicalBrain-NoteTool-${version}-${arch}.${ext}

appImage:
  artifactName: SurgicalBrain-NoteTool-${version}-${arch}.AppImage

# ─── Auto-Update (optional, for future) ───────────────────────────
# publish:
#   provider: github
#   owner: surgicalbrain
#   repo: notetool
```

#### Build Icon Files Required

You need to provide icon files in `electron/build/`:

| Platform | File | Size |
|----------|------|------|
| Windows | `icon.ico` | 256x256 (multi-size) |
| macOS | `icon.icns` | 512x512 (multi-size) |
| Linux | `icon.png` | 512x512 |
| macOS DMG | `background.png` | 540x360 |

**Quick icon generation from SVG:**
```bash
# Install icon generation tools
npm install -g electron-icon-builder

# Generate all sizes from a single 1024x1024 PNG
electron-icon-builder --input=public/logo.svg --output=electron/build
```

#### TypeScript Config for Electron

Create `electron/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": ".",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": false
  },
  "include": ["main.ts", "preload.ts"],
  "exclude": ["node_modules"]
}
```

### Step 7: Test the Portable Version

#### Development Mode (with hot reload)

```bash
# Terminal 1: Start Next.js dev server
bun run dev

# Terminal 2: Start Electron (waits for dev server)
bun run dev:electron
```

Or in a single command:
```bash
concurrently "next dev -p 3000" "wait-on http://localhost:3000 && electron ."
```

#### Build and Test Portable Executable

```bash
# 1. Compile Electron TypeScript
cd /home/z/my-project
npx tsc -p electron/tsconfig.json

# 2. Build Next.js for static export
ELECTRON_BUILD=true next build

# 3. Build the portable executable
npx electron-builder --win portable
# For macOS: npx electron-builder --mac
# For Linux: npx electron-builder --linux AppImage

# 4. Find the output
ls dist-electron/
# Windows: SurgicalBrain-NoteTool-Portable-1.0.0.exe
# macOS: SurgicalBrain-NoteTool-1.0.0-arm64.dmg
# Linux: SurgicalBrain-NoteTool-1.0.0-x64.AppImage
```

#### Test the Portable Build

```bash
# Windows
./dist-electron/SurgicalBrain-NoteTool-Portable-1.0.0.exe

# macOS
open ./dist-electron/mac-arm64/SurgicalBrain-NoteTool-1.0.0-arm64.dmg

# Linux
chmod +x ./dist-electron/SurgicalBrain-NoteTool-1.0.0-x64.AppImage
./dist-electron/SurgicalBrain-NoteTool-1.0.0-x64.AppImage
```

### Complete Code Examples Summary

#### File: `electron/main.ts`
(See Step 2 above — full file with BrowserWindow, IPC handlers, menu, lifecycle)

#### File: `electron/preload.ts`
(See Step 3 above — full file with contextBridge, fs, dialog, paths, menu actions)

#### File: `electron/tsconfig.json`
(See Step 6 above — TypeScript configuration for Electron compilation)

#### File: `electron-builder.yml`
(See Step 6 above — Complete build configuration for all platforms)

#### File: `next.config.ts` changes
(See Step 5 above — Conditional output: standalone vs export)

#### File: `package.json` changes
(See Step 4 above — New scripts, main entry, build config)

### Troubleshooting

#### Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| **Blank window on launch** | Next.js not ready or wrong URL | Use `wait-on` in dev; check `out/` exists in prod |
| **"require is not defined"** | `nodeIntegration` is `true` or `contextIsolation` is `false` | Ensure both are set correctly (see Step 2) |
| **Static export 404s** | `trailingSlash` not set | Set `trailingSlash: true` in next.config.ts |
| **Images not loading** | `images.unoptimized` not set | Add `images: { unoptimized: true }` to next.config.ts |
| **CSP errors** | Content Security Policy blocking inline scripts | Add meta tag or Electron header override |
| **IPC channel not working** | Channel not in preload's `validChannels` list | Add channel name to the whitelist array |
| **Portable .exe too large** | Including node_modules in build | Verify `files` config only includes needed paths |
| **macOS code signing error** | No Apple Developer certificate | Add `CSC_IDENTITY_AUTO_DISCOVERY=false` env var to skip signing |
| **Asset files not found** | Wrong relative path in packaged app | Use `process.resourcesPath` for assets in `extraResources` |
| **Dev tools open in production** | `openDevTools` called unconditionally | Guard with `isDev` check (see Step 2) |

#### Path Resolution in Electron vs Browser

```typescript
// ❌ WRONG — Browser path (won't work in Electron production)
const assetPath = '/assets/note-id/image.png';

// ✅ CORRECT — Electron production path
import { app } from 'electron';
const assetPath = path.join(process.resourcesPath, 'assets', 'note-id', 'image.png');

// ✅ CORRECT — Dual mode (dev + prod)
const isDev = !app.isPackaged;
const assetPath = isDev
  ? path.join(__dirname, '..', 'assets', 'note-id', 'image.png')
  : path.join(process.resourcesPath, 'assets', 'note-id', 'image.png');

// ✅ CORRECT — Renderer side (via preload)
const dataPath = await window.electronAPI.paths.getDataPath();
const docsPath = await window.electronAPI.paths.getDocumentsPath();
```

#### CSP Issues with Next.js in Electron

Add this to `electron/main.ts` in the `createWindow` function:

```typescript
// Set Content Security Policy for Electron
mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https:; " +
        "frame-src 'self' blob:;"
      ],
    },
  });
});
```

#### Electron Build Doesn't Show App

If the packaged app shows a blank window:
1. Open DevTools programmatically: `mainWindow.webContents.openDevTools()`
2. Check the console for errors.
3. Verify `out/index.html` exists and is valid.
4. Check that all static assets were copied to `out/`.
5. Ensure `trailingSlash: true` is set for static export.

---

## 8. Development Workflow

### How to Run the Dev Server

```bash
# Start Next.js development server on port 3000
cd /home/z/my-project
bun run dev

# The app is available at http://localhost:3000
# Hot reload is enabled — changes reflect immediately
```

### How to Run with Electron (Development)

```bash
# Start both Next.js and Electron concurrently
bun run dev:electron

# This runs:
# 1. wait-on http://localhost:3000 (waits for dev server)
# 2. electron . (launches Electron window)
# 3. Next.js dev server runs with hot reload
```

### How to Build for Production (Web)

```bash
# Build Next.js standalone server
bun run build

# Start production server
bun run start
```

### How to Build for Production (Electron)

```bash
# 1. Compile Electron TypeScript
npx tsc -p electron/tsconfig.json

# 2. Build Next.js static export
ELECTRON_BUILD=true next build

# 3. Package with electron-builder
npx electron-builder

# Or for specific platform:
npx electron-builder --win    # Windows (portable + NSIS)
npx electron-builder --mac    # macOS (DMG + ZIP)
npx electron-builder --linux  # Linux (AppImage + DEB)
```

### How to Check Code Quality

```bash
# Run ESLint
bun run lint

# This checks:
# - TypeScript errors
# - React/Next.js best practices
# - Unused imports/variables
# - Accessibility issues
```

### Development Agent Workflow

1. **[The Architect]** initializes the project skeleton and data model.
2. **[The Stylist]** establishes the design token system and component styles.
3. **[The Clinical Strategist]** defines the demo note content and educational templates.
4. **[The Asset Manager]** sets up the asset pipeline and placeholder system.
5. All agents collaborate on the Tri-Mode interface implementation.
6. Integration testing across all three modes.
7. Electron wrapper preparation for desktop deployment.
8. Portable build generation and cross-platform testing.

---

## 9. Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Cmd+K` / `Ctrl+K` | Open Command Palette | Global |
| `Cmd+1` / `Ctrl+1` | Switch to Read Mode | Global |
| `Cmd+2` / `Ctrl+2` | Switch to Annotate Mode | Global |
| `Cmd+3` / `Ctrl+3` | Switch to Developer Mode | Global |
| `Cmd+B` / `Ctrl+B` | Toggle Sidebar | Global |
| `Escape` | Close modals / search / fullscreen | Global |
| `Cmd+N` / `Ctrl+N` | New Synthesis Note | Global (Electron) |
| `Cmd+O` / `Ctrl+O` | Open Note File | Electron only |
| `Cmd+Shift+E` / `Ctrl+Shift+E` | Export JSON | Electron only |
| `Cmd+Shift+H` / `Ctrl+Shift+H` | Export HTML | Electron only |
| `Cmd+I` / `Ctrl+I` | Import PDF | Electron only |
| `Cmd+,` / `Ctrl+,` | Open Settings | Electron only |

### Command Palette Navigation

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open / Close palette |
| `Arrow Up` | Move selection up |
| `Arrow Down` | Move selection down |
| `Enter` | Select note and navigate |
| `Escape` | Close palette |

### Annotation Mode Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `P` | Select Pen tool | Annotate mode |
| `H` | Select Text Highlight tool | Annotate mode |
| `F` | Select Free Highlight tool | Annotate mode |
| `S` | Add Sticky Note | Annotate mode |
| `E` | Select Eraser tool | Annotate mode |
| `[` | Decrease brush size | Annotate mode |
| `]` | Increase brush size | Annotate mode |
| `Cmd+Z` / `Ctrl+Z` | Undo last annotation | Annotate mode |
| `Cmd+Shift+Z` / `Ctrl+Shift+Z` | Redo annotation | Annotate mode |

### MCQ Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `1`–`5` / `A`–`E` | Select answer option | MCQ focused |
| `Enter` | Reveal explanation (after selecting) | MCQ focused |
| `R` | Reset MCQ answer | MCQ focused |

### Flashcard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Space` | Flip card | Flashcard focused |
| `←` | Previous card | Flashcard deck |
| `→` | Next card | Flashcard deck |

### View Navigation

| Shortcut | Action | Context |
|----------|--------|---------|
| `Cmd+Shift+C` / `Ctrl+Shift+C` | Open Connectome View | Global |
| `Cmd+Shift+M` / `Ctrl+Shift+M` | Open Mindmap View | Global |
| `Cmd+Shift+D` / `Ctrl+Shift+D` | Open DDx Splitter | Global |
| `Cmd+Shift+P` / `Ctrl+Shift+P` | Open PDF Workspace | Global |
| `Cmd+Shift+F` / `Ctrl+Shift+F` | Toggle Fullscreen View | Visualizations |
| `F11` | Toggle Browser Fullscreen | Browser only |

---

*SurgicalBrain NoteTool — Built with the Surgeon's Mind. Dissect. Map. Act. Connect.*
