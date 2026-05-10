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
        'border-[#30363d] bg-[#161b22]',
        'hover:border-[#f0a500]/50 hover:bg-[#f0a500]/8',
        'cursor-pointer'
      );
    }

    // After answering - correct answer
    if (index === data.correctIndex) {
      return 'border-[#2ea043] bg-[#2ea043]/12';
    }

    // After answering - wrong selection
    if (index === selected && index !== data.correctIndex) {
      return 'border-[#da3633] bg-[#da3633]/12';
    }

    // After answering - other options
    return 'border-[#30363d] bg-[#161b22] opacity-40';
  };

  const getKeyBadgeClass = (index: number) => {
    if (!isAnswered) {
      return 'bg-[#1c2330] text-[#8b949e] border border-[#30363d]';
    }

    if (index === data.correctIndex) {
      return 'bg-[#2ea043] text-white border border-[#2ea043]';
    }

    if (index === selected && index !== data.correctIndex) {
      return 'bg-[#da3633] text-white border border-[#da3633]';
    }

    return 'bg-[#1c2330] text-[#8b949e]/50 border border-[#30363d]';
  };

  const getOptionIcon = (index: number) => {
    if (!isAnswered) return null;
    if (index === data.correctIndex)
      return <CheckCircle2 className="h-4 w-4 text-[#2ea043] flex-shrink-0" />;
    if (index === selected && index !== data.correctIndex)
      return <XCircle className="h-4 w-4 text-[#da3633] flex-shrink-0" />;
    return null;
  };

  const handleTryAgain = () => {
    setSelected(null);
    setRevealed(false);
  };

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
      {/* ─── HEADER ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#30363d] bg-[#0d1117]">
        <div className="flex items-center gap-3">
          {/* Question Number Badge */}
          {data.questionNumber !== undefined && data.totalQuestions !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-[#f0a500] bg-[#f0a500]/12 px-2 py-0.5 rounded-md">
                Q{data.questionNumber}/{data.totalQuestions}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[#f0a500]" />
            <span className="text-sm font-semibold text-[#f0a500]">Active Recall</span>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] border-[#f0a500]/30 text-[#f0a500] bg-[#f0a500]/8"
          >
            SBA
          </Badge>
          {isAnswered && (
            <Badge
              variant="outline"
              className={cn(
                'text-[10px]',
                isCorrect
                  ? 'border-[#2ea043]/50 text-[#2ea043] bg-[#2ea043]/8'
                  : 'border-[#da3633]/50 text-[#da3633] bg-[#da3633]/8'
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
              ? 'text-[#f0a500] bg-[#f0a500]/12'
              : 'text-[#8b949e] hover:text-[#f0a500] hover:bg-[#f0a500]/8'
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
        <p className="text-sm leading-relaxed font-medium text-[#e6edf3]">
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
                  isAnswered && index === data.correctIndex && 'bg-[#2ea043] text-white border-[#2ea043]',
                  isAnswered && index === selected && index !== data.correctIndex && 'bg-[#da3633] text-white border-[#da3633]',
                  !isAnswered && 'hover:border-[#f0a500]/50'
                )}
              >
                {OPTION_LETTERS[index]}
              </span>
              <span className="flex-1 text-[#e6edf3]">{option}</span>
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
            className="w-full border-[#f0a500]/30 text-[#f0a500] bg-[#f0a500]/8 hover:bg-[#f0a500]/15 hover:border-[#f0a500]/50"
          >
            <Eye className="h-4 w-4 mr-2" />
            Reveal Explanation
          </Button>
        )}

        {/* ─── EXPLANATION BOX ────────────────────────────────────────── */}
        {revealed && (
          <div className="explanation-expand rounded-lg rounded-l-none bg-[#1c2330] border border-[#30363d] border-l-[3px] border-l-[#f0a500] p-4 space-y-2">
            <div className="flex items-center gap-2 text-[#f0a500] text-xs font-semibold">
              <Lightbulb className="h-3.5 w-3.5" />
              Explanation
            </div>
            <div className="text-sm leading-relaxed text-[#8b949e] whitespace-pre-line">
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
              className="gap-1.5 text-xs text-[#8b949e] hover:text-[#e6edf3]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try Again
            </Button>
            {isAnswered && (
              <div className="text-[10px] text-[#8b949e]">
                {isCorrect ? 'Well done! 🎯' : `Correct answer: ${OPTION_LETTERS[data.correctIndex]}`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
