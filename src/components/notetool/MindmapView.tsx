'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network } from 'lucide-react';

interface MindmapViewProps {
  markdown: string;
}

export function MindmapView({ markdown }: MindmapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderMindmap = async () => {
      if (!containerRef.current) return;

      try {
        const { Markmap } = await import('markmap-view');
        const { Transformer } = await import('markmap-lib');

        const transformer = new Transformer();
        const { root } = transformer.transform(markdown);

        // Clear previous content
        containerRef.current.innerHTML = '';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.width = '100%';
        svg.style.height = '100%';
        containerRef.current.appendChild(svg);

        const markmap = Markmap.create(svg, {
          color: (node: any) => {
            const colors = ['#0d9488', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];
            return colors[node.state?.depth % colors.length] || '#0d9488';
          },
          paddingX: 16,
          autoFit: true,
          duration: 300,
        }, root);

        markmap.fit();
        setError(null);
      } catch (err) {
        console.error('Markmap render error:', err);
        setError('Failed to render mindmap.');
      }
    };

    renderMindmap();
  }, [markdown]);

  return (
    <Card className="border-violet-800/30 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-violet-400" />
          <CardTitle className="text-sm font-semibold text-violet-400">
            Knowledge Mindmap
          </CardTitle>
          <Badge variant="outline" className="text-[10px] border-violet-700/50 text-violet-400">
            Markmap
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div
            ref={containerRef}
            className="w-full h-[400px] rounded-lg bg-slate-950/50 border border-border/20"
          />
        )}
      </CardContent>
    </Card>
  );
}
