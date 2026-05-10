'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight } from 'lucide-react';

interface DdxRow {
  feature: string;
  [key: string]: string;
}

interface DDxSplitterProps {
  leftTitle: string;
  rightTitle: string;
  rows: DdxRow[];
}

export function DDxSplitter({ leftTitle, rightTitle, rows }: DDxSplitterProps) {
  const leftKey = leftTitle.split(' ').map(w => w.toLowerCase()).join('');
  const rightKey = rightTitle.split(' ').map(w => w.toLowerCase()).join('');

  return (
    <Card className="border-rose-800/30 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-rose-400" />
          <CardTitle className="text-sm font-semibold text-rose-400">
            Differential Diagnosis Splitter
          </CardTitle>
          <Badge variant="outline" className="text-[10px] border-rose-700/50 text-rose-400">
            Comparison
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border/20">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/40">
                <th className="px-3 py-2 text-left text-muted-foreground font-medium w-[25%] border-b border-border/20">
                  Feature
                </th>
                <th className="px-3 py-2 text-left font-medium border-b border-border/20 text-teal-400 w-[37.5%]">
                  {leftTitle}
                </th>
                <th className="px-3 py-2 text-left font-medium border-b border-border/20 text-rose-400 w-[37.5%]">
                  {rightTitle}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const keys = Object.keys(row).filter(k => k !== 'feature');
                const leftVal = row[keys[0]] || row[leftKey] || '-';
                const rightVal = row[keys[1]] || row[rightKey] || '-';
                return (
                  <tr
                    key={i}
                    className="border-b border-border/10 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-3 py-2 font-medium text-foreground/80">
                      {row.feature}
                    </td>
                    <td className="px-3 py-2 text-foreground/70">
                      {leftVal}
                    </td>
                    <td className="px-3 py-2 text-foreground/70">
                      {rightVal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
