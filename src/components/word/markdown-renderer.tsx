/**
 * Markdown renderer for word content.
 *
 * This component provides consistent markdown rendering for word definitions
 * and examples throughout the dictionary application. It uses ReactMarkdown
 * with custom component mappings to apply the application's styling.
 *
 * ## Supported Markdown
 * - **Bold text**: `**text**` or `__text__`
 * - *Italic text*: `*text*` or `_text_`
 * - ***Bold and italic***: `***text***`
 *
 * ## Custom Styling
 * - Bold: Blue color (duech-blue) with font-bold
 * - Italic: Gray color (gray-800) with italic style
 * - Paragraphs: Rendered as inline spans (not block elements)
 *
 * ## Use Cases
 * - Word definitions with emphasized terms
 * - Examples with highlighted usage
 * - Any text content that needs markdown formatting
 *
 * @module components/word/markdown-renderer
 * @see {@link MarkdownRenderer} - The main exported component (default export)
 * @see {@link MarkdownRendererProps} - Props interface
 */

'use client';

import ReactMarkdown from 'react-markdown';

/**
 * Props for the MarkdownRenderer component.
 *
 * @interface MarkdownRendererProps
 */
export interface MarkdownRendererProps {
  /**
   * The markdown content string to render.
   * Supports basic markdown syntax: bold, italic, combined.
   * @type {string}
   */
  content: string;

  /**
   * Additional CSS classes to apply to formatted elements.
   * @type {string}
   */
  className?: string;
}

/**
 * Renders markdown content with custom dictionary styling.
 *
 * Uses ReactMarkdown with custom component mappings to render
 * markdown text inline with the application's design system.
 * Paragraphs are rendered as spans to allow inline usage within
 * other text elements.
 *
 * @function MarkdownRenderer
 * @param {MarkdownRendererProps} props - Component props
 * @param {string} props.content - Markdown content to render
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Rendered markdown content
 *
 * @example
 * // Basic usage
 * <MarkdownRenderer content="A **bold** word" />
 *
 * @example
 * // Italic text
 * <MarkdownRenderer content="An *italic* phrase" />
 *
 * @example
 * // Combined formatting
 * <MarkdownRenderer content="Both ***bold and italic***" />
 *
 * @example
 * // With additional classes
 * <MarkdownRenderer
 *   content="The word **chilenismo** means..."
 *   className="text-lg"
 * />
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
