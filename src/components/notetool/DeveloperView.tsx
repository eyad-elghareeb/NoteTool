'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  Code2,
  Eye,
  Bold,
  Italic,
  Heading2,
  List,
  Table,
  Code,
  Link,
  HelpCircle,
  Layers,
  GitBranch,
  Activity,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { MermaidMakerGUI } from './MermaidMakerGUI';
import { MarkdownRenderer } from './MarkdownRenderer';

interface DeveloperViewProps {
  initialContent: string;
  onContentChange?: (content: string) => void;
  sections?: { id: string; title: string; type: string }[];
}

// ─── Toolbar Tool Definitions ──────────────────────────────────────────

interface ToolbarTool {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: 'wrap' | 'insert';
  /** For wrap tools: the opening tag */
  openTag?: string;
  /** For wrap tools: the closing tag */
  closeTag?: string;
  /** For insert tools: the template to insert */
  template?: string;
}

const TEXT_TOOLS: ToolbarTool[] = [
  {
    id: 'bold',
    label: 'Bold',
    icon: <Bold className="h-3.5 w-3.5" />,
    type: 'wrap',
    openTag: '**',
    closeTag: '**',
  },
  {
    id: 'italic',
    label: 'Italic',
    icon: <Italic className="h-3.5 w-3.5" />,
    type: 'wrap',
    openTag: '_',
    closeTag: '_',
  },
  {
    id: 'heading',
    label: 'Heading',
    icon: <Heading2 className="h-3.5 w-3.5" />,
    type: 'wrap',
    openTag: '## ',
    closeTag: '',
  },
  {
    id: 'list',
    label: 'List',
    icon: <List className="h-3.5 w-3.5" />,
    type: 'wrap',
    openTag: '- ',
    closeTag: '',
  },
  {
    id: 'code',
    label: 'Code',
    icon: <Code className="h-3.5 w-3.5" />,
    type: 'wrap',
    openTag: '`',
    closeTag: '`',
  },
  {
    id: 'link',
    label: 'Link',
    icon: <Link className="h-3.5 w-3.5" />,
    type: 'wrap',
    openTag: '[',
    closeTag: '](url)',
  },
];

const INSERT_TOOLS: ToolbarTool[] = [
  {
    id: 'table',
    label: 'Medical Table',
    icon: <Table className="h-3.5 w-3.5" />,
    type: 'insert',
    template: `
| Clinical Feature | Normal Range | Patient Finding | Interpretation |
|:-----------------|:-------------|:----------------|:---------------|
| Heart Rate (bpm) | 60 - 100     | 112             | Tachycardia    |
| BP (mmHg)        | < 120/80     | 145/95          | Hypertension   |
| SpO2 (%)         | > 94%        | 89% (RA)        | Hypoxemia      |
| Temp (°C)        | 36.5 - 37.5  | 38.4            | Pyrexia        |
`,
  },
  {
    id: 'mcq',
    label: 'MCQ Block',
    icon: <HelpCircle className="h-3.5 w-3.5" />,
    type: 'insert',
    template: `
\`\`\`mcq
{
  "question": "What is the primary diagnostic finding in this condition?",
  "options": [
    "Elevated troponin",
    "ST-segment elevation",
    "Prolonged PR interval",
    "T-wave inversion"
  ],
  "correctIndex": 1,
  "explanation": "ST-segment elevation is diagnostic of STEMI in the clinical context of chest pain."
}
\`\`\`
`,
  },
  {
    id: 'tab',
    label: 'Tab Section',
    icon: <Layers className="h-3.5 w-3.5" />,
    type: 'insert',
    template: `
### Tab: Diagnosis
Content for diagnosis tab...

### Tab: Management
Content for management tab...
`,
  },
  {
    id: 'flashcard',
    label: 'Flashcard',
    icon: <Layers className="h-3.5 w-3.5" />,
    type: 'insert',
    template: `<div class="flashcard" style="perspective: 1000px; margin: 12px 0;">
  <div style="position: relative; width: 100%; min-height: 120px; transition: transform 0.6s; transform-style: preserve-3d; cursor: pointer;"
       onclick="this.style.transform = this.style.transform === 'rotateY(180deg)' ? '' : 'rotateY(180deg)'">
    <div style="backface-visibility: hidden; position: absolute; inset: 0; background: var(--color-sb-surface2); border: 2px solid #8b5cf6; border-radius: 12px; padding: 20px; display: flex; align-items: center; justify-content: center;">
      <p style="color: var(--color-sb-text); text-align: center; font-size: 1.1em;">Front: Your question or prompt</p>
    </div>
    <div style="backface-visibility: hidden; transform: rotateY(180deg); position: absolute; inset: 0; background: var(--color-sb-surface2); border: 2px solid #3fb950; border-radius: 12px; padding: 20px; display: flex; align-items: center; justify-content: center;">
      <p style="color: #3fb950; text-align: center; font-size: 1.1em;">Back: Your answer</p>
    </div>
  </div>
</div>`,
  },
  {
    id: 'mermaid',
    label: 'Diagram',
    icon: <Activity className="h-3.5 w-3.5" />,
    type: 'insert',
    template: `<div class="mermaid-diagram" style="background: var(--color-sb-surface2); border: 1px solid rgba(59,130,246,0.2); border-radius: 12px; padding: 16px; margin: 12px 0;">
  <p style="color: #3b82f6; font-weight: 600; margin-bottom: 8px;">Clinical Diagram</p>
  <pre class="mermaid" style="background: var(--color-sb-bg); border-radius: 8px; padding: 12px; color: var(--color-sb-muted);">
graph TD
    A["Patient Presentation"] --> B{"Assessment"}
    B -->|"Positive"| C["Intervention"]
    B -->|"Negative"| D["Monitor"]
    C --> E["Re-evaluate"]
    D --> E
  </pre>
</div>`,
  },
];

