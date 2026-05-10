'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Plus,
  Link2,
  Trash2,
  LayoutGrid,
  CircleDot,
  X,
} from 'lucide-react';
import { useNoteToolStore } from '@/stores/notetool-store';

// ─── Types ────────────────────────────────────────────────────────────

interface ConnectomeLink {
  source: string;
  target: string;
  relation: string;
  label: string;
}

interface ConnectomeViewProps {
  centerNode: string;
  links: ConnectomeLink[];
}

interface GraphNode {
  id: string;
  isCenter: boolean;
  specialty: string;
  x: number;
  y: number;
  fx: number | null;
  fy: number | null;
  vx: number;
  vy: number;
}

interface GraphLink {
  source: GraphNode | string;
  target: GraphNode | string;
  relation: string;
  label: string;
  index?: number;
}

type EditorTool = 'select' | 'addNode' | 'addLink' | 'delete';
type LayoutMode = 'force' | 'radial';

// ─── Specialty Color Map ──────────────────────────────────────────────

const SPECIALTY_COLORS: Record<string, { fill: string; stroke: string; text: string; glow: string }> = {
  Cardiology: { fill: '#9f1239', stroke: '#f43f5e', text: '#fda4af', glow: 'rgba(244,63,94,0.4)' },
  'Respiratory Medicine': { fill: '#0c4a6e', stroke: '#0ea5e9', text: '#7dd3fc', glow: 'rgba(14,165,233,0.4)' },
  Nephrology: { fill: '#064e3b', stroke: '#10b981', text: '#6ee7b7', glow: 'rgba(16,185,129,0.4)' },
  'General Surgery': { fill: '#713f12', stroke: '#f59e0b', text: '#fcd34d', glow: 'rgba(245,158,11,0.4)' },
  Neurology: { fill: '#581c87', stroke: '#a855f7', text: '#d8b4fe', glow: 'rgba(168,85,247,0.4)' },
  Gastroenterology: { fill: '#7c2d12', stroke: '#f97316', text: '#fdba74', glow: 'rgba(249,115,22,0.4)' },
  Endocrinology: { fill: '#134e4a', stroke: '#14b8a6', text: '#5eead4', glow: 'rgba(20,184,166,0.4)' },
  InfectiousDisease: { fill: '#4a1d96', stroke: '#8b5cf6', text: '#c4b5fd', glow: 'rgba(139,92,246,0.4)' },
  Hematology: { fill: '#7f1d1d', stroke: '#ef4444', text: '#fca5a5', glow: 'rgba(239,68,68,0.4)' },
  Oncology: { fill: '#831843', stroke: '#ec4899', text: '#f9a8d4', glow: 'rgba(236,72,153,0.4)' },
  default: { fill: '#1e293b', stroke: '#475569', text: '#94a3b8', glow: 'rgba(71,85,105,0.3)' },
};

function getSpecialtyColor(specialty: string) {
  return SPECIALTY_COLORS[specialty] || SPECIALTY_COLORS.default;
}

// ─── Utility: truncate label ──────────────────────────────────────────

function truncateLabel(text: string, maxLen: number = 14): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}

// ─── Helper: guess specialty from node id ─────────────────────────────

const SPECIALTY_KEYWORDS: [string, string][] = [
  ['heart', 'Cardiology'],
  ['cardiac', 'Cardiology'],
  ['hf', 'Cardiology'],
  ['afib', 'Cardiology'],
  ['aortic', 'Cardiology'],
  ['coronary', 'Cardiology'],
  ['copd', 'Respiratory Medicine'],
  ['pulmonary', 'Respiratory Medicine'],
  ['pneumonia', 'Respiratory Medicine'],
  ['asthma', 'Respiratory Medicine'],
  ['respiratory', 'Respiratory Medicine'],
  ['renal', 'Nephrology'],
  ['kidney', 'Nephrology'],
  ['aki', 'Nephrology'],
  ['nephro', 'Nephrology'],
  ['chole', 'General Surgery'],
  ['surgery', 'General Surgery'],
  ['lap', 'General Surgery'],
  ['gall', 'General Surgery'],
  ['biliar', 'General Surgery'],
  ['pancrea', 'Gastroenterology'],
  ['gi', 'Gastroenterology'],
  ['liver', 'Gastroenterology'],
  ['neuro', 'Neurology'],
  ['stroke', 'Neurology'],
  ['seizure', 'Neurology'],
  ['diabetes', 'Endocrinology'],
  ['thyroid', 'Endocrinology'],
  ['endo', 'Endocrinology'],
  ['sepsis', 'InfectiousDisease'],
  ['infect', 'InfectiousDisease'],
  ['anemia', 'Hematology'],
  ['hemato', 'Hematology'],
  ['bleed', 'Hematology'],
  ['cancer', 'Oncology'],
  ['tumor', 'Oncology'],
  ['oncol', 'Oncology'],
];

