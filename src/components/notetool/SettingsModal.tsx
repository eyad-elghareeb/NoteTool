'use client';

import { useNoteToolStore } from '@/stores/notetool-store';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Settings, Cpu, RefreshCw, Info, Sun, Moon } from 'lucide-react';

export function SettingsModal() {
  const { settingsModalOpen, setSettingsModalOpen, settings, updateSettings } =
    useNoteToolStore();

  const isDark = settings.theme === 'dark';

  return (
    <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
      <DialogContent
        className="border text-sm max-w-md"
        style={{
          background: 'var(--color-sb-surface)',
          borderColor: 'var(--color-sb-border)',
          color: 'var(--color-sb-text)',
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2 serif-title text-lg"
            style={{ color: 'var(--color-sb-text)' }}
          >
            <Settings className="h-5 w-5" style={{ color: 'var(--color-sb-accent)' }} />
            System Controls
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ─── Appearance ───────────────────────────────────────── */}
          <div className="space-y-4">
            <span className="label-uppercase" style={{ color: 'var(--color-sb-muted)' }}>
              Appearance
            </span>

            {/* Theme Toggle */}
            <div
              className="flex items-center justify-between rounded-xl p-3 border"
              style={{
                background: 'var(--color-sb-bg)',
                borderColor: 'var(--color-sb-border)',
              }}
            >
              <div className="space-y-0.5">
                <Label className="text-xs font-medium" style={{ color: 'var(--color-sb-text)' }}>
                  Theme
                </Label>
                <p className="text-[10px]" style={{ color: 'var(--color-sb-muted)' }}>
                  {isDark ? 'Dark mode — GitHub dark' : 'Light mode — Warm parchment'}
                </p>
              </div>
              <button
                onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: isDark ? 'rgba(240,165,0,0.12)' : 'rgba(194,120,3,0.10)',
                  color: 'var(--color-sb-accent)',
                  border: '1px solid var(--color-sb-accent)',
                }}
              >
                {isDark ? (
                  <>
                    <Sun className="h-3.5 w-3.5" />
                    Light
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5" />
                    Dark
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ─── Interface Preferences ────────────────────────────── */}
          <div className="space-y-4">
            <span className="label-uppercase" style={{ color: 'var(--color-sb-muted)' }}>
              Interface Preferences
            </span>

            {/* Auto-Dissection Toggle */}
            <div
              className="flex items-center justify-between rounded-xl p-3 border"
              style={{ background: 'var(--color-sb-bg)', borderColor: 'var(--color-sb-border)' }}
            >
              <div className="space-y-0.5">
                <Label className="text-xs font-medium" style={{ color: 'var(--color-sb-text)' }}>
                  Auto-Dissection
                </Label>
                <p className="text-[10px]" style={{ color: 'var(--color-sb-muted)' }}>
                  Automatically show high-yield summary on note open
                </p>
              </div>
              <Switch
                checked={settings.autoDissect}
                onCheckedChange={(checked) => updateSettings({ autoDissect: checked })}
              />
            </div>

            {/* Connectome Sync Toggle */}
            <div
              className="flex items-center justify-between rounded-xl p-3 border"
              style={{ background: 'var(--color-sb-bg)', borderColor: 'var(--color-sb-border)' }}
            >
              <div className="space-y-0.5">
                <Label className="text-xs font-medium" style={{ color: 'var(--color-sb-text)' }}>
                  Connectome Sync
                </Label>
                <p className="text-[10px]" style={{ color: 'var(--color-sb-muted)' }}>
                  Auto-update knowledge graph on note changes
                </p>
              </div>
              <Switch
                checked={settings.connectomeSync}
                onCheckedChange={(checked) => updateSettings({ connectomeSync: checked })}
              />
            </div>

            {/* Font Size Slider */}
            <div
              className="space-y-2 rounded-xl p-3 border"
              style={{ background: 'var(--color-sb-bg)', borderColor: 'var(--color-sb-border)' }}
            >
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium" style={{ color: 'var(--color-sb-text)' }}>
                  Font Size
                </Label>
                <span className="text-xs font-mono" style={{ color: 'var(--color-sb-accent)' }}>
                  {settings.fontSize}px
                </span>
              </div>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => updateSettings({ fontSize: value })}
                min={12}
                max={22}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[9px]" style={{ color: 'var(--color-sb-muted)' }}>
                <span>Compact</span>
                <span>Large</span>
              </div>
            </div>
          </div>

          <Separator style={{ background: 'var(--color-sb-border)' }} />

          {/* ─── Clinical Engine Info ─────────────────────────────── */}
          <div
            className="rounded-xl p-4 space-y-2 border"
            style={{
              borderColor: 'rgba(240,165,0,0.2)',
              background: 'rgba(240,165,0,0.05)',
            }}
          >
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4" style={{ color: 'var(--color-sb-accent)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-sb-accent)' }}>
                Clinical Engine
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div style={{ color: 'var(--color-sb-muted)' }}>Engine Version</div>
              <div className="font-mono" style={{ color: 'var(--color-sb-text)' }}>2.4.0</div>
              <div style={{ color: 'var(--color-sb-muted)' }}>ICD-10 Database</div>
              <div className="font-mono" style={{ color: 'var(--color-sb-text)' }}>2025-R1</div>
              <div style={{ color: 'var(--color-sb-muted)' }}>SNOMED CT</div>
              <div className="font-mono" style={{ color: 'var(--color-sb-text)' }}>Jan 2025</div>
              <div style={{ color: 'var(--color-sb-muted)' }}>Algorithm Count</div>
              <div className="font-mono" style={{ color: 'var(--color-sb-text)' }}>47</div>
            </div>
          </div>

          {/* ─── Version Info ─────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5" style={{ color: 'var(--color-sb-muted)' }} />
              <span className="text-[10px]" style={{ color: 'var(--color-sb-muted)' }}>
                NoteTool v2.4.0
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] h-6"
              style={{ color: 'var(--color-sb-muted)' }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Check for Updates
            </Button>
          </div>
        </div>

        <DialogClose asChild>
          <Button
            className="w-full font-semibold rounded-xl"
            style={{
              background: 'var(--color-sb-accent)',
              color: isDark ? 'var(--color-sb-bg)' : '#ffffff',
            }}
          >
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
