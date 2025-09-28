import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { portfolioId } = resolvedParams;

    // Demo mode - calculate summary based on demo alerts
    const alertSummary = {
      total_alerts: 8,
      active_alerts: 6,
      critical_alerts: 1,
      alerts_by_type: {
        cash_flow_negative: 1,
        occupancy_low: 2,
        risk_warning: 1,
        lease_expiry: 2,
        maintenance_due: 1,
        tax_deadline: 1,
        opportunity: 1,
        performance_drop: 0
      },
      alerts_by_severity: {
        low: 1,
        medium: 3,
        high: 3,
        critical: 1
      },
      recent_alerts: [
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
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
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
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          acknowledged_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
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
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
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
          trigger_value: 645,
          threshold_value: 365,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
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
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      trends: {
        new_alerts_last_7_days: 3,
        resolved_alerts_last_7_days: 1,
        avg_resolution_time_hours: 48,
        most_common_alert_type: 'lease_expiry',
        portfolio_risk_score: 0.67 // 0-1 scale
      },
      recommendations: [
        {
          priority: 'high',
          action: 'Traiter immédiatement les alertes critiques',
          description: 'Vous avez 1 alerte critique qui nécessite une action immédiate.'
        },
        {
          priority: 'medium',
          action: 'Planifier la maintenance préventive',
          description: '1 bien nécessite une maintenance après plus d\'un an sans intervention.'
        },
        {
          priority: 'medium',
          action: 'Anticiper les fins de bail',
          description: '2 baux arrivent à échéance dans les prochains mois.'
        }
      ]
    };

    return NextResponse.json({
      success: true,
      summary: alertSummary,
      metadata: {
        portfolio_id: portfolioId,
        generated_at: new Date().toISOString(),
        evaluation_period: 'last_30_days',
        next_evaluation: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      }
    });

  } catch (error) {
    console.error('Error generating alert summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate alert summary' },
      { status: 500 }
    );
  }
}