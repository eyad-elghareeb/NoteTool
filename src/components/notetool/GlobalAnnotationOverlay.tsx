'use client';

import React, { useState, useCallback, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Pencil,
  Highlighter,
  StickyNote,
  Eraser,
  Trash2,
  X,
  Type,
  Hand,
  Palette,
  Paintbrush,
  Minus,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useNoteToolStore,
  type StickyNote as StickyNoteType,
  type DrawingPath,
  type HighlightRect,
} from '@/stores/notetool-store';

// ─── Color Palettes ──────────────────────────────────────────────────

const PEN_COLORS = [
  { id: 'amber', color: 'var(--color-sb-accent)' },
  { id: 'red', color: '#ef4444' },
  { id: 'orange', color: '#f97316' },
  { id: 'green', color: '#22c55e' },
  { id: 'emerald', color: '#10b981' },
  { id: 'cyan', color: '#06b6d4' },
  { id: 'blue', color: '#3b82f6' },
  { id: 'violet', color: '#8b5cf6' },
  { id: 'pink', color: '#ec4899' },
  { id: 'rose', color: '#f43f5e' },
  { id: 'white', color: '#ffffff' },
  { id: 'neutral', color: '#9ca3af' },
];

const TEXT_HL_COLORS = [
  { id: 'amber', color: 'var(--color-sb-accent)' },
  { id: 'yellow', color: '#fbbf24' },
  { id: 'orange', color: '#fb923c' },
  { id: 'green', color: '#34d399' },
  { id: 'emerald', color: '#6ee7b7' },
  { id: 'cyan', color: '#22d3ee' },
  { id: 'sky', color: '#7dd3fc' },
  { id: 'blue', color: '#60a5fa' },
  { id: 'violet', color: '#a78bfa' },
  { id: 'pink', color: '#f472b6' },
  { id: 'rose', color: '#fda4af' },
  { id: 'red', color: '#f87171' },
];

const STICKY_COLORS = [
  { id: 'yellow', bg: '#fde68a', border: '#fbbf24', text: '#78350f' },
  { id: 'green', bg: '#86efac', border: '#34d399', text: '#064e3b' },
  { id: 'blue', bg: '#93c5fd', border: '#60a5fa', text: '#1e3a5f' },
  { id: 'pink', bg: '#f9a8d4', border: '#f472b6', text: '#831843' },
  { id: 'orange', bg: '#fdba74', border: '#fb923c', text: '#7c2d12' },
];

