import { NextRequest, NextResponse } from 'next/server';
import { generateOptimizationSuggestions } from '@/lib/calculations/tax-optimization';
import { Property, Transaction } from '@/lib/types/database';
import { EnhancedLegalEntity } from '@/lib/types/fiscal';

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

    const demoTransactions: Transaction[] = [
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
        property_id: 'prop-002',
        legal_entity_id: 'entity-sci',
        transaction_type: 'rental_income',
        amount: 16800,
        transaction_date: '2024-12-31',
        description: 'Loyers 2024 - Lyon',
        category: 'income',
        tax_deductible: false,
        created_at: '2024-01-01T00:00:00Z'
      }
    ];

    const demoEntities: EnhancedLegalEntity[] = [
      {
        id: 'entity-lmnp',
        name: 'LMNP Dupont',
        type: 'lmnp',
        properties_count: 1,
        incorporation_date: '2023-01-01',
        created_at: '2023-01-01T00:00:00Z',
        fiscal_settings: {
          capital_gains: {
            lmnp: {
              income_tax_allowances: [],
              social_charges_allowances: [],
              surcharge_threshold: 50000,
              surcharge_rates: [],
              depreciation_recapture: false
            }
          }
        }
      },
      {
        id: 'entity-sci',
        name: 'SCI Familiale',
        type: 'sci_is',
        properties_count: 1,
        incorporation_date: '2022-06-01',
        created_at: '2022-06-01T00:00:00Z',
        fiscal_settings: {
          capital_gains: {
            sci_is: {
              corporate_tax_rate: 0.25,
              depreciation_recapture: true,
              special_allowances: []
            }
          }
        }
      }
    ];

    const suggestions = generateOptimizationSuggestions(
      demoProperties,
      demoEntities,
      demoTransactions,
      2024
    );

    return NextResponse.json({
      success: true,
      suggestions,
      metadata: {
        properties_count: demoProperties.length,
        entities_count: demoEntities.length,
        analysis_year: 2024,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating optimization suggestions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate optimization suggestions' },
      { status: 500 }
    );
  }
}