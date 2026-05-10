'use client';

import { useState, useCallback, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Pencil,
  Highlighter,
  StickyNote,
  Eraser,
  Trash2,
  X,
  Type,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
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
  { id: 'green', color: '#22c55e' },
  { id: 'cyan', color: '#06b6d4' },
  { id: 'white', color: '#ffffff' },
  { id: 'pink', color: '#ec4899' },
];

const TEXT_HL_COLORS = [
  { id: 'amber', color: 'var(--color-sb-accent)' },
  { id: 'yellow', color: '#fbbf24' },
  { id: 'green', color: '#34d399' },
  { id: 'cyan', color: '#22d3ee' },
  { id: 'pink', color: '#f472b6' },
  { id: 'red', color: '#f87171' },
];

const FREE_HL_COLORS = [
  { id: 'yellow', color: '#fbbf24' },
  { id: 'green', color: '#34d399' },
  { id: 'pink', color: '#f472b6' },
  { id: 'amber', color: 'var(--color-sb-accent)' },
  { id: 'cyan', color: '#22d3ee' },
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

  // Start with the first point
  let d = `M ${points[0].x} ${points[0].y}`;

  // Line to midpoint of first two points
  const mid0 = {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2,
  };
  d += ` L ${mid0.x} ${mid0.y}`;

  // Quadratic bezier through midpoints for smooth curves
  for (let i = 1; i < points.length - 1; i++) {
    const mid = {
      x: (points[i].x + points[i + 1].x) / 2,
      y: (points[i].y + points[i + 1].y) / 2,
    };
    d += ` Q ${points[i].x} ${points[i].y} ${mid.x} ${mid.y}`;
  }

  // Line to last point
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;

  return d;
}

// ─── Free-highlight stroke width computation ─────────────────────────

function freeHighlightWidth(brushSize: number): number {
  return brushSize * 3 + 14;
}

// ─── Component ───────────────────────────────────────────────────────

