'use client';

import { useNoteToolStore } from '@/stores/notetool-store';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Settings, Cpu, RefreshCw, Info } from 'lucide-react';

export function SettingsModal() {
  const { settingsModalOpen, setSettingsModalOpen, settings, updateSettings } = useNoteToolStore();

  return (
    <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#e6edf3] flex items-center gap-2 serif-title text-lg">
            <Settings className="h-5 w-5 text-[#f0a500]" />
            System Controls
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ─── Interface Preferences ────────────────────────────── */}
          <div className="space-y-4">
            <span className="label-uppercase text-[#8b949e]">Interface Preferences</span>

            {/* Auto-Dissection Toggle */}
            <div className="flex items-center justify-between rounded-xl bg-[#0d1117] p-3 border border-[#30363d]">
              <div className="space-y-0.5">
                <Label className="text-[#e6edf3] text-xs font-medium">Auto-Dissection</Label>
                <p className="text-[10px] text-[#8b949e]">Automatically show high-yield summary on note open</p>
              </div>
              <Switch
                checked={settings.autoDissect}
                onCheckedChange={(checked) => updateSettings({ autoDissect: checked })}
              />
            </div>

            {/* Connectome Sync Toggle */}
            <div className="flex items-center justify-between rounded-xl bg-[#0d1117] p-3 border border-[#30363d]">
              <div className="space-y-0.5">
                <Label className="text-[#e6edf3] text-xs font-medium">Connectome Sync</Label>
                <p className="text-[10px] text-[#8b949e]">Auto-update knowledge graph on note changes</p>
              </div>
              <Switch
                checked={settings.connectomeSync}
                onCheckedChange={(checked) => updateSettings({ connectomeSync: checked })}
              />
            </div>

            {/* Font Size Slider */}
            <div className="space-y-2 rounded-xl bg-[#0d1117] p-3 border border-[#30363d]">
              <div className="flex items-center justify-between">
                <Label className="text-[#e6edf3] text-xs font-medium">Font Size</Label>
                <span className="text-xs text-[#f0a500] font-mono">{settings.fontSize}px</span>
              </div>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => updateSettings({ fontSize: value })}
                min={12}
                max={22}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-[#8b949e]">
                <span>Compact</span>
                <span>Large</span>
              </div>
            </div>
          </div>

          <Separator className="bg-[#30363d]" />

          {/* ─── Clinical Engine Info ─────────────────────────────── */}
          <div className="rounded-xl border border-[#f0a500]/20 bg-[#f0a500]/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#f0a500]" />
              <span className="text-xs font-semibold text-[#f0a500]">Clinical Engine</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="text-[#8b949e]">Engine Version</div>
              <div className="text-[#e6edf3] font-mono">2.4.0</div>
              <div className="text-[#8b949e]">ICD-10 Database</div>
              <div className="text-[#e6edf3] font-mono">2025-R1</div>
              <div className="text-[#8b949e]">SNOMED CT</div>
              <div className="text-[#e6edf3] font-mono">Jan 2025</div>
              <div className="text-[#8b949e]">Algorithm Count</div>
              <div className="text-[#e6edf3] font-mono">47</div>
            </div>
          </div>

          {/* ─── Version Info ─────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-[10px] text-[#8b949e]">NoteTool v2.4.0</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] text-[#8b949e] hover:text-[#f0a500] h-6"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Check for Updates
            </Button>
          </div>
        </div>

        <DialogClose asChild>
          <Button className="w-full bg-[#f0a500] hover:bg-[#d4940a] text-[#0d1117] font-semibold rounded-xl">
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
