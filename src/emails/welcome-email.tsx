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

interface WelcomeEmailProps {
  username: string;
  resetLink: string;
}

const WelcomeEmail = ({ username, resetLink }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Bienvenido a DUECh Online - Tu cuenta ha sido creada</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Bienvenido a DUECh Online</Heading>

        <Text style={paragraph}>Hola {username},</Text>

        <Text style={paragraph}>
          Tu cuenta en el Diccionario de Uso del Español de Chile (DUECh) ha sido creada
          exitosamente.
        </Text>

        <Text style={paragraph}>
          Para comenzar a usar tu cuenta, necesitas establecer tu contraseña. Haz clic en el botón
          de abajo para crear tu contraseña:
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={resetLink}>
            Establecer mi contraseña
          </Button>
        </Section>

        <Text style={paragraph}>O copia y pega este enlace en tu navegador:</Text>

        <Text style={linkText}>{resetLink}</Text>

        <EmailFooter />
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;
