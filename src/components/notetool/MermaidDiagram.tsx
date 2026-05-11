'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Activity,
  GitBranch,
  Stethoscope,
  FlaskConical,
  HeartPulse,
  AlertTriangle,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNoteToolStore } from '@/stores/notetool-store';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { cn } from '@/lib/utils';

/* ─── Props ──────────────────────────────────────────────────────── */

interface MermaidDiagramProps {
  id: string;
  title: string;
  code: string;
  isFullScreen?: boolean;
  /** When embedded in the flow builder, use flexible height instead of fixed */
  embedded?: boolean;
}

/* ─── Diagram-type detection from Mermaid code ───────────────────── */

type DiagramKind = 'pathway' | 'algorithm' | 'protocol' | 'taxonomy' | 'flowchart';

const DIAGRAM_META: Record<DiagramKind, { label: string; icon: typeof Activity; color: string }> = {
  pathway:    { label: 'Clinical Pathway',  icon: HeartPulse,    color: 'text-rose-400' },
  algorithm:  { label: 'Decision Algorithm', icon: Activity,     color: 'text-amber-400' },
  protocol:   { label: 'Protocol',           icon: Stethoscope,  color: 'text-sky-400' },
  taxonomy:   { label: 'Classification',      icon: FlaskConical, color: 'text-violet-400' },
  flowchart:  { label: 'Flowchart',           icon: GitBranch,    color: 'text-teal-400' },
};

function detectDiagramKind(code: string): DiagramKind {
  const c = code.toLowerCase();
  if (/\b(diagnos|treatment|management|therapy)\b/.test(c)) return 'pathway';
  if (/\b(if|else|decision|yes|no|condition)\b/.test(c))    return 'algorithm';
  if (/\b(protocol|guideline|step\s*\d|phase)\b/.test(c))   return 'protocol';
  if (/\b(class|taxonomy|category|type\s+[a-z])\b/.test(c)) return 'taxonomy';
  return 'flowchart';
}

/* ─── Loading skeleton ───────────────────────────────────────────── */

function DiagramSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full animate-pulse">
      <div className={cn(
        'w-16 h-16 rounded-2xl flex items-center justify-center',
        isDark ? 'bg-white/5' : 'bg-black/5'
      )}>
        <Activity className={cn('w-7 h-7', isDark ? 'text-white/15' : 'text-black/15')} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className={cn('h-3 w-32 rounded-full', isDark ? 'bg-white/8' : 'bg-black/8')} />
        <div className={cn('h-2.5 w-24 rounded-full', isDark ? 'bg-white/5' : 'bg-black/5')} />
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */

