import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { main, container, heading as baseHeading, paragraph, footer } from '@/emails/email-styles';

interface PasswordChangedEmailProps {
  username: string;
}

const PasswordChangedEmail = ({ username }: PasswordChangedEmailProps) => (
  <Html>
    <Head />
    <Preview>Tu contraseña ha sido actualizada exitosamente</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Contraseña actualizada</Heading>

        <Section style={iconSection}>
          <Text style={icon}>✓</Text>
        </Section>

        <Text style={paragraph}>Hola {username},</Text>

        <Text style={paragraph}>
          Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva
          contraseña.
        </Text>

        <Section style={infoBox}>
          <Text style={infoText}>
            <strong>Fecha:</strong>{' '}
            {new Date().toLocaleString('es-CL', {
              timeZone: 'America/Santiago',
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </Text>
        </Section>

        <Text style={securityText}>
          Si no realizaste este cambio, por favor contacta inmediatamente a nuestro equipo de
          soporte en <strong>soporte@duech.cl</strong>
        </Text>

        <Text style={footer}>
          Saludos,
          <br />
          El equipo de DUECh Online
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordChangedEmail;

const heading = {
  ...baseHeading,
  padding: '5% 0 3%',
};

const iconSection = {
  textAlign: 'center' as const,
  margin: '0 0 4%',
};

const icon = {
  fontSize: 'clamp(36px, 8vw, 48px)',
  color: '#10b981',
  margin: '0',
};

const infoBox = {
  backgroundColor: '#f4f4f4',
  borderRadius: '8px',
  padding: '3%',
  margin: '4% 5%',
  border: '1px solid #e5e7eb',
  maxWidth: '90%',
  boxSizing: 'border-box' as const,
};

const infoText = {
  fontSize: 'clamp(12px, 2vw, 14px)',
  color: '#666666',
  margin: '0',
  lineHeight: '1.6',
};

const securityText = {
  fontSize: 'clamp(12px, 2vw, 14px)',
  color: '#dc2626',
  padding: '3% 5%',
  marginTop: '4%',
  backgroundColor: '#fef2f2',
  marginLeft: '5%',
  marginRight: '5%',
  borderRadius: '8px',
  border: '1px solid #fecaca',
  lineHeight: '1.6',
  maxWidth: '90%',
  boxSizing: 'border-box' as const,
};
