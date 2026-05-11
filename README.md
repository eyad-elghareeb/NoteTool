<div align="center">
  # SurgicalBrain NoteTool
  
  ### The Universal Medical Synthesis Engine
  
  *"Dissect → Map → Act → Connect"*
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.1-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
  [![Zustand](https://img.shields.io/badge/Zustand-5.x-433E38?style=flat-square)](https://github.com/pmndrs/zustand)
  [![D3.js](https://img.shields.io/badge/D3.js-7.x-F9A03C?style=flat-square&logo=d3.js)](https://d3js.org/)
  [![Mermaid](https://img.shields.io/badge/Mermaid-11.x-FF3670?style=flat-square&logo=mermaid)](https://mermaid.js.org/)
  [![Framer Motion](https://img.shields.io/badge/Framer-12.x-0055FF?style=flat-square&logo=framer)](https://www.framer.com/motion/)
  [![Electron](https://img.shields.io/badge/Electron-ready-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
  [![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
</div>

---

## 📋 Overview

**SurgicalBrain** is a local-first, medical-grade knowledge synthesis platform designed for **clinicians, residents, and medical students**. It combines structured note-taking, interactive clinical algorithms, active-recall testing, visual diagram building, and a knowledge graph (the "Connectome") into a single desktop-ready application.

> *"The Surgeon's Mind" Philosophy — every feature follows a four-step cognitive cycle:*
>
> | Step | Meaning | Implementation |
> |------|---------|---------------|
> | **Dissect** | Break down complex topics into high-yield components | Dissection View, collapsible sections, high-yield summaries |
> | **Map** | Visualize relationships between concepts | Connectome graph (D3.js), Mermaid algorithms, Markmap mindmaps, MermaidMakerGUI |
> | **Act** | Test and reinforce knowledge through active recall | MCQ blocks (SBA format), flashcard blocks (cloze / image-occlusion) |
> | **Connect** | Link topics across specialties via the knowledge graph | Note links, ICD-10/SNOMED tagging, DDx Splitter, folders |

---

## ✨ Features

### 📝 Medical-Grade Note-Taking
- **Structured notes** with multiple section types (content, MCQs, flashcards, diagrams, tabs, assets, PDF embeds)
- **Dissection View** — high-yield summary collapsible mode for rapid scanning
- **Medical-grade typography** optimized for clinical readability (15–16px base, 1.65 line-height)
- **ICD-10/SNOMED CT tagging** for professional-grade indexing
- **Local-first architecture** — all data persisted to localStorage, no network dependency

### 🧠 Active Recall Engine
- **MCQ Blocks** — Single Best Answer (SBA) format following medical examination standards
- **Flashcard Blocks** — Cloze deletion & Image Occlusion cards with 3D flip animation
- **Persistent state** — answer progress and card flips survive note switches and page reloads

### 📊 Clinical Algorithms & Diagrams
- **Mermaid.js Integration** — render clinical pathways, decision trees, and protocols
- **MermaidMakerGUI** — visual flowchart builder with drag-and-drop step editing
- **Zoom/Pan Controls** — interactive diagram exploration with `react-zoom-pan-pinch`
- **Preset Templates** — Clinical Pathway, Decision Tree, Protocol quick-starts

### 🔗 Knowledge Graph (The "Connectome")
- **D3.js force-directed graph** visualizing relationships between medical concepts
- **Note linking** with typed relations (e.g., "differential-diagnosis", "via-RAA-system")
- **Specialty color coding** — Cardiac, Respiratory, Renal, Neuro, GI, Surgical
- **Click-to-navigate** — jump directly to connected notes

### 🧩 Differential Diagnosis Splitter
- Side-by-side comparison tables highlighting **discriminating features**
- Color-coded cells: green (supporting), red (contradicting), neutral (equivocal)

### 🧭 Interactive Mindmaps
- **Markmap** collapsible mindmap rendering from note content
- Fullscreen exploration mode

### ✏️ Tri-Mode Interface
| Mode | Purpose |
|------|---------|
| **Read** (Clean Room) | High-contrast scanning mode for rounds and study |
| **Annotate** (Canvas Layer) | Non-destructive pen, highlight, sticky notes overlay |
| **Developer** (Split-Pane) | WYSIWYG + raw HTML/JS editor for custom content |

### 📄 PDF Workspace
- Split-screen PDF viewer with drag-and-drop upload
- Highlight-to-snippet extraction workflow
- Annotation overlay compatible

### 📦 Export Pipeline
- **JSON** — Full note data export
- **HTML** — Standalone readable document with dark theme
- **PDF** — DOM capture via html2canvas + jsPDF

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) | SSR/SSG, routing, API routes |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Type safety across entire codebase |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS with custom design tokens |
| **Components** | [shadcn/ui](https://ui.shadcn.com/) | Pre-built, accessible UI primitives |
| **State** | [Zustand 5](https://github.com/pmndrs/zustand) | Client-side global state with persist middleware |
| **Graph** | [D3.js 7](https://d3js.org/) | Connectome force-directed graph |
| **Diagrams** | [Mermaid.js 11](https://mermaid.js.org/) | Clinical algorithm flowcharts |
| **Mindmaps** | [Markmap 0.18](https://markmap.js.org/) | Interactive collapsible mindmaps |
| **Animation** | [Framer Motion 12](https://www.framer.com/motion/) | Page transitions, micro-interactions |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent icon system |
| **Database** | [Prisma ORM](https://www.prisma.io/) + SQLite | Optional server-side persistence |
| **Desktop** | [Electron](https://www.electronjs.org/) | Cross-platform portable build |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [bun](https://bun.sh/) 1.x (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/eyad-elghareeb/NoteTool.git
cd NoteTool

# Install dependencies
bun install

# Start the development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using SurgicalBrain.

### Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Next.js dev server (port 3000) |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |

---

## 🏗️ Project Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout: fonts, dark theme, Toaster
│   ├── page.tsx              # Main application shell (single-page app)
│   └── globals.css           # Design tokens, glassmorphism, animations
│
├── components/
│   ├── ui/                   # shadcn/ui primitives (50+ components)
│   └── notetool/             # SurgicalBrain domain components
│       ├── AccountModal.tsx        # User profile editing
│       ├── ConnectomeView.tsx      # D3.js knowledge graph
│       ├── ContentToolbar.tsx      # Add-content sidebar panel
│       ├── DDxSplitter.tsx         # Differential diagnosis comparison
│       ├── DeveloperView.tsx       # Code editor panel
│       ├── DissectionView.tsx      # High-yield summary collapser
│       ├── FlashcardBlock.tsx      # Cloze & Image Occlusion
│       ├── GlobalAnnotationOverlay.tsx  # Universal pen/highlight overlay
│       ├── HomeScreen.tsx          # Dashboard with folders & stats
│       ├── ICDTagger.tsx           # ICD-10/SNOMED code badges
│       ├── MCQBlock.tsx            # Interactive SBA questions
│       ├── MarkdownRenderer.tsx    # MD with Mermaid code block detection
│       ├── MedLibrary.tsx          # Medical library browser
│       ├── MermaidDiagram.tsx      # Algorithm renderer with zoom
│       ├── MermaidMakerGUI.tsx     # Visual flowchart builder
│       ├── MindmapView.tsx         # Markmap collapsible mindmap
│       ├── NewNoteModal.tsx        # Create note dialog
│       ├── NoteTabs.tsx            # Multi-tab content sections
│       ├── PdfWorkspace.tsx        # Split-screen PDF viewer
│       ├── SettingsModal.tsx       # Application settings
│       ├── Sidebar.tsx             # Note navigation & folders
│       ├── StatusBar.tsx           # Bottom status bar
│       ├── ThemeSync.tsx           # Theme synchronization
│       └── TriModeSwitcher.tsx     # Read/Annotate/Developer toggle
│
├── stores/
│   └── notetool-store.ts   # Zustand global state (607 lines)

Assets are organized by note:  /assets/{Note_ID}/filename.ext

Electron wrapper:  /electron/main.ts + preload.ts
```

---

## 🎯 Design Principles

1. **Local-First** — All core functionality works offline. No network dependency for CRUD operations.
2. **Medical-Grade Typography** — 15–16px base, 1.65 line-height, generous paragraph spacing, serif headings.
3. **Semantic Color** — Amber (#f0a500) = clinical action, Red (#da3633) = critical/danger, Green (#2ea043) = safe/correct.
4. **Non-Destructive Annotations** — Highlights, drawings, and sticky notes stored separately from base content.
5. **Active Recall > Passive Reading** — Every note prompts the learner to think, not just consume.
6. **Atomicity** — Writes are atomic; never leave a note in a partially-saved state.
7. **Progressive Complexity** — Content layered: Dissection View for rapid review, full sections for deep study, MCQ/flashcards for active recall.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` | Read Mode |
| `Ctrl+2` | Annotate Mode |
| `Ctrl+3` | Developer Mode |
| `Ctrl+K` | Command Palette (search notes) |
| `Ctrl+B` | Toggle Sidebar |
| `Ctrl+Shift+P` | Toggle Pen Overlay |
| `Escape` | Close fullscreen/modal/palette |

---

## 📖 Demo Content

SurgicalBrain ships with demo notes covering:
- **Acute Heart Failure Management** (Cardiology)
- **COPD Exacerbation** (Respiratory)
- **Laparoscopic Cholecystectomy** (Surgery)
- **Acute Kidney Injury** (Nephrology)

Each demo note includes full sections, MCQs, flashcards, clinical algorithms, and Connectome links.

---

## 📦 Export Formats

| Format | Description |
|--------|-------------|
| **JSON** | Full `NoteData` object — importable back into the app |
| **HTML** | Standalone readable document with dark theme styling |
| **PDF** | Visual DOM capture with CSS variable resolution |

---

## 🖥️ Desktop Build (Electron)

SurgicalBrain can be packaged as a cross-platform desktop application:

```bash
# Development (web + Electron simultaneously)
bun run dev:electron

# Production build
bun run dist
```

Supports Windows (NSIS, portable), macOS (DMG, ZIP), and Linux (AppImage, DEB).

---

## 🎨 Color Palette

```
┌─ SURFACE LAYER ──────────────────────────────────────────────┐
│  BG #0d1117    Surface1 #161b22   Surface2 #1c2330           │
│  Surface3 #222a36    Border #30363d                           │
├─ TEXT LAYER ─────────────────────────────────────────────────┤
│  Primary #e6edf3    Muted #8b949e                             │
├─ ACCENT LAYER ───────────────────────────────────────────────┤
│  Amber #f0a500     Amber Light #ffc844                        │
├─ SEMANTIC LAYER ─────────────────────────────────────────────┤
│  Correct #2ea043   Wrong/Critical #da3633                     │
├─ SPECIALTY LAYER ────────────────────────────────────────────┤
│  Cardiac #f43f5e   Respiratory #38bdf8   Renal #a78bfa       │
│  Neuro #fb923c     GI #4ade80           Surgical #f0a500      │
└──────────────────────────────────────────────────────────────┘
```

---

## 🤝 Contributing

Please refer to [AGENTS.md](AGENTS.md) for the full architecture guide, component API reference, state management patterns, and contributing guidelines.

### Quick Checklist
- [ ] TypeScript compiles without errors
- [ ] All section types render correctly
- [ ] Mermaid diagrams render without black boxes on edge labels
- [ ] Zoom controls use `setTransform()` (not `zoomTo()`)
- [ ] PDF export doesn't crash with CSS `var()` errors
- [ ] MCQ answer state persists across note switches
- [ ] Annotations save/load correctly when switching notes

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <sub>Built with ❤️ for the medical education community</sub>
  <br />
  <sub>SurgicalBrain — *"Dissect → Map → Act → Connect"*</sub>
</div>