import { Resend } from 'resend';
import { render } from '@react-email/components';
import WelcomeEmail from '@/emails/welcome-email';
import PasswordChangedEmail from '@/emails/password-changed-email';
import PasswordResetEmail from '@/emails/password-reset-email';

const FROM_EMAIL = 'soporte@duech.cl';

/**
 * Lazily initialize Resend to avoid build-time errors when env vars aren't available
 */
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

/**
 * Generic email sending function to reduce duplication
 */
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  logPrefix: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: htmlContent,
    });

    if (result.error) {
      console.error(`Error sending ${logPrefix}:`, result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error(`Failed to send ${logPrefix}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sends a welcome email to a newly created user with a link to set their password.
 */
export async function sendWelcomeEmail(
  email: string,
  username: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  const editorHost = process.env.HOST_URL || 'editor.localhost:3000';
  const resetLink = `http://${editorHost}/cambiar-contrasena?token=${resetToken}`;

  const emailHtml = await render(
    WelcomeEmail({
      username,
      resetLink,
    })
  );

  return sendEmail(email, 'Bienvenido a DUECh Online', emailHtml, 'welcome email');
}

/**
 * Sends a confirmation email after a user successfully changes their password.
 */
export async function sendPasswordChangeConfirmation(
  email: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  const emailHtml = await render(
    PasswordChangedEmail({
      username,
    })
  );

  return sendEmail(
    email,
    'Tu contraseña ha sido actualizada',
    emailHtml,
    'password change confirmation'
  );
}

/**
 * Sends a password reset email when an admin resets a user's password.
 */
export async function sendPasswordResetEmail(
  email: string,
  username: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  const editorHost = process.env.HOST_URL || 'editor.localhost:3000';
  const resetLink = `http://${editorHost}/cambiar-contrasena?token=${resetToken}`;

  const emailHtml = await render(
    PasswordResetEmail({
      username,
      resetLink,
    })
  );

  return sendEmail(
    email,
    'Restablece tu contraseña de DUECh Online',
    emailHtml,
    'password reset email'
  );
}
