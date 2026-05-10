'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Highlighter,
  StickyNote,
  Pencil,
  Eraser,
  Trash2,
  Palette,
  X,
  Minus,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useNoteToolStore,
  type StickyNote as StickyNoteType,
  type DrawingPath,
  type HighlightRect,
} from '@/stores/notetool-store';

const HIGHLIGHT_COLORS = [
  { id: 'amber', color: 'var(--color-sb-accent)', label: 'Amber' },
  { id: 'yellow', color: '#fbbf24', label: 'Yellow' },
  { id: 'green', color: '#34d399', label: 'Green' },
  { id: 'cyan', color: '#22d3ee', label: 'Cyan' },
  { id: 'pink', color: '#f472b6', label: 'Pink' },
  { id: 'red', color: '#f87171', label: 'Red' },
];

const STICKY_COLORS = [
  { id: 'yellow', bg: '#fde68a', border: '#fbbf24', text: '#78350f' },
  { id: 'green', bg: '#86efac', border: '#34d399', text: '#064e3b' },
  { id: 'blue', bg: '#93c5fd', border: '#60a5fa', text: '#1e3a5f' },
  { id: 'pink', bg: '#f9a8d4', border: '#f472b6', text: '#831843' },
  { id: 'orange', bg: '#fdba74', border: '#fb923c', text: '#7c2d12' },
];

const DRAW_COLORS = [
  { id: 'amber', color: 'var(--color-sb-accent)' },
  { id: 'red', color: '#ef4444' },
  { id: 'green', color: '#22c55e' },
  { id: 'cyan', color: '#06b6d4' },
  { id: 'white', color: '#ffffff' },
  { id: 'pink', color: '#ec4899' },
];

interface AnnotateCanvasProps {
  children: React.ReactNode;
  isActive: boolean;
}

