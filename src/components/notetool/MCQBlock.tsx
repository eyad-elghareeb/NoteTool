'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Lightbulb,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MCQData {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  questionNumber?: number;
  totalQuestions?: number;
}

interface MCQBlockProps {
  data: MCQData;
  /** MCQs are always interactive regardless of mode */
  mode?: 'read' | 'annotate' | 'developer';
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function MCQBlock({ data, mode }: MCQBlockProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const isAnswered = selected !== null;
  const isCorrect = isAnswered && selected === data.correctIndex;
  const isWrong = isAnswered && selected !== data.correctIndex;

  const handleSelect = (index: number) => {
    if (isAnswered) return; // Already answered
    setSelected(index);
  };

  const getOptionClass = (index: number) => {
    // Before answering
    if (!isAnswered) {
      return cn(
        'border-[var(--color-sb-border)] bg-[var(--color-sb-surface)]',
        'hover:border-[var(--color-sb-accent)]/50 hover:bg-[var(--color-sb-accent)]/8',
        'cursor-pointer'
      );
    }

    // After answering - correct answer
    if (index === data.correctIndex) {
      return 'border-[var(--color-sb-correct)] bg-[var(--color-sb-correct)]/12';
    }

    // After answering - wrong selection
    if (index === selected && index !== data.correctIndex) {
      return 'border-[var(--color-sb-wrong)] bg-[var(--color-sb-wrong)]/12';
    }

    // After answering - other options
    return 'border-[var(--color-sb-border)] bg-[var(--color-sb-surface)] opacity-40';
  };

  const getKeyBadgeClass = (index: number) => {
    if (!isAnswered) {
      return 'bg-[var(--color-sb-surface2)] text-[var(--color-sb-muted)] border border-[var(--color-sb-border)]';
    }

    if (index === data.correctIndex) {
      return 'bg-[var(--color-sb-correct)] text-white border border-[var(--color-sb-correct)]';
    }

    if (index === selected && index !== data.correctIndex) {
      return 'bg-[var(--color-sb-wrong)] text-white border border-[var(--color-sb-wrong)]';
    }

    return 'bg-[var(--color-sb-surface2)] text-[var(--color-sb-muted)]/50 border border-[var(--color-sb-border)]';
  };

  const getOptionIcon = (index: number) => {
    if (!isAnswered) return null;
    if (index === data.correctIndex)
      return <CheckCircle2 className="h-4 w-4 text-[var(--color-sb-correct)] flex-shrink-0" />;
    if (index === selected && index !== data.correctIndex)
      return <XCircle className="h-4 w-4 text-[var(--color-sb-wrong)] flex-shrink-0" />;
    return null;
  };

  const handleTryAgain = () => {
    setSelected(null);
    setRevealed(false);
  };

  return (
    <div className="rounded-xl border border-[var(--color-sb-border)] bg-[var(--color-sb-surface)] overflow-hidden">
      {/* ─── HEADER ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-sb-border)] bg-[var(--color-sb-bg)]">
        <div className="flex items-center gap-3">
          {/* Question Number Badge */}
          {data.questionNumber !== undefined && data.totalQuestions !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-[var(--color-sb-accent)] bg-[var(--color-sb-accent)]/12 px-2 py-0.5 rounded-md">
                Q{data.questionNumber}/{data.totalQuestions}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[var(--color-sb-accent)]" />
            <span className="text-sm font-semibold text-[var(--color-sb-accent)]">Active Recall</span>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] border-[var(--color-sb-accent)]/30 text-[var(--color-sb-accent)] bg-[var(--color-sb-accent)]/8"
          >
            SBA
          </Badge>
          {isAnswered && (
            <Badge
              variant="outline"
              className={cn(
                'text-[10px]',
                isCorrect
                  ? 'border-[var(--color-sb-correct)]/50 text-[var(--color-sb-correct)] bg-[var(--color-sb-correct)]/8'
                  : 'border-[var(--color-sb-wrong)]/50 text-[var(--color-sb-wrong)] bg-[var(--color-sb-wrong)]/8'
              )}
            >
              {isCorrect ? '✓ Correct' : '✗ Incorrect'}
            </Badge>
          )}
        </div>

        {/* Flag/Bookmark Button */}
        <button
          onClick={() => setFlagged(!flagged)}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            flagged
              ? 'text-[var(--color-sb-accent)] bg-[var(--color-sb-accent)]/12'
              : 'text-[var(--color-sb-muted)] hover:text-[var(--color-sb-accent)] hover:bg-[var(--color-sb-accent)]/8'
          )}
          title={flagged ? 'Remove bookmark' : 'Bookmark this question'}
        >
          {flagged ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* ─── QUESTION BODY ────────────────────────────────────────────── */}
      <div className="p-5 space-y-4">
        {/* Question Text */}
        <p className="text-sm leading-relaxed font-medium text-[var(--color-sb-text)]">
          {data.question}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {data.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={isAnswered}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg border-2 p-3 text-left text-sm',
                'transition-all duration-200',
                getOptionClass(index)
              )}
            >
              {/* Letter Key Badge */}
              <span
                className={cn(
                  'mcq-option-key',
                  getKeyBadgeClass(index),
                  isAnswered && index === data.correctIndex && 'bg-[var(--color-sb-correct)] text-white border-[var(--color-sb-correct)]',
                  isAnswered && index === selected && index !== data.correctIndex && 'bg-[var(--color-sb-wrong)] text-white border-[var(--color-sb-wrong)]',
                  !isAnswered && 'hover:border-[var(--color-sb-accent)]/50'
                )}
              >
                {OPTION_LETTERS[index]}
              </span>
              <span className="flex-1 text-[var(--color-sb-text)]">{option}</span>
              {getOptionIcon(index)}
            </button>
          ))}
        </div>

        {/* ─── REVEAL EXPLANATION BUTTON ──────────────────────────────── */}
        {isAnswered && !revealed && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRevealed(true)}
            className="w-full border-[var(--color-sb-accent)]/30 text-[var(--color-sb-accent)] bg-[var(--color-sb-accent)]/8 hover:bg-[var(--color-sb-accent)]/15 hover:border-[var(--color-sb-accent)]/50"
          >
            <Eye className="h-4 w-4 mr-2" />
            Reveal Explanation
          </Button>
        )}

        {/* ─── EXPLANATION BOX ────────────────────────────────────────── */}
        {revealed && (
          <div className="explanation-expand rounded-lg rounded-l-none bg-[var(--color-sb-surface2)] border border-[var(--color-sb-border)] border-l-[3px] border-l-[var(--color-sb-accent)] p-4 space-y-2">
            <div className="flex items-center gap-2 text-[var(--color-sb-accent)] text-xs font-semibold">
              <Lightbulb className="h-3.5 w-3.5" />
              Explanation
            </div>
            <div className="text-sm leading-relaxed text-[var(--color-sb-muted)] whitespace-pre-line">
              {data.explanation}
            </div>
          </div>
        )}

        {/* ─── TRY AGAIN BUTTON ────────────────────────────────────────── */}
        {isAnswered && (
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTryAgain}
              className="gap-1.5 text-xs text-[var(--color-sb-muted)] hover:text-[var(--color-sb-text)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try Again
            </Button>
            {isAnswered && (
              <div className="text-[10px] text-[var(--color-sb-muted)]">
                {isCorrect ? 'Well done! 🎯' : `Correct answer: ${OPTION_LETTERS[data.correctIndex]}`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