function guessSpecialty(nodeId: string, centerSpecialty?: string): string {
  const lower = nodeId.toLowerCase();
  for (const [keyword, specialty] of SPECIALTY_KEYWORDS) {
    if (lower.includes(keyword)) return specialty;
  }
  return centerSpecialty || 'default';
}

// ─── Relation Dash Patterns ───────────────────────────────────────────

const RELATION_DASH_PATTERNS: Record<string, string> = {
  continuum: '8,4',
  'via-RAA-system': '6,3,2,3',
  comorbidity: '4,4',
  etiology: '12,4',
  'differential-diagnosis': '2,4',
  'common-trigger': '6,6',
  'perioperative-risk': '8,2,2,2',
  indication: '10,4',
  complication: '4,2',
  cardiorenal: '6,2,2,2,2,2',
  'sepsis-related': '4,6',
  default: '6,4',
};

function getDashPattern(relation: string): string {
  return RELATION_DASH_PATTERNS[relation] || RELATION_DASH_PATTERNS.default;
}

const RELATION_COLORS: Record<string, string> = {
  continuum: '#14b8a6',
  'via-RAA-system': '#f97316',
  comorbidity: '#a855f7',
  etiology: '#f43f5e',
  'differential-diagnosis': '#0ea5e9',
  'common-trigger': '#f59e0b',
  'perioperative-risk': '#ef4444',
  indication: '#10b981',
  complication: '#dc2626',
  cardiorenal: '#f59e0b',
  'sepsis-related': '#8b5cf6',
  default: '#475569',
};

function getRelationColor(relation: string): string {
  return RELATION_COLORS[relation] || RELATION_COLORS.default;
}

// ─── Main Component ───────────────────────────────────────────────────

