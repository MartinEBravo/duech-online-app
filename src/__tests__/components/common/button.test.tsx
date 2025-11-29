/**
 * Tests for Button component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/common/button';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
    'aria-disabled': ariaDisabled,
    tabIndex,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    'aria-disabled'?: boolean;
    tabIndex?: number;
  }) => (
    <a href={href} className={className} aria-disabled={ariaDisabled} tabIndex={tabIndex}>
      {children}
    </a>
  ),
}));

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is disabled when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not call onClick when disabled', () => {
      const onClick = vi.fn();
      render(
        <Button disabled onClick={onClick}>
          Disabled
        </Button>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      // The SpinnerIcon should be rendered
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('still shows children when loading', () => {
      render(<Button loading>Loading text</Button>);
      expect(screen.getByText('Loading text')).toBeInTheDocument();
    });
  });

  describe('link mode', () => {
    it('renders as link when href provided', () => {
      render(<Button href="/page">Go to page</Button>);
      expect(screen.getByRole('link')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('sets correct href', () => {
      render(<Button href="/page">Go to page</Button>);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/page');
    });

    it('shows spinner when loading in link mode', () => {
      render(
        <Button href="/page" loading>
          Loading link
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link.querySelector('svg')).toBeInTheDocument();
    });

    it('sets aria-disabled when loading in link mode', () => {
      render(
        <Button href="/page" loading>
          Loading link
        </Button>
      );
      expect(screen.getByRole('link')).toHaveAttribute('aria-disabled', 'true');
    });

    it('sets tabIndex to -1 when loading in link mode', () => {
      render(
        <Button href="/page" loading>
          Loading link
        </Button>
      );
      expect(screen.getByRole('link')).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('styling', () => {
    it('applies default background when no bg class provided', () => {
      render(<Button>Default</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-duech-blue');
    });

    it('does not apply default styles when custom bg provided', () => {
      render(<Button className="bg-red-500 text-white">Custom</Button>);
      expect(screen.getByRole('button')).not.toHaveClass('bg-duech-blue');
    });

    it('passes through other button attributes', () => {
      render(
        <Button type="submit" name="submit-btn">
          Submit
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submit-btn');
    });
  });
});
