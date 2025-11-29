/**
 * Tests for Pagination component.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/search/pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: vi.fn(),
    hasNext: true,
    hasPrev: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when totalPages is 1', () => {
    const { container } = render(<Pagination {...defaultProps} totalPages={1} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when totalPages is 0', () => {
    const { container } = render(<Pagination {...defaultProps} totalPages={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders previous and next buttons', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByRole('button', { name: /página anterior/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /página siguiente/i })).toBeInTheDocument();
  });

  it('disables previous button when hasPrev is false', () => {
    render(<Pagination {...defaultProps} hasPrev={false} />);
    expect(screen.getByRole('button', { name: /página anterior/i })).toBeDisabled();
  });

  it('disables next button when hasNext is false', () => {
    render(<Pagination {...defaultProps} hasNext={false} />);
    expect(screen.getByRole('button', { name: /página siguiente/i })).toBeDisabled();
  });

  it('enables previous button when hasPrev is true', () => {
    render(<Pagination {...defaultProps} hasPrev={true} currentPage={5} />);
    expect(screen.getByRole('button', { name: /página anterior/i })).not.toBeDisabled();
  });

  it('calls onPageChange with previous page when previous clicked', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination {...defaultProps} currentPage={5} hasPrev={true} onPageChange={onPageChange} />
    );

    fireEvent.click(screen.getByRole('button', { name: /página anterior/i }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('calls onPageChange with next page when next clicked', () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: /página siguiente/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when page number clicked', () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} onPageChange={onPageChange} />);

    // Page 2 is visible when currentPage=1
    fireEvent.click(screen.getByRole('button', { name: 'Página 2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('highlights current page', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    const currentPageButton = screen.getByRole('button', { name: /página 3/i });
    expect(currentPageButton).toHaveAttribute('aria-current', 'page');
  });

  it('does not highlight non-current pages', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    // Page 4 is visible when currentPage=3
    const otherPageButton = screen.getByRole('button', { name: 'Página 4' });
    expect(otherPageButton).not.toHaveAttribute('aria-current');
  });

  describe('page number display', () => {
    it('shows all pages when totalPages <= 7', () => {
      render(<Pagination {...defaultProps} totalPages={5} />);
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByRole('button', { name: `Página ${i}` })).toBeInTheDocument();
      }
    });

    it('shows ellipsis when current page is far from start', () => {
      render(<Pagination {...defaultProps} currentPage={6} totalPages={10} />);
      expect(screen.getAllByText('...')).toHaveLength(2);
    });

    it('shows first page always', () => {
      render(<Pagination {...defaultProps} currentPage={8} totalPages={10} />);
      // Use exact name to avoid matching "Página 10"
      expect(screen.getByRole('button', { name: 'Página 1' })).toBeInTheDocument();
    });

    it('shows last page always', () => {
      render(<Pagination {...defaultProps} currentPage={3} totalPages={10} />);
      expect(screen.getByRole('button', { name: /página 10/i })).toBeInTheDocument();
    });

    it('shows pages around current page', () => {
      render(<Pagination {...defaultProps} currentPage={5} totalPages={10} />);
      expect(screen.getByRole('button', { name: 'Página 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Página 5' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Página 6' })).toBeInTheDocument();
    });
  });
});
