'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNoteToolStore } from '@/stores/notetool-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  Upload,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Scissors,
  BookOpen,
  FileDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── PDF.js Setup ────────────────────────────────────────────────────
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
}

// ─── Component ───────────────────────────────────────────────────────

export function PdfWorkspace() {
  const { pdfFile, setPdfFile, pdfPageNum, setPdfPageNum } = useNoteToolStore();
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [snippets, setSnippets] = useState<{ id: string; text: string; page: number }[]>([]);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [numPages, setNumPages] = useState(0);

  // PDF.js state
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderingRef = useRef(false);

  // ─── Load PDF with PDF.js ─────────────────────────────────────────
  useEffect(() => {
    if (!pdfFile) return;

    const url = URL.createObjectURL(pdfFile);
    let cancelled = false;

    pdfjsLib.getDocument(url).promise.then((doc) => {
      if (!cancelled) {
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setPdfPageNum(1);
      }
    }).catch((err) => {
      console.error('Error loading PDF:', err);
    });

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
      setPdfDoc(null);
      setNumPages(0);
    };
  }, [pdfFile, setPdfPageNum]);

  // ─── Render page to canvas ─────────────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;
    renderingRef.current = true;

    pdfDoc.getPage(pdfPageNum).then((page) => {
      if (cancelled) return;

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      const viewport = page.getViewport({ scale: zoom / 100 });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      page.render({
        canvasContext: ctx,
        viewport,
      } as any).promise.then(() => {
        if (!cancelled) {
          renderingRef.current = false;
        }
      }).catch(() => {
        if (!cancelled) {
          renderingRef.current = false;
        }
      });
    }).catch(() => {
      if (!cancelled) {
        renderingRef.current = false;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pdfPageNum, zoom]);

  // ─── File handling ────────────────────────────────────────────────
  const handleFileSelect = useCallback(
    (file: File) => {
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        setPdfPageNum(1);
        setZoom(100);
        setSnippets([]);
      }
    },
    [setPdfFile, setPdfPageNum]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleClose = useCallback(() => {
    setPdfFile(null);
    setPdfPageNum(1);
    setPdfDoc(null);
    setNumPages(0);
  }, [setPdfFile, setPdfPageNum]);

  // ─── Zoom controls ───────────────────────────────────────────────
  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(25, z - 25));
  const handleZoomReset = () => setZoom(100);

  // ─── Page navigation ─────────────────────────────────────────────
  const goToPrevPage = () => setPdfPageNum(Math.max(1, pdfPageNum - 1));
  const goToNextPage = () => setPdfPageNum(Math.min(numPages, pdfPageNum + 1));

  // ─── Snippet extraction ──────────────────────────────────────────
  const handleAddSnippet = () => {
    const newSnippet = {
      id: `snippet-${Date.now()}`,
      text: `Snippet from page ${pdfPageNum} — click to edit`,
      page: pdfPageNum,
    };
    setSnippets((prev) => [...prev, newSnippet]);
  };

  const handleRemoveSnippet = (id: string) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSnippetTextChange = (id: string, text: string) => {
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, text } : s))
    );
  };

  // ─── If no PDF uploaded, show dropzone ───────────────────────────
  if (!pdfFile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative w-full max-w-xl rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer',
            'group hover:border-sb-accent/60 hover:bg-sb-accent/5',
            isDragging
              ? 'border-sb-accent bg-sb-accent/10 scale-[1.02]'
              : 'border-sb-border bg-sb-bg/50'
          )}
          onClick={() => document.getElementById('pdf-upload-input')?.click()}
        >
          {/* Hidden file input */}
          <input
            id="pdf-upload-input"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Upload icon */}
          <div
            className={cn(
              'mx-auto mb-6 h-20 w-20 rounded-2xl flex items-center justify-center transition-all duration-300',
              isDragging
                ? 'bg-sb-accent/20 text-sb-accent scale-110'
                : 'bg-sb-surface2 text-sb-muted group-hover:bg-sb-accent/10 group-hover:text-sb-accent'
            )}
          >
            <Upload className="h-10 w-10" />
          </div>

          {/* Text */}
          <h3 className="text-lg font-semibold text-sb-text mb-2">
            {isDragging ? 'Drop your PDF here' : 'Drop PDF here or click to upload'}
          </h3>
          <p className="text-sm text-sb-muted mb-4">
            Upload a medical PDF to extract and synthesize content
          </p>

          {/* Feature badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="text-[10px] border-sb-accent/30 text-sb-accent"
            >
              <Scissors className="h-3 w-3 mr-1" />
              Snippet Extraction
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] border-violet-500/30 text-violet-400"
            >
              <BookOpen className="h-3 w-3 mr-1" />
              Auto-Synthesize
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] border-teal-500/30 text-teal-400"
            >
              <FileDown className="h-3 w-3 mr-1" />
              PDF-to-Note
            </Badge>
          </div>

          {/* Drag overlay glow */}
          {isDragging && (
            <div className="absolute inset-0 rounded-2xl bg-sb-accent/5 pointer-events-none" />
          )}
        </div>
      </div>
    );
  }

  // ─── PDF Viewer ──────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0">
      {/* Main PDF viewer area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* PDF Toolbar */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-sb-border/60 bg-sb-surface">
          {/* Filename */}
          <FileText className="h-3.5 w-3.5 text-sb-accent flex-shrink-0" />
          <span className="text-xs font-medium text-sb-text truncate max-w-[200px]">
            {pdfFile.name}
          </span>
          <Badge variant="outline" className="text-[9px] border-sb-border text-sb-muted ml-1">
            {(pdfFile.size / 1024).toFixed(0)} KB
          </Badge>

          <Separator orientation="vertical" className="h-5 bg-sb-border mx-1" />

          {/* Page navigation */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-sb-muted hover:text-sb-text hover:bg-sb-surface2"
                  onClick={goToPrevPage}
                  disabled={pdfPageNum <= 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous Page</TooltipContent>
            </Tooltip>
            <span className="text-xs text-sb-muted min-w-[60px] text-center">
              {pdfPageNum} / {numPages}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-sb-muted hover:text-sb-text hover:bg-sb-surface2"
                  onClick={goToNextPage}
                  disabled={pdfPageNum >= numPages}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next Page</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-5 bg-sb-border mx-1" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-sb-muted hover:text-sb-text hover:bg-sb-surface2"
                  onClick={handleZoomOut}
                  disabled={zoom <= 25}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
            <button
              onClick={handleZoomReset}
              className="text-xs text-sb-muted hover:text-sb-accent min-w-[40px] text-center transition-colors"
            >
              {zoom}%
            </button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-sb-muted hover:text-sb-text hover:bg-sb-surface2"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-5 bg-sb-border mx-1" />

          {/* Snippet toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-7 w-7',
                  showSidePanel
                    ? 'text-sb-accent bg-sb-accent/10'
                    : 'text-sb-muted hover:text-sb-text hover:bg-sb-surface2'
                )}
                onClick={() => setShowSidePanel(!showSidePanel)}
              >
                <Scissors className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Snippet Panel</TooltipContent>
          </Tooltip>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Rendering indicator - uses ref for performance */}

          {/* Close button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-sb-muted hover:text-sb-wrong hover:bg-sb-wrong/10"
                onClick={handleClose}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close PDF</TooltipContent>
          </Tooltip>
        </div>

        {/* PDF Canvas Renderer */}
        <div className="flex-1 overflow-auto bg-sb-bg flex items-start justify-center p-4">
          <div className="transition-transform duration-200">
            <canvas
              ref={canvasRef}
              className="bg-white rounded-lg shadow-2xl shadow-black/50"
            />
          </div>
        </div>
      </div>

      {/* ─── Side Panel: Snippet Extraction ─────────────────────────── */}
      {showSidePanel && (
        <div className="w-72 flex-shrink-0 border-l border-sb-border/60 bg-sb-bg flex flex-col">
          {/* Panel header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-sb-border/60">
            <Scissors className="h-3.5 w-3.5 text-sb-accent" />
            <span className="text-xs font-semibold text-sb-accent">Snippets</span>
            <Badge
              variant="outline"
              className="text-[9px] border-sb-border text-sb-muted ml-auto"
            >
              {snippets.length}
            </Badge>
          </div>

          {/* Add snippet button */}
          <div className="px-3 py-2 border-b border-sb-border/40">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed border-sb-border text-sb-muted text-xs hover:text-sb-accent hover:border-sb-accent/30"
              onClick={handleAddSnippet}
            >
              <Scissors className="h-3 w-3 mr-1.5" />
              Extract Snippet from Page {pdfPageNum}
            </Button>
          </div>

          {/* Snippets list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {snippets.length === 0 ? (
              <div className="text-center py-8">
                <Scissors className="h-8 w-8 text-sb-muted/20 mx-auto mb-3" />
                <p className="text-xs text-sb-muted/60">No snippets yet</p>
                <p className="text-[10px] text-sb-muted/40 mt-1">
                  Click the button above to extract text from the current page
                </p>
              </div>
            ) : (
              snippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className="group relative rounded-lg border border-sb-border/60 bg-sb-surface p-3 transition-all hover:border-sb-accent/30"
                >
                  {/* Snippet header */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <Badge
                      variant="outline"
                      className="text-[9px] border-sb-accent/30 text-sb-accent"
                    >
                      p.{snippet.page}
                    </Badge>
                  </div>
                  {/* Editable snippet text */}
                  <textarea
                    value={snippet.text}
                    onChange={(e) =>
                      handleSnippetTextChange(snippet.id, e.target.value)
                    }
                    className="w-full bg-transparent text-xs text-sb-text/80 resize-none border-none outline-none leading-relaxed min-h-[40px]"
                    rows={2}
                  />
                  {/* Delete button */}
                  <button
                    onClick={() => handleRemoveSnippet(snippet.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 rounded flex items-center justify-center text-sb-muted hover:text-sb-wrong hover:bg-sb-wrong/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Panel footer */}
          {snippets.length > 0 && (
            <div className="flex-shrink-0 px-3 py-2 border-t border-sb-border/60">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-sb-accent/30 text-sb-accent text-xs hover:bg-sb-accent/10"
                onClick={() => {
                  // Copy all snippets as text
                  const text = snippets
                    .map((s) => `[Page ${s.page}]\n${s.text}`)
                    .join('\n\n---\n\n');
                  navigator.clipboard.writeText(text);
                }}
              >
                <FileDown className="h-3 w-3 mr-1.5" />
                Copy All Snippets
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