export function ConnectomeView({ centerNode, links }: ConnectomeViewProps) {
  const { fullscreenView, setFullscreenView } = useNoteToolStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<any>(null);

  const [zoom, setZoom] = useState(1);
  const [editorTool, setEditorTool] = useState<EditorTool>('select');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [linkSource, setLinkSource] = useState<string | null>(null);
  const [localNodes, setLocalNodes] = useState<GraphNode[]>([]);
  const [localLinks, setLocalLinks] = useState<GraphLink[]>([]);
  const [nodeCounter, setNodeCounter] = useState(0);
  const [tooltipInfo, setTooltipInfo] = useState<{
    x: number;
    y: number;
    content: string;
    subContent?: string;
  } | null>(null);

  const isFullscreen = fullscreenView === 'connectome';

  // ─── Build graph data from props ────────────────────────────────────

  const centerSpecialty = useMemo(() => {
    const store = useNoteToolStore.getState();
    const note = store.notes.find((n) => n.id === centerNode);
    return note?.specialty || 'default';
  }, [centerNode]);

  const buildGraphData = useCallback(() => {
    const nodeSet = new Set<string>();
    nodeSet.add(centerNode);
    links.forEach((l) => {
      nodeSet.add(l.target);
    });

    const nodes: GraphNode[] = Array.from(nodeSet).map((id) => ({
      id,
      isCenter: id === centerNode,
      specialty: id === centerNode ? centerSpecialty : guessSpecialty(id, centerSpecialty),
      x: 0,
      y: 0,
      fx: null,
      fy: null,
      vx: 0,
      vy: 0,
    }));

    const graphLinks: GraphLink[] = links.map((l) => ({
      source: centerNode,
      target: l.target,
      relation: l.relation,
      label: l.label,
    }));

    return { nodes, graphLinks };
  }, [centerNode, links, centerSpecialty]);

  // Initialize local data from props
  useEffect(() => {
    const { nodes, graphLinks } = buildGraphData();
    setLocalNodes(nodes);
    setLocalLinks(graphLinks);
    setNodeCounter(nodes.length);
  }, [buildGraphData]);

  // ─── D3 Rendering ───────────────────────────────────────────────────

  const renderGraph = useCallback(async () => {
    if (!svgRef.current || localNodes.length === 0) return;

    const d3 = await import('d3');

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 600;
    const height = svgRef.current.clientHeight || 400;

    // Deep clone nodes/links for d3 simulation
    const simNodes: GraphNode[] = localNodes.map((n) => ({ ...n }));
    const simLinks: GraphLink[] = localLinks.map((l) => ({
      ...l,
      source: typeof l.source === 'object' && 'id' in l.source ? (l.source as GraphNode).id : l.source,
      target: typeof l.target === 'object' && 'id' in l.target ? (l.target as GraphNode).id : l.target,
    }));

    // ─── SVG Defs (filters, markers) ───────────────────────────────
    const defs = svg.append('defs');

    // Glow filter for center node
    const glowFilter = defs.append('filter').attr('id', 'center-glow');
    glowFilter
      .append('feGaussianBlur')
      .attr('stdDeviation', '6')
      .attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Subtle glow for other nodes on hover
    const hoverGlow = defs.append('filter').attr('id', 'hover-glow');
    hoverGlow
      .append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    const feMerge2 = hoverGlow.append('femerge');
    feMerge2.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge2.append('feMergeNode').attr('in', 'SourceGraphic');

    // ─── Root group (for zoom/pan) ─────────────────────────────────
    const g = svg.append('g');

    // Zoom behavior
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior as any);

    // Apply current zoom level
    const currentTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(zoom).translate(-width / 2, -height / 2);
    svg.call(zoomBehavior.transform, currentTransform);

    // ─── Simulation ────────────────────────────────────────────────
    if (layoutMode === 'force') {
      const simulation = d3
        .forceSimulation(simNodes as any)
        .force(
          'link',
          d3
            .forceLink(simLinks as any)
            .id((d: any) => d.id)
            .distance(160)
        )
        .force('charge', d3.forceManyBody().strength(-500))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(55))
        .force('x', d3.forceX(width / 2).strength(0.05))
        .force('y', d3.forceY(height / 2).strength(0.05));

      simulationRef.current = simulation;

      // ─── Render Links (curved paths) ────────────────────────────
      const linkGroup = g.append('g').attr('class', 'links');

      const linkPath = linkGroup
        .selectAll('path')
        .data(simLinks)
        .join('path')
        .attr('fill', 'none')
        .attr('stroke', (d: any) => getRelationColor(d.relation))
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', (d: any) => getDashPattern(d.relation))
        .attr('stroke-opacity', 0.7)
        .attr('cursor', editorTool === 'delete' ? 'pointer' : 'default')
        .on('mouseenter', function (_event: any, d: any) {
          const idx = simLinks.indexOf(d);
          setHoveredLink(idx);
          d3.select(this)
            .attr('stroke-width', 3)
            .attr('stroke-opacity', 1);
        })
        .on('mouseleave', function (_event: any, d: any) {
          setHoveredLink(null);
          d3.select(this)
            .attr('stroke-width', 1.8)
            .attr('stroke-opacity', 0.7);
        })
        .on('click', (_event: any, d: any) => {
          if (editorTool === 'delete') {
            setLocalLinks((prev) => prev.filter((l) => l.label !== d.label));
          }
        });

      // Animated dash offset
      function animateLinks() {
        linkPath
          .attr('stroke-dashoffset', function () {
            const current = parseFloat(d3.select(this).attr('stroke-dashoffset') || '0');
            return current - 0.4;
          });
        requestAnimationFrame(animateLinks);
      }
      animateLinks();

      // ─── Link Labels (on hover) ─────────────────────────────────
      const linkLabelGroup = g.append('g').attr('class', 'link-labels');

      const linkLabel = linkLabelGroup
        .selectAll('g')
        .data(simLinks)
        .join('g')
        .attr('opacity', 0);

      linkLabel
        .append('rect')
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', 'rgba(15,23,42,0.85)')
        .attr('stroke', (d: any) => getRelationColor(d.relation))
        .attr('stroke-width', 1);

      linkLabel
        .append('text')
        .attr('fill', '#e2e8f0')
        .attr('font-size', '10px')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .text((d: any) => d.label || d.relation);

      // ─── Render Nodes ────────────────────────────────────────────
      const nodeGroup = g.append('g').attr('class', 'nodes');

      const node = nodeGroup
        .selectAll('g')
        .data(simNodes)
        .join('g')
        .attr('cursor', editorTool === 'delete' ? 'pointer' : 'grab')
        .call(
          d3
            .drag()
            .on('start', (event: any, d: any) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on('drag', (event: any, d: any) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on('end', (event: any, d: any) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            }) as any
        );

      // Node outer ring (glow ring for center)
      node
        .append('circle')
        .attr('r', (d: any) => (d.isCenter ? 40 : 24))
        .attr('fill', 'none')
        .attr('stroke', (d: any) => {
          const colors = getSpecialtyColor(d.specialty);
          return d.isCenter ? colors.stroke : 'transparent';
        })
        .attr('stroke-width', (d: any) => (d.isCenter ? 2 : 0))
        .attr('stroke-opacity', (d: any) => (d.isCenter ? 0.4 : 0));

      // Node main circle
      node
        .append('circle')
        .attr('r', (d: any) => (d.isCenter ? 32 : 20))
        .attr('fill', (d: any) => {
          const colors = getSpecialtyColor(d.specialty);
          return d.isCenter ? colors.stroke : colors.fill;
        })
        .attr('stroke', (d: any) => getSpecialtyColor(d.specialty).stroke)
        .attr('stroke-width', (d: any) => (d.isCenter ? 3 : 1.5))
        .attr('filter', (d: any) => (d.isCenter ? 'url(#center-glow)' : 'none'))
        .on('mouseenter', function (_event: any, d: any) {
          setHoveredNode(d.id);
          if (!d.isCenter) {
            d3.select(this).attr('filter', 'url(#hover-glow)');
          }
          // Show tooltip
          const [mx, my] = d3.pointer(_event, svgRef.current);
          setTooltipInfo({
            x: mx,
            y: my - 20,
            content: d.id,
            subContent: d.specialty !== 'default' ? d.specialty : undefined,
          });
        })
        .on('mouseleave', function (_event: any, d: any) {
          setHoveredNode(null);
          if (!d.isCenter) {
            d3.select(this).attr('filter', 'none');
          }
          setTooltipInfo(null);
        })
        .on('click', (_event: any, d: any) => {
          if (editorTool === 'delete') {
            setLocalNodes((prev) => prev.filter((n) => n.id !== d.id));
            setLocalLinks((prev) =>
              prev.filter((l) => {
                const srcId = typeof l.source === 'object' && 'id' in l.source ? (l.source as GraphNode).id : l.source;
                const tgtId = typeof l.target === 'object' && 'id' in l.target ? (l.target as GraphNode).id : l.target;
                return srcId !== d.id && tgtId !== d.id;
              })
            );
            return;
          }
          if (editorTool === 'addLink') {
            if (!linkSource) {
              setLinkSource(d.id);
            } else if (linkSource !== d.id) {
              setLocalLinks((prev) => [
                ...prev,
                { source: linkSource, target: d.id, relation: 'related', label: 'New Link' },
              ]);
              setLinkSource(null);
              setEditorTool('select');
            }
          }
        });

      // Node label
      node
        .append('text')
        .attr('dy', (d: any) => (d.isCenter ? 4 : 3))
        .attr('text-anchor', 'middle')
        .attr('fill', (d: any) => getSpecialtyColor(d.specialty).text)
        .attr('font-size', (d: any) => (d.isCenter ? '10px' : '8px'))
        .attr('font-weight', (d: any) => (d.isCenter ? 'bold' : 'normal'))
        .attr('pointer-events', 'none')
        .text((d: any) => truncateLabel(d.id, d.isCenter ? 16 : 12));

      // ─── Tick Handler ────────────────────────────────────────────
      simulation.on('tick', () => {
        linkPath.attr('d', (d: any) => {
          const dx = (d.target.x as number) - (d.source.x as number);
          const dy = (d.target.y as number) - (d.source.y as number);
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

        linkLabel.each(function (d: any) {
          const midX = ((d.source.x as number) + (d.target.x as number)) / 2;
          const midY = ((d.source.y as number) + (d.target.y as number)) / 2;
          const textEl = d3.select(this).select('text');
          const rectEl = d3.select(this).select('rect');
          const bbox = (textEl.node() as SVGTextElement)?.getBBox();
          if (bbox) {
            rectEl
              .attr('x', midX - bbox.width / 2 - 4)
              .attr('y', midY - bbox.height / 2 - 2)
              .attr('width', bbox.width + 8)
              .attr('height', bbox.height + 4);
          }
          textEl.attr('x', midX).attr('y', midY);
        });

        // Show link labels on hover
        linkLabel.attr('opacity', (_d: any, i: number) =>
          hoveredLink === i ? 1 : 0
        );

        node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });
    } else {
      // ─── Radial Layout ─────────────────────────────────────────
      const centerX = width / 2;
      const centerY = height / 2;
      const centerNodeData = simNodes.find((n) => n.isCenter);
      const peripheralNodes = simNodes.filter((n) => !n.isCenter);
      const radius = Math.min(width, height) * 0.35;

      // Position center
      if (centerNodeData) {
        centerNodeData.x = centerX;
        centerNodeData.y = centerY;
      }

      // Position peripheral in circle
      peripheralNodes.forEach((n, i) => {
        const angle = (2 * Math.PI * i) / peripheralNodes.length - Math.PI / 2;
        n.x = centerX + radius * Math.cos(angle);
        n.y = centerY + radius * Math.sin(angle);
      });

      // Resolve links to use positioned nodes
      const resolvedLinks = simLinks.map((l) => {
        const srcId = typeof l.source === 'object' && 'id' in l.source ? (l.source as GraphNode).id : (l.source as string);
        const tgtId = typeof l.target === 'object' && 'id' in l.target ? (l.target as GraphNode).id : (l.target as string);
        const srcNode = simNodes.find((n) => n.id === srcId);
        const tgtNode = simNodes.find((n) => n.id === tgtId);
        return { ...l, source: srcNode || l.source, target: tgtNode || l.target };
      });

      // ─── Render Links (curved) ─────────────────────────────────
      const linkGroup = g.append('g').attr('class', 'links');

      const linkPath = linkGroup
        .selectAll('path')
        .data(resolvedLinks)
        .join('path')
        .attr('fill', 'none')
        .attr('stroke', (d: any) => getRelationColor(d.relation))
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', (d: any) => getDashPattern(d.relation))
        .attr('stroke-opacity', 0.7)
        .on('mouseenter', function (_event: any, d: any) {
          d3.select(this).attr('stroke-width', 3).attr('stroke-opacity', 1);
        })
        .on('mouseleave', function () {
          d3.select(this).attr('stroke-width', 1.8).attr('stroke-opacity', 0.7);
        })
        .on('click', (_event: any, d: any) => {
          if (editorTool === 'delete') {
            setLocalLinks((prev) => prev.filter((l) => l.label !== d.label));
          }
        });

      linkPath.attr('d', (d: any) => {
        const sx = (d.source as GraphNode).x;
        const sy = (d.source as GraphNode).y;
        const tx = (d.target as GraphNode).x;
        const ty = (d.target as GraphNode).y;
        const dx = tx - sx;
        const dy = ty - sy;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
        return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`;
      });

      // Animated dash
      function animateLinks() {
        linkPath.attr('stroke-dashoffset', function () {
          const current = parseFloat(d3.select(this).attr('stroke-dashoffset') || '0');
          return current - 0.4;
        });
        requestAnimationFrame(animateLinks);
      }
      animateLinks();

      // ─── Link Labels on hover ──────────────────────────────────
      const linkLabelGroup = g.append('g').attr('class', 'link-labels');
      const linkLabel = linkLabelGroup
        .selectAll('g')
        .data(resolvedLinks)
        .join('g')
        .attr('opacity', 0);

      linkLabel
        .append('rect')
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', 'rgba(15,23,42,0.85)')
        .attr('stroke', (d: any) => getRelationColor(d.relation))
        .attr('stroke-width', 1);

      linkLabel
        .append('text')
        .attr('fill', '#e2e8f0')
        .attr('font-size', '10px')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .text((d: any) => d.label || d.relation);

      linkLabel.each(function (d: any) {
        const sx = (d.source as GraphNode).x;
        const sy = (d.source as GraphNode).y;
        const tx = (d.target as GraphNode).x;
        const ty = (d.target as GraphNode).y;
        const midX = (sx + tx) / 2;
        const midY = (sy + ty) / 2;
        const textEl = d3.select(this).select('text');
        const rectEl = d3.select(this).select('rect');
        const bbox = (textEl.node() as SVGTextElement)?.getBBox();
        if (bbox) {
          rectEl
            .attr('x', midX - bbox.width / 2 - 4)
            .attr('y', midY - bbox.height / 2 - 2)
            .attr('width', bbox.width + 8)
            .attr('height', bbox.height + 4);
        }
        textEl.attr('x', midX).attr('y', midY);
      });

      // ─── Render Nodes ──────────────────────────────────────────
      const nodeGroup = g.append('g').attr('class', 'nodes');

      const node = nodeGroup
        .selectAll('g')
        .data(simNodes)
        .join('g')
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
        .attr('cursor', editorTool === 'delete' ? 'pointer' : 'grab');

      // Outer glow ring for center
      node
        .append('circle')
        .attr('r', (d: any) => (d.isCenter ? 40 : 0))
        .attr('fill', 'none')
        .attr('stroke', (d: any) => getSpecialtyColor(d.specialty).stroke)
        .attr('stroke-width', (d: any) => (d.isCenter ? 2 : 0))
        .attr('stroke-opacity', (d: any) => (d.isCenter ? 0.4 : 0));

      node
        .append('circle')
        .attr('r', (d: any) => (d.isCenter ? 32 : 20))
        .attr('fill', (d: any) => {
          const colors = getSpecialtyColor(d.specialty);
          return d.isCenter ? colors.stroke : colors.fill;
        })
        .attr('stroke', (d: any) => getSpecialtyColor(d.specialty).stroke)
        .attr('stroke-width', (d: any) => (d.isCenter ? 3 : 1.5))
        .attr('filter', (d: any) => (d.isCenter ? 'url(#center-glow)' : 'none'))
        .on('mouseenter', function (_event: any, d: any) {
          if (!d.isCenter) d3.select(this).attr('filter', 'url(#hover-glow)');
          const [mx, my] = d3.pointer(_event, svgRef.current);
          setTooltipInfo({
            x: mx,
            y: my - 20,
            content: d.id,
            subContent: d.specialty !== 'default' ? d.specialty : undefined,
          });
        })
        .on('mouseleave', function (_event: any, d: any) {
          if (!d.isCenter) d3.select(this).attr('filter', 'none');
          setTooltipInfo(null);
        })
        .on('click', (_event: any, d: any) => {
          if (editorTool === 'delete') {
            setLocalNodes((prev) => prev.filter((n) => n.id !== d.id));
            setLocalLinks((prev) =>
              prev.filter((l) => {
                const srcId = typeof l.source === 'object' && 'id' in l.source ? (l.source as GraphNode).id : l.source;
                const tgtId = typeof l.target === 'object' && 'id' in l.target ? (l.target as GraphNode).id : l.target;
                return srcId !== d.id && tgtId !== d.id;
              })
            );
            return;
          }
          if (editorTool === 'addLink') {
            if (!linkSource) {
              setLinkSource(d.id);
            } else if (linkSource !== d.id) {
              setLocalLinks((prev) => [
                ...prev,
                { source: linkSource, target: d.id, relation: 'related', label: 'New Link' },
              ]);
              setLinkSource(null);
              setEditorTool('select');
            }
          }
        });

      node
        .append('text')
        .attr('dy', (d: any) => (d.isCenter ? 4 : 3))
        .attr('text-anchor', 'middle')
        .attr('fill', (d: any) => getSpecialtyColor(d.specialty).text)
        .attr('font-size', (d: any) => (d.isCenter ? '10px' : '8px'))
        .attr('font-weight', (d: any) => (d.isCenter ? 'bold' : 'normal'))
        .attr('pointer-events', 'none')
        .text((d: any) => truncateLabel(d.id, d.isCenter ? 16 : 12));

      simulationRef.current = null;
    }
  }, [localNodes, localLinks, layoutMode, editorTool, hoveredLink, linkSource, zoom]);

  // Re-render when data or layout changes
  useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  // ─── Handlers ───────────────────────────────────────────────────────

  const handleAddNode = useCallback(() => {
    const newId = `node-${nodeCounter + 1}`;
    setNodeCounter((c) => c + 1);
    setLocalNodes((prev) => [
      ...prev,
      {
        id: newId,
        isCenter: false,
        specialty: guessSpecialty(newId, centerSpecialty),
        x: 0,
        y: 0,
        fx: null,
        fy: null,
        vx: 0,
        vy: 0,
      },
    ]);
  }, [nodeCounter, centerSpecialty]);

  const handleToolChange = useCallback(
    (tool: EditorTool) => {
      setEditorTool((prev) => (prev === tool ? 'select' : tool));
      if (tool !== 'addLink') {
        setLinkSource(null);
      }
    },
    []
  );

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(3, z + 0.2)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(0.3, z - 0.2)), []);
  const handleZoomReset = useCallback(() => setZoom(1), []);

  const handleToggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      setFullscreenView('none');
    } else {
      setFullscreenView('connectome');
    }
  }, [isFullscreen, setFullscreenView]);

  const handleLayoutToggle = useCallback(() => {
    setLayoutMode((prev) => (prev === 'force' ? 'radial' : 'force'));
  }, []);

  // ─── Toolbar buttons config ─────────────────────────────────────────

  const toolButtons = useMemo(
    () => [
      {
        icon: Plus,
        label: 'Add Node',
        tool: 'addNode' as EditorTool,
        active: editorTool === 'addNode',
        onClick: () => {
          handleAddNode();
          setEditorTool('select');
        },
      },
      {
        icon: Link2,
        label: 'Add Link',
        tool: 'addLink' as EditorTool,
        active: editorTool === 'addLink',
        onClick: () => handleToolChange('addLink'),
      },
      {
        icon: Trash2,
        label: 'Delete',
        tool: 'delete' as EditorTool,
        active: editorTool === 'delete',
        onClick: () => handleToolChange('delete'),
      },
    ],
    [editorTool, handleAddNode, handleToolChange]
  );

  // ─── Render ─────────────────────────────────────────────────────────

  const svgHeight = isFullscreen ? '100%' : '400px';
  const svgClass = isFullscreen
    ? 'w-full h-full bg-sb-bg'
    : 'w-full rounded-lg bg-slate-950/50 border border-border/20';

  const content = (
    <div
      ref={containerRef}
      className={`relative ${isFullscreen ? 'h-full w-full' : ''}`}
      style={isFullscreen ? { background: 'var(--color-sb-bg)' } : undefined}
    >
      {/* ─── Header (non-fullscreen) ──────────────────────────── */}
      {!isFullscreen && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-violet-400" />
              <CardTitle className="text-sm font-semibold text-violet-400">
                Medical Connectome
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[10px] border-violet-700/50 text-violet-400"
              >
                Knowledge Graph
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomReset}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-violet-400 hover:text-violet-300"
                onClick={handleToggleFullscreen}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}

      {/* ─── Fullscreen Header ────────────────────────────────── */}
      {isFullscreen && (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-[var(--color-sb-bg)] to-transparent">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-violet-400" />
            <h2 className="text-base font-semibold text-violet-400">
              Medical Connectome
            </h2>
            <Badge
              variant="outline"
              className="text-[10px] border-violet-700/50 text-violet-400"
            >
              {layoutMode === 'force' ? 'Force Layout' : 'Radial Layout'}
            </Badge>
            {editorTool !== 'select' && (
              <Badge className="text-[10px] bg-amber-600/80 text-white border-0">
                {editorTool === 'addLink'
                  ? linkSource
                    ? `Link: select target`
                    : `Link: select source`
                  : editorTool === 'delete'
                    ? 'Delete mode'
                    : editorTool}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-violet-400 hover:text-violet-300 hover:bg-violet-900/30"
            onClick={handleToggleFullscreen}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ─── SVG Canvas ───────────────────────────────────────── */}
      <div className={isFullscreen ? 'h-full w-full' : ''}>
        <svg
          ref={svgRef}
          className={svgClass}
          style={{
            height: svgHeight,
            minHeight: isFullscreen ? '100%' : '400px',
          }}
        />
      </div>

      {/* ─── Tooltip ──────────────────────────────────────────── */}
      {tooltipInfo && (
        <div
          className="absolute z-30 pointer-events-none px-2 py-1 rounded bg-slate-800/95 border border-slate-600/50 shadow-lg"
          style={{
            left: tooltipInfo.x,
            top: tooltipInfo.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-xs text-white font-medium">{tooltipInfo.content}</p>
          {tooltipInfo.subContent && (
            <p className="text-[10px] text-slate-400">{tooltipInfo.subContent}</p>
          )}
        </div>
      )}

      {/* ─── Floating Toolbar ─────────────────────────────────── */}
      <TooltipProvider delayDuration={200}>
        <div
          className={`absolute z-10 flex items-center gap-1 rounded-lg border bg-card/90 backdrop-blur-md shadow-lg px-2 py-1.5 ${
            isFullscreen
              ? 'bottom-4 left-1/2 -translate-x-1/2'
              : 'bottom-3 right-3'
          }`}
        >
          {/* Zoom Controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Zoom Out
            </TooltipContent>
          </Tooltip>

          <span className="text-[10px] text-muted-foreground w-8 text-center select-none">
            {Math.round(zoom * 100)}%
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Zoom In
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomReset}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Reset Zoom
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Editor Tools */}
          {toolButtons.map((btn) => (
            <Tooltip key={btn.label}>
              <TooltipTrigger asChild>
                <Button
                  variant={btn.active ? 'default' : 'ghost'}
                  size="icon"
                  className={`h-7 w-7 ${
                    btn.active
                      ? 'bg-violet-600 hover:bg-violet-700 text-white'
                      : ''
                  }`}
                  onClick={btn.onClick}
                >
                  <btn.icon className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {btn.label}
              </TooltipContent>
            </Tooltip>
          ))}

          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Layout Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={layoutMode === 'radial' ? 'default' : 'ghost'}
                size="icon"
                className={`h-7 w-7 ${
                  layoutMode === 'radial'
                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                    : ''
                }`}
                onClick={handleLayoutToggle}
              >
                {layoutMode === 'force' ? (
                  <CircleDot className="h-3.5 w-3.5" />
                ) : (
                  <LayoutGrid className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {layoutMode === 'force' ? 'Switch to Radial' : 'Switch to Force'}
            </TooltipContent>
          </Tooltip>

          {/* Fullscreen toggle (only in non-fullscreen card) */}
          {!isFullscreen && (
            <>
              <div className="w-px h-5 bg-border mx-0.5" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-violet-400 hover:text-violet-300"
                    onClick={handleToggleFullscreen}
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Fullscreen
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </TooltipProvider>

      {/* ─── Link source indicator ────────────────────────────── */}
      {linkSource && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-600/90 text-white text-xs font-medium shadow-lg">
          <Link2 className="h-3.5 w-3.5" />
          <span>
            Source: <strong>{truncateLabel(linkSource, 20)}</strong> — click target node
          </span>
          <button
            onClick={() => {
              setLinkSource(null);
              setEditorTool('select');
            }}
            className="ml-1 hover:bg-amber-500 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );

  // ─── Fullscreen overlay or card wrapper ─────────────────────────────

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-sb-bg flex flex-col">
        {content}
      </div>
    );
  }

  return (
    <Card className="border-violet-800/30 bg-card/60 backdrop-blur-sm">
      {content}
    </Card>
  );
}
