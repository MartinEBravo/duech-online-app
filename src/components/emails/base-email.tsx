import { Body, Container, Head, Heading, Html, Preview, Tailwind } from '@react-email/components';
import * as React from 'react';
import { EmailFooter } from '@/components/emails/email-footer';

interface BaseEmailProps {
  preview: string;
  title: string;
  children: React.ReactNode;
  showFooter?: boolean;
}

/**
 * Base email template with common structure
 * All emails should extend this component to maintain consistency
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
