'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNoteToolStore } from '@/stores/notetool-store';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { cn } from '@/lib/utils';

interface MermaidDiagramProps {
  id: string;
  title: string;
  code: string;
  isFullScreen?: boolean;
}

export function MermaidDiagram({ id, title, code, isFullScreen = false }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const { setFullscreenView, setFullscreenMermaidCode, settings } = useNoteToolStore();

  const isDark = settings.theme === 'dark';

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'base',
          themeVariables: isDark
            ? {
                primaryColor: '#0d9488',
                primaryTextColor: '#ffffff',
                primaryBorderColor: '#0f766e',
                lineColor: '#94a3b8',
                secondaryColor: '#1e293b',
                tertiaryColor: '#0f172a',
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '13px',
              }
            : {
                primaryColor: '#0d9488',
                primaryTextColor: '#1c1917',
                primaryBorderColor: '#0f766e',
                lineColor: '#78716c',
                secondaryColor: '#f8f6f1',
                tertiaryColor: '#eeeae4',
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: '13px',
              },
          flowchart: {
            curve: 'basis',
            padding: 20,
            htmlLabels: true,
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
        setError('Failed to render diagram. Check the Mermaid syntax.');
      }
    };

    renderDiagram();
  }, [id, code, isDark]);

  const handleFullscreen = () => {
    setFullscreenMermaidCode(code);
    setFullscreenView('mermaid');
  };

  return (
    <Card
      className="overflow-hidden"
      style={{
        borderColor: 'rgba(13,148,136,0.3)',
        background: isDark ? 'rgba(13,20,30,0.6)' : 'rgba(248,246,241,0.9)',
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold text-teal-400">
              {title}
            </CardTitle>
            <Badge
              variant="outline"
              className="text-[10px] border-teal-700/50 text-teal-400"
            >
              Clinical Algorithm
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom(1)}
              title="Reset zoom"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-sb-accent hover:text-sb-accent hover:bg-sb-accent/10"
              onClick={handleFullscreen}
              title="Fullscreen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("pt-0", isFullScreen && "flex-1 p-0")}>
        {error ? (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className={cn("relative overflow-hidden rounded-lg border border-sb-border/20", isFullScreen ? "h-[calc(100vh-120px)]" : "h-[400px]")}
               style={{ background: isDark ? 'rgba(15,23,42,0.5)' : 'var(--color-sb-surface2)' }}>
            <TransformWrapper
              initialScale={1}
              minScale={0.2}
              maxScale={5}
              centerOnInit
              wheel={{ disabled: true }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="absolute right-4 bottom-4 z-20 flex flex-col gap-2 scale-90 sm:scale-100">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-xl bg-sb-surface2/80 backdrop-blur-md border border-sb-border/50 hover:bg-sb-accent/20" onClick={() => zoomIn()}><ZoomIn className="h-4 w-4" /></Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-xl bg-sb-surface2/80 backdrop-blur-md border border-sb-border/50 hover:bg-sb-accent/20" onClick={() => zoomOut()}><ZoomOut className="h-4 w-4" /></Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-xl bg-sb-surface2/80 backdrop-blur-md border border-sb-border/50 hover:bg-sb-accent/20" onClick={() => resetTransform()}><RotateCcw className="h-4 w-4" /></Button>
                  </div>
                  
                  <TransformComponent
                    wrapperStyle={{ width: '100%', height: '100%' }}
                    contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center' }}
                  >
                    <div
                      ref={containerRef}
                      className="mermaid-container flex items-center justify-center p-8 w-full h-full"
                      dangerouslySetInnerHTML={{ __html: svg }}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
