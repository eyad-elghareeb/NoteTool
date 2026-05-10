'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TabData {
  tabs: { id: string; label: string; content: string }[];
}

interface NoteTabsProps {
  data: TabData;
}

export function NoteTabs({ data }: NoteTabsProps) {
  const [activeTab, setActiveTab] = useState(data.tabs[0]?.id || '');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="bg-muted/40 border border-border/30 h-9 p-0.5">
        {data.tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="text-xs data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {data.tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-4 outline-none">
          <MarkdownRenderer content={tab.content} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
