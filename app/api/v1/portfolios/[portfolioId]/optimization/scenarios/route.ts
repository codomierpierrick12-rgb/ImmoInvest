import { NextRequest, NextResponse } from 'next/server';
import {
  simulateInvestmentScenario,
  analyzePortfolioRebalancing,
  analyzeBuyVsHold
} from '@/lib/calculations/scenario-simulator';
import { Property } from '@/lib/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { portfolioId } = resolvedParams;

    // Demo mode data
    const demoProperties: Property[] = [
      {
        id: 'prop-001',
        portfolio_id: portfolioId,
        address: '15 rue de Rivoli',
        city: 'Paris',
        postal_code: '75001',
        property_type: 'apartment',
        bedrooms: 2,
        bathrooms: 1,
        surface_area: 65,
        acquisition_price: 450000,
        current_value: 485000,
        rental_price: 1800,
        legal_entity_id: 'entity-lmnp',
        acquisition_date: '2023-01-15',
        created_at: '2023-01-15T10:00:00Z'
      },
      {
        id: 'prop-002',
        portfolio_id: portfolioId,
        address: '25 cours Vitton',
        city: 'Lyon',
        postal_code: '69006',
        property_type: 'apartment',
        bedrooms: 3,
        bathrooms: 2,
        surface_area: 95,
        acquisition_price: 320000,
        current_value: 335000,
        rental_price: 1400,
        legal_entity_id: 'entity-sci',
        acquisition_date: '2022-06-10',
        created_at: '2022-06-10T14:30:00Z'
      }
    ];

    // Scenario 1: Acquisition d'un nouveau bien
    const newPropertyScenario = simulateInvestmentScenario({
      property_value: 300000,
      down_payment: 60000,
      loan_amount: 240000,
      interest_rate: 0.035,
      loan_term: 20,
      monthly_rent: 1200,
      vacancy_rate: 0.05,
      annual_expenses: 3600,
      appreciation_rate: 0.02,
      analysis_period: 10
    });

    // Scenario 2: Optimisation du portefeuille actuel
    const portfolioOptimization = analyzePortfolioRebalancing(
      {
        properties: demoProperties,
        entities: [],
        transactions: []
      },
      {
        by_location: { 'Paris': 50, 'Lyon': 30, 'Autres': 20 },
        by_property_type: { 'apartment': 80, 'house': 20 },
        by_fiscal_regime: { 'lmnp': 60, 'sci_is': 40 }
      }
    );

    // Scenario 3: Analyse Buy vs Hold pour chaque bien
    const buyVsHoldAnalysis = demoProperties.map(property => ({
      property_id: property.id,
      address: property.address,
      analysis: analyzeBuyVsHold(
        property.current_value,
        property.rental_price * 12,
        property.acquisition_price,
        5 // 5 years analysis
      )
    }));

    // Scenario 4: Simulation avec différents taux d'intérêt
    const interestRateScenarios = [0.025, 0.035, 0.045, 0.055].map(rate => ({
      interest_rate: rate,
      scenario: simulateInvestmentScenario({
        property_value: 400000,
        down_payment: 80000,
        loan_amount: 320000,
        interest_rate: rate,
        loan_term: 25,
        monthly_rent: 1600,
        vacancy_rate: 0.05,
        annual_expenses: 4800,
        appreciation_rate: 0.02,
        analysis_period: 10
      })
    }));

    return NextResponse.json({
      success: true,
      scenarios: {
        new_property_acquisition: {
          title: 'Acquisition nouveau bien - 300k€',
          description: 'Simulation d\'achat d\'un appartement de 300k€ avec 20% d\'apport',
          results: newPropertyScenario
        },
        portfolio_optimization: {
          title: 'Optimisation portefeuille actuel',
          description: 'Recommandations pour optimiser la répartition et performance',
          results: portfolioOptimization
        },
        buy_vs_hold_analysis: {
          title: 'Analyse Buy vs Hold',
          description: 'Comparaison vente vs conservation pour chaque bien',
          results: buyVsHoldAnalysis
        },
        interest_rate_sensitivity: {
          title: 'Sensibilité aux taux d\'intérêt',
          description: 'Impact des variations de taux sur un nouvel investissement',
          results: interestRateScenarios
        }
      },
      metadata: {
        properties_analyzed: demoProperties.length,
        total_portfolio_value: demoProperties.reduce((sum, p) => sum + p.current_value, 0),
        analysis_date: new Date().toISOString(),
        scenarios_count: 4
      }
    });

  } catch (error) {
    console.error('Error generating investment scenarios:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate investment scenarios' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { portfolioId } = resolvedParams;
    const body = await request.json();

    const {
      property_value,
      down_payment,
      loan_amount,
      interest_rate,
      loan_term,
      monthly_rent,
      vacancy_rate = 0.05,
      annual_expenses,
      appreciation_rate = 0.02,
      analysis_period = 10
    } = body;

    const customScenario = simulateInvestmentScenario({
      property_value,
      down_payment,
      loan_amount,
      interest_rate,
      loan_term,
      monthly_rent,
      vacancy_rate,
      annual_expenses,
      appreciation_rate,
      analysis_period
    });

    return NextResponse.json({
      success: true,
      scenario: customScenario,
      metadata: {
        portfolio_id: portfolioId,
        scenario_type: 'custom',
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating custom scenario:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create custom scenario' },
      { status: 500 }
    );
  }
}