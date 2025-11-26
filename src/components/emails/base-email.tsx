/**
 * Base email template component.
 *
 * Provides common structure for all email templates including
 * Tailwind styling, preview text, and optional footer.
 *
 * @module components/emails/base-email
 */

import { Body, Container, Head, Heading, Html, Preview, Tailwind } from '@react-email/components';
import * as React from 'react';
import { EmailFooter } from '@/components/emails/email-footer';

/**
 * Props for the BaseEmail component.
 */
export interface BaseEmailProps {
  /** Preview text shown in email clients */
  preview: string;
  /** Email heading/title */
  title: string;
  /** Email body content */
  children: React.ReactNode;
  /** Whether to show the standard footer (default: true) */
  showFooter?: boolean;
}

/**
 * Base email template with common structure.
 *
 * All emails should use this component for consistency.
 * Includes Tailwind CSS, preview text, title, and footer.
 *
 * @example
 * ```tsx
 * <BaseEmail preview="Welcome!" title="Hello">
 *   <Text>Email content here</Text>
 * </BaseEmail>
 * ```
 */
export function BaseEmail({ preview, title, children, showFooter = true }: BaseEmailProps) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>{preview}</Preview>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto mb-16 w-full max-w-[600px] bg-white p-5 pb-12">
            <Heading className="py-[5%] text-center text-2xl leading-tight font-bold text-blue-600 lg:text-3xl">
              {title}
            </Heading>

            {children}

            {showFooter && <EmailFooter />}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
