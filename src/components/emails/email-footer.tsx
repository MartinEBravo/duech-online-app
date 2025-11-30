/**
 * Email footer component.
 *
 * Standard footer with contact information and team signature.
 *
 * @module components/emails/email-footer
 */

import { Text, Tailwind } from '@react-email/components';
import * as React from 'react';

/**
 * Standard email footer with contact info and signature.
 *
 * @example
 * ```tsx
 * <EmailFooter />
 * ```
 */
export function EmailFooter() {
  return (
    <Tailwind>
      <Text className="mt-[5%] px-[5%] text-sm leading-relaxed text-gray-600">
        Si tienes alguna pregunta, no dudes en contactarnos en soporte@duech.cl
      </Text>

      <Text className="px-[5%] text-sm leading-relaxed text-gray-600">
        Saludos,
        <br />
        El equipo de DUECh en línea
      </Text>
    </Tailwind>
  );
}
