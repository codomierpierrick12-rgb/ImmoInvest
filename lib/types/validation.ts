import { z } from 'zod';
import { CurrencyCode, PropertyType, LegalEntityType, ScenarioType } from './database';

// Portfolio validation schemas
export const portfolioCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  base_currency: z.enum(['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY'], {
    errorMap: () => ({ message: 'Invalid currency code' }),
  }),
  baseline_date: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      const today = new Date();
      return parsedDate <= today;
    },
    { message: 'Baseline date cannot be in the future' }
  ),
});

export const portfolioUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').optional(),
  sharing_settings: z.object({
    is_shared: z.boolean().optional(),
    shared_users: z.array(z.object({
      user_id: z.string().uuid('Invalid user ID'),
      permission: z.enum(['read', 'comment', 'edit']),
      granted_at: z.string().datetime().optional(),
      granted_by: z.string().uuid('Invalid user ID').optional(),
    })).optional(),
    share_settings: z.object({
      allow_export: z.boolean().optional(),
      allow_copy: z.boolean().optional(),
      expire_at: z.string().datetime().nullable().optional(),
    }).optional(),
  }).optional(),
});

// Property validation schemas
export const propertyCreateSchema = z.object({
  legal_entity_id: z.string().uuid('Invalid legal entity ID'),
  address: z.string().min(1, 'Address is required').max(500, 'Address must be 500 characters or less'),
  city: z.string().min(1, 'City is required').max(100, 'City must be 100 characters or less'),
  postal_code: z.string().max(20, 'Postal code must be 20 characters or less').optional(),
  country: z.string().min(2, 'Country code must be at least 2 characters').max(3, 'Country code must be 3 characters or less').default('FR'),
  acquisition_price: z.number().positive('Acquisition price must be positive'),
  acquisition_date: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      const today = new Date();
      return parsedDate <= today;
    },
    { message: 'Acquisition date cannot be in the future' }
  ),
  acquisition_costs: z.object({
    notary_fees: z.number().nonnegative().optional(),
    agency_fees: z.number().nonnegative().optional(),
    renovation_costs: z.number().nonnegative().optional(),
    furniture_costs: z.number().nonnegative().optional(),
    loan_setup_fees: z.number().nonnegative().optional(),
    inspection_fees: z.number().nonnegative().optional(),
    insurance_setup: z.number().nonnegative().optional(),
    other_costs: z.number().nonnegative().optional(),
    total_acquisition_costs: z.number().nonnegative().optional(),
  }).default({}),
  current_value: z.number().positive('Current value must be positive'),
  valuation_date: z.string().optional(),
  property_type: z.enum(['apartment', 'house', 'commercial', 'parking', 'land', 'office', 'retail', 'warehouse']),
  surface_area: z.number().positive('Surface area must be positive').optional(),
  rental_yield_target: z.number().min(0, 'Rental yield target cannot be negative').max(50, 'Rental yield target cannot exceed 50%').optional(),
  status: z.enum(['active', 'sold', 'under_renovation', 'vacant', 'rented']).default('active'),
});

// Legal Entity validation schemas
export const legalEntityCreateSchema = z.object({
  portfolio_id: z.string().uuid('Invalid portfolio ID'),
  type: z.enum(['personal', 'lmnp', 'sci_is']),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  tax_settings: z.object({
    jurisdiction: z.string().optional(),
    tax_rates: z.object({
      income_tax_rate: z.number().min(0).max(100).optional(),
      social_charges_rate: z.number().min(0).max(100).optional(),
      corporate_tax_rate: z.number().min(0).max(100).optional(),
      dividend_tax_rate: z.number().min(0).max(100).optional(),
    }).optional(),
    depreciation: z.object({
      building_rate: z.number().min(0).max(100).optional(),
      furniture_rate: z.number().min(0).max(100).optional(),
      equipment_rate: z.number().min(0).max(100).optional(),
    }).optional(),
    capital_gains: z.object({
      allowance_duration_years: z.boolean().optional(),
      exemption_duration_years: z.number().positive().optional(),
      depreciation_recapture: z.boolean().optional(),
      professional_rate: z.number().min(0).max(100).optional(),
    }).optional(),
    expense_limitations: z.object({
      max_deduction_percentage: z.number().min(0).max(100).optional(),
    }).optional(),
  }).default({}),
  incorporation_date: z.string().optional(),
}).refine(
  (data) => {
    // Personal entities should not have incorporation date
    if (data.type === 'personal' && data.incorporation_date) {
      return false;
    }
    // LMNP and SCI IS entities should have incorporation date
    if ((data.type === 'lmnp' || data.type === 'sci_is') && !data.incorporation_date) {
      return false;
    }
    return true;
  },
  {
    message: 'Incorporation date is required for LMNP and SCI IS entities, but not for personal entities',
    path: ['incorporation_date'],
  }
);

