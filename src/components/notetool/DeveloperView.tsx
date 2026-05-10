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
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { MermaidMakerGUI } from './MermaidMakerGUI';
import ReactMarkdown from 'react-markdown';

interface DeveloperViewProps {
  initialContent: string;
  onContentChange?: (content: string) => void;
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
    label: 'Table',
    icon: <Table className="h-3.5 w-3.5" />,
    type: 'insert',
    template: `<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr style="background: var(--color-sb-surface3);">
      <th style="padding: 8px; text-align: left; color: var(--color-sb-accent); border: 1px solid var(--color-sb-border);">Header 1</th>
      <th style="padding: 8px; text-align: left; color: var(--color-sb-accent); border: 1px solid var(--color-sb-border);">Header 2</th>
      <th style="padding: 8px; text-align: left; color: var(--color-sb-accent); border: 1px solid var(--color-sb-border);">Header 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 8px; color: var(--color-sb-muted); border: 1px solid var(--color-sb-border);">Cell 1</td>
      <td style="padding: 8px; color: var(--color-sb-muted); border: 1px solid var(--color-sb-border);">Cell 2</td>
      <td style="padding: 8px; color: var(--color-sb-muted); border: 1px solid var(--color-sb-border);">Cell 3</td>
    </tr>
    <tr style="background: var(--color-sb-surface2);">
      <td style="padding: 8px; color: var(--color-sb-muted); border: 1px solid var(--color-sb-border);">Cell 4</td>
      <td style="padding: 8px; color: var(--color-sb-muted); border: 1px solid var(--color-sb-border);">Cell 5</td>
      <td style="padding: 8px; color: var(--color-sb-muted); border: 1px solid var(--color-sb-border);">Cell 6</td>
    </tr>
  </tbody>
</table>`,
  },
  {
    id: 'mcq',
    label: 'MCQ',
    icon: <HelpCircle className="h-3.5 w-3.5" />,
    type: 'insert',
    template: `<div class="mcq-block" style="background: var(--color-sb-surface2); border: 1px solid var(--color-sb-accent); border-radius: 12px; padding: 16px; margin: 12px 0;">
  <p style="color: var(--color-sb-accent); font-weight: 600; margin-bottom: 12px;">Question:</p>
  <p style="color: var(--color-sb-text); margin-bottom: 12px;">Your question here?</p>
  <ul style="list-style: none; padding: 0; margin: 0;">
    <li style="padding: 8px 12px; margin: 4px 0; border-radius: 8px; background: var(--color-sb-bg); border: 1px solid var(--color-sb-border); color: var(--color-sb-muted);">A. Option 1</li>
    <li style="padding: 8px 12px; margin: 4px 0; border-radius: 8px; background: var(--color-sb-bg); border: 1px solid var(--color-sb-border); color: var(--color-sb-muted);">B. Option 2</li>
    <li style="padding: 8px 12px; margin: 4px 0; border-radius: 8px; background: var(--color-sb-bg); border: 1px solid var(--color-sb-border); color: var(--color-sb-muted);">C. Option 3</li>
    <li style="padding: 8px 12px; margin: 4px 0; border-radius: 8px; background: var(--color-sb-bg); border: 1px solid var(--color-sb-border); color: var(--color-sb-muted);">D. Option 4</li>
  </ul>
  <details style="margin-top: 12px;">
    <summary style="color: var(--color-sb-accent); cursor: pointer; font-size: 0.85em;">Show Answer</summary>
    <p style="color: #3fb950; margin-top: 8px; padding: 8px; background: var(--color-sb-bg); border-radius: 8px;">Correct answer and explanation here.</p>
  </details>
</div>`,
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
    label: 'Mermaid',
    icon: <GitBranch className="h-3.5 w-3.5" />,
    type: 'insert',
    template: `<div class="mermaid-diagram" style="background: var(--color-sb-surface2); border: 1px solid #22d3ee; border-radius: 12px; padding: 16px; margin: 12px 0;">
  <p style="color: #22d3ee; font-weight: 600; margin-bottom: 8px;">Mermaid Diagram</p>
  <pre class="mermaid" style="background: var(--color-sb-bg); border-radius: 8px; padding: 12px; color: var(--color-sb-muted);">
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
  </pre>
</div>`,
  },
];

export function DeveloperView({ initialContent, onContentChange }: DeveloperViewProps) {
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

  const handleMermaidSave = (htmlBlock: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const beforeSelection = code.substring(0, start);
    const afterSelection = code.substring(textarea.selectionEnd);
    const newCode = beforeSelection + `\n${htmlBlock}\n` + afterSelection;
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
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
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
                className="flex-1 w-full bg-transparent p-4 text-xs font-mono text-emerald-300 resize-none border-none outline-none leading-relaxed"
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
                className="flex-1 overflow-auto p-4 prose prose-sm prose-invert max-w-none"
                style={{ color: 'var(--color-sb-text)' }}
              >
                <ReactMarkdown>{code}</ReactMarkdown>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <Dialog open={isMermaidMakerOpen} onOpenChange={setIsMermaidMakerOpen}>
        <DialogContent className="max-w-[900px] p-0 border-none bg-transparent">
          <DialogTitle className="sr-only">Visual Mermaid Maker</DialogTitle>
          <MermaidMakerGUI 
            onSave={handleMermaidSave} 
            onCancel={() => setIsMermaidMakerOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
