import { NextResponse } from 'next/server';

export async function GET() {
  try {
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

  } catch (error: any) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
