import { NextRequest, NextResponse } from 'next/server';
import { serverHelpers } from '@/lib/supabase/server';
import { propertyCreateSchema } from '@/lib/types/validation';
import { z } from 'zod';

// UUID validation schema
const uuidSchema = z.string().uuid('Invalid portfolio ID format');

// Query parameters schema
const querySchema = z.object({
  type: z.string().optional(),
  city: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(['acquisition_date', 'current_value', 'address', 'city']).default('acquisition_date'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    // Await params in Next.js 15
    const { portfolioId } = await params;

    // DEMO MODE: Return demo properties
    const demoProperties = [
      {
        id: 'prop-demo-1',
        portfolio_id: portfolioId,
        address: '123 Rue de la République',
        city: 'Paris',
        postal_code: '75011',
        country: 'France',
        property_type: 'apartment',
        property_subtype: 'T3',
        surface_area: 65,
        number_of_rooms: 3,
        acquisition_date: '2022-06-15',
        acquisition_price: 320000,
        current_value: 380000,
        rental_type: 'furnished',
        monthly_rent: 1800,
        charges: 150,
        tax_regime: 'LMNP',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prop-demo-2',
        portfolio_id: portfolioId,
        address: '45 Avenue Jean Jaurès',
        city: 'Lyon',
        postal_code: '69007',
        country: 'France',
        property_type: 'apartment',
        property_subtype: 'T2',
        surface_area: 45,
        number_of_rooms: 2,
        acquisition_date: '2023-03-20',
        acquisition_price: 180000,
        current_value: 195000,
        rental_type: 'furnished',
        monthly_rent: 1200,
        charges: 100,
        tax_regime: 'LMNP',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prop-demo-3',
        portfolio_id: portfolioId,
        address: '78 Rue Victor Hugo',
        city: 'Bordeaux',
        postal_code: '33000',
        country: 'France',
        property_type: 'house',
        property_subtype: 'Maison de ville',
        surface_area: 120,
        number_of_rooms: 5,
        acquisition_date: '2021-09-10',
        acquisition_price: 450000,
        current_value: 520000,
        rental_type: 'unfurnished',
        monthly_rent: 1800,
        charges: 0,
        tax_regime: 'SCI_IS',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      properties: demoProperties,
      pagination: {
        total: demoProperties.length,
        limit: 50,
        offset: 0,
        has_more: false,
      },
    });
  } catch (error) {
    console.error('Properties GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    // Await params in Next.js 15
    const { portfolioId } = await params;

    // Parse request body
    const body = await request.json();

    // DEMO MODE: Return created property
    const newProperty = {
      id: `prop-demo-${Date.now()}`,
      portfolio_id: portfolioId,
      address: body.address || 'Nouvelle adresse',
      city: body.city || 'Paris',
      postal_code: body.postal_code || '75000',
      country: body.country || 'France',
      property_type: body.property_type || 'apartment',
      property_subtype: body.property_subtype,
      surface_area: body.surface_area,
      number_of_rooms: body.number_of_rooms,
      acquisition_date: body.acquisition_date,
      acquisition_price: body.acquisition_price,
      current_value: body.current_value,
      rental_type: body.rental_type,
      monthly_rent: body.monthly_rent,
      charges: body.charges,
      tax_regime: body.tax_regime,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        property: newProperty,
        message: 'Property created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Property creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}