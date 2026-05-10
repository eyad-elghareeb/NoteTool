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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import {
  useNoteToolStore,
  type StickyNote as StickyNoteType,
  type DrawingPath,
  type HighlightRect,
} from '@/stores/notetool-store';

// ─── Color Palettes ──────────────────────────────────────────────────

const PEN_COLORS = [
  { id: 'amber', color: '#f0a500' },
  { id: 'red', color: '#ef4444' },
  { id: 'green', color: '#22c55e' },
  { id: 'cyan', color: '#06b6d4' },
  { id: 'white', color: '#ffffff' },
  { id: 'pink', color: '#ec4899' },
];

const TEXT_HL_COLORS = [
  { id: 'amber', color: '#f0a500' },
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
  { id: 'amber', color: '#f0a500' },
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
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // ─── Viewport Resize ─────────────────────────────────────────────
  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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
        rects.push({
          x: r.left,
          y: r.top,
          width: r.width,
          height: r.height,
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
      setCurrentPath([{ x: e.clientX, y: e.clientY }]);
    },
    [globalPenActive, globalPenTool]
  );

  const handlePointerMove = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      if (!isDrawing) return;
      if (globalPenTool !== 'pen' && globalPenTool !== 'highlight-free') return;
      setCurrentPath((prev) => [...prev, { x: e.clientX, y: e.clientY }]);
    },
    [isDrawing, globalPenTool]
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

      // ── Sticky Note placement ──
      if (globalPenTool === 'sticky') {
        const colorSet = STICKY_COLORS.find((c) => c.id === selectedStickyColor) || STICKY_COLORS[0];
        const newNote: StickyNoteType = {
          id: `note-${Date.now()}`,
          x: e.clientX - 88,
          y: e.clientY - 20,
          text: '',
          color: colorSet.id,
          timestamp: Date.now(),
        };
        addStickyNote(newNote);
        return;
      }

      // ── Eraser: proximity-based detection for drawing paths ──
      if (globalPenTool === 'eraser') {
        const clickX = e.clientX;
        const clickY = e.clientY;

        // Check highlight regions first (they're rendered as rects in the SVG)
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

        // Check drawing paths
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
        setDragOffset({
          x: e.clientX - note.x,
          y: e.clientY - note.y,
        });
      }
    },
    [globalPenTool, stickyNotes]
  );

  const handleNoteMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      if (!dragNote) return;
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      updateStickyNote(dragNote, { x, y });
    },
    [dragNote, dragOffset, updateStickyNote]
  );

  useEffect(() => {
    if (!dragNote) return;
    const handleMove = (e: globalThis.MouseEvent) => {
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
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

  // ─── Helper: Get sticky color set ────────────────────────────────
  const getStickyColor = (colorId: string) =>
    STICKY_COLORS.find((c) => c.id === colorId) || STICKY_COLORS[0];

  // ─── Cursor per tool ─────────────────────────────────────────────
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

  // ─── Don't render when inactive ──────────────────────────────────
  if (!globalPenActive) return null;

  const totalAnnotations = stickyNotes.length + highlightRegions.length + drawingPaths.length;

  // ─── Tool hint text ──────────────────────────────────────────────
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
        width={viewport.w}
        height={viewport.h}
        className="fixed top-0 left-0 z-[9999]"
        style={{
          cursor: overlayCursor,
          pointerEvents: overlayCapturesPointer ? 'auto' : 'none',
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
              borderColor: globalPenTool === 'eraser' ? '#da3633' : colorSet.border,
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
          LEFT SIDE TOOLBAR — vertical strip, fixed on left side
          ═══════════════════════════════════════════════════════════════ */}
      <div
        data-annotate-toolbar
        className={cn(
          'fixed left-16 top-14 z-[10002]',
          'flex flex-col items-center',
          'bg-[#0d1117]/90 backdrop-blur-xl',
          'border-r border-t border-b border-[#30363d]/70',
          'rounded-r-xl',
          'shadow-2xl shadow-black/40',
          'transition-all duration-200',
          'py-2',
        )}
        style={{ width: '48px' }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ── Tool Buttons (stacked vertically) ── */}
        <div className="flex flex-col items-center gap-0.5 p-0.5">
          {/* Pen */}
          <SideToolButton
            active={globalPenTool === 'pen'}
            onClick={() => setGlobalPenTool('pen')}
            icon={<Pencil className="h-4 w-4" />}
            label="Pen"
            activeColor="#f0a500"
          />

          {/* Text Highlight */}
          <SideToolButton
            active={globalPenTool === 'highlight-text'}
            onClick={() => setGlobalPenTool('highlight-text')}
            icon={
              <span className="relative flex items-center justify-center">
                <span
                  className="absolute bottom-0 left-0 right-0 h-2 rounded-sm"
                  style={{ backgroundColor: highlightColor, opacity: 0.4 }}
                />
                <Type className="h-4 w-4 relative" />
              </span>
            }
            label="Text HL"
            activeColor="#f0a500"
          />

          {/* Free Highlight */}
          <SideToolButton
            active={globalPenTool === 'highlight-free'}
            onClick={() => setGlobalPenTool('highlight-free')}
            icon={<Highlighter className="h-4 w-4" />}
            label="Free HL"
            activeColor="#f0a500"
          />

          {/* Sticky Note */}
          <SideToolButton
            active={globalPenTool === 'sticky'}
            onClick={() => setGlobalPenTool('sticky')}
            icon={<StickyNote className="h-4 w-4" />}
            label="Sticky"
            activeColor="#f0a500"
          />

          {/* Eraser */}
          <SideToolButton
            active={globalPenTool === 'eraser'}
            onClick={() => setGlobalPenTool('eraser')}
            icon={<Eraser className="h-4 w-4" />}
            label="Eraser"
            activeColor="#da3633"
          />
        </div>

        {/* ── Divider ── */}
        <div className="w-6 h-px bg-[#30363d]/60 my-1" />

        {/* ── Annotation Count ── */}
        <span className="text-[9px] text-[#f0a500] bg-[#f0a500]/10 px-1.5 py-0.5 rounded-full font-medium leading-none">
          {totalAnnotations}
        </span>

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── Clear All ── */}
        <button
          className="flex items-center justify-center h-8 w-8 rounded-lg text-[#8b949e] hover:text-[#da3633] hover:bg-[#da3633]/10 transition-colors shrink-0"
          onClick={() => clearAllAnnotations()}
          title="Clear All Annotations"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        {/* ── Close ── */}
        <button
          className="flex items-center justify-center h-8 w-8 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2330] transition-colors shrink-0"
          onClick={() => {
            setGlobalPenActive(false);
            setGlobalPenTool('pen');
          }}
          title="Close Annotation Mode"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          EXPANDED OPTIONS PANEL — slides right from toolbar
          ═══════════════════════════════════════════════════════════════ */}
      {(globalPenTool === 'pen' || globalPenTool === 'highlight-text' || globalPenTool === 'highlight-free' || globalPenTool === 'sticky') && (
        <div
          className={cn(
            'fixed left-16 z-[10002]',
            'flex flex-col items-start',
            'bg-[#0d1117]/90 backdrop-blur-xl',
            'border border-[#30363d]/70',
            'rounded-xl',
            'shadow-2xl shadow-black/40',
            'px-3 py-2',
            'transition-all duration-200',
          )}
          style={{ top: 'calc(3.5rem + 52px)' }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Color Picker (contextual) */}
          {globalPenTool === 'pen' && (
            <div className="flex items-center gap-1.5">
              {PEN_COLORS.map((c) => (
                <ColorDot
                  key={c.id}
                  color={c.color}
                  active={drawingColor === c.color}
                  onClick={() => setDrawingColor(c.color)}
                />
              ))}
            </div>
          )}

          {globalPenTool === 'highlight-text' && (
            <div className="flex items-center gap-1.5">
              {TEXT_HL_COLORS.map((c) => (
                <ColorDot
                  key={c.id}
                  color={c.color}
                  active={highlightColor === c.color}
                  onClick={() => setHighlightColor(c.color)}
                />
              ))}
            </div>
          )}

          {globalPenTool === 'highlight-free' && (
            <div className="flex items-center gap-1.5">
              {FREE_HL_COLORS.map((c) => (
                <ColorDot
                  key={c.id}
                  color={c.color}
                  active={highlightColor === c.color}
                  onClick={() => setHighlightColor(c.color)}
                />
              ))}
            </div>
          )}

          {globalPenTool === 'sticky' && (
            <div className="flex items-center gap-1.5">
              {STICKY_COLORS.map((c) => (
                <ColorDot
                  key={c.id}
                  color={c.bg}
                  active={selectedStickyColor === c.id}
                  onClick={() => setSelectedStickyColor(c.id)}
                  border={c.border}
                />
              ))}
            </div>
          )}

          {/* Brush Size Slider (pen & free-highlight) */}
          {(globalPenTool === 'pen' || globalPenTool === 'highlight-free') && (
            <div className="flex items-center gap-2 mt-2 min-w-[120px]">
              <Slider
                value={[drawingBrushSize]}
                onValueChange={([v]) => setDrawingBrushSize(v)}
                min={1}
                max={20}
                step={1}
                className="w-20"
              />
              <span className="text-[10px] text-[#8b949e] font-mono w-8 text-right shrink-0">
                {globalPenTool === 'highlight-free'
                  ? `${freeHighlightWidth(drawingBrushSize)}px`
                  : `${drawingBrushSize}px`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TOOL HINT — appears to the right of the toolbar
          ═══════════════════════════════════════════════════════════════ */}
      <div className="fixed left-16 z-[10002]" style={{ top: 'calc(3.5rem + 100px)' }}>
        <p className="text-[11px] text-[#8b949e]/70 bg-[#0d1117]/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-[#30363d]/30 whitespace-nowrap max-w-[220px]">
          {toolHintText}
        </p>
      </div>
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

function SideToolButton({ active, onClick, icon, label, activeColor = '#f0a500' }: SideToolButtonProps) {
  return (
    <button
      className={cn(
        'flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-150 relative group',
        active
          ? 'text-white shadow-sm'
          : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2330]'
      )}
      style={
        active
          ? { backgroundColor: `${activeColor}20`, color: activeColor }
          : undefined
      }
      onClick={onClick}
      title={label}
    >
      {icon}
      {/* Tooltip on hover */}
      <span className="absolute left-full ml-2 px-2 py-1 text-[10px] rounded-md bg-[#1c2330] text-[#e6edf3] border border-[#30363d] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
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
          ? 'h-5 w-5 ring-2 ring-white/80 ring-offset-1 ring-offset-[#0d1117] scale-110'
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
