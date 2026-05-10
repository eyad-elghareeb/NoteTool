'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Trash2,
  GitBranch,
  Save,
  Activity,
  HeartPulse,
  Stethoscope,
  Play,
  CircleDot,
  Diamond,
  Square,
  ChevronDown,
  ChevronRight,
  GitMerge,
  CornerDownRight,
  Check,
  X,
  Pencil,
  ArrowDown,
} from 'lucide-react';
import { MermaidDiagram } from './MermaidDiagram';
import { cn } from '@/lib/utils';

/* ─── Data Model ───────────────────────────────────────────────── */

type StepKind = 'start' | 'process' | 'decision' | 'end' | 'milestone';

interface FlowStep {
  id: string;
  kind: StepKind;
  label: string;
  /** For decisions: the branches coming out */
  branches: Branch[];
  /** ID of the next step in the main flow (null = end) */
  nextId: string | null;
}

interface Branch {
  id: string;
  label: string;        // e.g. "Yes", "Abnormal", "High Risk"
  targetId: string | null; // null = not connected yet
}

interface MermaidMakerGUIProps {
  onSave: (data: { code: string; title: string }) => void;
  onCancel: () => void;
  initialCode?: string;
  initialTitle?: string;
}

/* ─── Step kind config ─────────────────────────────────────────── */

