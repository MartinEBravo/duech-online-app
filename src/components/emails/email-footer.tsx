import { Text, Tailwind } from '@react-email/components';
import * as React from 'react';

export function EmailFooter() {
  return (
    <Tailwind>
      <Text className="mt-[5%] px-[5%] text-sm leading-relaxed text-gray-600">
        Si tienes alguna pregunta, no dudes en contactarnos en soporte@duech.cl
      </Text>

      <Text className="px-[5%] text-sm leading-relaxed text-gray-600">
        Saludos,
        <br />
        El equipo de DUECh Online
      </Text>
    </Tailwind>
  );
}
