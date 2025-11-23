import { NextResponse } from 'next/server';
import { sendRedactedWordsReport } from '@/lib/email';
import { authenticateAndFetchRedactedWords } from '@/lib/redacted-words-utils';
import { generateRedactedWordsPDF } from '@/lib/pdf-utils';

export async function POST() {
  try {
    // Authenticate and fetch redacted words
    const result = await authenticateAndFetchRedactedWords();
    if (!result.success) return result.response;

    // Generate PDF
    const pdfBytes = await generateRedactedWordsPDF(result.words);
    const pdfBuffer = Buffer.from(pdfBytes);

    // Send email with PDF attachment
    const emailResult = await sendRedactedWordsReport(
      result.user.email,
      result.user.name || result.user.email,
      pdfBuffer
    );

    if (!emailResult.success) {
      console.error('Failed to send report email:', emailResult.error);
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || 'Failed to send email',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email: result.user.email,
    });
  } catch (error) {
    console.error('Error generating and sending report:', error);
    return NextResponse.json({ error: 'Failed to generate and send report' }, { status: 500 });
  }
}