export function MermaidDiagram({ id, title, code, isFullScreen = false, embedded = false }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<any>(null);
  const [svg, setSvg] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const { setFullscreenView, setFullscreenMermaidCode, settings } = useNoteToolStore();

  const isDark = settings.theme === 'dark';
  const kind = detectDiagramKind(code);
  const meta = DIAGRAM_META[kind];
  const IconComponent = meta.icon;

  /* ── Render diagram ────────────────────────────────────────────── */
  useEffect(() => {
    const renderDiagram = async () => {
      setIsRendering(true);
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'base',
          themeVariables: isDark
            ? {
                primaryColor: '#1e3a5f',
                primaryTextColor: '#e2e8f0',
                primaryBorderColor: '#2563eb',
                lineColor: '#64748b',
                secondaryColor: '#1e293b',
                tertiaryColor: '#0f172a',
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '13px',
                nodeBorder: '#2563eb',
                mainBkg: '#1e3a5f',
                clusterBkg: 'rgba(30,58,95,0.4)',
                titleColor: '#e2e8f0',
                edgeLabelBackground: 'transparent',
              }
            : {
                primaryColor: '#dbeafe',
                primaryTextColor: '#1e293b',
                primaryBorderColor: '#3b82f6',
                lineColor: '#94a3b8',
                secondaryColor: '#f0f9ff',
                tertiaryColor: '#e0f2fe',
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '13px',
                nodeBorder: '#3b82f6',
                mainBkg: '#dbeafe',
                clusterBkg: 'rgba(219,234,254,0.5)',
                titleColor: '#1e293b',
                edgeLabelBackground: 'transparent',
              },
          flowchart: {
            curve: 'basis',
            padding: 24,
            htmlLabels: false,
            nodeSpacing: 50,
            rankSpacing: 60,
          },
          sequence: {
            actorMargin: 80,
            messageMargin: 40,
          },
        });

        const { svg: renderedSvg } = await mermaid.render(
          `mermaid-${id}-${Date.now()}`,
          code
        );
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('Unable to render this diagram. Please verify the diagram structure and syntax.');
      } finally {
        setIsRendering(false);
      }
    };

    renderDiagram();
  }, [id, code, isDark]);

  /* ── Handlers ──────────────────────────────────────────────────── */
  const handleFullscreen = () => {
    setFullscreenMermaidCode(code);
    setFullscreenView('mermaid');
  };

  const handleZoomIn = () => {
    if (transformRef.current) {
      const newScale = Math.min(5, zoomLevel + 0.25);
      const { positionX, positionY } = transformRef.current.state || { positionX: 0, positionY: 0 };
      transformRef.current.setTransform(positionX, positionY, newScale);
      setZoomLevel(newScale);
    }
  };

  const handleZoomOut = () => {
    if (transformRef.current) {
      const newScale = Math.max(0.2, zoomLevel - 0.25);
      const { positionX, positionY } = transformRef.current.state || { positionX: 0, positionY: 0 };
      transformRef.current.setTransform(positionX, positionY, newScale);
      setZoomLevel(newScale);
    }
  };

  const handleReset = () => {
    if (transformRef.current) {
      transformRef.current.resetTransform();
      setZoomLevel(1);
    }
  };

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div
      className={cn(
        'mermaid-card group relative',
        isFullScreen ? 'flex flex-col h-full' : 'rounded-2xl',
      )}
      style={{
        background: isDark
          ? 'linear-gradient(180deg, rgba(15,23,42,0.8) 0%, rgba(13,17,23,0.95) 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,246,241,0.98) 100%)',
        border: isDark
          ? '1px solid rgba(59,130,246,0.12)'
          : '1px solid rgba(59,130,246,0.18)',
        boxShadow: isDark
          ? '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)'
          : '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
           style={{ borderColor: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.1)' }}>
        {/* Left: icon + title + kind badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            'shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
            isDark ? 'bg-blue-500/10' : 'bg-blue-50'
          )}>
            <IconComponent className={cn('w-4 h-4', meta.color)} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className={cn(
              'text-sm font-semibold truncate',
              isDark ? 'text-slate-200' : 'text-slate-800'
            )}>
              {title}
            </span>
            <span className={cn(
              'text-[10px] font-medium tracking-wide uppercase',
              isDark ? 'text-slate-500' : 'text-slate-400'
            )}>
              {meta.label}
            </span>
          </div>
        </div>

        {/* Right: zoom controls + fullscreen */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Zoom strip */}
          <div className={cn(
            'flex items-center gap-0.5 px-1 py-0.5 rounded-lg',
            isDark ? 'bg-white/4' : 'bg-black/4'
          )}>
            <button
              onClick={handleZoomOut}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                isDark ? 'hover:bg-white/8 text-slate-400 hover:text-slate-200' : 'hover:bg-black/8 text-slate-500 hover:text-slate-700'
              )}
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className={cn(
              'text-[10px] font-mono w-9 text-center tabular-nums',
              isDark ? 'text-slate-500' : 'text-slate-400'
            )}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                isDark ? 'hover:bg-white/8 text-slate-400 hover:text-slate-200' : 'hover:bg-black/8 text-slate-500 hover:text-slate-700'
              )}
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                isDark ? 'hover:bg-white/8 text-slate-400 hover:text-slate-200' : 'hover:bg-black/8 text-slate-500 hover:text-slate-700'
              )}
              title="Reset view"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Divider */}
          <div className={cn(
            'w-px h-5 mx-1',
            isDark ? 'bg-white/8' : 'bg-black/8'
          )} />

          {/* Fullscreen */}
          <button
            onClick={handleFullscreen}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isDark
                ? 'hover:bg-blue-500/15 text-slate-400 hover:text-blue-400'
                : 'hover:bg-blue-50 text-slate-500 hover:text-blue-600'
            )}
            title="Fullscreen view"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Diagram viewport ───────────────────────────────────── */}
      <div
        className={cn('mermaid-viewport relative', isFullScreen ? 'flex-1' : embedded ? 'flex-1 min-h-0' : 'h-[420px]')}
        style={{
          overflow: 'hidden',
          background: isDark
            ? 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.04) 0%, transparent 60%), var(--color-sb-surface2)'
            : 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.03) 0%, transparent 60%), var(--color-sb-surface2)',
        }}
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Error state */}
        {error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
            <div className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center',
              isDark ? 'bg-red-500/10' : 'bg-red-50'
            )}>
              <AlertTriangle className={cn('w-5 h-5', isDark ? 'text-red-400' : 'text-red-500')} />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-slate-700')}>
                Rendering Failed
              </span>
              <span className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>
                {error}
              </span>
            </div>
          </div>
        ) : isRendering ? (
          <DiagramSkeleton isDark={isDark} />
        ) : (
          <TransformWrapper
            ref={transformRef}
            initialScale={1}
            minScale={0.2}
            maxScale={5}
            centerOnInit
            wheel={{ disabled: true }}
            onTransform={(ref: any) => {
              setZoomLevel(ref.state.scale);
            }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Floating controls — bottom-right */}
                <div className="absolute right-3 bottom-3 z-20 flex items-center gap-1">
                  <div className={cn(
                    'flex items-center gap-0.5 px-1 py-0.5 rounded-xl',
                    isDark
                      ? 'bg-slate-900/80 backdrop-blur-lg border border-white/6 shadow-lg'
                      : 'bg-white/80 backdrop-blur-lg border border-black/6 shadow-md'
                  )}>
                    <button
                      onClick={() => { zoomIn(); setZoomLevel((z: number) => Math.min(5, z + 0.25)); }}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        isDark ? 'hover:bg-white/8 text-slate-400 hover:text-slate-200' : 'hover:bg-black/8 text-slate-500 hover:text-slate-700'
                      )}
                      title="Zoom in"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { zoomOut(); setZoomLevel((z: number) => Math.max(0.2, z - 0.25)); }}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        isDark ? 'hover:bg-white/8 text-slate-400 hover:text-slate-200' : 'hover:bg-black/8 text-slate-500 hover:text-slate-700'
                      )}
                      title="Zoom out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { resetTransform(); setZoomLevel(1); }}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        isDark ? 'hover:bg-white/8 text-slate-400 hover:text-slate-200' : 'hover:bg-black/8 text-slate-500 hover:text-slate-700'
                      )}
                      title="Fit to view"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Pan hint — fades out */}
                <div
                  className={cn(
                    'absolute left-3 bottom-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium',
                    'opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                    isDark
                      ? 'bg-slate-900/60 text-slate-500 backdrop-blur-sm'
                      : 'bg-white/60 text-slate-400 backdrop-blur-sm'
                  )}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 9l-3 3 3 3" /><path d="M9 5l3-3 3 3" /><path d="M15 19l-3 3-3-3" /><path d="M19 9l3 3-3 3" />
                  </svg>
                  Drag to pan
                </div>

                <TransformComponent
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  contentStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div
                    ref={containerRef}
                    className="mermaid-container flex items-center justify-center p-8"
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        )}

        {/* Viewport label — bottom-left */}
        {!error && !isRendering && (
          <div className={cn(
            'absolute left-3 top-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-semibold tracking-wider uppercase',
            isDark
              ? 'bg-blue-500/8 text-blue-400/60 backdrop-blur-sm'
              : 'bg-blue-50 text-blue-500/70 backdrop-blur-sm'
          )}>
            <IconComponent className="w-2.5 h-2.5" />
            {meta.label}
          </div>
        )}
      </div>
    </div>
  );
}
