import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string; alertId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { portfolioId, alertId } = resolvedParams;

    // Demo mode - simulate resolving an alert
    console.log(`Resolving alert ${alertId} for portfolio ${portfolioId}`);

    // In a real implementation, this would:
    // 1. Update the alert status to 'resolved'
    // 2. Set the resolved_at timestamp
    // 3. Possibly trigger notifications or logs
    // 4. Update related metrics or KPIs

    return NextResponse.json({
      success: true,
      message: 'Alert resolved successfully',
      alert_id: alertId,
      resolved_at: new Date().toISOString(),
      metadata: {
        portfolio_id: portfolioId,
        action: 'resolve',
        performed_at: new Date().toISOString(),
        resolution_notes: 'Alert resolved via dashboard action'
      }
    });

  } catch (error) {
    console.error('Error resolving alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resolve alert' },
      { status: 500 }
    );
  }
}