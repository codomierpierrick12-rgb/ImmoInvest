import { NextRequest, NextResponse } from 'next/server';
import { propertyComparator } from '@/lib/comparison/property-comparator';
import { Property, Transaction } from '@/lib/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { portfolioId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const preset = searchParams.get('preset') || 'balanced';

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
      },
      {
        id: 'prop-003',
        portfolio_id: portfolioId,
        address: '8 allées de Tourny',
        city: 'Bordeaux',
        postal_code: '33000',
        property_type: 'apartment',
        bedrooms: 1,
        bathrooms: 1,
        surface_area: 45,
        acquisition_price: 185000,
        current_value: 195000,
        rental_price: 900,
        legal_entity_id: 'entity-personal',
        acquisition_date: '2021-03-20',
        created_at: '2021-03-20T16:45:00Z'
      }
    ];

    const demoTransactions: Transaction[] = [
      // Property 1 transactions
      {
        id: 'trans-001',
        portfolio_id: portfolioId,
        property_id: 'prop-001',
        legal_entity_id: 'entity-lmnp',
        transaction_type: 'rental_income',
        amount: 21600,
        transaction_date: '2024-12-31',
        description: 'Loyers 2024 - Paris',
        category: 'income',
        tax_deductible: false,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'trans-002',
        portfolio_id: portfolioId,
        property_id: 'prop-001',
        legal_entity_id: 'entity-lmnp',
        transaction_type: 'maintenance',
        amount: -3500,
        transaction_date: '2024-08-15',
        description: 'Rénovation salle de bain',
        category: 'expense',
        tax_deductible: true,
        created_at: '2024-08-15T10:00:00Z'
      },
      {
        id: 'trans-003',
        portfolio_id: portfolioId,
        property_id: 'prop-001',
        legal_entity_id: 'entity-lmnp',
        transaction_type: 'property_management',
        amount: -2160,
        transaction_date: '2024-12-31',
        description: 'Frais de gestion 2024',
        category: 'expense',
        tax_deductible: true,
        created_at: '2024-01-01T00:00:00Z'
      },

      // Property 2 transactions
      {
        id: 'trans-004',
        portfolio_id: portfolioId,
        property_id: 'prop-002',
        legal_entity_id: 'entity-sci',
        transaction_type: 'rental_income',
        amount: 16800,
        transaction_date: '2024-12-31',
        description: 'Loyers 2024 - Lyon',
        category: 'income',
        tax_deductible: false,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'trans-005',
        portfolio_id: portfolioId,
        property_id: 'prop-002',
        legal_entity_id: 'entity-sci',
        transaction_type: 'maintenance',
        amount: -2200,
        transaction_date: '2024-09-10',
        description: 'Travaux électricité',
        category: 'expense',
        tax_deductible: true,
        created_at: '2024-09-10T14:20:00Z'
      },
      {
        id: 'trans-006',
        portfolio_id: portfolioId,
        property_id: 'prop-002',
        legal_entity_id: 'entity-sci',
        transaction_type: 'property_management',
        amount: -1680,
        transaction_date: '2024-12-31',
        description: 'Frais de gestion 2024',
        category: 'expense',
        tax_deductible: true,
        created_at: '2024-01-01T00:00:00Z'
      },

      // Property 3 transactions
      {
        id: 'trans-007',
        portfolio_id: portfolioId,
        property_id: 'prop-003',
        legal_entity_id: 'entity-personal',
        transaction_type: 'rental_income',
        amount: 10800,
        transaction_date: '2024-12-31',
        description: 'Loyers 2024 - Bordeaux',
        category: 'income',
        tax_deductible: false,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'trans-008',
        portfolio_id: portfolioId,
        property_id: 'prop-003',
        legal_entity_id: 'entity-personal',
        transaction_type: 'property_management',
        amount: -1080,
        transaction_date: '2024-12-31',
        description: 'Frais de gestion 2024',
        category: 'expense',
        tax_deductible: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'trans-009',
        portfolio_id: portfolioId,
        property_id: 'prop-003',
        legal_entity_id: 'entity-personal',
        transaction_type: 'insurance',
        amount: -480,
        transaction_date: '2024-12-31',
        description: 'Assurance PNO 2024',
        category: 'expense',
        tax_deductible: true,
        created_at: '2024-01-01T00:00:00Z'
      }
    ];

    // Use the property comparator to generate detailed comparison
    const comparisonReport = await propertyComparator.compareProperties(
      demoProperties,
      demoTransactions,
      {
        metrics: [],
        weights: {},
        sort_by: 'overall_score',
        sort_direction: 'desc'
      }
    );

    return NextResponse.json({
      success: true,
      comparison: comparisonReport,
      metadata: {
        portfolio_id: portfolioId,
        preset_used: preset,
        properties_analyzed: demoProperties.length,
        analysis_date: new Date().toISOString(),
        methodology: 'Multi-criteria decision analysis with weighted scoring'
      }
    });

  } catch (error) {
    console.error('Error generating property comparison:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate property comparison' },
      { status: 500 }
    );
  }
}