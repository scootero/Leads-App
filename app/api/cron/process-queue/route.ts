import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Verify the secret token
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token-change-this';

    // Debug logging
    console.log('🔍 Auth Debug:', {
      hasHeader: !!authHeader,
      headerLength: authHeader?.length,
      headerPreview: authHeader ? `${authHeader.substring(0, 20)}...` : 'none',
      hasToken: !!expectedToken,
      tokenLength: expectedToken?.length,
      tokenPreview: expectedToken ? `${expectedToken.substring(0, 10)}...` : 'none'
    });

    // More flexible token comparison (case-insensitive, strip whitespace)
    const normalizedHeader = authHeader?.trim().toLowerCase();
    const normalizedExpected = `bearer ${expectedToken}`.trim().toLowerCase();

    if (!normalizedHeader || normalizedHeader !== normalizedExpected) {
      console.error('❌ Unauthorized cron job attempt', {
        received: normalizedHeader,
        expected: normalizedExpected
      });
      return NextResponse.json(
        { error: 'Unauthorized', debug: { receivedHeader: normalizedHeader } },
        { status: 401 }
      );
    }

    console.log('⏰ Cron job triggered - processing queue...');

    // Call our existing queue processing API
    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/process-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Queue processing failed: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Cron job completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error: unknown) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
