/**
 * Tests for WordCard component.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WordCard } from '@/components/search/word-card';

// Use vi.hoisted for mock function shared across tests
const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(() => '/'),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe('WordCard', () => {
  const defaultProps = {
    lemma: 'chilenismo',
    letter: 'c',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
  });

  describe('Public mode', () => {
    it('renders lemma text', () => {
      render(<WordCard {...defaultProps} />);
      expect(screen.getByText('chilenismo')).toBeInTheDocument();
    });

    it('renders as a link to word page', () => {
      render(<WordCard {...defaultProps} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/palabra/chilenismo');
    });

    it('encodes special characters in URL', () => {
      render(<WordCard {...defaultProps} lemma="niño" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/palabra/ni%C3%B1o');
    });

    it('applies custom className', () => {
      render(<WordCard {...defaultProps} className="custom-class" />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-class');
    });

    it('applies dictionary color background', () => {
      render(<WordCard {...defaultProps} dictionary="DUECh" />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('bg-amber-50');
    });
  });

  describe('Editor mode', () => {
    const editorProps = {
      ...defaultProps,
      editorMode: true,
      status: 'draft',
      definitionsCount: 3,
      currentUserId: 1,
      currentUserRole: 'admin',
    };

    it('renders lemma text', () => {
      render(<WordCard {...editorProps} />);
      expect(screen.getByText('chilenismo')).toBeInTheDocument();
    });

    it('shows letter badge', () => {
      render(<WordCard {...editorProps} />);
      expect(screen.getByText('Letra C')).toBeInTheDocument();
    });

    it('shows dictionary badge when not duech', () => {
      render(<WordCard {...editorProps} dictionary="Academia" />);
      expect(screen.getByText('Academia')).toBeInTheDocument();
    });

    it('does not show dictionary badge for duech', () => {
      render(<WordCard {...editorProps} dictionary="duech" />);
      expect(screen.queryByText('duech')).not.toBeInTheDocument();
    });

    it('shows definitions count', () => {
      render(<WordCard {...editorProps} definitionsCount={3} />);
      expect(screen.getByText(/3 definiciones/)).toBeInTheDocument();
    });

    it('shows singular definition text for 1 definition', () => {
      render(<WordCard {...editorProps} definitionsCount={1} />);
      expect(screen.getByText(/1 definición/)).toBeInTheDocument();
    });

    it('shows status label', () => {
      render(<WordCard {...editorProps} status="imported" />);
      expect(screen.getByText('Importado')).toBeInTheDocument();
    });

    it('shows Edit button for admin', () => {
      render(<WordCard {...editorProps} currentUserRole="admin" />);
      expect(screen.getByText('Editar')).toBeInTheDocument();
    });

    it('shows Edit button for superadmin', () => {
      render(<WordCard {...editorProps} currentUserRole="superadmin" />);
      expect(screen.getByText('Editar')).toBeInTheDocument();
    });

    it('shows Comentar button for non-privileged user without assignment', () => {
      render(
        <WordCard
          {...editorProps}
          currentUserRole="lexicographer"
          currentUserId={5}
          assignedTo={null}
          createdBy={1}
        />
      );
      expect(screen.getByText('Comentar')).toBeInTheDocument();
    });

    it('shows Edit button for assigned user', () => {
      render(
        <WordCard
          {...editorProps}
          currentUserRole="lexicographer"
          currentUserId={5}
          assignedTo={5}
        />
      );
      expect(screen.getByText('Editar')).toBeInTheDocument();
    });

    it('shows Edit button for creator when assigned', () => {
      render(
        <WordCard
          {...editorProps}
          currentUserRole="lexicographer"
          currentUserId={5}
          createdBy={5}
          assignedTo={5}
        />
      );
      expect(screen.getByText('Editar')).toBeInTheDocument();
    });

    it('shows Ver button when published', () => {
      render(<WordCard {...editorProps} status="published" />);
      expect(screen.getByText('Ver')).toBeInTheDocument();
    });

    it('does not show Ver button when not published', () => {
      render(<WordCard {...editorProps} status="draft" />);
      expect(screen.queryByText('Ver')).not.toBeInTheDocument();
    });

    describe('status colors', () => {
      const statuses = [
        { status: 'imported', label: 'Importado' },
        { status: 'included', label: 'Incorporado' },
        { status: 'preredacted', label: 'Prerredactada' },
        { status: 'redacted', label: 'Redactado' },
        { status: 'reviewedLex', label: 'Revisado por lexicógrafos' },
        { status: 'reviewed', label: 'Revisado por comisión' },
        { status: 'published', label: 'Publicado' },
      ];

      statuses.forEach(({ status, label }) => {
        it(`shows correct label for ${status} status`, () => {
          render(<WordCard {...editorProps} status={status} />);
          expect(screen.getByText(label)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Editor path mode', () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue('/editor/search');
    });

    it('uses editor base path in URLs', () => {
      render(
        <WordCard {...defaultProps} editorMode={true} status="draft" currentUserRole="admin" />
      );
      const editLink = screen.getByRole('link', { name: /editar/i });
      expect(editLink).toHaveAttribute('href', '/editor/palabra/chilenismo');
    });
  });
});