// ─── Smooth SVG Path Helper ──────────────────────────────────────────

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  const mid0 = {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2,
  };
  d += ` L ${mid0.x} ${mid0.y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const mid = {
      x: (points[i].x + points[i + 1].x) / 2,
      y: (points[i].y + points[i + 1].y) / 2,
    };
    d += ` Q ${points[i].x} ${points[i].y} ${mid.x} ${mid.y}`;
  }
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}

function freeHighlightWidth(brushSize: number): number {
  return brushSize * 3 + 14;
}

export function GlobalAnnotationOverlay(): React.ReactNode {
  const {
    mode,
    globalPenActive,
    setGlobalPenActive,
    globalPenTool,
    setGlobalPenTool,
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
    settings,
  } = useNoteToolStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [selectedStickyColor, setSelectedStickyColor] = useState('yellow');
  const [dragNote, setDragNote] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [stylingBarOpen, setStylingBarOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const toolbarPos = settings.annotationToolbarPosition || 'right';
  const isLandscape = toolbarPos === 'top' || toolbarPos === 'bottom';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mode === 'annotate' && !globalPenActive) {
      setGlobalPenActive(true);
    }
  }, [mode, globalPenActive, setGlobalPenActive]);

  const totalAnnotations = (stickyNotes?.length || 0) + (highlightRegions?.length || 0) + (drawingPaths?.length || 0);

  const getCoordinates = useCallback((e: { clientX: number; clientY: number }) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const transformed = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return { x: transformed.x, y: transformed.y };
  }, []);

  useEffect(() => {
    if (!globalPenActive || globalPenTool !== 'highlight-text') return;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const text = selection.toString().trim();
      if (!text) return;

      const clientRects = range.getClientRects();
      if (clientRects.length === 0) return;

      const rects: HighlightRect[] = [];
      for (let i = 0; i < clientRects.length; i++) {
        const r = clientRects[i];
        if (r.width < 2) continue;
        const tl = getCoordinates({ clientX: r.left, clientY: r.top });
        const br = getCoordinates({ clientX: r.right, clientY: r.bottom });
        rects.push({ x: tl.x, y: tl.y, width: br.x - tl.x, height: br.y - tl.y });
      }

      if (rects.length === 0) return;

      addHighlightRegion({
        id: `hl-${Date.now()}`,
        text,
        color: highlightColor,
        rangeInfo: {
          startContainerPath: '',
          startOffset: range.startOffset,
          endContainerPath: '',
          endOffset: range.endOffset,
        },
        rect: rects[0],
        rects,
      });

      selection.removeAllRanges();
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [globalPenActive, globalPenTool, highlightColor, addHighlightRegion, getCoordinates]);

  useEffect(() => {
    const handleUp = () => setDragNote(null);
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, []);

  const overlayCapturesPointer =
    globalPenTool === 'pen' ||
    globalPenTool === 'highlight-free' ||
    globalPenTool === 'sticky' ||
    globalPenTool === 'eraser';

  const handlePointerDown = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      if (!globalPenActive) return;
      if (globalPenTool !== 'pen' && globalPenTool !== 'highlight-free') return;
      setIsDrawing(true);
      const coords = getCoordinates(e);
      setCurrentPath([coords]);
    },
    [globalPenActive, globalPenTool, getCoordinates]
  );

  const handlePointerMove = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      if (!isDrawing) return;
      const coords = getCoordinates(e);
      setCurrentPath((prev) => [...prev, coords]);
    },
    [isDrawing, getCoordinates]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || currentPath.length < 2) {
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    const isHighlight = globalPenTool === 'highlight-free';
    const strokeWidth = isHighlight ? freeHighlightWidth(drawingBrushSize) : drawingBrushSize;
    const color = isHighlight ? highlightColor : drawingColor;
    const idPrefix = isHighlight ? 'hlpath' : 'path';

    addDrawingPath({
      id: `${idPrefix}-${Date.now()}`,
      points: currentPath,
      color,
      strokeWidth,
    });

    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentPath, globalPenTool, drawingBrushSize, drawingColor, highlightColor, addDrawingPath]);

  const handleOverlayClick = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      if (!globalPenActive) return;

      if (globalPenTool === 'sticky') {
        const colorSet = STICKY_COLORS.find((c) => c.id === selectedStickyColor) || STICKY_COLORS[0];
        const coords = getCoordinates(e);
        addStickyNote({
          id: `note-${Date.now()}`,
          x: coords.x - 100,
          y: coords.y - 100,
          text: '',
          color: colorSet.id,
          timestamp: Date.now(),
        });
        return;
      }

      if (globalPenTool === 'eraser') {
        const coords = getCoordinates(e);
        const { x, y } = coords;

        for (let i = highlightRegions.length - 1; i >= 0; i--) {
          const hl = highlightRegions[i];
          const renderRects = hl.rects && hl.rects.length > 0 ? hl.rects : [hl.rect];
          for (const r of renderRects) {
            if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) {
              removeHighlightRegion(hl.id);
              return;
            }
          }
        }

        const threshold = 20;
        for (let i = drawingPaths.length - 1; i >= 0; i--) {
          const path = drawingPaths[i];
          for (const pt of path.points) {
            const dist = Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2);
            if (dist < threshold + path.strokeWidth / 2) {
              removeDrawingPath(path.id);
              return;
            }
          }
        }
      }
    },
    [globalPenActive, globalPenTool, selectedStickyColor, addStickyNote, highlightRegions, removeHighlightRegion, drawingPaths, removeDrawingPath, getCoordinates]
  );

  const handleNoteMouseDown = useCallback(
    (e: ReactMouseEvent, noteId: string) => {
      if (globalPenTool === 'eraser') return;
      e.stopPropagation();
      e.preventDefault();
      setDragNote(noteId);
      const note = stickyNotes.find((n) => n.id === noteId);
      if (note) {
        setDragOffset({ x: e.clientX - note.x, y: e.clientY - note.y });
      }
    },
    [globalPenTool, stickyNotes]
  );

  useEffect(() => {
    if (!dragNote) return;
    const handleMove = (e: globalThis.MouseEvent) => {
      updateStickyNote(dragNote, { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    };
    const handleUp = () => setDragNote(null);
    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('mouseup', handleUp, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragNote, dragOffset, updateStickyNote]);

  const getStickyColor = (colorId: string) => STICKY_COLORS.find((c) => c.id === colorId) || STICKY_COLORS[0];

  if (!mounted || (mode !== 'annotate' && mode !== 'read')) return null;

  const showToolbar = mode === 'annotate' && globalPenActive;

  const toolbarClasses = cn(
    "fixed z-[100] p-2 bg-sb-bg/95 backdrop-blur-3xl border border-sb-border/80 shadow-2xl shadow-black/80 transition-all duration-300 ease-in-out",
    isLandscape
      ? "flex-row items-center h-14 w-fit rounded-full px-4"
      : "flex-col w-14 h-fit rounded-2xl py-4",
    toolbarPos === 'right' && "right-6 top-1/2 -translate-y-1/2",
    toolbarPos === 'left' && "left-6 top-1/2 -translate-y-1/2",
    toolbarPos === 'top' && "top-6 left-1/2 -translate-x-1/2",
    toolbarPos === 'bottom' && "bottom-8 left-1/2 -translate-x-1/2"
  );

  let overlayCursor = 'default';
  if (globalPenTool === 'pen' || globalPenTool === 'highlight-free') overlayCursor = 'crosshair';
  else if (globalPenTool === 'highlight-text') overlayCursor = 'text';
  else if (globalPenTool === 'sticky') overlayCursor = 'copy';
  else if (globalPenTool === 'eraser') overlayCursor = 'pointer';

  return (
    <>
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full z-[45]"
        style={{
          cursor: showToolbar ? overlayCursor : 'default',
          pointerEvents: (showToolbar && overlayCapturesPointer) ? 'auto' : 'none',
          minHeight: '100%',
        }}
        onClick={handleOverlayClick}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
      >
        {highlightRegions.map((hl) => {
          const renderRects = hl.rects && hl.rects.length > 0 ? hl.rects : [hl.rect];
          return (
            <g key={hl.id}>
              {renderRects.map((r, idx) => (
                <rect
                  key={`${hl.id}-r-${idx}`}
                  x={r.x}
                  y={r.y}
                  width={r.width}
                  height={r.height}
                  fill={hl.color}
                  opacity={globalPenTool === 'eraser' ? 0.5 : 0.3}
                  rx={2}
                  style={{ pointerEvents: globalPenTool === 'eraser' ? 'stroke' : 'none' }}
                />
              ))}
            </g>
          );
        })}

        {drawingPaths.map((path) => {
          const isHighlightPath = path.id.startsWith('hlpath-');
          const pathD = buildSmoothPath(path.points);
          return (
            <g key={path.id}>
              <path
                d={pathD}
                fill="none"
                stroke={path.color}
                strokeWidth={path.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isHighlightPath ? 0.35 : 0.9}
                style={{ pointerEvents: globalPenTool === 'eraser' ? 'stroke' : 'auto' }}
              />
            </g>
          );
        })}

        {isDrawing && currentPath.length > 1 && (
          <path
            d={buildSmoothPath(currentPath)}
            fill="none"
            stroke={globalPenTool === 'highlight-free' ? highlightColor : drawingColor}
            strokeWidth={globalPenTool === 'highlight-free' ? freeHighlightWidth(drawingBrushSize) : drawingBrushSize}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={globalPenTool === 'highlight-free' ? 0.35 : 0.9}
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>

      {stickyNotes.map((note) => {
        const colorSet = getStickyColor(note.color);
        return (
          <div
            key={note.id}
            className={cn('absolute z-[48] w-44 rounded-lg border-2 shadow-lg', dragNote === note.id && 'shadow-2xl z-[49]')}
            style={{
              left: note.x,
              top: note.y,
              backgroundColor: colorSet.bg,
              borderColor: colorSet.border,
              cursor: showToolbar ? (globalPenTool === 'eraser' ? 'pointer' : (dragNote === note.id ? 'grabbing' : 'grab')) : 'default',
              pointerEvents: showToolbar ? 'auto' : 'none',
            }}
            onMouseDown={(e) => {
              if (!showToolbar) return;
              // Don't drag if clicking on textarea — allow text editing
              if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
              if (globalPenTool === 'eraser') {
                e.stopPropagation();
                removeStickyNote(note.id);
                return;
              }
              handleNoteMouseDown(e, note.id);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-2 py-1 border-b cursor-grab active:cursor-grabbing"
              style={{ borderColor: colorSet.border, opacity: 0.7 }}
              onMouseDown={(e) => {
                if (!showToolbar || globalPenTool === 'eraser') return;
                handleNoteMouseDown(e, note.id);
              }}
            >
              <span className="text-[9px] font-medium" style={{ color: colorSet.text }}>Note</span>
              <button onClick={(e) => { e.stopPropagation(); removeStickyNote(note.id); }} className="rounded-full p-0.5 hover:bg-black/10 transition-colors" style={{ color: colorSet.text }}>
                <X className="h-3 w-3" />
              </button>
            </div>
            <textarea
              value={note.text}
              onChange={(e) => updateStickyNote(note.id, { text: e.target.value })}
              className="w-full bg-transparent px-2 py-1.5 text-xs resize-none border-none outline-none"
              style={{ color: colorSet.text }}
              rows={3}
              readOnly={globalPenTool === 'eraser'}
            />
          </div>
        );
      })}

      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={toolbarClasses}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={cn("flex gap-1 items-center", isLandscape ? "flex-row" : "flex-col")}>
              {[
                { id: 'pan', icon: Hand, label: 'Pan' },
                { id: 'pen', icon: Pencil, label: 'Pen' },
                { id: 'highlight-text', icon: Type, label: 'Text' },
                { id: 'highlight-free', icon: Highlighter, label: 'Free' },
                { id: 'sticky', icon: StickyNote, label: 'Note' },
                { id: 'eraser', icon: Eraser, label: 'Eraser' },
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setGlobalPenTool(tool.id as any)}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    globalPenTool === tool.id ? "bg-sb-surface2 text-sb-accent" : "text-sb-muted hover:text-sb-text"
                  )}
                >
                  <tool.icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            {(globalPenTool === 'pen' || globalPenTool === 'highlight-free') && stylingBarOpen && (
              <div className={cn("flex items-center", isLandscape ? "flex-row gap-1.5 mr-2" : "flex-col gap-1")}>
                {/* Brush: -, circle, + */}
                <div className={cn("flex items-center gap-0.5", isLandscape ? "flex-row" : "flex-col")}>
                  <button onClick={() => setDrawingBrushSize(Math.max(2, drawingBrushSize - 2))} className="p-0.5 rounded text-sb-muted hover:text-sb-text">
                    <Minus className="h-3 w-3" />
                  </button>
                  <div className="flex items-center justify-center shrink-0" style={{ width: 20, height: 20 }}>
                    <div className="rounded-full transition-all" style={{
                      width: drawingBrushSize * 0.5,
                      height: drawingBrushSize * 0.5,
                      backgroundColor: globalPenTool === 'pen' ? drawingColor : highlightColor,
                    }} />
                  </div>
                  <button onClick={() => setDrawingBrushSize(Math.min(40, drawingBrushSize + 2))} className="p-0.5 rounded text-sb-muted hover:text-sb-text">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <div className={cn("bg-sb-border/40 shrink-0", isLandscape ? "w-px h-6" : "w-6 h-px")} />

                {/* Color swatches */}
                <div className={cn("flex gap-1", isLandscape ? "flex-row" : "flex-col")}>
                  {(globalPenTool === 'pen' ? PEN_COLORS : TEXT_HL_COLORS).slice(0, isLandscape ? 12 : 6).map((c) => (
                    <button key={c.id} onClick={() => globalPenTool === 'pen' ? setDrawingColor(c.color) : setHighlightColor(c.color)}
                      className={cn("w-3.5 h-3.5 rounded-full shrink-0",
                        (globalPenTool === 'pen' ? drawingColor : highlightColor) === c.color ? "ring-[1.5px] ring-white scale-110" : "opacity-50 hover:opacity-80"
                      )}
                      style={{ backgroundColor: c.color }} title={c.id}
                    />
                  ))}
                  <label className="relative cursor-pointer shrink-0 flex items-center justify-center w-3.5 h-3.5 rounded-full border border-sb-border/50 hover:border-sb-accent/60 bg-sb-surface2/60">
                    <input type="color" className="absolute inset-0 opacity-0 cursor-pointer"
                      value={(globalPenTool === 'pen' ? drawingColor : highlightColor).replace('var(--color-sb-accent)', '#f0a500')}
                      onChange={(e) => { const h = e.target.value; if (globalPenTool === 'pen') setDrawingColor(h); else setHighlightColor(h); }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Plus className="h-2 w-2 text-sb-muted" />
                  </label>
                </div>
              </div>
            )}

            {(globalPenTool === 'pen' || globalPenTool === 'highlight-free') && (
              <button onClick={() => setStylingBarOpen(!stylingBarOpen)}
                className={cn("p-2 rounded-xl transition-all shrink-0", stylingBarOpen ? "bg-sb-surface2 text-sb-accent" : "text-sb-muted hover:text-sb-text")}
                title="Color & Size"
              >
                <Paintbrush className="h-4 w-4" />
              </button>
            )}

            <div className={cn("bg-sb-border/40 shrink-0", isLandscape ? "w-px h-8 mx-1.5" : "w-8 h-px my-1.5 mx-auto")} />

            <button onClick={clearAllAnnotations} className="p-1.5 text-sb-wrong hover:bg-sb-wrong/10 rounded-lg">
              <Trash2 className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
