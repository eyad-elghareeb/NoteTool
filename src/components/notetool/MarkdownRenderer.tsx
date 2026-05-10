'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { MermaidDiagram } from './MermaidDiagram';
import { MCQBlock } from './MCQBlock';
import { FlashcardBlock } from './FlashcardBlock';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn(
      "prose prose-sm sm:prose-base prose-invert max-w-none",
      // Table styling — borders, padding, and header backgrounds
      "prose-table:border prose-table:border-sb-border prose-table:rounded-lg prose-table:overflow-hidden",
      "prose-th:bg-sb-surface2 prose-th:p-2 prose-th:text-sb-text prose-th:font-semibold prose-th:text-xs prose-th:uppercase prose-th:tracking-wider",
      "prose-td:p-2 prose-td:border prose-td:border-sb-border prose-td:text-sb-text",
      "prose-tr:border-b prose-tr:border-sb-border",
      "prose-thead:border-b-2 prose-thead:border-sb-accent/40",
      className
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            
            if (!inline && lang === 'mermaid') {
              return (
                <div className="my-6">
                  <MermaidDiagram 
                    id={`mermaid-${Math.random().toString(36).substr(2, 9)}`}
                    title="Diagram"
                    code={String(children).replace(/\n$/, '')}
                  />
                </div>
              );
            }
            
            if (!inline && lang === 'mcq') {
              try {
                const data = JSON.parse(String(children));
                return <MCQBlock data={data} mode="read" />;
              } catch (e) {
                return <pre className={className} {...props}>{children}</pre>;
              }
            }

            return inline ? (
              <code className={cn("bg-sb-surface2 px-1.5 py-0.5 rounded text-sb-accent font-mono text-[0.9em]", className)} {...props}>
                {children}
              </code>
            ) : (
              <pre className={cn("bg-sb-surface2 p-4 rounded-xl border border-sb-border overflow-x-auto", className)} {...props}>
                <code className={className}>{children}</code>
              </pre>
            );
          },
          // You can add more custom components here (e.g. for special tags)
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
