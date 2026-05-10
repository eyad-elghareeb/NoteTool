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
  const assetUrl = data.path || (data as any).url;
  const isPdf = data.type === 'pdf';
  const isVideo = data.type === 'video';
  const isImage = data.type === 'image';

  // ─── PDF Embedding ────────────────────────────────────────────────
  if (isPdf) {
    return (
      <Card className="border-sb-border/30 bg-sb-surface/40 overflow-hidden">
        <CardContent className="p-0">
          <div className="relative bg-sb-bg border-b border-sb-border/20">
            {assetUrl ? (
              <iframe
                src={assetUrl}
                className="w-full h-[600px] rounded-none"
                title={`PDF: ${data.filename || 'Document'}`}
                style={{ border: 'none' }}
              />
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-sb-muted gap-3">
                <FileText className="h-10 w-10 opacity-20" />
                <p className="text-xs">No PDF data provided</p>
              </div>
            )}
            <div className="absolute top-2 right-2 flex gap-1">
              <Badge variant="outline" className="text-[9px] border-sb-border/30 bg-sb-bg/80 backdrop-blur-sm text-sb-accent">
                PDF
              </Badge>
            </div>
          </div>
          {data.caption && (
            <div className="p-3 bg-sb-surface/20">
              <p className="text-xs text-sb-muted leading-relaxed italic">{data.caption}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Video Embedding ──────────────────────────────────────────────
  if (isVideo) {
    return (
      <Card className="border-sb-border/30 bg-sb-surface/40 overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-black/40 flex items-center justify-center border-b border-sb-border/20">
            {assetUrl ? (
              <video 
                src={assetUrl} 
                controls 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-sb-surface2/40 flex items-center justify-center mx-auto">
                  <Video className="h-8 w-8 text-sb-muted/50" />
                </div>
                <p className="text-xs text-sb-muted/70 font-mono">Missing Video Source</p>
              </div>
            )}
            <div className="absolute top-2 right-2 flex gap-1">
              <Badge variant="outline" className="text-[9px] border-sb-border/30 bg-sb-bg/80 backdrop-blur-sm text-rose-400 font-bold">
                VIDEO
              </Badge>
            </div>
          </div>
          {data.caption && (
            <div className="p-3 bg-sb-surface/20">
              <p className="text-xs text-sb-muted leading-relaxed italic">{data.caption}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Image (default) ──────────────────────────────────────────────
  return (
    <Card className="border-sb-border/30 bg-sb-surface/40 overflow-hidden">
      <CardContent className="p-0">
        <div className="relative min-h-[200px] bg-black/20 flex items-center justify-center border-b border-sb-border/20">
          {assetUrl ? (
            <img 
              src={assetUrl} 
              alt={data.caption || 'Clinical Image'} 
              className="w-full h-auto max-h-[600px] object-contain block mx-auto"
              loading="lazy"
            />
          ) : (
            <div className="text-center space-y-3 p-8">
              <div className="w-16 h-16 rounded-full bg-sb-surface2/40 flex items-center justify-center mx-auto">
                <ImagePlus className="h-8 w-8 text-sb-muted/50" />
              </div>
              <p className="text-xs text-sb-muted/70 font-mono">Missing Image Source</p>
            </div>
          )}

          <div className="absolute top-2 right-2 flex gap-1">
            <Badge variant="outline" className="text-[9px] border-sb-border/30 bg-sb-bg/80 backdrop-blur-sm text-sb-accent font-bold">
              IMAGE
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 bg-sb-bg/80 backdrop-blur-sm hover:bg-sb-bg"
              onClick={() => assetUrl && window.open(assetUrl, '_blank')}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {data.caption && (
          <div className="p-3 bg-sb-surface/20">
            <p className="text-xs text-sb-muted leading-relaxed italic">
              {data.caption}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