export function AnnotateCanvas({ children, isActive }: AnnotateCanvasProps) {
  const store = useNoteToolStore();
  const {
    annotateTool,
    setAnnotateTool,
    highlightColor,
    setHighlightColor,
    drawingColor,
    setDrawingColor,
    drawingBrushSize,
    setDrawingBrushSize,
    stickyNotes,
    addStickyNote,
    updateStickyNote,
    removeStickyNote,
    highlightRegions,
    addHighlightRegion,
    removeHighlightRegion,
    drawingPaths,
    addDrawingPath,
    removeDrawingPath,
    clearAllAnnotations,
  } = store;

  const [dragNote, setDragNote] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [selectedStickyColor, setSelectedStickyColor] = useState('yellow');
  const [showColorPicker, setShowColorPicker] = useState<'highlight' | 'drawing' | 'sticky' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isEraserActive = annotateTool === 'eraser';
  const isDrawingActive = annotateTool === 'drawing';

  // ─── Highlight Tool ──────────────────────────────────────────────
  const handleMouseUpHighlight = useCallback(
    (e: React.MouseEvent) => {
      if (annotateTool !== 'highlight' || !isActive) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const text = selection.toString().trim();
      if (!text) return;

      const clientRects = range.getClientRects();
      if (clientRects.length === 0) return;

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      // Capture ALL rects for multi-line selections
      const rects: HighlightRect[] = [];
      for (let i = 0; i < clientRects.length; i++) {
        const r = clientRects[i];
        // Skip near-zero-width rects (sometimes returned at line boundaries)
        if (r.width < 2) continue;
        rects.push({
          x: r.left - containerRect.left,
          y: r.top - containerRect.top,
          width: r.width,
          height: r.height,
        });
      }

      if (rects.length === 0) return;

      // Use the first rect as the primary rect for backward compat
      const firstRect = rects[0];

      const newHighlight = {
        id: `hl-${Date.now()}`,
        text,
        color: highlightColor,
        rangeInfo: {
          startContainerPath: '',
          startOffset: range.startOffset,
          endContainerPath: '',
          endOffset: range.endOffset,
        },
        rect: firstRect,
        rects,
      };

      addHighlightRegion(newHighlight);
      selection.removeAllRanges();
    },
    [annotateTool, isActive, highlightColor, addHighlightRegion]
  );

  // ─── Sticky Note Tool ────────────────────────────────────────────
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isActive) return;
      if (annotateTool !== 'sticky') return;
      // Don't add notes if clicking on existing notes or toolbar
      const target = e.target as HTMLElement;
      if (target.closest('[data-sticky-note]') || target.closest('[data-annotate-toolbar]')) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const colorSet = STICKY_COLORS.find((c) => c.id === selectedStickyColor) || STICKY_COLORS[0];

      const newNote: StickyNoteType = {
        id: `note-${Date.now()}`,
        x,
        y,
        text: '',
        color: colorSet.id,
        timestamp: Date.now(),
      };

      addStickyNote(newNote);
    },
    [isActive, annotateTool, selectedStickyColor, addStickyNote]
  );

  // ─── Drawing Tool ────────────────────────────────────────────────
  const handleDrawStart = useCallback(
    (e: React.MouseEvent) => {
      if (annotateTool !== 'drawing' || !isActive) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      setIsDrawing(true);
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentPath([{ x, y }]);
    },
    [annotateTool, isActive]
  );

  const handleDrawMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || annotateTool !== 'drawing') return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentPath((prev) => [...prev, { x, y }]);
    },
    [isDrawing, annotateTool]
  );

  const handleDrawEnd = useCallback(() => {
    if (!isDrawing || currentPath.length < 2) {
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    const newPath: DrawingPath = {
      id: `path-${Date.now()}`,
      points: currentPath,
      color: drawingColor,
      strokeWidth: drawingBrushSize,
    };

    addDrawingPath(newPath);
    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentPath, drawingColor, drawingBrushSize, addDrawingPath]);

  // ─── Sticky Note Drag ────────────────────────────────────────────
  const handleNoteMouseDown = useCallback(
    (e: React.MouseEvent, noteId: string) => {
      if (!isActive) return;
      // Don't drag if eraser is active — let the click handler delete it
      if (annotateTool === 'eraser') return;
      e.stopPropagation();
      e.preventDefault();
      setDragNote(noteId);
      const note = stickyNotes.find((n) => n.id === noteId);
      if (note && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left - note.x,
          y: e.clientY - rect.top - note.y,
        });
      }
    },
    [isActive, annotateTool, stickyNotes]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragNote || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      updateStickyNote(dragNote, { x, y });
    },
    [dragNote, dragOffset, updateStickyNote]
  );

  const handleMouseUp = useCallback(() => {
    setDragNote(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  // ─── Eraser Tool Click ───────────────────────────────────────────
  const handleEraserClick = useCallback(
    (e: React.MouseEvent) => {
      if (annotateTool !== 'eraser' || !isActive) return;
      const target = e.target as HTMLElement;

      // Check if clicking on a sticky note
      const stickyEl = target.closest('[data-sticky-note]');
      if (stickyEl) {
        const noteId = stickyEl.getAttribute('data-sticky-note');
        if (noteId) {
          removeStickyNote(noteId);
          return;
        }
      }

      // Check if clicking on a highlight
      const highlightEl = target.closest('[data-highlight-id]');
      if (highlightEl) {
        const hlId = highlightEl.getAttribute('data-highlight-id');
        if (hlId) {
          removeHighlightRegion(hlId);
          return;
        }
      }

      // Check if clicking on a drawing path (via SVG group)
      const drawingEl = target.closest('[data-drawing-path]');
      if (drawingEl) {
        const pathId = drawingEl.getAttribute('data-drawing-path');
        if (pathId) {
          removeDrawingPath(pathId);
          return;
        }
      }

      // Fallback: proximity-based detection for drawing paths
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const threshold = 15;
        for (let i = drawingPaths.length - 1; i >= 0; i--) {
          const path = drawingPaths[i];
          for (const pt of path.points) {
            const dist = Math.sqrt((pt.x - clickX) ** 2 + (pt.y - clickY) ** 2);
            if (dist < threshold) {
              removeDrawingPath(path.id);
              return;
            }
          }
        }
      }
    },
    [annotateTool, isActive, removeStickyNote, removeHighlightRegion, drawingPaths, removeDrawingPath]
  );

  // ─── Render Helpers ──────────────────────────────────────────────
  const getStickyColor = (colorId: string) => {
    return STICKY_COLORS.find((c) => c.id === colorId) || STICKY_COLORS[0];
  };

  if (!isActive) return <>{children}</>;

  const totalAnnotations = stickyNotes.length + highlightRegions.length + drawingPaths.length;

  return (
    <div className="relative">
      {/* ─── ANNOTATION TOOLBAR ──────────────────────────────────────── */}
      <div
        data-annotate-toolbar
        className={cn(
          'relative z-10 mb-4 rounded-2xl border',
          'glass-strong',
          'border-sb-border/60',
          'p-3 shadow-lg shadow-black/30',
          'annotate-toolbar-active'
        )}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tool Buttons */}
          <div className="flex items-center gap-1 rounded-xl bg-sb-bg/80 p-1">
            {/* Highlight */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-1.5 text-xs h-8 px-3 rounded-md',
                annotateTool === 'highlight'
                  ? 'bg-sb-accent/20 text-sb-accent'
                  : 'text-sb-muted hover:text-sb-text hover:bg-sb-surface2'
              )}
              onClick={() => {
                setAnnotateTool(annotateTool === 'highlight' ? null : 'highlight');
                setShowColorPicker(annotateTool === 'highlight' ? null : 'highlight');
              }}
            >
              <Highlighter className="h-4 w-4" />
              <span className="hidden sm:inline">Highlight</span>
            </Button>

            {/* Sticky Note */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-1.5 text-xs h-8 px-3 rounded-md',
                annotateTool === 'sticky'
                  ? 'bg-sb-accent/20 text-sb-accent'
                  : 'text-sb-muted hover:text-sb-text hover:bg-sb-surface2'
              )}
              onClick={() => {
                setAnnotateTool(annotateTool === 'sticky' ? null : 'sticky');
                setShowColorPicker(annotateTool === 'sticky' ? null : 'sticky');
              }}
            >
              <StickyNote className="h-4 w-4" />
              <span className="hidden sm:inline">Sticky Note</span>
            </Button>

            {/* Drawing */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-1.5 text-xs h-8 px-3 rounded-md',
                annotateTool === 'drawing'
                  ? 'bg-sb-accent/20 text-sb-accent'
                  : 'text-sb-muted hover:text-sb-text hover:bg-sb-surface2'
              )}
              onClick={() => {
                setAnnotateTool(annotateTool === 'drawing' ? null : 'drawing');
                setShowColorPicker(annotateTool === 'drawing' ? null : 'drawing');
              }}
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Draw</span>
            </Button>

            {/* Eraser */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-1.5 text-xs h-8 px-3 rounded-md',
                annotateTool === 'eraser'
                  ? 'bg-sb-wrong/20 text-sb-wrong'
                  : 'text-sb-muted hover:text-sb-text hover:bg-sb-surface2'
              )}
              onClick={() => {
                setAnnotateTool(annotateTool === 'eraser' ? null : 'eraser');
                setShowColorPicker(null);
              }}
            >
              <Eraser className="h-4 w-4" />
              <span className="hidden sm:inline">Eraser</span>
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 bg-sb-border" />

          {/* Color Picker Area */}
          {showColorPicker === 'highlight' && (
            <div className="flex items-center gap-1.5 px-2">
              <Palette className="h-3.5 w-3.5 text-sb-muted" />
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  className={cn(
                    'color-swatch',
                    highlightColor === c.color && 'active'
                  )}
                  style={{ backgroundColor: c.color }}
                  onClick={() => setHighlightColor(c.color)}
                  title={c.label}
                />
              ))}
            </div>
          )}

          {showColorPicker === 'sticky' && (
            <div className="flex items-center gap-1.5 px-2">
              <Palette className="h-3.5 w-3.5 text-sb-muted" />
              {STICKY_COLORS.map((c) => (
                <button
                  key={c.id}
                  className={cn(
                    'color-swatch',
                    selectedStickyColor === c.id && 'active'
                  )}
                  style={{ backgroundColor: c.bg }}
                  onClick={() => setSelectedStickyColor(c.id)}
                  title={c.id}
                />
              ))}
            </div>
          )}

          {showColorPicker === 'drawing' && (
            <div className="flex items-center gap-2 px-2">
              <Palette className="h-3.5 w-3.5 text-sb-muted" />
              {DRAW_COLORS.map((c) => (
                <button
                  key={c.id}
                  className={cn(
                    'color-swatch',
                    drawingColor === c.color && 'active'
                  )}
                  style={{ backgroundColor: c.color }}
                  onClick={() => setDrawingColor(c.color)}
                  title={c.id}
                />
              ))}
              <Separator orientation="vertical" className="h-4 bg-sb-border" />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-sb-muted"
                  onClick={() => setDrawingBrushSize(Math.max(1, drawingBrushSize - 1))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-[10px] text-sb-muted w-6 text-center font-mono">
                  {drawingBrushSize}px
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-sb-muted"
                  onClick={() => setDrawingBrushSize(Math.min(20, drawingBrushSize + 1))}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1" />

          {/* Annotation Count */}
          <Badge
            variant="outline"
            className="text-[10px] border-sb-border text-sb-accent bg-sb-accent/10"
          >
            {totalAnnotations} annotation{totalAnnotations !== 1 ? 's' : ''}
          </Badge>

          {/* Clear All */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-8 text-sb-wrong hover:text-[#f87171] hover:bg-sb-wrong/10 rounded-md"
            onClick={() => clearAllAnnotations()}
            title="Clear All Annotations"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear All</span>
          </Button>
        </div>

        {/* Active tool hint */}
        {annotateTool && (
          <div className="mt-2 pt-2 border-t border-sb-border/50">
            <p className="text-[11px] text-sb-muted">
              {annotateTool === 'highlight' && '💡 Select text on the page to highlight it'}
              {annotateTool === 'sticky' && '💡 Click anywhere on the page to place a sticky note'}
              {annotateTool === 'drawing' && '💡 Click and drag to draw on top of the content'}
              {annotateTool === 'eraser' && '💡 Click on a sticky note, highlight, or drawing to erase it'}
            </p>
          </div>
        )}
      </div>

      {/* ─── CANVAS CONTAINER ────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={cn(
          'relative',
          annotateTool === 'sticky' && 'cursor-crosshair',
          annotateTool === 'eraser' && 'cursor-pointer',
          annotateTool === 'highlight' && 'annotate-highlight-selection',
          annotateTool === 'drawing' && 'cursor-crosshair'
        )}
        onClick={(e) => {
          handleContainerClick(e);
          handleEraserClick(e);
        }}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handleDrawMove(e);
        }}
        onMouseUp={(e) => {
          handleMouseUpHighlight(e);
          handleDrawEnd();
        }}
      >
        {/* Content with highlight overlays rendered inline */}
        <div ref={contentRef}>
          {children}
        </div>

        {/* ─── SVG DRAWING OVERLAY ──────────────────────────────────────── */}
        <svg
          ref={svgRef}
          className={cn(
            'drawing-canvas-overlay',
            isDrawingActive && 'drawing-active',
            isEraserActive && 'eraser-canvas-active'
          )}
          style={{ position: 'absolute', inset: 0 }}
          onMouseDown={handleDrawStart}
        >
          {/* Rendered drawing paths */}
          {drawingPaths.map((path) => (
            <g key={path.id} data-drawing-path={path.id}>
              {/* Invisible wider stroke for easier clicking when eraser is active */}
              {isEraserActive && (
                <path
                  d={path.points
                    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
                    .join(' ')}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(path.strokeWidth + 12, 20)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                />
              )}
              {/* Visible stroke */}
              <path
                d={path.points
                  .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
                  .join(' ')}
                fill="none"
                stroke={path.color}
                strokeWidth={path.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
                style={isEraserActive ? { pointerEvents: 'none', cursor: 'pointer' } : undefined}
              />
            </g>
          ))}

          {/* Current drawing path (in progress) */}
          {isDrawing && currentPath.length > 1 && (
            <path
              d={currentPath
                .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
                .join(' ')}
              fill="none"
              stroke={drawingColor}
              strokeWidth={drawingBrushSize}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          )}
        </svg>

        {/* ─── HIGHLIGHT RECTANGLE OVERLAYS ──────────────────────────────── */}
        {highlightRegions.map((hl) => {
          // Support both single rect (legacy) and multi-rect
          const renderRects = hl.rects && hl.rects.length > 0 ? hl.rects : [hl.rect];

          return (
            <div key={hl.id} data-highlight-id={hl.id} className="contents">
              {renderRects.map((r, idx) => (
                <div
                  key={`${hl.id}-rect-${idx}`}
                  className={cn(
                    'annotation-highlight absolute z-10',
                    isEraserActive
                      ? 'pointer-events-auto cursor-pointer eraser-target-highlight'
                      : 'pointer-events-none'
                  )}
                  style={{
                    left: r.x,
                    top: r.y,
                    width: r.width,
                    height: r.height,
                    backgroundColor: hl.color,
                    opacity: isEraserActive ? 0.4 : 0.3,
                  }}
                  title={hl.text}
                  onClick={(e) => {
                    if (annotateTool === 'eraser') {
                      e.stopPropagation();
                      removeHighlightRegion(hl.id);
                    }
                  }}
                />
              ))}
            </div>
          );
        })}

        {/* ─── STICKY NOTES OVERLAY ──────────────────────────────────────── */}
        {stickyNotes.map((note) => {
          const colorSet = getStickyColor(note.color);
          return (
            <div
              key={note.id}
              data-sticky-note={note.id}
              className={cn(
                'absolute z-20 w-44 rounded-lg border-2 shadow-lg sticky-note-shadow',
                'transition-shadow duration-150',
                dragNote === note.id && 'shadow-2xl z-30',
                isEraserActive && 'eraser-target-sticky'
              )}
              style={{
                left: note.x,
                top: note.y,
                backgroundColor: colorSet.bg,
                borderColor: isEraserActive ? 'var(--color-sb-wrong)' : colorSet.border,
                cursor: isEraserActive ? 'pointer' : undefined,
              }}
              onMouseDown={(e) => handleNoteMouseDown(e, note.id)}
              onClick={(e) => {
                if (annotateTool === 'eraser') {
                  e.stopPropagation();
                  removeStickyNote(note.id);
                }
              }}
            >
              {/* Note Header */}
              <div
                className="flex items-center justify-between px-2 py-1 border-b"
                style={{ borderColor: colorSet.border, opacity: 0.7 }}
              >
                <div className="flex items-center gap-1">
                  <Palette className="h-3 w-3" style={{ color: colorSet.text }} />
                  <span
                    className="text-[9px] font-medium"
                    style={{ color: colorSet.text }}
                  >
                    Note
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStickyNote(note.id);
                  }}
                  className="rounded-full p-0.5 hover:bg-black/10 transition-colors"
                  style={{ color: colorSet.text }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Note Body */}
              <textarea
                value={note.text}
                onChange={(e) => updateStickyNote(note.id, { text: e.target.value })}
                placeholder="Type note..."
                className={cn(
                  'w-full bg-transparent px-2 py-1.5 text-xs resize-none border-none outline-none',
                  'placeholder:text-black/30'
                )}
                style={{ color: colorSet.text }}
                rows={3}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                readOnly={isEraserActive}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