export function DeveloperView({ initialContent, onContentChange, sections = [] }: DeveloperViewProps) {
  const [code, setCode] = useState(initialContent);
  const [preview, setPreview] = useState(initialContent);
  const [isMermaidMakerOpen, setIsMermaidMakerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCode(initialContent);
    setPreview(initialContent);
  }, [initialContent]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPreview(code);
      onContentChange?.(code);
    }, 500);
    return () => clearTimeout(timer);
  }, [code, onContentChange]);

  // ─── Handle toolbar actions ───────────────────────────────────────
  const handleToolClick = useCallback((tool: ToolbarTool) => {
    if (tool.id === 'mermaid') {
      setIsMermaidMakerOpen(true);
      return;
    }
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = code.substring(start, end);
    const beforeSelection = code.substring(0, start);
    const afterSelection = code.substring(end);

    let newCode: string;
    let newCursorPos: number;

    if (tool.type === 'wrap' && tool.openTag && tool.closeTag) {
      // Wrap selection in tags
      const wrapped = `${tool.openTag}${selectedText || 'text'}${tool.closeTag}`;
      newCode = beforeSelection + wrapped + afterSelection;
      // Position cursor after opening tag (or select the placeholder text)
      if (selectedText) {
        newCursorPos = start + wrapped.length;
      } else {
        newCursorPos = start + tool.openTag.length;
      }
    } else if (tool.type === 'insert' && tool.template) {
      // Insert template at cursor position
      const insertText = selectedText ? `\n${tool.template}\n` : `\n${tool.template}\n`;
      newCode = beforeSelection + insertText + afterSelection;
      newCursorPos = start + insertText.length;
    } else {
      return;
    }

    setCode(newCode);

    // Restore cursor position after React re-renders
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        if (!selectedText && tool.type === 'wrap' && tool.openTag) {
          // Select the placeholder "text"
          const placeholderStart = start + tool.openTag.length;
          const placeholderEnd = placeholderStart + 4; // length of "text"
          textareaRef.current.setSelectionRange(placeholderStart, placeholderEnd);
        } else {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }
    });
  }, [code]);

  const handleMermaidSave = (mermaidCode: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const beforeSelection = code.substring(0, start);
    const afterSelection = code.substring(textarea.selectionEnd);
    const newCode = beforeSelection + `\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n` + afterSelection;
    setCode(newCode);
    setIsMermaidMakerOpen(false);
  };

  return (
    <div className="h-full rounded-lg border border-violet-800/30 overflow-hidden flex flex-col">
      {/* ─── GUI Toolbar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-violet-800/20 bg-slate-950/80">
        <div className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto scrollbar-thin">
          {/* Text formatting tools */}
          {TEXT_TOOLS.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleToolClick(tool)}
                  className="flex items-center justify-center h-7 w-7 rounded-md text-violet-300/70 hover:text-violet-200 hover:bg-violet-600/15 transition-colors flex-shrink-0"
                >
                  {tool.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-violet-900 text-violet-100 border-violet-700/50 text-[11px]">
                {tool.label}
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Separator between text tools and insert tools */}
          <Separator orientation="vertical" className="h-5 mx-1 bg-violet-700/30 flex-shrink-0" />

          {/* Insert tools */}
          {INSERT_TOOLS.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleToolClick(tool)}
                  className="flex items-center justify-center h-7 w-7 rounded-md text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-600/15 transition-colors flex-shrink-0"
                >
                  {tool.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-emerald-900 text-emerald-100 border-emerald-700/50 text-[11px]">
                Insert {tool.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* ─── Split Pane Editor ───────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">
        {/* Section Selector Sidebar */}
        <div className="w-48 flex-shrink-0 bg-slate-900/50 border-r border-violet-800/20 overflow-y-auto scrollbar-thin">
          <div className="px-3 py-2 border-b border-violet-800/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400/60">Sections</span>
          </div>
          <div className="p-1 space-y-0.5">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  const textarea = textareaRef.current;
                  if (!textarea) return;
                  // Improved search logic
                  const cleanTitle = sec.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(`^#+\\s+\\[.*?\\]\\s+${cleanTitle}`, 'm');
                  const match = code.match(regex);
                  
                  if (match && match.index !== undefined) {
                    textarea.focus();
                    textarea.setSelectionRange(match.index, match.index + match[0].length);
                    
                    // Improved scrolling
                    const lines = code.substring(0, match.index).split('\n');
                    const lineHeight = 20; 
                    textarea.scrollTop = Math.max(0, (lines.length - 2) * lineHeight);
                  }
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-violet-600/10 transition-colors group"
              >
                <div className="text-[11px] font-medium text-violet-300 truncate">{sec.title || sec.type}</div>
                <div className="text-[9px] text-violet-500/70 capitalize">{sec.type}</div>
              </button>
            ))}
          </div>
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Raw Editor */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col bg-slate-950">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-muted/20">
                <Code2 className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-xs font-medium text-violet-400">Raw HTML/JS</span>
                <Badge variant="outline" className="text-[9px] border-violet-700/40 text-violet-400 ml-auto">
                  Editor
                </Badge>
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 w-full bg-transparent p-4 text-xs font-mono text-emerald-300 resize-none border-none outline-none leading-relaxed scroll-smooth"
                spellCheck={false}
                placeholder="Write HTML/JS here..."
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Preview */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col bg-background">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-muted/20">
                <Eye className="h-3.5 w-3.5 text-teal-400" />
                <span className="text-xs font-medium text-teal-400">WYSIWYG Preview</span>
                <Badge variant="outline" className="text-[9px] border-teal-700/40 text-teal-400 ml-auto">
                  Live
                </Badge>
              </div>
              <div
                className="flex-1 overflow-auto p-6 prose prose-sm prose-invert max-w-none prose-table:border prose-table:border-sb-border prose-th:bg-sb-surface2 prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-sb-border"
                style={{ color: 'var(--color-sb-text)' }}
              >
                <MarkdownRenderer content={code} />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <Dialog open={isMermaidMakerOpen} onOpenChange={setIsMermaidMakerOpen}>
        <DialogContent className="max-w-[900px] p-0 border-none bg-transparent">
          <DialogTitle className="sr-only">Visual Mermaid Maker</DialogTitle>
          <MermaidMakerGUI 
            onSave={(data) => handleMermaidSave(data.code)} 
            onCancel={() => setIsMermaidMakerOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
