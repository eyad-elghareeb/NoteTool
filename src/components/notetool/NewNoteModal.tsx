'use client';

import { useState } from 'react';
import { useNoteToolStore, type NoteData } from '@/stores/notetool-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Plus, Sparkles } from 'lucide-react';

const SPECIALTIES = [
  'Cardiology',
  'Respiratory Medicine',
  'Nephrology',
  'General Surgery',
  'Neurology',
  'GI Medicine',
  'Endocrinology',
  'Haematology',
  'Oncology',
  'Infectious Diseases',
  'Emergency Medicine',
  'Critical Care',
  'Paediatrics',
  'Obstetrics & Gynaecology',
  'Orthopaedics',
  'Urology',
  'Psychiatry',
  'Dermatology',
];

export function NewNoteModal() {
  const { newNoteModalOpen, setNewNoteModalOpen, addNote, setActiveNoteId, setActiveView } = useNoteToolStore();
  const [title, setTitle] = useState('');
  const [specialty, setSpecialty] = useState('Cardiology');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');

  const handleCreate = () => {
    if (!title.trim()) return;

    const noteId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const newNote: NoteData = {
      id: noteId,
      title: title.trim(),
      category: specialty,
      specialty,
      summary: content.trim() || `New synthesis: ${title.trim()}`,
      icd10Codes: [],
      snomedCodes: [],
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      sections: content.trim()
        ? [{
            id: `section-${Date.now()}`,
            title: 'Overview',
            type: 'content' as const,
            content: content.trim(),
          }]
        : [],
      highYieldSummary: [],
      links: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addNote(newNote);
    setActiveNoteId(noteId);
    setActiveView('notes');

    // Reset form
    setTitle('');
    setSpecialty('Cardiology');
    setTags('');
    setContent('');
    setNewNoteModalOpen(false);
  };

  return (
    <Dialog open={newNoteModalOpen} onOpenChange={setNewNoteModalOpen}>
      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#e6edf3] flex items-center gap-2 serif-title text-lg">
            <Sparkles className="h-5 w-5 text-[#f0a500]" />
            Create New Synthesis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-[#8b949e] text-xs">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Acute Heart Failure Management"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] text-base rounded-xl h-11 placeholder:text-[#8b949e]/50"
            />
          </div>

          {/* Specialty */}
          <div className="space-y-2">
            <Label className="text-[#8b949e] text-xs">Specialty</Label>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-[#30363d]">
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s} className="text-[#e6edf3] focus:bg-[#1c2330] focus:text-[#f0a500]">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-[#8b949e] text-xs">Tags (comma separated)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., emergency, pharmacology, acute-care"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] rounded-xl placeholder:text-[#8b949e]/50"
            />
          </div>

          {/* Initial Content */}
          <div className="space-y-2">
            <Label className="text-[#8b949e] text-xs">Initial Content (Markdown)</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your synthesis content here..."
              rows={5}
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] rounded-xl font-mono text-xs placeholder:text-[#8b949e]/50"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="ghost" className="text-[#8b949e] rounded-xl">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="bg-[#f0a500] hover:bg-[#d4940a] text-[#0d1117] font-semibold rounded-xl"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Synthesis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
