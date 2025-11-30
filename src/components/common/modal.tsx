/**
 * Modal dialog component with backdrop.
 *
 * Provides a centered modal overlay with click-outside-to-close functionality.
 *
 * @module components/common/modal
 */

'use client';

import React from 'react';

/**
 * Props for the Modal component.
 */
export interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when modal should close (backdrop click) */
  onClose?: () => void;
  /** Modal content */
  children: React.ReactNode;
  /** Additional CSS classes for the modal container */
  className?: string;
}

/**
 * Modal dialog with backdrop overlay.
 *
 * Renders children in a centered container with a semi-transparent backdrop.
 * Clicking the backdrop triggers the onClose callback.
 *
 * @example
 * ```tsx
 * <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
 *   <div className="p-6">Modal content here</div>
 * </Modal>
 * ```
 */
export function Modal({ isOpen, onClose, children, className = '' }: ModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className={`rounded-lg bg-white shadow-xl ${className}`}>{children}</div>
    </div>
  );
}