export function GlobalAnnotationOverlay() {
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
  } = useNoteToolStore();

  // ─── Local State ─────────────────────────────────────────────────
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [selectedStickyColor, setSelectedStickyColor] = useState('yellow');
  const [dragNote, setDragNote] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [assetPreview, setAssetPreview] = useState<string | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mode === 'annotate' && !globalPenActive) {
      setGlobalPenActive(true);
    }
  }, [mode, globalPenActive, setGlobalPenActive]);

  const totalAnnotations = (stickyNotes?.length || 0) + (highlightRegions?.length || 0) + (drawingPaths?.length || 0);

  // ─── Coordinate Helper ───────────────────────────────────────────
  const getCoordinates = useCallback((e: { clientX: number; clientY: number }) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const transformed = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return { x: transformed.x, y: transformed.y };
  }, []);

  const handlePdfFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    setPdfFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => setPdfDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddPdf = () => {
    if (!pdfDataUrl) return;
    // ... add logic
    setPdfDataUrl(null); setPdfFilename('');
  };

  // ─── Text Highlight: Capture Selection ───────────────────────────
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
        
        // Convert viewport rect to SVG coordinates
        const tl = getCoordinates({ clientX: r.left, clientY: r.top });
        const br = getCoordinates({ clientX: r.right, clientY: r.bottom });
        
        rects.push({
          x: tl.x,
          y: tl.y,
          width: br.x - tl.x,
          height: br.y - tl.y,
        });
      }

      if (rects.length === 0) return;

      const firstRect = rects[0];
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
        rect: firstRect,
        rects,
      });

      selection.removeAllRanges();
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [globalPenActive, globalPenTool, highlightColor, addHighlightRegion]);

  // ─── Sticky Note Drag: Global mouseup ────────────────────────────
  useEffect(() => {
    const handleUp = () => setDragNote(null);
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, []);

  // ─── Pointer-event decision per tool ─────────────────────────────
  const overlayCapturesPointer =
    globalPenTool === 'pen' ||
    globalPenTool === 'highlight-free' ||
    globalPenTool === 'sticky' ||
    globalPenTool === 'eraser';

  // ─── Drawing: Start / Move / End ─────────────────────────────────
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
      if (globalPenTool !== 'pen' && globalPenTool !== 'highlight-free') return;
      const coords = getCoordinates(e);
      setCurrentPath((prev) => [...prev, coords]);
    },
    [isDrawing, globalPenTool, getCoordinates]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || currentPath.length < 2) {
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    const isHighlight = globalPenTool === 'highlight-free';
    const strokeWidth = isHighlight
      ? freeHighlightWidth(drawingBrushSize)
      : drawingBrushSize;
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

  // ─── Overlay Click: Sticky placement / Eraser detection ──────────
  const handleOverlayClick = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      if (!globalPenActive) return;

      if (globalPenTool === 'sticky') {
        const colorSet = STICKY_COLORS.find((c) => c.id === selectedStickyColor) || STICKY_COLORS[0];
        const coords = getCoordinates(e);
        const newNote: StickyNoteType = {
          id: `note-${Date.now()}`,
          x: coords.x - 100,
          y: coords.y - 100,
          text: '',
          color: colorSet.id,
          timestamp: Date.now(),
        };
        addStickyNote(newNote);
        return;
      }

      if (globalPenTool === 'eraser') {
        const coords = getCoordinates(e);
        const clickX = coords.x;
        const clickY = coords.y;

        for (let i = highlightRegions.length - 1; i >= 0; i--) {
          const hl = highlightRegions[i];
          const renderRects = hl.rects && hl.rects.length > 0 ? hl.rects : [hl.rect];
          for (const r of renderRects) {
            if (
              clickX >= r.x &&
              clickX <= r.x + r.width &&
              clickY >= r.y &&
              clickY <= r.y + r.height
            ) {
              removeHighlightRegion(hl.id);
              return;
            }
          }
        }

        const threshold = 20;
        for (let i = drawingPaths.length - 1; i >= 0; i--) {
          const path = drawingPaths[i];
          for (const pt of path.points) {
            const dist = Math.sqrt((pt.x - clickX) ** 2 + (pt.y - clickY) ** 2);
            if (dist < threshold + path.strokeWidth / 2) {
              removeDrawingPath(path.id);
              return;
            }
          }
        }
      }
    },
    [globalPenActive, globalPenTool, selectedStickyColor, addStickyNote, highlightRegions, removeHighlightRegion, drawingPaths, removeDrawingPath]
  );

  // ─── Sticky Note Drag Handlers ───────────────────────────────────
  const handleNoteMouseDown = useCallback(
    (e: ReactMouseEvent, noteId: string) => {
      if (globalPenTool === 'eraser') return;
      e.stopPropagation();
      e.preventDefault();
      setDragNote(noteId);
      const note = stickyNotes.find((n) => n.id === noteId);
      if (note) {
        const coords = getCoordinates(e);
        setDragOffset({
          x: coords.x - note.x,
          y: coords.y - note.y,
        });
      }
    },
    [globalPenTool, stickyNotes, getCoordinates]
  );

  useEffect(() => {
    if (!dragNote) return;
    const handleMove = (e: globalThis.MouseEvent) => {
      const coords = getCoordinates(e);
      const x = coords.x - dragOffset.x;
      const y = coords.y - dragOffset.y;
      updateStickyNote(dragNote, { x, y });
    };
    const handleUp = () => setDragNote(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragNote, dragOffset, updateStickyNote]);

  const getStickyColor = (colorId: string) =>
    STICKY_COLORS.find((c) => c.id === colorId) || STICKY_COLORS[0];

  const overlayCursor = (() => {
    switch (globalPenTool) {
      case 'pen':
      case 'highlight-free':
        return 'crosshair';
      case 'highlight-text':
        return 'text';
      case 'sticky':
        return 'copy';
      case 'eraser':
        return 'pointer';
      default:
        return 'default';
    }
  })();

  const toolHintText = (() => {
    switch (globalPenTool) {
      case 'pen': return 'Click and drag to draw anywhere on screen';
      case 'highlight-text': return 'Select text anywhere to highlight it';
      case 'highlight-free': return 'Draw wide semi-transparent highlights anywhere';
      case 'sticky': return 'Click anywhere to place a sticky note';
      case 'eraser': return 'Click on any annotation to erase it';
      default: return '';
    }
  })();

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          SVG OVERLAY — fixed full-viewport drawing surface
          ═══════════════════════════════════════════════════════════════ */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full z-[9999]"
        style={{
          cursor: overlayCursor,
          pointerEvents: overlayCapturesPointer ? 'auto' : 'none',
          minHeight: '100%',
        }}
        onClick={handleOverlayClick}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
      >
        {/* ── Highlight Region Rectangles ── */}
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
                  style={{
                    pointerEvents: globalPenTool === 'eraser' ? 'stroke' : 'none',
                    cursor: globalPenTool === 'eraser' ? 'pointer' : 'default',
                  }}
                />
              ))}
              {/* Wider invisible hit area for eraser */}
              {globalPenTool === 'eraser' &&
                renderRects.map((r, idx) => (
                  <rect
                    key={`${hl.id}-hit-${idx}`}
                    x={r.x - 4}
                    y={r.y - 4}
                    width={r.width + 8}
                    height={r.height + 8}
                    fill="transparent"
                    stroke="transparent"
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeHighlightRegion(hl.id);
                    }}
                  />
                ))}
            </g>
          );
        })}

        {/* ── Drawing Paths ── */}
        {drawingPaths.map((path) => {
          const isHighlightPath = path.id.startsWith('hlpath-');
          const pathD = buildSmoothPath(path.points);

          return (
            <g key={path.id}>
              {/* Invisible wider hit area for eraser */}
              {globalPenTool === 'eraser' && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(path.strokeWidth + 16, 28)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDrawingPath(path.id);
                  }}
                />
              )}
              {/* Visible stroke */}
              <path
                d={pathD}
                fill="none"
                stroke={path.color}
                strokeWidth={path.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isHighlightPath ? 0.35 : 0.9}
                style={{
                  pointerEvents: globalPenTool === 'eraser' ? 'none' : 'auto',
                  cursor: globalPenTool === 'eraser' ? 'pointer' : 'default',
                }}
              />
            </g>
          );
        })}

        {/* ── Current Drawing Path (in progress) ── */}
        {isDrawing && currentPath.length > 1 && (
          <path
            d={buildSmoothPath(currentPath)}
            fill="none"
            stroke={globalPenTool === 'highlight-free' ? highlightColor : drawingColor}
            strokeWidth={
              globalPenTool === 'highlight-free'
                ? freeHighlightWidth(drawingBrushSize)
                : drawingBrushSize
            }
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={globalPenTool === 'highlight-free' ? 0.35 : 0.9}
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>

      {/* ═══════════════════════════════════════════════════════════════
          STICKY NOTES — HTML overlays for text editing
          ═══════════════════════════════════════════════════════════════ */}
      {stickyNotes.map((note) => {
        const colorSet = getStickyColor(note.color);
        return (
          <div
            key={note.id}
            data-sticky-note={note.id}
            className={cn(
              'fixed z-[10000] w-44 rounded-lg border-2 shadow-lg',
              'transition-shadow duration-150',
              dragNote === note.id && 'shadow-2xl z-[10001]',
              globalPenTool === 'eraser' && 'hover:ring-2 hover:ring-red-500'
            )}
            style={{
              left: note.x,
              top: note.y,
              backgroundColor: colorSet.bg,
              borderColor: globalPenTool === 'eraser' ? 'var(--color-sb-wrong)' : colorSet.border,
              cursor: globalPenTool === 'eraser' ? 'pointer' : dragNote === note.id ? 'grabbing' : 'grab',
            }}
            onMouseDown={(e) => {
              if (globalPenTool === 'eraser') {
                e.stopPropagation();
                removeStickyNote(note.id);
                return;
              }
              handleNoteMouseDown(e, note.id);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Note Header */}
            <div
              className="flex items-center justify-between px-2 py-1 border-b"
              style={{ borderColor: colorSet.border, opacity: 0.7 }}
            >
              <span
                className="text-[9px] font-medium"
                style={{ color: colorSet.text }}
              >
                Note
              </span>
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
              onMouseDown={(e) => {
                if (globalPenTool === 'eraser') {
                  e.stopPropagation();
                  removeStickyNote(note.id);
                } else {
                  e.stopPropagation();
                }
              }}
              readOnly={globalPenTool === 'eraser'}
            />
          </div>
        );
      })}

      {/* ═══════════════════════════════════════════════════════════════
          RIGHT SIDE TOOLBAR — floating pill on the right
          ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {globalPenActive && (
          <motion.div
            drag
            dragMomentum={false}
            whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-6 top-1/2 -translate-y-1/2 z-[10002] flex flex-col gap-3 p-3 bg-sb-bg/95 backdrop-blur-xl border border-sb-border/70 rounded-2xl shadow-2xl shadow-black/50 cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              {[
                { id: 'pen', icon: Pencil, label: 'Pen', color: 'var(--color-sb-accent)' },
                { id: 'highlight-text', icon: Type, label: 'Text', color: 'var(--color-sb-accent)' },
                { id: 'highlight-free', icon: Highlighter, label: 'Free', color: 'var(--color-sb-accent)' },
                { id: 'sticky', icon: StickyNote, label: 'Note', color: 'var(--color-sb-accent)' },
                { id: 'eraser', icon: Eraser, label: 'Eraser', color: 'var(--color-sb-wrong)' },
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setGlobalPenTool(tool.id as any)}
                  className={cn(
                    "group relative p-3 rounded-xl transition-all duration-200",
                    globalPenTool === tool.id 
                      ? "bg-sb-surface2 text-sb-text shadow-lg" 
                      : "text-sb-muted hover:text-sb-text hover:bg-sb-surface/50"
                  )}
                  title={tool.label}
                >
                  <div className="relative z-10">
                    {tool.id === 'highlight-text' ? (
                      <span className="relative flex items-center justify-center">
                        <span
                          className="absolute bottom-0 left-0 right-0 h-2 rounded-sm"
                          style={{ backgroundColor: highlightColor, opacity: 0.4 }}
                        />
                        <Type className="h-5 w-5 relative" />
                      </span>
                    ) : (
                      <tool.icon className="h-5 w-5" style={{ color: globalPenTool === tool.id ? tool.color : undefined }} />
                    )}
                  </div>
                  {globalPenTool === tool.id && (
                    <motion.div 
                      layoutId="activeToolGlow"
                      className="absolute inset-0 bg-sb-accent/5 rounded-xl border border-sb-accent/30"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="w-full h-px bg-sb-border/50" />

            {/* Tool Settings (Color/Size) */}
            <div className="flex flex-col items-center gap-4">
              {(globalPenTool === 'pen' || globalPenTool === 'highlight-free') && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {(globalPenTool === 'pen' ? PEN_COLORS : TEXT_HL_COLORS).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => globalPenTool === 'pen' ? setDrawingColor(c.color) : setHighlightColor(c.color)}
                        className={cn(
                          "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                          (globalPenTool === 'pen' ? drawingColor : highlightColor) === c.color 
                            ? "border-white scale-110" 
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: c.color }}
                      />
                    ))}
                  </div>
                  <div className="h-20 py-2 flex justify-center">
                    <Slider
                      orientation="vertical"
                      min={1}
                      max={40}
                      step={1}
                      value={[drawingBrushSize]}
                      onValueChange={(val) => setDrawingBrushSize(val[0])}
                    />
                  </div>
                </div>
              )}

              {globalPenTool === 'sticky' && (
                <div className="grid grid-cols-2 gap-1.5">
                  {STICKY_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedStickyColor(c.id)}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                        selectedStickyColor === c.id ? "border-white scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: c.bg }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="w-full h-px bg-sb-border/50" />

            <button
              onClick={clearAllAnnotations}
              className="p-3 rounded-xl text-sb-wrong hover:bg-sb-wrong/10 transition-colors"
              title="Clear All"
            >
              <Trash2 className="h-5 w-5" />
            </button>

            {/* Count */}
            <div className="text-[10px] font-mono text-sb-muted text-center">
              {totalAnnotations}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}


// ─── Sub-components ──────────────────────────────────────────────────

interface SideToolButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeColor?: string;
}

