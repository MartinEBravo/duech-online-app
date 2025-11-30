/**
 * Tests for Alert component.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertVariant } from '@/components/common/alert';

describe('Alert', () => {
  it('renders children as text', () => {
    render(<Alert variant="info">Test message</Alert>);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders children as React nodes', () => {
    render(
      <Alert variant="info">
        <span data-testid="custom-node">Custom content</span>
      </Alert>
    );
    expect(screen.getByTestId('custom-node')).toBeInTheDocument();
  });

  it('wraps string children in paragraph', () => {
    render(<Alert variant="info">Test message</Alert>);
    const text = screen.getByText('Test message');
    expect(text.tagName).toBe('P');
  });

  it('does not wrap non-string children in paragraph', () => {
    render(
      <Alert variant="info">
        <div data-testid="div-child">Content</div>
      </Alert>
    );
    expect(screen.getByTestId('div-child').tagName).toBe('DIV');
  });

  it('applies custom className', () => {
    render(
      <Alert variant="info" className="custom-class">
        Test
      </Alert>
    );
    const alert = screen.getByText('Test').closest('div');
    expect(alert).toHaveClass('custom-class');
  });

  describe('variants', () => {
    const variants: AlertVariant[] = ['error', 'success', 'warning', 'info'];

    variants.forEach((variant) => {
      it(`renders ${variant} variant with correct styling`, () => {
        render(<Alert variant={variant}>Test message</Alert>);
        const alert = screen.getByText('Test message').closest('div');
        expect(alert).toBeInTheDocument();
      });
    });

    it('applies error styles', () => {
      render(<Alert variant="error">Error</Alert>);
      const alert = screen.getByText('Error').closest('div');
      expect(alert).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
    });

    it('applies success styles', () => {
      render(<Alert variant="success">Success</Alert>);
      const alert = screen.getByText('Success').closest('div');
      expect(alert).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
    });

    it('applies warning styles', () => {
      render(<Alert variant="warning">Warning</Alert>);
      const alert = screen.getByText('Warning').closest('div');
      expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
    });

    it('applies info styles', () => {
      render(<Alert variant="info">Info</Alert>);
      const alert = screen.getByText('Info').closest('div');
      expect(alert).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
    });
  });
});