const STEP_KINDS: { value: StepKind; label: string; medical: string; icon: typeof Play; color: string; bg: string }[] = [
  { value: 'start',    label: 'Start',     medical: 'Entry Point',     icon: Play,        color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { value: 'process',  label: 'Process',   medical: 'Action / Step',   icon: Square,      color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  { value: 'decision', label: 'Decision',  medical: 'If / Branch',     icon: Diamond,     color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  { value: 'milestone',label: 'Milestone', medical: 'Checkpoint',      icon: CircleDot,   color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  { value: 'end',      label: 'End',       medical: 'Outcome',         icon: Check,       color: 'text-rose-400',    bg: 'bg-rose-500/10' },
];

/* ─── Presets ──────────────────────────────────────────────────── */

const PRESETS = [
  {
    id: 'pathway',
    label: 'Clinical Pathway',
    icon: HeartPulse,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    title: 'Clinical Pathway',
  },
  {
    id: 'algorithm',
    label: 'Decision Tree',
    icon: Activity,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    title: 'Diagnostic Algorithm',
  },
  {
    id: 'protocol',
    label: 'Protocol',
    icon: Stethoscope,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    title: 'Treatment Protocol',
  },
];

/* ─── Helpers ──────────────────────────────────────────────────── */

let _idCounter = 0;
function nextId(): string {
  _idCounter++;
  return `S${_idCounter}`;
}
function nextBranchId(): string {
  return `B${Date.now()}${Math.random().toString(36).slice(2, 5)}`;
}

function makeStep(kind: StepKind, label: string): FlowStep {
  const branches = kind === 'decision'
    ? [
        { id: nextBranchId(), label: 'Yes', targetId: null },
        { id: nextBranchId(), label: 'No', targetId: null },
      ]
    : [];
  return { id: nextId(), kind, label, branches, nextId: null };
}

/** Convert flow steps into Mermaid code */
function stepsToMermaid(steps: FlowStep[]): string {
  const lines: string[] = ['graph TD'];

  // Build a map for quick lookup
  const stepMap = new Map(steps.map(s => [s.id, s]));

  // Emit node declarations
  for (const step of steps) {
    let open = '[';
    let close = ']';
    if (step.kind === 'decision') { open = '{'; close = '}'; }
    if (step.kind === 'start' || step.kind === 'end') { open = '('; close = ')'; }
    if (step.kind === 'milestone') { open = '(['; close = '])'; }
    lines.push(`    ${step.id}${open}"${step.label}"${close}`);
  }

  // Emit edges
  for (const step of steps) {
    // Main flow: nextId
    if (step.nextId && stepMap.has(step.nextId)) {
      if (step.kind !== 'decision') {
        lines.push(`    ${step.id} --> ${step.nextId}`);
      }
    }
    // Decision branches
    if (step.kind === 'decision') {
      for (const branch of step.branches) {
        if (branch.targetId && stepMap.has(branch.targetId)) {
          lines.push(`    ${step.id} -->|"${branch.label}"| ${branch.targetId}`);
        }
      }
      // If no branch is connected but nextId exists, connect via first branch
      const anyConnected = step.branches.some(b => b.targetId);
      if (!anyConnected && step.nextId && stepMap.has(step.nextId)) {
        lines.push(`    ${step.id} --> ${step.nextId}`);
      }
    }
  }

  return lines.join('\n');
}

/* ─── Inline Editable Label ────────────────────────────────────── */

function InlineEdit({ value, onChange, className, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    if (draft.trim()) onChange(draft.trim());
    else setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className={cn('bg-transparent border-b border-blue-400 outline-none text-xs', className)}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      className={cn('cursor-text hover:border-b hover:border-blue-400/30', className)}
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Click to edit"
    >
      {value}
    </span>
  );
}

/* ─── Step Card in Flow ────────────────────────────────────────── */

function StepCard({
  step,
  allSteps,
  onUpdate,
  onDelete,
  onAddAfter,
  onSetBranchTarget,
  onAddBranch,
  onRemoveBranch,
  onUpdateBranchLabel,
  isLast,
}: {
  step: FlowStep;
  allSteps: FlowStep[];
  onUpdate: (id: string, patch: Partial<FlowStep>) => void;
  onDelete: (id: string) => void;
  onAddAfter: (afterId: string, kind: StepKind, label: string) => void;
  onSetBranchTarget: (stepId: string, branchId: string, targetId: string | null) => void;
  onAddBranch: (stepId: string) => void;
  onRemoveBranch: (stepId: string, branchId: string) => void;
  onUpdateBranchLabel: (stepId: string, branchId: string, label: string) => void;
  isLast: boolean;
}) {
  const [showInsert, setShowInsert] = useState(false);
  const [showBranchTarget, setShowBranchTarget] = useState<string | null>(null);
  const kindMeta = STEP_KINDS.find(k => k.value === step.kind)!;
  const Icon = kindMeta.icon;

  const availableTargets = allSteps.filter(s => s.id !== step.id);

  return (
    <div className="flex flex-col items-center w-full">
      {/* ── The Step Card ──────────────────────────── */}
      <div
        className={cn(
          'w-full rounded-xl border p-3.5 transition-all group relative',
          step.kind === 'decision' ? 'border-amber-500/25 bg-amber-500/5' :
          step.kind === 'start' ? 'border-emerald-500/25 bg-emerald-500/5' :
          step.kind === 'end' ? 'border-rose-500/25 bg-rose-500/5' :
          step.kind === 'milestone' ? 'border-violet-500/25 bg-violet-500/5' :
          'border-blue-500/20 bg-blue-500/5',
        )}
      >
        {/* Top row: kind icon + label + actions */}
        <div className="flex items-center gap-2.5">
          <div className={cn('shrink-0 w-7 h-7 rounded-lg flex items-center justify-center', kindMeta.bg)}>
            <Icon className={cn('w-3.5 h-3.5', kindMeta.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <InlineEdit
              value={step.label}
              onChange={label => onUpdate(step.id, { label })}
              className={cn('text-xs font-medium truncate block', step.kind === 'decision' ? 'text-amber-300' : 'text-slate-200')}
              placeholder="Step name..."
            />
            <span className="text-[9px] uppercase tracking-wider font-medium text-slate-500">
              {kindMeta.medical}
            </span>
          </div>
          {/* Delete button */}
          <button
            onClick={() => onDelete(step.id)}
            className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
            title="Delete step"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Decision branches */}
        {step.kind === 'decision' && (
          <div className="mt-3 space-y-2 pl-2 border-l-2 border-amber-500/15">
            {step.branches.map(branch => (
              <div key={branch.id} className="flex items-center gap-2 group/branch">
                <CornerDownRight className="w-3 h-3 text-amber-500/40 shrink-0" />
                <InlineEdit
                  value={branch.label}
                  onChange={label => onUpdateBranchLabel(step.id, branch.id, label)}
                  className="text-[11px] text-amber-300 font-medium"
                  placeholder="Condition..."
                />
                {/* Branch target */}
                {branch.targetId ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 truncate max-w-[100px]">
                    {allSteps.find(s => s.id === branch.targetId)?.label || branch.targetId}
                  </span>
                ) : (
                  <button
                    onClick={() => setShowBranchTarget(showBranchTarget === branch.id ? null : branch.id)}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-dashed border-slate-600 text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-colors"
                  >
                    Connect →
                  </button>
                )}
                {branch.targetId && (
                  <button
                    onClick={() => onSetBranchTarget(step.id, branch.id, null)}
                    className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-red-400 opacity-0 group-hover/branch:opacity-100 transition-opacity"
                    title="Disconnect"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
                {step.branches.length > 2 && (
                  <button
                    onClick={() => onRemoveBranch(step.id, branch.id)}
                    className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-red-400 opacity-0 group-hover/branch:opacity-100 transition-opacity"
                    title="Remove branch"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
            {/* Add branch */}
            {step.branches.length < 5 && (
              <button
                onClick={() => onAddBranch(step.id)}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-400 transition-colors pl-5"
              >
                <Plus className="w-2.5 h-2.5" /> Add branch
              </button>
            )}
          </div>
        )}

        {/* Branch target dropdown */}
        {showBranchTarget && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-sb-border bg-sb-surface shadow-xl max-h-40 overflow-y-auto">
            {availableTargets.length === 0 ? (
              <div className="p-3 text-[10px] text-slate-500 text-center">Add more steps first</div>
            ) : (
              availableTargets.map(target => (
                <button
                  key={target.id}
                  onClick={() => {
                    onSetBranchTarget(step.id, showBranchTarget, target.id);
                    setShowBranchTarget(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-blue-500/10 hover:text-blue-400 transition-colors"
                >
                  <span className={cn('w-4 h-4 rounded flex items-center justify-center text-[8px]',
                    target.kind === 'decision' ? 'bg-amber-500/10 text-amber-400' :
                    target.kind === 'start' ? 'bg-emerald-500/10 text-emerald-400' :
                    target.kind === 'end' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-blue-500/10 text-blue-400'
                  )}>
                    {target.id.charAt(0)}
                  </span>
                  {target.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Connector between steps ─────────────── */}
      {!isLast && (
        <div
          className="relative flex flex-col items-center w-full"
          onMouseEnter={() => setShowInsert(true)}
          onMouseLeave={() => setShowInsert(false)}
        >
          {/* Vertical line */}
          <div className="w-px h-4 bg-slate-600/40" />

          {/* Insert step button — appears on hover */}
          {showInsert && (
            <div className="flex items-center gap-1.5 z-20 py-1.5 px-3 rounded-lg"
                 style={{ background: 'var(--color-sb-surface)', border: '1px solid var(--color-sb-border)' }}>
              {STEP_KINDS.filter(k => k.value !== 'start').map(kind => {
                const KIcon = kind.icon;
                return (
                  <button
                    key={kind.value}
                    onClick={() => onAddAfter(step.id, kind.value, kind.medical)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium border transition-all whitespace-nowrap',
                      kind.bg, kind.color, 'border-current/20 hover:brightness-125'
                    )}
                    title={`Insert ${kind.medical}`}
                  >
                    <KIcon className="w-2.5 h-2.5" />
                    {kind.medical}
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom half of vertical line */}
          <div className="w-px h-4 bg-slate-600/40" />
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────── */

export function MermaidMakerGUI({ onSave, onCancel, initialTitle }: MermaidMakerGUIProps) {
  const [title, setTitle] = useState(initialTitle || 'Clinical Pathway');
  const [steps, setSteps] = useState<FlowStep[]>([
    { ...makeStep('start', 'Patient Presentation'), nextId: '__placeholder__' },
    { ...makeStep('process', 'Initial Assessment'), id: '__placeholder__', nextId: null },
  ]);
  const [addingStep, setAddingStep] = useState(false);
  const [newStepLabel, setNewStepLabel] = useState('');
  const [newStepKind, setNewStepKind] = useState<StepKind>('process');
  const addInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clean up placeholder IDs on first real interaction
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const s1 = nextId();
      const s2 = nextId();
      setSteps([
        { id: s1, kind: 'start', label: 'Patient Presentation', branches: [], nextId: s2 },
        { id: s2, kind: 'process', label: 'Initial Assessment', branches: [], nextId: null },
      ]);
    }
  }, []);

  // ─── Generate Mermaid code ───────────────────────────────────
  const generatedCode = useMemo(() => stepsToMermaid(steps), [steps]);

  // ─── Handlers ────────────────────────────────────────────────
  const updateStep = useCallback((id: string, patch: Partial<FlowStep>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const deleteStep = useCallback((id: string) => {
    setSteps(prev => {
      const filtered = prev.filter(s => s.id !== id);
      // Re-link: any step whose nextId pointed to the deleted step now points to null
      return filtered.map(s => {
        if (s.nextId === id) return { ...s, nextId: null };
        // Also clean up branch targets
        if (s.kind === 'decision') {
          const branches = s.branches.map(b => b.targetId === id ? { ...b, targetId: null } : b);
          return { ...s, branches };
        }
        return s;
      });
    });
  }, []);

  const addAfter = useCallback((afterId: string, kind: StepKind, label: string) => {
    const newStep = makeStep(kind, label);
    setSteps(prev => {
      const idx = prev.findIndex(s => s.id === afterId);
      if (idx === -1) return prev;
      const afterStep = prev[idx];
      // New step inherits the nextId of the after-step
      newStep.nextId = afterStep.nextId;
      // After-step now points to new step
      const updated = [...prev];
      updated[idx] = { ...afterStep, nextId: newStep.id };
      // Insert new step right after
      updated.splice(idx + 1, 0, newStep);
      return updated;
    });
  }, []);

  const addStepAtEnd = useCallback(() => {
    if (!newStepLabel.trim()) return;
    const newStep = makeStep(newStepKind, newStepLabel.trim());
    setSteps(prev => {
      if (prev.length === 0) return [newStep];
      // Link last step to new step
      const lastStep = prev[prev.length - 1];
      const updated = [...prev];
      updated[updated.length - 1] = { ...lastStep, nextId: newStep.id };
      updated.push(newStep);
      return updated;
    });
    setNewStepLabel('');
    setAddingStep(false);
    // Scroll to bottom
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, [newStepLabel, newStepKind]);

  const setBranchTarget = useCallback((stepId: string, branchId: string, targetId: string | null) => {
    setSteps(prev => prev.map(s => {
      if (s.id !== stepId) return s;
      return { ...s, branches: s.branches.map(b => b.id === branchId ? { ...b, targetId } : b) };
    }));
  }, []);

  const addBranchToStep = useCallback((stepId: string) => {
    setSteps(prev => prev.map(s => {
      if (s.id !== stepId || s.kind !== 'decision') return s;
      return { ...s, branches: [...s.branches, { id: nextBranchId(), label: 'Maybe', targetId: null }] };
    }));
  }, []);

  const removeBranchFromStep = useCallback((stepId: string, branchId: string) => {
    setSteps(prev => prev.map(s => {
      if (s.id !== stepId) return s;
      return { ...s, branches: s.branches.filter(b => b.id !== branchId) };
    }));
  }, []);

  const updateBranchLabel = useCallback((stepId: string, branchId: string, label: string) => {
    setSteps(prev => prev.map(s => {
      if (s.id !== stepId) return s;
      return { ...s, branches: s.branches.map(b => b.id === branchId ? { ...b, label } : b) };
    }));
  }, []);

  const loadPreset = useCallback((preset: typeof PRESETS[number]) => {
    setTitle(preset.title);
    _idCounter = 0;
    const s1 = nextId();
    const s2 = nextId();
    const s3 = nextId();
    const s4 = nextId();
    const s5 = nextId();
    const s6 = nextId();

    if (preset.id === 'pathway') {
      setSteps([
        { id: s1, kind: 'start', label: 'Patient Presentation', branches: [], nextId: s2 },
        { id: s2, kind: 'decision', label: 'Initial Assessment', branches: [
          { id: nextBranchId(), label: 'High Risk', targetId: s3 },
          { id: nextBranchId(), label: 'Low Risk', targetId: s4 },
        ], nextId: null },
        { id: s3, kind: 'process', label: 'Urgent Intervention', branches: [], nextId: s5 },
        { id: s4, kind: 'process', label: 'Conservative Management', branches: [], nextId: s5 },
        { id: s5, kind: 'process', label: 'Re-evaluate', branches: [], nextId: s6 },
        { id: s6, kind: 'end', label: 'Discharge Plan', branches: [], nextId: null },
      ]);
    } else if (preset.id === 'algorithm') {
      setSteps([
        { id: s1, kind: 'start', label: 'Signs & Symptoms', branches: [], nextId: s2 },
        { id: s2, kind: 'decision', label: 'Lab Results', branches: [
          { id: nextBranchId(), label: 'Abnormal', targetId: s3 },
          { id: nextBranchId(), label: 'Normal', targetId: s4 },
        ], nextId: null },
        { id: s3, kind: 'decision', label: 'Imaging Required?', branches: [
          { id: nextBranchId(), label: 'Yes', targetId: s5 },
          { id: nextBranchId(), label: 'No', targetId: s6 },
        ], nextId: null },
        { id: s4, kind: 'process', label: 'Monitor & Reassess', branches: [], nextId: null },
        { id: s5, kind: 'process', label: 'CT / MRI', branches: [], nextId: null },
        { id: s6, kind: 'end', label: 'Empirical Treatment', branches: [], nextId: null },
      ]);
    } else if (preset.id === 'protocol') {
      setSteps([
        { id: s1, kind: 'start', label: 'Start Protocol', branches: [], nextId: s2 },
        { id: s2, kind: 'process', label: 'Step 1: Stabilization', branches: [], nextId: s3 },
        { id: s3, kind: 'process', label: 'Step 2: Medication', branches: [], nextId: s4 },
        { id: s4, kind: 'decision', label: 'Response?', branches: [
          { id: nextBranchId(), label: 'Adequate', targetId: s5 },
          { id: nextBranchId(), label: 'Inadequate', targetId: s6 },
        ], nextId: null },
        { id: s5, kind: 'process', label: 'Step 3: Maintenance', branches: [], nextId: null },
        { id: s6, kind: 'process', label: 'Escalate Therapy', branches: [], nextId: s4 },
      ]);
    }
  }, []);

  const handleSave = () => {
    onSave({ code: generatedCode, title });
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden"
         style={{ background: 'var(--color-sb-bg)' }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
           style={{ background: 'var(--color-sb-surface)', borderBottom: '1px solid var(--color-sb-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-500/10">
            <GitMerge className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-sb-text)' }}>
              Flow Builder
            </h3>
            <span className="text-[10px] uppercase tracking-wider font-medium"
                  style={{ color: 'var(--color-sb-muted)' }}>
              Draw your clinical algorithm step by step
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}
                  className="text-sb-muted hover:text-sb-text h-8 px-3">Cancel</Button>
          <Button size="sm" onClick={handleSave}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white h-8 px-3">
            <Save className="h-3.5 w-3.5" /> Insert Diagram
          </Button>
          {/* Close X button */}
          <div className="w-px h-5 mx-1" style={{ background: 'var(--color-sb-border)' }} />
          <button
            onClick={onCancel}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sb-muted hover:text-sb-text hover:bg-sb-surface2 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Panel: Flow Builder ────────────────────────────── */}
        <div className="w-[340px] shrink-0 flex flex-col min-h-0"
             style={{ borderRight: '1px solid var(--color-sb-border)', background: 'var(--color-sb-surface)' }}>

          {/* Title input */}
          <div className="px-4 pt-3 pb-2.5">
            <span className="text-[10px] uppercase tracking-wider font-medium block mb-1.5"
                  style={{ color: 'var(--color-sb-muted)' }}>
              Diagram Title
            </span>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Acute Heart Failure Pathway"
              className="h-8 text-xs"
              style={{ background: 'var(--color-sb-bg)', borderColor: 'var(--color-sb-border)', color: 'var(--color-sb-text)' }}
            />
          </div>

          {/* Presets row */}
          <div className="px-4 pb-2.5">
            <span className="text-[10px] uppercase tracking-wider font-medium block mb-1.5"
                  style={{ color: 'var(--color-sb-muted)' }}>
              Quick Start
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {PRESETS.map(p => {
                const PIcon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => loadPreset(p)}
                    className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all hover:brightness-125', p.color, p.bg)}
                    style={{ borderColor: 'var(--color-sb-border)' }}
                  >
                    <PIcon className="w-3 h-3 shrink-0" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mx-4 border-t" style={{ borderColor: 'var(--color-sb-border)', opacity: 0.4 }} />

          {/* ── Flow Steps (the interactive part) ────────────────── */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div ref={scrollRef} className="px-4 py-3 space-y-1.5">
              {steps.map((step, idx) => (
                <StepCard
                  key={step.id}
                  step={step}
                  allSteps={steps}
                  onUpdate={updateStep}
                  onDelete={deleteStep}
                  onAddAfter={addAfter}
                  onSetBranchTarget={setBranchTarget}
                  onAddBranch={addBranchToStep}
                  onRemoveBranch={removeBranchFromStep}
                  onUpdateBranchLabel={updateBranchLabel}
                  isLast={idx === steps.length - 1}
                />
              ))}

              {/* Add step at end */}
              {!addingStep ? (
                <div className="flex items-center justify-center pt-4">
                  <button
                    onClick={() => { setAddingStep(true); setTimeout(() => addInputRef.current?.focus(), 50); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-dashed text-[11px] font-medium text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-colors"
                    style={{ borderColor: 'var(--color-sb-border)' }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Next Step
                  </button>
                </div>
              ) : (
                <div className="mt-2 p-3 rounded-xl border"
                     style={{ background: 'var(--color-sb-bg)', borderColor: 'var(--color-sb-border)' }}>
                  {/* Kind selector */}
                  <div className="flex gap-1.5 mb-2.5 flex-wrap">
                    {STEP_KINDS.filter(k => k.value !== 'start').map(kind => {
                      const KIcon = kind.icon;
                      return (
                        <button
                          key={kind.value}
                          onClick={() => setNewStepKind(kind.value)}
                          className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium border transition-all',
                            newStepKind === kind.value
                              ? cn(kind.bg, kind.color, 'border-current/30')
                              : 'text-slate-500 border-slate-700 hover:text-slate-300'
                          )}
                        >
                          <KIcon className="w-2.5 h-2.5" />
                          {kind.medical}
                        </button>
                      );
                    })}
                  </div>
                  {/* Label input */}
                  <div className="flex gap-1.5">
                    <input
                      ref={addInputRef}
                      value={newStepLabel}
                      onChange={e => setNewStepLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addStepAtEnd(); if (e.key === 'Escape') { setAddingStep(false); setNewStepLabel(''); } }}
                      placeholder="Step name... (Enter to add)"
                      className="flex-1 h-8 px-2.5 rounded-lg text-xs border outline-none focus:border-blue-500/40"
                      style={{ background: 'var(--color-sb-surface)', borderColor: 'var(--color-sb-border)', color: 'var(--color-sb-text)' }}
                    />
                    <button
                      onClick={addStepAtEnd}
                      className="shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center transition-colors"
                      title="Add step"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setAddingStep(false); setNewStepLabel(''); }}
                      className="shrink-0 w-8 h-8 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step count */}
          <div className="px-4 py-2 border-t flex items-center justify-between shrink-0"
               style={{ borderColor: 'var(--color-sb-border)' }}>
            <span className="text-[10px]" style={{ color: 'var(--color-sb-muted)' }}>
              {steps.length} step{steps.length !== 1 ? 's' : ''}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--color-sb-muted)' }}>
              Click labels to edit · Hover between steps to insert
            </span>
          </div>
        </div>

        {/* ── Right Panel: Live Preview ───────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--color-sb-bg)' }}>

          {/* Preview header */}
          <div className="flex items-center justify-between px-4 py-2 shrink-0"
               style={{ borderBottom: '1px solid var(--color-sb-border)' }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" style={{ animation: 'pulse-gold 2s ease-in-out infinite' }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--color-sb-muted)' }}>
                Live Preview
              </span>
            </div>
          </div>

          {/* Diagram Preview */}
          <div className="flex-1 p-3 flex flex-col min-h-0">
            <div className="flex-1 rounded-xl overflow-hidden flex flex-col min-h-0"
                 style={{ border: '1px solid var(--color-sb-border)', background: 'var(--color-sb-bg)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.15)' }}>
              <MermaidDiagram id="flow-builder-preview" title={title} code={generatedCode} embedded />
            </div>
          </div>

          {/* Generated Syntax */}
          <div className="mx-3 mb-3 p-2.5 rounded-xl shrink-0"
               style={{ background: 'var(--color-sb-surface)', border: '1px solid var(--color-sb-border)' }}>
            <span className="text-[10px] uppercase tracking-wider font-medium mb-1 block"
                  style={{ color: 'var(--color-sb-muted)' }}>
              Generated Syntax
            </span>
            <code className="text-[10px] font-mono block whitespace-pre overflow-x-auto leading-relaxed"
                  style={{ color: 'var(--color-sb-accent)' }}>
              {generatedCode}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
