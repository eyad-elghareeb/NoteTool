'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MermaidDiagramProps {
  id: string;
  title: string;
  code: string;
}

export function MermaidDiagram({ id, title, code }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#0d9488',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#0f766e',
            lineColor: '#94a3b8',
            secondaryColor: '#1e293b',
            tertiaryColor: '#0f172a',
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
  }, [id, code]);

  return (
    <Card className="border-teal-800/30 bg-card/60 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold text-teal-400">
              {title}
            </CardTitle>
            <Badge variant="outline" className="text-[10px] border-teal-700/50 text-teal-400">
              Clinical Algorithm
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
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
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom(1)}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {error ? (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div
            ref={containerRef}
            className="overflow-auto rounded-lg bg-slate-950/50 p-4 max-h-[500px] border border-border/20"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </CardContent>
    </Card>
  );
}
