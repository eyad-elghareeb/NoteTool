'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImagePlus, ZoomIn, Download, FileText, Video, Eye } from 'lucide-react';

interface AssetRef {
  id: string;
  noteId: string;
  filename: string;
  type: 'image' | 'pdf' | 'video';
  caption: string;
  path: string;
}

interface AssetPlaceholderProps {
  data: AssetRef;
}

export function AssetPlaceholder({ data }: AssetPlaceholderProps) {
  // ─── PDF Embedding ────────────────────────────────────────────────
  if (data.type === 'pdf') {
    return (
      <Card className="border-border/30 bg-card/40 overflow-hidden">
        <CardContent className="p-0">
          {/* PDF viewer area */}
          <div className="relative bg-[#0d1117] border-b border-border/20">
            <iframe
              src={data.path}
              className="w-full h-[500px] rounded-none"
              title={`PDF: ${data.filename}`}
              style={{ border: 'none' }}
            />
            {/* PDF overlay controls */}
            <div className="absolute top-2 right-2 flex gap-1">
              <Badge variant="outline" className="text-[9px] border-border/30 bg-background/80 backdrop-blur-sm text-[#f0a500]">
                PDF
              </Badge>
              <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm hover:bg-background/90">
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm hover:bg-background/90">
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {/* Caption */}
          <div className="p-3 bg-muted/20">
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              {data.caption}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Video Embedding ──────────────────────────────────────────────
  if (data.type === 'video') {
    return (
      <Card className="border-border/30 bg-card/40 overflow-hidden">
        <CardContent className="p-0">
          {/* Video placeholder area */}
          <div className="relative aspect-video bg-slate-900/80 flex items-center justify-center border-b border-border/20">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mx-auto">
                <Video className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground/70 font-mono">{data.filename}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  {data.path}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-dashed border-border/40 text-muted-foreground text-xs"
              >
                <Video className="h-3 w-3 mr-1" />
                Upload Video
              </Button>
            </div>

            {/* Asset overlay controls */}
            <div className="absolute top-2 right-2 flex gap-1">
              <Badge variant="outline" className="text-[9px] border-border/30 bg-background/80 backdrop-blur-sm text-rose-400">
                VIDEO
              </Badge>
            </div>

            <div className="absolute bottom-2 right-2 flex gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm">
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm">
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Caption */}
          <div className="p-3 bg-muted/20">
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              {data.caption}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Image (default) ──────────────────────────────────────────────
  return (
    <Card className="border-border/30 bg-card/40 overflow-hidden">
      <CardContent className="p-0">
        {/* Image placeholder area */}
        <div className="relative aspect-[4/3] bg-slate-900/80 flex items-center justify-center border-b border-border/20">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mx-auto">
              <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground/70 font-mono">{data.filename}</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                {data.path}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-dashed border-border/40 text-muted-foreground text-xs"
            >
              <ImagePlus className="h-3 w-3 mr-1" />
              Upload Image
            </Button>
          </div>

          {/* Asset overlay controls */}
          <div className="absolute top-2 right-2 flex gap-1">
            <Badge variant="outline" className="text-[9px] border-border/30 bg-background/80 backdrop-blur-sm">
              {data.type.toUpperCase()}
            </Badge>
          </div>

          <div className="absolute bottom-2 right-2 flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm">
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm">
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Caption */}
        <div className="p-3 bg-muted/20">
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            {data.caption}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
