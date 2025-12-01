import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateAndFetchWordsByStatus,
  mapWordsByStatusToPdf,
  WordStatusFilter,
} from '@/lib/report-words-utils';
import { requireAdminForApi } from '@/lib/api-auth';
import { generatePDFreport } from '@/lib/pdf-utils';

export async function GET(request: NextRequest) {
  // Require admin or superadmin to generate reports
  await requireAdminForApi();

  try {
    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get('type') || 'redacted') as WordStatusFilter;

    // Authenticate and fetch redacted words
    const result = await authenticateAndFetchWordsByStatus(type);
    if (!result.success) return result.response;

    // Map type to filename
    const filenameMap = {
      redacted: 'reporte_redactadas.pdf',
      reviewedLex: 'reporte_revisadas.pdf',
      both: 'reporte_completo.pdf',
    };

    // Generate PDF
    const pdfReadyWords = mapWordsByStatusToPdf(result.words);
    const pdfBytes = await generatePDFreport(pdfReadyWords, type);

    return new Response(Buffer.from(pdfBytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filenameMap[type]}"`,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
