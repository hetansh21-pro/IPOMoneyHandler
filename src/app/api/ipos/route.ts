import { NextResponse } from 'next/server';
import { getVerifiedIndianIPOs } from '@/lib/ipo/provider';

export const dynamic = 'force-static';

export async function GET() {
  try {
    const ipos = getVerifiedIndianIPOs();
    return NextResponse.json({
      success: true,
      source: 'National Stock Exchange of India & BSE Public Filings',
      lastUpdated: new Date().toISOString(),
      ipos,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch IPOs',
        ipos: getVerifiedIndianIPOs(),
      },
      { status: 200 }
    );
  }
}
