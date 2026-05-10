'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  FileText,
  HelpCircle,
  Layers,
  GitBranch,
  Columns3,
  ImagePlus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNoteToolStore, type DynamicSection } from '@/stores/notetool-store';

interface ContentToolbarProps {
  onAddSection?: (section: DynamicSection) => void;
}

export function ContentToolbar({ onAddSection }: ContentToolbarProps) {
  const { addDynamicSection } = useNoteToolStore();
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  // ─── Section Form State ──────────────────────────────────────────
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionContent, setSectionContent] = useState('');

  // ─── MCQ Form State ──────────────────────────────────────────────
  const [mcqQuestion, setMcqQuestion] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '', '']);
  const [mcqCorrect, setMcqCorrect] = useState('0');
  const [mcqExplanation, setMcqExplanation] = useState('');

  // ─── Flashcard Form State ────────────────────────────────────────
  const [fcType, setFcType] = useState<'cloze' | 'image-occlusion'>('cloze');
  const [fcFront, setFcFront] = useState('');
  const [fcBack, setFcBack] = useState('');
  const [fcTags, setFcTags] = useState('');

  // ─── Mermaid Form State ──────────────────────────────────────────
  const [mermaidTitle, setMermaidTitle] = useState('');
  const [mermaidCode, setMermaidCode] = useState('graph TD\n    A-->B\n    B-->C');

  // ─── Tab Group Form State ────────────────────────────────────────
  const [tabTitle, setTabTitle] = useState('');
  const [tabNames, setTabNames] = useState('Tab 1, Tab 2');

  // ─── Helpers ─────────────────────────────────────────────────────
  const generateId = () => `dyn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const handleAddSection = () => {
    if (!sectionTitle.trim()) return;
    const section: DynamicSection = {
      id: generateId(),
      type: 'content',
      title: sectionTitle,
      content: sectionContent,
    };
    addDynamicSection(section);
    onAddSection?.(section);
    setSectionTitle('');
    setSectionContent('');
    setOpenDialog(null);
  };

  const handleAddMCQ = () => {
    if (!mcqQuestion.trim()) return;
    const filledOptions = mcqOptions.filter((o) => o.trim());
    if (filledOptions.length < 2) return;
    const section: DynamicSection = {
      id: generateId(),
      type: 'mcq',
      title: 'Active Recall Question',
      content: {
        id: generateId(),
        question: mcqQuestion,
        options: filledOptions,
        correctIndex: parseInt(mcqCorrect),
        explanation: mcqExplanation,
      },
    };
    addDynamicSection(section);
    onAddSection?.(section);
    setMcqQuestion('');
    setMcqOptions(['', '', '', '', '']);
    setMcqCorrect('0');
    setMcqExplanation('');
    setOpenDialog(null);
  };

  const handleAddFlashcard = () => {
    if (!fcFront.trim() || !fcBack.trim()) return;
    const section: DynamicSection = {
      id: generateId(),
      type: 'flashcard',
      title: 'Flashcards',
      content: [
        {
          id: generateId(),
          type: fcType,
          front: fcFront,
          back: fcBack,
          tags: fcTags.split(',').map((t) => t.trim()).filter(Boolean),
        },
      ],
    };
    addDynamicSection(section);
    onAddSection?.(section);
    setFcFront('');
    setFcBack('');
    setFcTags('');
    setOpenDialog(null);
  };

  const handleAddMermaid = () => {
    if (!mermaidCode.trim()) return;
    const section: DynamicSection = {
      id: generateId(),
      type: 'mermaid',
      title: mermaidTitle || 'Mermaid Diagram',
      content: {
        id: generateId(),
        title: mermaidTitle || 'Mermaid Diagram',
        code: mermaidCode,
      },
    };
    addDynamicSection(section);
    onAddSection?.(section);
    setMermaidTitle('');
    setMermaidCode('graph TD\n    A-->B\n    B-->C');
    setOpenDialog(null);
  };

  const handleAddTabGroup = () => {
    if (!tabNames.trim()) return;
    const names = tabNames.split(',').map((t) => t.trim()).filter(Boolean);
    const section: DynamicSection = {
      id: generateId(),
      type: 'tabs',
      title: tabTitle || 'Tabbed Section',
      content: {
        tabs: names.map((name, i) => ({
          id: `tab-${i}`,
          label: name,
          content: `Content for ${name}`,
        })),
      },
    };
    addDynamicSection(section);
    onAddSection?.(section);
    setTabTitle('');
    setTabNames('Tab 1, Tab 2');
    setOpenDialog(null);
  };

  const handleAddAsset = () => {
    const section: DynamicSection = {
      id: generateId(),
      type: 'asset',
      title: 'Image Asset',
      content: {
        id: generateId(),
        noteId: 'current',
        filename: 'placeholder.png',
        type: 'image',
        caption: 'Image placeholder — upload an image to replace this',
        path: '/assets/placeholder.png',
      },
    };
    addDynamicSection(section);
    onAddSection?.(section);
    setOpenDialog(null);
  };

  const tools = [
    {
      id: 'section',
      label: 'Add Section',
      icon: <FileText className="h-4 w-4" />,
      color: 'text-teal-400',
      bgColor: 'bg-teal-600/10',
      borderColor: 'border-teal-600/30',
    },
    {
      id: 'mcq',
      label: 'Add MCQ',
      icon: <HelpCircle className="h-4 w-4" />,
      color: 'text-[#f0a500]',
      bgColor: 'bg-[#f0a500]/10',
      borderColor: 'border-[#f0a500]/30',
    },
    {
      id: 'flashcard',
      label: 'Add Flashcard',
      icon: <Layers className="h-4 w-4" />,
      color: 'text-violet-400',
      bgColor: 'bg-violet-600/10',
      borderColor: 'border-violet-600/30',
    },
    {
      id: 'mermaid',
      label: 'Add Mermaid Diagram',
      icon: <GitBranch className="h-4 w-4" />,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-600/10',
      borderColor: 'border-cyan-600/30',
    },
    {
      id: 'tabs',
      label: 'Add Tab Group',
      icon: <Columns3 className="h-4 w-4" />,
      color: 'text-rose-400',
      bgColor: 'bg-rose-600/10',
      borderColor: 'border-rose-600/30',
    },
    {
      id: 'asset',
      label: 'Add Asset',
      icon: <ImagePlus className="h-4 w-4" />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-600/10',
      borderColor: 'border-emerald-600/30',
    },
  ];

  return (
    <div className="flex flex-col gap-1">
      {tools.map((tool) => (
        <Dialog
          key={tool.id}
          open={openDialog === tool.id}
          onOpenChange={(open) => setOpenDialog(open ? tool.id : null)}
        >
          <DialogTrigger asChild>
            <button
              className={cn(
                'w-full flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium',
                'transition-all duration-150 text-left',
                tool.color,
                tool.bgColor,
                tool.borderColor,
                'hover:brightness-125'
              )}
            >
              {tool.icon}
              {tool.label}
            </button>
          </DialogTrigger>

          {/* ─── ADD SECTION DIALOG ────────────────────────────────── */}
          {tool.id === 'section' && (
            <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3]">
              <DialogHeader>
                <DialogTitle className="text-[#e6edf3] flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-400" />
                  Add Content Section
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-[#8b949e]">Section Title</Label>
                  <Input
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                    placeholder="e.g., Differential Diagnosis"
                    className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#8b949e]">Markdown Content</Label>
                  <Textarea
                    value={sectionContent}
                    onChange={(e) => setSectionContent(e.target.value)}
                    placeholder="Write markdown content here..."
                    rows={6}
                    className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] font-mono text-xs"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" className="text-[#8b949e]">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddSection} className="bg-teal-600 hover:bg-teal-700 text-white">
                  Add Section
                </Button>
              </DialogFooter>
            </DialogContent>
          )}

          {/* ─── ADD MCQ DIALOG ────────────────────────────────────── */}
          {tool.id === 'mcq' && (
            <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#e6edf3] flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-[#f0a500]" />
                  Add MCQ Question
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-[#8b949e]">Question</Label>
                  <Textarea
                    value={mcqQuestion}
                    onChange={(e) => setMcqQuestion(e.target.value)}
                    placeholder="Enter your question..."
                    rows={3}
                    className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#8b949e]">Options (A-E)</Label>
                  {mcqOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="mcq-option-key bg-[#1c2330] text-[#8b949e] border border-[#30363d] flex-shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const next = [...mcqOptions];
                          next[idx] = e.target.value;
                          setMcqOptions(next);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] text-xs"
                      />
                      {idx >= 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[#8b949e] hover:text-[#da3633] flex-shrink-0"
                          onClick={() => {
                            setMcqOptions(mcqOptions.filter((_, i) => i !== idx));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {mcqOptions.length < 8 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-dashed border-[#30363d] text-[#8b949e] text-xs"
                      onClick={() => setMcqOptions([...mcqOptions, ''])}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[#8b949e]">Correct Answer</Label>
                  <Select value={mcqCorrect} onValueChange={setMcqCorrect}>
                    <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161b22] border-[#30363d]">
                      {mcqOptions.filter((o) => o.trim()).map((_, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {String.fromCharCode(65 + idx)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#8b949e]">Explanation</Label>
                  <Textarea
                    value={mcqExplanation}
                    onChange={(e) => setMcqExplanation(e.target.value)}
                    placeholder="Explain why this is the correct answer..."
                    rows={4}
                    className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] text-xs"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" className="text-[#8b949e]">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddMCQ} className="bg-[#f0a500] hover:bg-[#d4940a] text-black">
                  Add MCQ
                </Button>
              </DialogFooter>
            </DialogContent>
          )}

          {/* ─── ADD FLASHCARD DIALOG ──────────────────────────────── */}
          {tool.id === 'flashcard' && (
            <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3]">
              <DialogHeader>
                <DialogTitle className="text-[#e6edf3] flex items-center gap-2">
                  <Layers className="h-4 w-4 text-violet-400" />
                  Add Flashcard
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-[#8b949e]">Type</Label>
                  <Select value={fcType} onValueChange={(v) => setFcType(v as 'cloze' | 'image-occlusion')}>
                    <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161b22] border-[#30363d]">
                      <SelectItem value="cloze">Cloze Deletion</SelectItem>
                      <SelectItem value="image-occlusion">Image Occlusion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#8b949e]">Front (Question/Prompt)</Label>
                  <Textarea
                    value={fcFront}
                    onChange={(e) => setFcFront(e.target.value)}
                    placeholder={fcType === 'cloze' ? 'The first-line diuretic in AHF is ___' : 'Identify the labeled structure'}
                    rows={3}
                    className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#8b949e]">Back (Answer)</Label>
                  <Input
                    value={fcBack}
                    onChange={(e) => setFcBack(e.target.value)}
                    placeholder="Furosemide"
                    className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#8b949e]">Tags (comma separated)</Label>
                  <Input
                    value={fcTags}
                    onChange={(e) => setFcTags(e.target.value)}
                    placeholder="pharmacology, emergency"
                    className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" className="text-[#8b949e]">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddFlashcard} className="bg-violet-600 hover:bg-violet-700 text-white">
                  Add Flashcard
                </Button>
              </DialogFooter>
            </DialogContent>
          )}

          {/* ─── ADD MERMAID DIALOG ────────────────────────────────── */}
          {tool.id === 'mermaid' && (
            <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3]">
              <DialogHeader>
                <DialogTitle className="text-[#e6edf3] flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-cyan-400" />
                  Add Mermaid Diagram
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-[#8b949e]">Diagram Title</Label>
                  <Input
                    value={mermaidTitle}
                    onChange={(e) => setMermaidTitle(e.target.value)}
                    placeholder="e.g., Treatment Algorithm"
                    className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#8b949e]">Mermaid Code</Label>
                  <Textarea
                    value={mermaidCode}
                    onChange={(e) => setMermaidCode(e.target.value)}
                    placeholder="graph TD&#10;    A-->B"
                    rows={8}
                    className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] font-mono text-xs"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" className="text-[#8b949e]">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddMermaid} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  Add Diagram
                </Button>
              </DialogFooter>
            </DialogContent>
          )}

          {/* ─── ADD TAB GROUP DIALOG ──────────────────────────────── */}
          {tool.id === 'tabs' && (
            <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3]">
              <DialogHeader>
                <DialogTitle className="text-[#e6edf3] flex items-center gap-2">
                  <Columns3 className="h-4 w-4 text-rose-400" />
                  Add Tab Group
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-[#8b949e]">Section Title</Label>
                  <Input
                    value={tabTitle}
                    onChange={(e) => setTabTitle(e.target.value)}
                    placeholder="e.g., Comparison"
                    className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#8b949e]">Tab Names (comma separated)</Label>
                  <Input
                    value={tabNames}
                    onChange={(e) => setTabNames(e.target.value)}
                    placeholder="Tab 1, Tab 2, Tab 3"
                    className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" className="text-[#8b949e]">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddTabGroup} className="bg-rose-600 hover:bg-rose-700 text-white">
                  Add Tab Group
                </Button>
              </DialogFooter>
            </DialogContent>
          )}

          {/* ─── ADD ASSET DIALOG ──────────────────────────────────── */}
          {tool.id === 'asset' && (
            <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3]">
              <DialogHeader>
                <DialogTitle className="text-[#e6edf3] flex items-center gap-2">
                  <ImagePlus className="h-4 w-4 text-emerald-400" />
                  Add Asset
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="border-2 border-dashed border-[#30363d] rounded-lg p-8 text-center">
                  <ImagePlus className="h-10 w-10 text-[#8b949e] mx-auto mb-3" />
                  <p className="text-sm text-[#8b949e]">File picker placeholder</p>
                  <p className="text-xs text-[#8b949e]/60 mt-1">
                    A placeholder asset will be added to the note
                  </p>
                  <Badge variant="outline" className="mt-3 border-[#30363d] text-[#8b949e] text-[10px]">
                    Coming Soon
                  </Badge>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" className="text-[#8b949e]">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddAsset} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Add Placeholder
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      ))}
    </div>
  );
}
