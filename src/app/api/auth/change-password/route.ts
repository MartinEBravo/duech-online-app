import { NextRequest, NextResponse } from 'next/server';
import {
  getPasswordResetToken,
  hashPassword,
  updateUser,
  deletePasswordResetToken,
} from '@/lib/queries';
import { sendPasswordChangeConfirmation } from '@/lib/email';

/**
 * Password validation rules
 */
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'La contraseña debe incluir al menos una letra minúscula' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'La contraseña debe incluir al menos una letra mayúscula' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'La contraseña debe incluir al menos un número' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    // Validate input
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token y contraseña son requeridos' }, { status: 400 });
    }

    // Get token from database
    const tokenRecord = await getPasswordResetToken(token);

    if (!tokenRecord || !tokenRecord.user) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    const user = tokenRecord.user;

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update user password
    await updateUser(user.id, {
      passwordHash: newPasswordHash,
    });

    // Delete the used token
    await deletePasswordResetToken(token);

    // Send confirmation email
    try {
      if (user.email) {
        await sendPasswordChangeConfirmation(user.email, user.username);
      }
    } catch (emailError) {
      // Log email error but don't fail the password change
      console.error('Failed to send password change confirmation:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Error al cambiar la contraseña' }, { status: 500 });
  }
}