function SideToolButton({ active, onClick, icon, label, activeColor = 'var(--color-sb-accent)' }: SideToolButtonProps) {
  return (
    <button
      className={cn(
        'flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-150 relative group',
        active
          ? 'text-white shadow-sm'
          : 'text-sb-muted hover:text-sb-text hover:bg-sb-surface2'
      )}
      style={
        active
          ? { 
              backgroundColor: activeColor.startsWith('var') 
                ? `color-mix(in srgb, ${activeColor}, transparent 80%)` 
                : `${activeColor}33`, 
              color: activeColor 
            }
          : undefined
      }
      onClick={onClick}
      title={label}
    >
      {icon}
      {/* Tooltip on hover */}
      <span className="absolute left-full ml-2 px-2 py-1 text-[10px] rounded-md bg-sb-surface2 text-sb-text border border-sb-border opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
        {label}
      </span>
    </button>
  );
}

interface ColorDotProps {
  color: string;
  active: boolean;
  onClick: () => void;
  border?: string;
}

function ColorDot({ color, active, onClick, border }: ColorDotProps) {
  return (
    <button
      className={cn(
        'shrink-0 rounded-full transition-all duration-150',
        active
          ? 'h-5 w-5 ring-2 ring-white/80 ring-offset-1 ring-offset-[var(--color-sb-bg)] scale-110'
          : 'h-4 w-4 hover:scale-125'
      )}
      style={{
        backgroundColor: color,
        border: border ? `1.5px solid ${border}` : undefined,
      }}
      onClick={onClick}
    />
  );
}
