import { NextRequest, NextResponse } from 'next/server';
import { alertEngine } from '@/lib/alerts/alert-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { portfolioId } = resolvedParams;

    // Demo mode - simulate real alerts based on portfolio data
    const demoKPIData = {
      irr: 0.095,
      cash_on_cash_return: 0.073,
      cap_rate: 0.048,
      dscr: 1.08, // Below threshold of 1.1 - should trigger alert
      ltv_ratio: 0.73,
      occupancy_rate: 0.82, // Below threshold of 0.85 - should trigger alert
      monthly_cash_flow: -150, // Negative - should trigger alert
      break_even_ratio: 0.82,
      debt_yield: 0.089
    };

    const demoProperties = [
      {
        id: 'prop-001',
        address: '15 rue de Rivoli, Paris',
        current_value: 485000,
        rental_price: 1800,
        last_maintenance_date: '2022-03-15', // Over 1 year ago - should trigger alert
        lease_end_date: '2024-12-31', // Expiring soon - should trigger alert
        occupancy_status: 'occupied' as const
      },
      {
        id: 'prop-002',
        address: '25 cours Vitton, Lyon',
        current_value: 335000,
        rental_price: 1400,
        last_maintenance_date: '2024-01-10',
        lease_end_date: '2025-06-30',
        occupancy_status: 'vacant' as const // Vacant - should trigger alert
      },
      {
        id: 'prop-003',
        address: '8 allées de Tourny, Bordeaux',
        current_value: 195000,
        rental_price: 900,
        last_maintenance_date: '2023-11-20',
        lease_end_date: '2025-01-15', // Expiring in 30 days - should trigger alert
        occupancy_status: 'occupied' as const
      }
    ];

    // Generate alerts using the alert engine
    const newAlerts = await alertEngine.evaluateAlerts(portfolioId, demoKPIData, demoProperties);

    // Get all alerts for this portfolio
    const allAlerts = [
      // Existing demo alerts
      {
        id: 'alert-001',
        portfolio_id: portfolioId,
        type: 'cash_flow_negative',
        severity: 'high',
        status: 'active',
        title: 'Cash Flow Négatif Détecté',
        description: 'Le cash flow mensuel est de -150€, en dessous du seuil de 0€.',
        recommendation: 'Analysez les dépenses récentes et considérez une révision des loyers ou une optimisation des charges.',
        trigger_value: -150,
        threshold_value: 0,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        id: 'alert-002',
        portfolio_id: portfolioId,
        property_id: 'prop-002',
        type: 'occupancy_low',
        severity: 'high',
        status: 'active',
        title: 'Bien Vacant',
        description: '25 cours Vitton, Lyon est actuellement vacant.',
        recommendation: 'Lancez une campagne de commercialisation active et vérifiez l\'état du bien.',
        trigger_value: 0,
        threshold_value: 1,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        id: 'alert-003',
        portfolio_id: portfolioId,
        type: 'risk_warning',
        severity: 'critical',
        status: 'acknowledged',
        title: 'Alerte Risque DSCR',
        description: 'Le DSCR est de 1.08, en dessous du seuil critique de 1.10.',
        recommendation: 'Action urgente requise : renégociation du financement ou augmentation des revenus.',
        trigger_value: 1.08,
        threshold_value: 1.1,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        acknowledged_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
      },
      {
        id: 'alert-004',
        portfolio_id: portfolioId,
        property_id: 'prop-001',
        type: 'lease_expiry',
        severity: 'medium',
        status: 'active',
        title: 'Fin de Bail Proche',
        description: 'Le bail de 15 rue de Rivoli, Paris expire dans 35 jours.',
        recommendation: 'Contactez le locataire pour un renouvellement ou préparez la remise en location.',
        trigger_value: 35,
        threshold_value: 60,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        id: 'alert-005',
        portfolio_id: portfolioId,
        property_id: 'prop-001',
        type: 'maintenance_due',
        severity: 'medium',
        status: 'active',
        title: 'Maintenance Requise',
        description: 'Aucune maintenance effectuée sur 15 rue de Rivoli, Paris depuis 21 mois.',
        recommendation: 'Planifiez une inspection et des travaux de maintenance préventive.',
        trigger_value: 645, // days
        threshold_value: 365,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        id: 'alert-006',
        portfolio_id: portfolioId,
        type: 'tax_deadline',
        severity: 'high',
        status: 'resolved',
        title: 'Échéance Fiscale Proche',
        description: 'Une échéance fiscale approche dans 15 jours.',
        recommendation: 'Préparez vos déclarations fiscales et consultez votre expert-comptable si nécessaire.',
        trigger_value: 15,
        threshold_value: 30,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        id: 'alert-007',
        portfolio_id: portfolioId,
        type: 'opportunity',
        severity: 'low',
        status: 'active',
        title: 'Opportunité de Renégociation',
        description: 'Les taux d\'intérêt actuels permettent une renégociation favorable de vos emprunts.',
        recommendation: 'Contactez votre banquier pour étudier les possibilités de renégociation.',
        trigger_value: 0.035,
        threshold_value: 0.04,
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
      },
      {
        id: 'alert-008',
        portfolio_id: portfolioId,
        property_id: 'prop-003',
        type: 'lease_expiry',
        severity: 'high',
        status: 'active',
        title: 'Fin de Bail Imminente',
        description: 'Le bail de 8 allées de Tourny, Bordeaux expire dans 19 jours.',
        recommendation: 'Action immédiate requise : contactez le locataire pour renouvellement ou préparez la commercialisation.',
        trigger_value: 19,
        threshold_value: 60,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
      }
    ];

    // Sort alerts by creation date (newest first)
    const sortedAlerts = allAlerts.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      success: true,
      alerts: sortedAlerts,
      metadata: {
        portfolio_id: portfolioId,
        total_alerts: sortedAlerts.length,
        active_alerts: sortedAlerts.filter(a => a.status === 'active').length,
        critical_alerts: sortedAlerts.filter(a => a.severity === 'critical').length,
        last_evaluation: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}