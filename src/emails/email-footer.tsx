import { Text } from '@react-email/components';
import * as React from 'react';
import { footer } from '@/emails/email-styles';

export function EmailFooter() {
  return (
    <>
      <Text style={footer}>
        Si tienes alguna pregunta, no dudes en contactarnos en soporte@duech.cl
      </Text>

      <Text style={footer}>
        Saludos,
        <br />
        El equipo de DUECh Online
      </Text>
    </>
  );
}
