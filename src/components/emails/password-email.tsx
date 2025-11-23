import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from '@/components/emails/base-email';

export type PasswordEmailVariant = 'welcome' | 'reset' | 'changed';

export interface PasswordEmailParagraph {
  text: string;
  className?: string;
}

export interface PasswordEmailProps {
  username: string;
  variant: PasswordEmailVariant;
  paragraphs: PasswordEmailParagraph[];
  buttonText?: string;
  buttonLink?: string;
  showInfoBox?: boolean;
  infoBoxContent?: React.ReactNode;
  alertContent?: React.ReactNode;
}

const variantConfig = {
  welcome: {
    preview: 'Bienvenido a DUECh Online - Tu cuenta ha sido creada',
    title: 'Bienvenido a DUECh Online',
  },
  reset: {
    preview: 'Restablece tu contraseña de DUECh Online',
    title: 'Restablecer contraseña',
  },
  changed: {
    preview: 'Tu contraseña ha sido actualizada exitosamente',
    title: 'Contraseña actualizada',
  },
};

/**
 * Generic password-related email template
 * Supports welcome, reset, and changed password emails with customizable content
 */
export function PasswordEmail({
  username,
  variant,
  paragraphs,
  buttonText,
  buttonLink,
  showInfoBox,
  infoBoxContent,
  alertContent,
}: PasswordEmailProps) {
  const config = variantConfig[variant];

  return (
    <BaseEmail preview={config.preview} title={config.title}>
      {/* Success icon for "changed" variant */}
      {variant === 'changed' && (
        <Section className="mb-[4%] text-center">
          <Text className="m-0 text-4xl text-green-500 lg:text-5xl">✓</Text>
        </Section>
      )}

      {/* Greeting */}
      <Text className="mb-[3%] px-[5%] text-base leading-relaxed text-gray-800">
        Hola {username},
      </Text>

      {/* Custom paragraphs */}
      {paragraphs.map((paragraph, index) => (
        <Text
          key={index}
          className={
            paragraph.className || 'mb-[3%] px-[5%] text-base leading-relaxed text-gray-800'
          }
        >
          {paragraph.text}
        </Text>
      ))}

      {/* Button section */}
      {buttonText && buttonLink && (
        <>
          <Section className="my-[5%] text-center">
            <Button
              className="inline-block max-w-[90%] rounded-lg bg-blue-600 px-[8%] py-[3%] text-center text-base font-semibold text-white no-underline"
              href={buttonLink}
            >
              {buttonText}
            </Button>
          </Section>

          <Text className="mb-[3%] px-[5%] text-base leading-relaxed text-gray-800">
            O copia y pega este enlace en tu navegador:
          </Text>

          <Text className="mx-auto mb-[4%] block max-w-[90%] px-[5%] text-sm break-all text-blue-600">
            {buttonLink}
          </Text>
        </>
      )}

      {/* Info box */}
      {showInfoBox && infoBoxContent && (
        <Section className="mx-[5%] my-[4%] max-w-[90%] rounded-lg border border-gray-200 bg-gray-100 p-[3%]">
          {infoBoxContent}
        </Section>
      )}

      {/* Alert/Warning box */}
      {alertContent && (
        <Section className="mx-[5%] mt-[4%] max-w-[90%] rounded-lg border border-gray-200 bg-gray-50 px-[5%] py-[3%] text-sm leading-relaxed text-gray-600">
          {alertContent}
        </Section>
      )}
    </BaseEmail>
  );
}
