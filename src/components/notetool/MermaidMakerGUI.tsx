'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, GitBranch, ArrowRight, Shapes, PlusCircle, Save } from 'lucide-react';
import { MermaidDiagram } from './MermaidDiagram';

interface Node {
  id: string;
  label: string;
  shape: 'rectangle' | 'diamond' | 'round' | 'stadium' | 'cylinder';
}

interface Edge {
  id: string;
  source: string;
  target: string;
  label: string;
}

interface MermaidMakerGUIProps {
  onSave: (mermaidHtml: string) => void;
  onCancel: () => void;
  initialCode?: string;
}

export function MermaidMakerGUI({ onSave, onCancel, initialCode }: MermaidMakerGUIProps) {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'A', label: 'Start', shape: 'rectangle' },
    { id: 'B', label: 'End', shape: 'rectangle' },
  ]);
  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e1', source: 'A', target: 'B', label: '' },
  ]);

  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeShape, setNewNodeShape] = useState<Node['shape']>('rectangle');

  const [newEdgeSource, setNewEdgeSource] = useState('');
  const [newEdgeTarget, setNewEdgeTarget] = useState('');
  const [newEdgeLabel, setNewEdgeLabel] = useState('');

  // ─── Generate Mermaid Code ──────────────────────────────────────────
  const generatedCode = useMemo(() => {
    let code = 'graph TD\n';
    
    nodes.forEach(node => {
      let open = '[';
      let close = ']';
      if (node.shape === 'diamond') { open = '{'; close = '}'; }
      if (node.shape === 'round') { open = '('; close = ')'; }
      if (node.shape === 'stadium') { open = '(['; close = '])'; }
      if (node.shape === 'cylinder') { open = '(('; close = '))'; }

      code += `    ${node.id}${open}"${node.label}"${close}\n`;
    });

    edges.forEach(edge => {
      const labelStr = edge.label ? `|"${edge.label}"| ` : '';
      code += `    ${edge.source} -->${labelStr}${edge.target}\n`;
    });

    return code;
  }, [nodes, edges]);

  const addNode = () => {
    if (!newNodeLabel.trim()) return;
    const id = String.fromCharCode(65 + nodes.length) || `N${nodes.length}`;
    setNodes([...nodes, { id, label: newNodeLabel, shape: newNodeShape }]);
    setNewNodeLabel('');
  };

  const deleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    setEdges(edges.filter(e => e.source !== id && e.target !== id));
  };

  const addEdge = () => {
    if (!newEdgeSource || !newEdgeTarget) return;
    const id = `e${Date.now()}`;
    setEdges([...edges, { id, source: newEdgeSource, target: newEdgeTarget, label: newEdgeLabel }]);
    setNewEdgeLabel('');
  };

  const deleteEdge = (id: string) => {
    setEdges(edges.filter(e => e.id !== id));
  };

  const handleSave = () => {
    const htmlBlock = `<div class="mermaid-diagram" style="background: var(--color-sb-surface2); border: 1px solid var(--color-sb-accent); border-radius: 12px; padding: 16px; margin: 12px 0;">
  <p style="color: var(--color-sb-accent); font-weight: 600; margin-bottom: 8px;">Clinical Algorithm</p>
  <pre class="mermaid">
${generatedCode}
  </pre>
</div>`;
    onSave(htmlBlock);
  };

  return (
    <div className="flex flex-col h-[85vh] w-[90vw] max-w-6xl bg-sb-bg border border-sb-border rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-sb-surface border-b border-sb-border">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-sb-accent" />
          <h3 className="font-bold text-sb-text text-lg">Visual Mermaid Maker</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-sb-muted">Cancel</Button>
          <Button variant="default" size="sm" onClick={handleSave} className="bg-sb-accent hover:bg-sb-accent/90 text-sb-bg gap-2">
            <Save className="h-4 w-4" />
            Insert Diagram
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Editor */}
        <div className="w-80 border-r border-sb-border bg-sb-surface flex flex-col">
          <Tabs defaultValue="nodes" className="flex-1 flex flex-col">
            <div className="px-4 pt-4">
              <TabsList className="w-full grid grid-cols-2 bg-sb-bg border border-sb-border h-9">
                <TabsTrigger value="nodes" className="text-[11px] data-[state=active]:bg-sb-surface data-[state=active]:text-sb-accent">
                  <Shapes className="h-3.5 w-3.5 mr-1.5" /> Nodes
                </TabsTrigger>
                <TabsTrigger value="edges" className="text-[11px] data-[state=active]:bg-sb-surface data-[state=active]:text-sb-accent">
                  <GitBranch className="h-3.5 w-3.5 mr-1.5" /> Links
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 p-4">
              <TabsContent value="nodes" className="mt-0 space-y-4">
                {/* Add Node Form */}
                <div className="space-y-3 p-3 rounded-lg border border-sb-border bg-sb-bg/50">
                  <Label className="text-[10px] uppercase tracking-wider text-sb-muted">Add New Node</Label>
                  <Input 
                    placeholder="Node label..." 
                    value={newNodeLabel} 
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    className="h-8 text-xs bg-sb-surface"
                  />
                  <Select value={newNodeShape} onValueChange={(val: any) => setNewNodeShape(val)}>
                    <SelectTrigger className="h-8 text-xs bg-sb-surface">
                      <SelectValue placeholder="Shape" />
                    </SelectTrigger>
                    <SelectContent className="bg-sb-surface border-sb-border">
                      <SelectItem value="rectangle">Rectangle (Process)</SelectItem>
                      <SelectItem value="diamond">Diamond (Decision)</SelectItem>
                      <SelectItem value="round">Round (Start/End)</SelectItem>
                      <SelectItem value="stadium">Stadium</SelectItem>
                      <SelectItem value="cylinder">Cylinder (DB)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addNode} className="w-full h-8 text-xs bg-sb-accent/10 text-sb-accent hover:bg-sb-accent/20 border border-sb-accent/20">
                    <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Add Node
                  </Button>
                </div>

                <Separator className="bg-sb-border/50" />

                {/* Node List */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-wider text-sb-muted">Existing Nodes</Label>
                  {nodes.map(node => (
                    <div key={node.id} className="flex items-center justify-between p-2 rounded-md bg-sb-bg border border-sb-border group">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-5 px-1.5 min-w-[20px] justify-center border-sb-accent/30 text-sb-accent text-[9px]">{node.id}</Badge>
                        <span className="text-xs text-sb-text truncate max-w-[120px]">{node.label}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteNode(node.id)} className="h-6 w-6 opacity-0 group-hover:opacity-100 text-sb-wrong">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="edges" className="mt-0 space-y-4">
                {/* Add Edge Form */}
                <div className="space-y-3 p-3 rounded-lg border border-sb-border bg-sb-bg/50">
                  <Label className="text-[10px] uppercase tracking-wider text-sb-muted">Create Connection</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={newEdgeSource} onValueChange={setNewEdgeSource}>
                      <SelectTrigger className="h-8 text-xs bg-sb-surface">
                        <SelectValue placeholder="From" />
                      </SelectTrigger>
                      <SelectContent className="bg-sb-surface border-sb-border">
                        {nodes.map(n => <SelectItem key={n.id} value={n.id}>{n.id}: {n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={newEdgeTarget} onValueChange={setNewEdgeTarget}>
                      <SelectTrigger className="h-8 text-xs bg-sb-surface">
                        <SelectValue placeholder="To" />
                      </SelectTrigger>
                      <SelectContent className="bg-sb-surface border-sb-border">
                        {nodes.map(n => <SelectItem key={n.id} value={n.id}>{n.id}: {n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input 
                    placeholder="Label (optional)..." 
                    value={newEdgeLabel} 
                    onChange={(e) => setNewEdgeLabel(e.target.value)}
                    className="h-8 text-xs bg-sb-surface"
                  />
                  <Button onClick={addEdge} className="w-full h-8 text-xs bg-sb-accent/10 text-sb-accent hover:bg-sb-accent/20 border border-sb-accent/20">
                    <GitBranch className="h-3.5 w-3.5 mr-1.5" /> Connect
                  </Button>
                </div>

                <Separator className="bg-sb-border/50" />

                {/* Edge List */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-wider text-sb-muted">Connections</Label>
                  {edges.map(edge => (
                    <div key={edge.id} className="p-2 rounded-md bg-sb-bg border border-sb-border group relative">
                      <div className="flex items-center gap-2 text-xs text-sb-text">
                        <Badge variant="outline" className="border-sb-muted/30 text-sb-muted text-[9px]">{edge.source}</Badge>
                        <ArrowRight className="h-3 w-3 text-sb-muted" />
                        <Badge variant="outline" className="border-sb-muted/30 text-sb-muted text-[9px]">{edge.target}</Badge>
                        {edge.label && <span className="text-[10px] italic text-sb-accent ml-auto">"{edge.label}"</span>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteEdge(edge.id)} className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 text-sb-wrong">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Main Content: Preview */}
        <div className="flex-1 bg-sb-bg/50 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="bg-sb-accent/5 text-sb-accent border-sb-accent/20">Live Preview</Badge>
          </div>
          <div className="flex-1 rounded-xl border border-sb-border bg-sb-bg overflow-hidden shadow-inner flex flex-col">
            <MermaidDiagram id="gui-maker-preview" title="Diagram Preview" code={generatedCode} />
          </div>
          <div className="mt-4 p-3 rounded-lg bg-sb-surface border border-sb-border">
             <Label className="text-[10px] uppercase tracking-wider text-sb-muted mb-2 block">Generated Syntax</Label>
             <code className="text-[10px] font-mono text-sb-accent block whitespace-pre overflow-x-auto">
               {generatedCode}
             </code>
          </div>
        </div>
      </div>
    </div>
  );
}
