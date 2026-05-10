'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  FileText,
  HelpCircle,
  Layers,
  GitBranch,
  Columns3,
  ImagePlus,
  FileUp,
  X,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNoteToolStore, type NoteSection } from '@/stores/notetool-store';
import { MermaidMakerGUI } from './MermaidMakerGUI';
import { useToast } from '@/hooks/use-toast';

export function ContentToolbar() {
  const { activeNoteId, addSectionToNote } = useNoteToolStore();
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const generateId = () => `dyn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // ─── Section Form ─────────────────────────────────────────────────
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionContent, setSectionContent] = useState('');

  // ─── MCQ Form ─────────────────────────────────────────────────────
  const [mcqQuestion, setMcqQuestion] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '', '']);
  const [mcqCorrect, setMcqCorrect] = useState('0');
  const [mcqExplanation, setMcqExplanation] = useState('');

  // ─── Flashcard Form ───────────────────────────────────────────────
  const [fcType, setFcType] = useState<'cloze' | 'image-occlusion'>('cloze');
  const [fcFront, setFcFront] = useState('');
  const [fcBack, setFcBack] = useState('');
  const [fcTags, setFcTags] = useState('');

  // ─── Mermaid Live Maker ───────────────────────────────────────────
  const [mermaidTitle, setMermaidTitle] = useState('');
  const [mermaidCode, setMermaidCode] = useState('graph TD\n    A-->B\n    B-->C');
  const [mermaidPreviewSvg, setMermaidPreviewSvg] = useState('');
  const [mermaidError, setMermaidError] = useState<string | null>(null);

  // ─── Tab Group Form ───────────────────────────────────────────────
  const [tabTitle, setTabTitle] = useState('');
  const [tabNames, setTabNames] = useState('Tab 1, Tab 2');

  // ─── Asset Form ──────────────────────────────────────────────────
  const [assetTitle, setAssetTitle] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [assetType, setAssetType] = useState<'image' | 'video'>('image');
  const [assetPreview, setAssetPreview] = useState<string | null>(null);

  // ─── PDF Embed Form ───────────────────────────────────────────────
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState('');

  // ─── Live Mermaid Preview ─────────────────────────────────────────
  const renderMermaidPreview = useCallback(async (code: string) => {
    try {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({ startOnLoad: false, theme: 'dark' });
      const { svg } = await mermaid.render(`preview-${Date.now()}`, code);
      setMermaidPreviewSvg(svg);
      setMermaidError(null);
    } catch {
      setMermaidError('Syntax error — check your Mermaid code');
      setMermaidPreviewSvg('');
    }
  }, []);

  useEffect(() => {
    if (openDialog !== 'mermaid') return;
    const timer = setTimeout(() => {
      renderMermaidPreview(mermaidCode);
    }, 400);
    return () => clearTimeout(timer);
  }, [mermaidCode, openDialog, renderMermaidPreview]);

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleAddSection = () => {
    if (!sectionTitle.trim()) return;
    const section: NoteSection = {
      id: generateId(), type: 'content', title: sectionTitle,
      content: sectionContent, dynamic: true,
    };
    addSectionToNote(activeNoteId, section);
    setSectionTitle(''); setSectionContent(''); setOpenDialog(null);
  };

  const handleAddMCQ = () => {
    if (!mcqQuestion.trim()) return;
    const filled = mcqOptions.filter((o) => o.trim());
    if (filled.length < 2) return;
    const section: NoteSection = {
      id: generateId(), type: 'mcq', title: 'Active Recall Question',
      content: {
        id: generateId(), question: mcqQuestion, options: filled,
        correctIndex: parseInt(mcqCorrect), explanation: mcqExplanation,
      },
      dynamic: true,
    };
    addSectionToNote(activeNoteId, section);
    setMcqQuestion(''); setMcqOptions(['', '', '', '', '']); setMcqCorrect('0'); setMcqExplanation(''); setOpenDialog(null);
  };

  const handleAddFlashcard = () => {
    if (!fcFront.trim() || !fcBack.trim()) return;
    const section: NoteSection = {
      id: generateId(), type: 'flashcard', title: 'Flashcards',
      content: [{
        id: generateId(), type: fcType, front: fcFront, back: fcBack,
        tags: fcTags.split(',').map((t) => t.trim()).filter(Boolean),
      }],
      dynamic: true,
    };
    addSectionToNote(activeNoteId, section);
    setFcFront(''); setFcBack(''); setFcTags(''); setOpenDialog(null);
  };

  const handleAddMermaid = () => {
    if (!mermaidCode.trim() || mermaidError) return;
    const section: NoteSection = {
      id: generateId(), type: 'mermaid', title: mermaidTitle || 'Mermaid Diagram',
      content: { id: generateId(), title: mermaidTitle || 'Mermaid Diagram', code: mermaidCode },
      dynamic: true,
    };
    addSectionToNote(activeNoteId, section);
    setMermaidTitle(''); setMermaidCode('graph TD\n    A-->B\n    B-->C'); setMermaidPreviewSvg(''); setOpenDialog(null);
  };

  const handleAddTabGroup = () => {
    if (!tabNames.trim()) return;
    const names = tabNames.split(',').map((t) => t.trim()).filter(Boolean);
    const section: NoteSection = {
      id: generateId(), type: 'tabs', title: tabTitle || 'Tabbed Section',
      content: { tabs: names.map((name, i) => ({ id: `tab-${i}`, label: name, content: `Content for ${name}` })) },
      dynamic: true,
    };
    addSectionToNote(activeNoteId, section);
    setTabTitle(''); setTabNames('Tab 1, Tab 2'); setOpenDialog(null);
  };

  const handleAssetFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAssetPreview(reader.result as string);
    reader.readAsDataURL(file);
    if (!assetTitle) setAssetTitle(file.name);
  };

  const handleAddAsset = () => {
    const finalUrl = assetPreview || assetUrl;
    if (!finalUrl || !activeNoteId) return;

    const section: NoteSection = {
      id: generateId(),
      type: 'asset',
      title: assetTitle || 'Clinical Asset',
      content: {
        id: generateId(),
        type: assetType,
        url: finalUrl,
        caption: assetTitle || 'Clinical Asset',
        noteId: activeNoteId,
        filename: assetTitle || 'asset',
      },
      dynamic: true,
    };
    addSectionToNote(activeNoteId, section);
    
    // Feedback
    toast({
      title: "Asset Added",
      description: `Successfully added ${assetType} to your synthesis.`,
    });

    setAssetTitle(''); setAssetUrl(''); setAssetPreview(null); setOpenDialog(null);
  };

  const handlePdfFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    setPdfFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => setPdfDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddPdf = () => {
    if (!pdfDataUrl || !activeNoteId) return;
    const section: NoteSection = {
      id: generateId(),
      type: 'pdf-embed',
      title: pdfFilename || 'Embedded PDF',
      content: { 
        dataUrl: pdfDataUrl, 
        filename: pdfFilename,
        noteId: activeNoteId,
      },
      dynamic: true,
    };
    addSectionToNote(activeNoteId, section);
    
    // Feedback
    toast({
      title: "PDF Embedded",
      description: `"${pdfFilename}" has been persisted with this note.`,
    });

    setPdfDataUrl(null); setPdfFilename(''); setOpenDialog(null);
  };

  const tools = [
    { id: 'section', label: 'Add Section', icon: <FileText className="h-4 w-4" />, color: 'text-teal-400', bgColor: 'bg-teal-600/10', borderColor: 'border-teal-600/30' },
    { id: 'mcq', label: 'Add MCQ', icon: <HelpCircle className="h-4 w-4" />, color: 'text-sb-accent', bgColor: 'bg-sb-accent/10', borderColor: 'border-sb-accent/30' },
    { id: 'flashcard', label: 'Add Flashcard', icon: <Layers className="h-4 w-4" />, color: 'text-violet-400', bgColor: 'bg-violet-600/10', borderColor: 'border-violet-600/30' },
    { id: 'mermaid', label: 'Mermaid Maker', icon: <GitBranch className="h-4 w-4" />, color: 'text-cyan-400', bgColor: 'bg-cyan-600/10', borderColor: 'border-cyan-600/30' },
    { id: 'tabs', label: 'Add Tab Group', icon: <Columns3 className="h-4 w-4" />, color: 'text-rose-400', bgColor: 'bg-rose-600/10', borderColor: 'border-rose-600/30' },
    { id: 'asset', label: 'Add Asset', icon: <ImagePlus className="h-4 w-4" />, color: 'text-emerald-400', bgColor: 'bg-emerald-600/10', borderColor: 'border-emerald-600/30' },
    { id: 'pdf', label: 'Embed PDF', icon: <FileUp className="h-4 w-4" />, color: 'text-orange-400', bgColor: 'bg-orange-600/10', borderColor: 'border-orange-600/30' },
  ];

  return (
    <div className="flex flex-col gap-1">
      {tools.map((tool) => (
        <Dialog key={tool.id} open={openDialog === tool.id} onOpenChange={(open) => setOpenDialog(open ? tool.id : null)}>
          <DialogTrigger asChild>
            <button className={cn('w-full flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all duration-150 text-left hover:brightness-125', tool.color, tool.bgColor, tool.borderColor)}>
              {tool.icon}{tool.label}
            </button>
          </DialogTrigger>

          {/* ADD SECTION */}
          {tool.id === 'section' && (
            <DialogContent className="bg-sb-surface border-sb-border text-sb-text">
              <DialogHeader><DialogTitle className="text-sb-text flex items-center gap-2"><FileText className="h-4 w-4 text-teal-400" />Add Content Section</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2"><Label className="text-sb-muted">Section Title</Label><Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="e.g., Differential Diagnosis" className="bg-sb-bg border-sb-border text-sb-text" /></div>
                <div className="space-y-2"><Label className="text-sb-muted">Markdown Content</Label><Textarea value={sectionContent} onChange={(e) => setSectionContent(e.target.value)} placeholder="Write markdown content here..." rows={6} className="bg-sb-bg border-sb-border text-sb-text font-mono text-xs" /></div>
              </div>
              <DialogFooter><DialogClose asChild><Button variant="ghost" className="text-sb-muted">Cancel</Button></DialogClose><Button onClick={handleAddSection} className="bg-teal-600 hover:bg-teal-700 text-white">Add Section</Button></DialogFooter>
            </DialogContent>
          )}

          {/* ADD MCQ */}
          {tool.id === 'mcq' && (
            <DialogContent className="bg-sb-surface border-sb-border text-sb-text max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-sb-text flex items-center gap-2"><HelpCircle className="h-4 w-4 text-sb-accent" />Add MCQ Question</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2"><Label className="text-sb-muted">Question</Label><Textarea value={mcqQuestion} onChange={(e) => setMcqQuestion(e.target.value)} placeholder="Enter your question..." rows={3} className="bg-sb-bg border-sb-border text-sb-text" /></div>
                <div className="space-y-2">
                  <Label className="text-sb-muted">Options (A-E)</Label>
                  {mcqOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="mcq-option-key bg-sb-surface2 text-sb-muted border border-sb-border flex-shrink-0">{String.fromCharCode(65 + idx)}</span>
                      <Input value={opt} onChange={(e) => { const next = [...mcqOptions]; next[idx] = e.target.value; setMcqOptions(next); }} placeholder={`Option ${String.fromCharCode(65 + idx)}`} className="bg-sb-bg border-sb-border text-sb-text text-xs" />
                      {idx >= 2 && <Button variant="ghost" size="icon" className="h-7 w-7 text-sb-muted hover:text-sb-wrong flex-shrink-0" onClick={() => setMcqOptions(mcqOptions.filter((_, i) => i !== idx))}><X className="h-3 w-3" /></Button>}
                    </div>
                  ))}
                  {mcqOptions.length < 8 && <Button variant="outline" size="sm" className="border-dashed border-sb-border text-sb-muted text-xs" onClick={() => setMcqOptions([...mcqOptions, ''])}><Plus className="h-3 w-3 mr-1" />Add Option</Button>}
                </div>
                <div className="space-y-2"><Label className="text-sb-muted">Correct Answer</Label><Select value={mcqCorrect} onValueChange={setMcqCorrect}><SelectTrigger className="bg-sb-bg border-sb-border text-sb-text"><SelectValue /></SelectTrigger><SelectContent className="bg-sb-surface border-sb-border">{mcqOptions.filter((o) => o.trim()).map((_, idx) => (<SelectItem key={idx} value={idx.toString()}>{String.fromCharCode(65 + idx)}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-sb-muted">Explanation</Label><Textarea value={mcqExplanation} onChange={(e) => setMcqExplanation(e.target.value)} placeholder="Explain why this is the correct answer..." rows={4} className="bg-sb-bg border-sb-border text-sb-text text-xs" /></div>
              </div>
              <DialogFooter><DialogClose asChild><Button variant="ghost" className="text-sb-muted">Cancel</Button></DialogClose><Button onClick={handleAddMCQ} className="bg-sb-accent hover:bg-[#d4940a] text-black">Add MCQ</Button></DialogFooter>
            </DialogContent>
          )}

          {/* ADD FLASHCARD */}
          {tool.id === 'flashcard' && (
            <DialogContent className="bg-sb-surface border-sb-border text-sb-text">
              <DialogHeader><DialogTitle className="text-sb-text flex items-center gap-2"><Layers className="h-4 w-4 text-violet-400" />Add Flashcard</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2"><Label className="text-sb-muted">Type</Label><Select value={fcType} onValueChange={(v) => setFcType(v as 'cloze' | 'image-occlusion')}><SelectTrigger className="bg-sb-bg border-sb-border text-sb-text"><SelectValue /></SelectTrigger><SelectContent className="bg-sb-surface border-sb-border"><SelectItem value="cloze">Cloze Deletion</SelectItem><SelectItem value="image-occlusion">Image Occlusion</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-sb-muted">Front (Prompt)</Label><Textarea value={fcFront} onChange={(e) => setFcFront(e.target.value)} placeholder={fcType === 'cloze' ? 'First-line diuretic in AHF is ___' : 'Identify the labeled structure'} rows={3} className="bg-sb-bg border-sb-border text-sb-text" /></div>
                <div className="space-y-2"><Label className="text-sb-muted">Back (Answer)</Label><Input value={fcBack} onChange={(e) => setFcBack(e.target.value)} placeholder="Furosemide" className="bg-sb-bg border-sb-border text-sb-text" /></div>
                <div className="space-y-2"><Label className="text-sb-muted">Tags (comma separated)</Label><Input value={fcTags} onChange={(e) => setFcTags(e.target.value)} placeholder="pharmacology, emergency" className="bg-sb-bg border-sb-border text-sb-text" /></div>
              </div>
              <DialogFooter><DialogClose asChild><Button variant="ghost" className="text-sb-muted">Cancel</Button></DialogClose><Button onClick={handleAddFlashcard} className="bg-violet-600 hover:bg-violet-700 text-white">Add Flashcard</Button></DialogFooter>
            </DialogContent>
          )}

          {/* MERMAID LIVE MAKER */}
          {tool.id === 'mermaid' && (
            <DialogContent className="!max-w-[95vw] !w-[95vw] h-[90vh] p-0 overflow-hidden bg-sb-surface border-sb-border flex flex-col shadow-2xl">
              <DialogTitle className="sr-only">Visual Mermaid Maker</DialogTitle>
              <MermaidMakerGUI 
                onSave={(data) => {
                  if (!activeNoteId) return;
                  const section: NoteSection = {
                    id: generateId(),
                    type: 'mermaid',
                    title: data.title || 'Flowchart',
                    content: { id: generateId(), title: data.title || 'Flowchart', code: data.code.trim() },
                    dynamic: true,
                  };
                  addSectionToNote(activeNoteId, section);
                  
                  toast({
                    title: "Diagram Added",
                    description: "Your clinical algorithm has been inserted into the synthesis.",
                  });
                  
                  setOpenDialog(null);
                }} 
                onCancel={() => setOpenDialog(null)} 
              />
            </DialogContent>
          )}

          {/* ADD TAB GROUP */}
          {tool.id === 'tabs' && (
            <DialogContent className="bg-sb-surface border-sb-border text-sb-text">
              <DialogHeader><DialogTitle className="text-sb-text flex items-center gap-2"><Columns3 className="h-4 w-4 text-rose-400" />Add Tab Group</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2"><Label className="text-sb-muted">Section Title</Label><Input value={tabTitle} onChange={(e) => setTabTitle(e.target.value)} placeholder="e.g., Comparison" className="bg-sb-bg border-sb-border text-sb-text" /></div>
                <div className="space-y-2"><Label className="text-sb-muted">Tab Names (comma separated)</Label><Input value={tabNames} onChange={(e) => setTabNames(e.target.value)} placeholder="Tab 1, Tab 2, Tab 3" className="bg-sb-bg border-sb-border text-sb-text" /></div>
              </div>
              <DialogFooter><DialogClose asChild><Button variant="ghost" className="text-sb-muted">Cancel</Button></DialogClose><Button onClick={handleAddTabGroup} className="bg-rose-600 hover:bg-rose-700 text-white">Add Tab Group</Button></DialogFooter>
            </DialogContent>
          )}

          {/* ADD ASSET */}
          {tool.id === 'asset' && (
            <DialogContent className="bg-sb-surface border-sb-border text-sb-text">
              <DialogHeader><DialogTitle className="text-sb-text flex items-center gap-2"><ImagePlus className="h-4 w-4 text-emerald-400" />Add Asset</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-sb-muted">Asset Title / Caption</Label>
                  <Input value={assetTitle} onChange={(e) => setAssetTitle(e.target.value)} placeholder="e.g., Chest X-Ray - PA View" className="bg-sb-bg border-sb-border text-sb-text" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sb-muted">Asset Type</Label>
                  <Select value={assetType} onValueChange={(v) => setAssetType(v as 'image' | 'video')}>
                    <SelectTrigger className="bg-sb-bg border-sb-border text-sb-text"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-sb-surface border-sb-border">
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sb-muted">Source</Label>
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-sb-bg">
                      <TabsTrigger value="upload" className="text-xs">Upload</TabsTrigger>
                      <TabsTrigger value="url" className="text-xs">URL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="mt-2">
                      <label className={cn('block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500/50 transition-colors', assetPreview ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-sb-border')}>
                        {assetPreview ? (
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-sb-border">
                            {assetType === 'image' ? (
                              <img src={assetPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <video src={assetPreview} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                              <p className="text-white text-xs font-bold">Change File</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ImagePlus className="h-8 w-8 mx-auto mb-2 text-sb-muted" />
                            <p className="text-xs text-sb-muted">Click to upload file</p>
                          </>
                        )}
                        <input type="file" accept={assetType === 'image' ? 'image/*' : 'video/*'} className="hidden" onChange={handleAssetFile} />
                      </label>
                    </TabsContent>
                    <TabsContent value="url" className="mt-2">
                      <Input value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="bg-sb-bg border-sb-border text-sb-text" />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost" className="text-sb-muted">Cancel</Button></DialogClose>
                <Button onClick={handleAddAsset} disabled={!assetPreview && !assetUrl} className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40">Add Asset</Button>
              </DialogFooter>
            </DialogContent>
          )}

          {/* EMBED PDF */}
          {tool.id === 'pdf' && (
            <DialogContent className="bg-sb-surface border-sb-border text-sb-text">
              <DialogHeader><DialogTitle className="text-sb-text flex items-center gap-2"><FileUp className="h-4 w-4 text-orange-400" />Embed PDF in Note</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <label className={cn('block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors', pdfDataUrl ? 'border-orange-500/50 bg-orange-500/5' : 'border-sb-border hover:border-sb-muted/40')}>
                  <FileUp className="h-10 w-10 mx-auto mb-3 text-sb-muted" />
                  {pdfDataUrl ? (
                    <p className="text-sm text-orange-400 font-medium">{pdfFilename}</p>
                  ) : (
                    <>
                      <p className="text-sm text-sb-muted">Click to select a PDF file</p>
                      <p className="text-xs text-sb-muted/60 mt-1">Stored as base64 — persists with note</p>
                    </>
                  )}
                  <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfFile} />
                </label>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost" className="text-sb-muted">Cancel</Button></DialogClose>
                <Button onClick={handleAddPdf} disabled={!pdfDataUrl} className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-40">Embed PDF</Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      ))}
    </div>
  );
}
