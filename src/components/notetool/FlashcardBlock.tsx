'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RotateCcw,
  Layers,
  ChevronLeft,
  ChevronRight,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlashcardData {
  id: string;
  type: 'cloze' | 'image-occlusion';
  front: string;
  back: string;
  tags: string[];
}

interface FlashcardBlockProps {
  cards: FlashcardData[];
  mode?: 'read' | 'annotate' | 'developer';
}

export function FlashcardBlock({ cards, mode }: FlashcardBlockProps) {
  const [flippedSet, setFlippedSet] = useState<Set<string>>(new Set());
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const toggleFlip = (id: string) => {
    setFlippedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetAll = () => {
    setFlippedSet(new Set());
  };

  const goToPrev = () => {
    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
  };

  const goToNext = () => {
    setCurrentCardIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
  };

  if (cards.length === 0) return null;

  const currentCard = cards[currentCardIndex];
  const isFlipped = flippedSet.has(currentCard.id);

  return (
    <div className="space-y-4">
      {/* ─── HEADER ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-semibold text-violet-400">Flashcards</span>
          <Badge
            variant="outline"
            className="text-[10px] border-violet-700/50 text-violet-400"
          >
            {cards.length} cards
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetAll}
          className="text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          Reset All
        </Button>
      </div>

      {/* ─── CARD DECK VIEW ────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4">
        {/* Single 3D Flip Card */}
        <div
          className="flashcard-container w-full max-w-lg cursor-pointer"
          onClick={() => toggleFlip(currentCard.id)}
          style={{ height: '260px' }}
        >
          <div
            className={cn(
              'flashcard-inner',
              isFlipped && 'flipped'
            )}
          >
            {/* ─── FRONT SIDE ──────────────────────────────────────────── */}
            <div className="flashcard-front rounded-xl border-2 border-violet-600/40 bg-[var(--color-sb-surface)] p-6 flex flex-col justify-between">
              {/* Top: Badge + Tags */}
              <div className="flex items-start justify-between gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] flex-shrink-0',
                    currentCard.type === 'cloze'
                      ? 'border-violet-600/40 text-violet-400 bg-violet-600/8'
                      : 'border-amber-600/40 text-amber-400 bg-amber-600/8'
                  )}
                >
                  {currentCard.type === 'cloze' ? 'CLOZE' : 'IMG-OCC'}
                </Badge>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {currentCard.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[9px] border-[var(--color-sb-border)] text-[var(--color-sb-muted)] bg-[var(--color-sb-surface2)]"
                    >
                      <Tag className="h-2.5 w-2.5 mr-0.5" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Center: Question */}
              <div className="flex-1 flex items-center justify-center py-4">
                <p className="text-sm leading-relaxed text-[var(--color-sb-text)] text-center">
                  {currentCard.front}
                </p>
              </div>

              {/* Bottom: Hint */}
              <div className="text-[10px] text-[var(--color-sb-muted)] text-center">
                Click to reveal answer
              </div>
            </div>

            {/* ─── BACK SIDE ────────────────────────────────────────────── */}
            <div className="flashcard-back rounded-xl border-2 border-emerald-600/40 bg-[var(--color-sb-surface)] p-6 flex flex-col justify-between">
              {/* Top: Badge */}
              <div className="flex items-start justify-between gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] border-emerald-600/40 text-emerald-400 bg-emerald-600/8"
                >
                  ANSWER
                </Badge>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {currentCard.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[9px] border-[var(--color-sb-border)] text-[var(--color-sb-muted)] bg-[var(--color-sb-surface2)]"
                    >
                      <Tag className="h-2.5 w-2.5 mr-0.5" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Center: Answer */}
              <div className="flex-1 flex items-center justify-center py-4">
                <p className="text-sm leading-relaxed text-emerald-300 text-center font-medium">
                  {currentCard.back}
                </p>
              </div>

              {/* Bottom: Hint */}
              <div className="text-[10px] text-[var(--color-sb-muted)] text-center">
                Click to flip back
              </div>
            </div>
          </div>
        </div>

        {/* ─── NAVIGATION ARROWS + COUNTER ──────────────────────────────── */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            className="h-8 w-8 border-[var(--color-sb-border)] bg-[var(--color-sb-surface)] text-[var(--color-sb-muted)] hover:text-[var(--color-sb-text)] hover:border-violet-500/40"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--color-sb-muted)]">
              {currentCardIndex + 1}
            </span>
            <span className="text-[10px] text-[var(--color-sb-border)]">/</span>
            <span className="text-xs font-mono text-[var(--color-sb-muted)]">
              {cards.length}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="h-8 w-8 border-[var(--color-sb-border)] bg-[var(--color-sb-surface)] text-[var(--color-sb-muted)] hover:text-[var(--color-sb-text)] hover:border-violet-500/40"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* ─── ALL CARDS MINI THUMBNAILS ─────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentCardIndex(idx);
              }}
              className={cn(
                'h-8 px-2 rounded-md border text-[10px] font-mono transition-all',
                idx === currentCardIndex
                  ? 'border-violet-500/60 bg-violet-600/15 text-violet-400'
                  : 'border-[var(--color-sb-border)] bg-[var(--color-sb-surface)] text-[var(--color-sb-muted)] hover:border-[var(--color-sb-muted)]'
              )}
            >
              {idx + 1}
              {flippedSet.has(card.id) && (
                <span className="ml-1 text-emerald-400">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
