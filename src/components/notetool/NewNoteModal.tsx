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
      <DialogContent className="bg-sb-surface border-sb-border text-sb-text max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sb-text flex items-center gap-2 serif-title text-lg">
            <Sparkles className="h-5 w-5 text-sb-accent" />
            Create New Synthesis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sb-muted text-xs">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Acute Heart Failure Management"
              className="bg-sb-bg border-sb-border text-sb-text text-base rounded-xl h-11 placeholder:text-sb-muted/50"
            />
          </div>

          {/* Specialty */}
          <div className="space-y-2">
            <Label className="text-sb-muted text-xs">Specialty</Label>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger className="bg-sb-bg border-sb-border text-sb-text rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-sb-surface border-sb-border">
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s} className="text-sb-text focus:bg-sb-surface2 focus:text-sb-accent">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-sb-muted text-xs">Tags (comma separated)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., emergency, pharmacology, acute-care"
              className="bg-sb-bg border-sb-border text-sb-text rounded-xl placeholder:text-sb-muted/50"
            />
          </div>

          {/* Initial Content */}
          <div className="space-y-2">
            <Label className="text-sb-muted text-xs">Initial Content (Markdown)</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your synthesis content here..."
              rows={5}
              className="bg-sb-bg border-sb-border text-sb-text rounded-xl font-mono text-xs placeholder:text-sb-muted/50"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="ghost" className="text-sb-muted rounded-xl">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="bg-sb-accent hover:bg-[#d4940a] text-sb-bg font-semibold rounded-xl"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Synthesis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
