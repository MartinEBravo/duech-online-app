/**
 * Markdown renderer for word content.
 *
 * Renders markdown text with styled emphasis (bold, italic)
 * using Tailwind CSS classes.
 *
 * @module components/word/markdown-renderer
 */

'use client';

import ReactMarkdown from 'react-markdown';

/**
 * Props for the MarkdownRenderer component.
 */
export interface MarkdownRendererProps {
  /** Markdown content to render */
  content: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Renders markdown content with custom styling.
 *
 * Supports bold (**text**), italic (*text*), and combined formatting.
 * Renders paragraphs as inline spans for use in flowing text.
 *
 * @example
 * ```tsx
 * <MarkdownRenderer content="A **bold** and *italic* word" />
 * ```
 */
export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      components={{
        // Custom rendering for markdown elements with Tailwind CSS classes
        strong: ({ children }) => (
          <strong className={`text-duech-blue font-bold ${className}`}>{children}</strong>
        ), // Bold text
        em: ({ children }) => <em className={`text-gray-800 italic ${className}`}>{children}</em>, // Italic text
        p: ({ children }) => <span className={`inline ${className}`}>{children}</span>, // Inline paragraph
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
