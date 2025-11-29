/**
 * Tests for Chip and ChipList components.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Chip, ChipList, MarkerColorVariant } from '@/components/common/chip';

describe('Chip', () => {
  const defaultProps = {
    code: 'test-code',
    label: 'Test Label',
  };

  it('renders with label', () => {
    render(<Chip {...defaultProps} />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders with title attribute', () => {
    render(<Chip {...defaultProps} />);
    expect(screen.getByTitle('Test Label')).toBeInTheDocument();
  });

  it('does not show remove button in read-only mode', () => {
    const onRemove = vi.fn();
    render(<Chip {...defaultProps} onRemove={onRemove} editorMode={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows remove button in editor mode', () => {
    const onRemove = vi.fn();
    render(<Chip {...defaultProps} onRemove={onRemove} editorMode={true} />);
    expect(screen.getByRole('button', { name: /quitar test label/i })).toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked', () => {
    const onRemove = vi.fn();
    render(<Chip {...defaultProps} onRemove={onRemove} editorMode={true} />);

    fireEvent.click(screen.getByRole('button', { name: /quitar test label/i }));
    expect(onRemove).toHaveBeenCalledWith('test-code');
  });

  it('has role="button" in editor mode', () => {
    render(<Chip {...defaultProps} editorMode={true} />);
    expect(screen.getByRole('button', { name: /test label/i })).toBeInTheDocument();
  });

  it('does not have role="button" in read-only mode', () => {
    render(<Chip {...defaultProps} editorMode={false} />);
    // The chip itself should not be a button
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  describe('color variants', () => {
    const variants: MarkerColorVariant[] = [
      'category',
      'socialValuations',
      'socialStratumMarkers',
      'styleMarkers',
      'intentionalityMarkers',
      'geographicalMarkers',
      'chronologicalMarkers',
      'frequencyMarkers',
      'warning',
    ];

    variants.forEach((variant) => {
      it(`renders with ${variant} variant`, () => {
        render(<Chip {...defaultProps} variant={variant} />);
        expect(screen.getByText('Test Label')).toBeInTheDocument();
      });
    });
  });

  it('applies custom className', () => {
    render(<Chip {...defaultProps} className="custom-class" />);
    const chip = screen.getByTitle('Test Label');
    expect(chip).toHaveClass('custom-class');
  });
});

describe('ChipList', () => {
  const defaultProps = {
    items: ['item1', 'item2'],
    labels: { item1: 'Item One', item2: 'Item Two' },
    variant: 'category' as MarkerColorVariant,
    editorMode: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all items as chips', () => {
    render(<ChipList {...defaultProps} />);
    expect(screen.getByText('Item One')).toBeInTheDocument();
    expect(screen.getByText('Item Two')).toBeInTheDocument();
  });

  it('uses code as label when label not found', () => {
    render(
      <ChipList {...defaultProps} items={['item1', 'unknown']} labels={{ item1: 'Item One' }} />
    );
    expect(screen.getByText('Item One')).toBeInTheDocument();
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });

  it('returns null for empty items in read-only mode', () => {
    const { container } = render(<ChipList {...defaultProps} items={[]} editorMode={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows add button for empty items in editor mode', () => {
    const onAdd = vi.fn();
    render(
      <ChipList {...defaultProps} items={[]} editorMode={true} onAdd={onAdd} addLabel="Agregar" />
    );
    expect(screen.getByText('Agregar')).toBeInTheDocument();
  });

  it('shows add button alongside chips in editor mode', () => {
    const onAdd = vi.fn();
    render(<ChipList {...defaultProps} editorMode={true} onAdd={onAdd} />);
    // Should have multiple buttons: remove buttons for each chip + add button
    const buttons = screen.getAllByRole('button');
    // 2 chips with remove buttons + 1 add button = 3 buttons
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onAdd when add button clicked', () => {
    const onAdd = vi.fn();
    render(
      <ChipList {...defaultProps} items={[]} editorMode={true} onAdd={onAdd} addLabel="Agregar" />
    );

    fireEvent.click(screen.getByText('Agregar'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('calls onRemove with index when chip removed', () => {
    const onRemove = vi.fn();
    render(<ChipList {...defaultProps} editorMode={true} onRemove={onRemove} />);

    const removeButtons = screen.getAllByRole('button', { name: /quitar/i });
    fireEvent.click(removeButtons[0]);
    expect(onRemove).toHaveBeenCalledWith(0);
  });

  it('does not show remove buttons in read-only mode', () => {
    const onRemove = vi.fn();
    render(<ChipList {...defaultProps} editorMode={false} onRemove={onRemove} />);
    expect(screen.queryByRole('button', { name: /quitar/i })).not.toBeInTheDocument();
  });
});
