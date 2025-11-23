import { NextResponse } from 'next/server';
import { authenticateAndFetchRedactedWords } from '@/lib/redacted-words-utils';

export async function GET() {
  try {
    // Authenticate and fetch redacted words
    const result = await authenticateAndFetchRedactedWords();
    if (!result.success) return result.response;

    return NextResponse.json({
      success: true,
      words: result.words,
      count: result.words.length,
    });
  } catch (error) {
    console.error('Error fetching redacted words:', error);
    return NextResponse.json({ error: 'Failed to fetch redacted words' }, { status: 500 });
  }
}
