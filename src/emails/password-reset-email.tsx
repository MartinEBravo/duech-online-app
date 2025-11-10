import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import {
  main,
  container,
  heading,
  paragraph,
  buttonContainer,
  button,
  linkText,
} from '@/emails/email-styles';
import { EmailFooter } from '@/emails/email-footer';

interface PasswordResetEmailProps {
  username: string;
  resetLink: string;
}

const PasswordResetEmail = ({ username, resetLink }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Restablece tu contraseña de DUECh Online</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Restablecer contraseña</Heading>

        <Text style={paragraph}>Hola {username},</Text>

        <Text style={paragraph}>
          Hemos recibido una solicitud para restablecer tu contraseña en DUECh Online.
        </Text>

        <Text style={paragraph}>
          Haz clic en el botón de abajo para establecer una nueva contraseña:
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={resetLink}>
            Restablecer contraseña
          </Button>
        </Section>

        <Text style={paragraph}>O copia y pega este enlace en tu navegador:</Text>

        <Text style={linkText}>{resetLink}</Text>

        <Text style={warningText}>
          Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
        </Text>

        <EmailFooter />
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

const warningText = {
  fontSize: 'clamp(12px, 2vw, 14px)',
  color: '#666666',
  padding: '3% 5%',
  marginTop: '4%',
  backgroundColor: '#f9fafb',
  marginLeft: '5%',
  marginRight: '5%',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  lineHeight: '1.6',
  maxWidth: '90%',
  boxSizing: 'border-box' as const,
};
