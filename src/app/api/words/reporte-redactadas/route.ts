import { NextResponse } from 'next/server';
import { authenticateAndFetchRedactedWords } from '@/lib/redacted-words-utils';
import { generateRedactedWordsPDF } from '@/lib/pdf-utils';

export async function GET() {
  try {
    // Authenticate and fetch redacted words
    const result = await authenticateAndFetchRedactedWords();
    if (!result.success) return result.response;

    // Generate PDF
    const pdfBytes = await generateRedactedWordsPDF(result.words);

    return new Response(Buffer.from(pdfBytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="reporte_redactadas.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