// Transaction validation schemas
export const transactionCreateSchema = z.object({
  property_id: z.string().uuid('Invalid property ID'),
  transaction_type: z.enum([
    'rental_income',
    'operating_expense',
    'capex',
    'loan_payment',
    'tax_payment',
    'insurance_payment',
    'management_fee',
    'repair_maintenance',
    'utility_payment',
    'other_income',
    'other_expense',
  ]),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be 100 characters or less'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be 500 characters or less'),
  amount: z.number().refine(amount => amount !== 0, 'Amount cannot be zero'),
  transaction_date: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      const today = new Date();
      return parsedDate <= today;
    },
    { message: 'Transaction date cannot be in the future' }
  ),
  payment_method: z.string().optional(),
  is_budgeted: z.boolean().default(false),
  tax_deductible: z.boolean().default(true),
  supporting_documents: z.array(z.object({
    type: z.enum(['invoice', 'receipt', 'bank_statement', 'contract', 'photo']),
    filename: z.string().min(1, 'Filename is required'),
    url: z.string().url('Invalid URL'),
    uploaded_at: z.string().datetime(),
    file_size: z.number().positive('File size must be positive'),
    mime_type: z.string().min(1, 'MIME type is required'),
  })).default([]),
});

// Scenario validation schemas
export const scenarioCreateSchema = z.object({
  portfolio_id: z.string().uuid('Invalid portfolio ID'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  scenario_type: z.enum(['acquisition', 'disposal', 'refinancing', 'mixed']),
  base_date: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      return parsedDate <= oneYearFromNow;
    },
    { message: 'Base date cannot be more than one year in the future' }
  ),
  projection_years: z.number().int().min(1, 'Projection years must be at least 1').max(30, 'Projection years cannot exceed 30').default(10),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  assumptions: z.object({
    market_conditions: z.object({
      property_appreciation_rate: z.number().min(-10).max(20).optional(),
      rental_growth_rate: z.number().min(-10).max(20).optional(),
      inflation_rate: z.number().min(0).max(10).optional(),
      interest_rate_trend: z.enum(['stable', 'rising', 'falling']).optional(),
    }).optional(),
    financing: z.object({
      default_ltv: z.number().min(0).max(100).optional(),
      default_interest_rate: z.number().min(0).max(30).optional(),
      default_term_years: z.number().positive().max(50).optional(),
    }).optional(),
    costs: z.object({
      transaction_cost_percentage: z.number().min(0).max(20).optional(),
      annual_management_rate: z.number().min(0).max(20).optional(),
      maintenance_rate: z.number().min(0).max(10).optional(),
    }).optional(),
    taxation: z.object({
      capital_gains_rate: z.number().min(0).max(100).optional(),
      income_tax_rate: z.number().min(0).max(100).optional(),
      depreciation_rate: z.number().min(0).max(20).optional(),
    }).optional(),
  }).default({}),
});

// Budget validation schemas
export const budgetCreateSchema = z.object({
  property_id: z.string().uuid('Invalid property ID'),
  budget_year: z.number().int().min(2020).max(new Date().getFullYear() + 5),
  budget_month: z.number().int().min(1).max(12).optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be 100 characters or less'),
  budgeted_amount: z.number(),
  variance_threshold: z.number().min(0, 'Variance threshold cannot be negative').max(100, 'Variance threshold cannot exceed 100%').default(10),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

// API response schemas
export const portfolioListResponseSchema = z.object({
  portfolios: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    base_currency: z.string(),
    baseline_date: z.string(),
    sharing_settings: z.object({}).passthrough(),
    created_at: z.string(),
    updated_at: z.string(),
  })),
  total: z.number().int().nonnegative(),
});

export const kpiResponseSchema = z.object({
  current: z.object({
    portfolio_id: z.string().uuid(),
    calculation_date: z.string(),
    total_property_value: z.number().nonnegative(),
    total_debt: z.number().nonnegative(),
    net_worth: z.number(),
    ltv_ratio: z.number().min(0).max(100),
    dscr_ratio: z.number().nonnegative().nullable(),
    monthly_cashflow: z.number(),
    annual_roi: z.number(),
    tax_liability: z.number(),
  }),
  comparison: z.object({}).optional(),
  trends: z.object({
    net_worth_trend: z.enum(['increasing', 'decreasing', 'stable']),
    cashflow_trend: z.enum(['improving', 'deteriorating', 'stable']),
  }).optional(),
});

// Error response schema
export const errorResponseSchema = z.object({
  code: z.enum(['VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN', 'INTERNAL_ERROR']),
  message: z.string(),
  details: z.object({}).optional(),
});

// Query parameter schemas
export const portfolioQuerySchema = z.object({
  include_shared: z.string().transform(val => val === 'true').default('true'),
});

export const propertyQuerySchema = z.object({
  status: z.enum(['active', 'sold', 'under_renovation', 'vacant', 'rented']).optional(),
  legal_entity_id: z.string().uuid().optional(),
});

export const scenarioQuerySchema = z.object({
  status: z.enum(['draft', 'active', 'executed', 'archived']).optional(),
  scenario_type: z.enum(['acquisition', 'disposal', 'refinancing', 'mixed']).optional(),
});

export const kpiQuerySchema = z.object({
  as_of_date: z.string().optional(),
  compare_to_date: z.string().optional(),
});

// Type exports for use in API routes
export type PortfolioCreateInput = z.infer<typeof portfolioCreateSchema>;
export type PortfolioUpdateInput = z.infer<typeof portfolioUpdateSchema>;
export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type LegalEntityCreateInput = z.infer<typeof legalEntityCreateSchema>;
export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
export type ScenarioCreateInput = z.infer<typeof scenarioCreateSchema>;
export type BudgetCreateInput = z.infer<typeof budgetCreateSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;