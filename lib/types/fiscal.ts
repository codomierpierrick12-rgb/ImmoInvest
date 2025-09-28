// Types for Stoneverse tax calculations (LMNP, SCI IS, Personal)

export type FiscalRegime = 'personal' | 'lmnp' | 'sci_is';

// LMNP (Loueur Meublé Non Professionnel) Configuration
export interface LMNPSettings {
  depreciation_components: {
    building: {
      rate: number; // Typically 2-3% per year
      base_amount: number; // Building value excluding land
    };
    furniture: {
      rate: number; // Typically 10% per year
      base_amount: number; // Furniture value
    };
    equipment: {
      rate: number; // Typically 20% per year
      base_amount: number; // Equipment value
    };
    works: {
      rate: number; // Typically 10% per year
      base_amount: number; // Works value
    };
  };
  land_percentage: number; // Default 10%, editable
  depreciation_limit: {
    prevent_bic_deficit: boolean; // Cannot create BIC deficit
  };
}

// SCI IS (SCI à l'Impôt sur les Sociétés) Configuration
export interface SCIISSettings {
  corporate_tax: {
    standard_rate: number; // 25% for 2023
    reduced_rate: number; // 15% on first 42,500€
    reduced_rate_threshold: number; // 42,500€
  };
  depreciation_components: {
    building: {
      rate: number;
      base_amount: number;
    };
    furniture: {
      rate: number;
      base_amount: number;
    };
    equipment: {
      rate: number;
      base_amount: number;
    };
    works: {
      rate: number;
      base_amount: number;
    };
  };
  deficit_carryforward: {
    enabled: boolean;
    max_years: number; // Typically unlimited for SCI IS
  };
}

// Capital Gains Tax Settings
export interface CapitalGainsSettings {
  // LMNP (Private capital gains)
  lmnp: {
    income_tax_allowances: Array<{
      years_held: number;
      allowance_rate: number; // e.g., 6% per year after 5 years
    }>;
    social_charges_allowances: Array<{
      years_held: number;
      allowance_rate: number; // e.g., 1.65% per year after 5 years
    }>;
    surcharge_threshold: number; // 50,000€ threshold for surcharge
    surcharge_rates: Array<{
      threshold: number;
      rate: number;
    }>;
    depreciation_recapture: boolean; // false for LMNP
  };

  // SCI IS (Professional capital gains)
  sci_is: {
    corporate_tax_rate: number; // Same as regular IS rate
    depreciation_recapture: boolean; // true for SCI IS
    special_allowances: Array<{
      condition: string;
      rate: number;
    }>;
  };
}

// Tax Calculation Results
export interface TaxCalculationResult {
  fiscal_regime: FiscalRegime;
  annual_result: {
    gross_rental_income: number;
    deductible_expenses: number;
    depreciation_total: number;
    taxable_result: number;
    tax_due: number;
    effective_tax_rate: number;
  };
  depreciation_detail: Array<{
    component: 'building' | 'furniture' | 'equipment' | 'works';
    annual_amount: number;
    remaining_base: number;
    years_remaining: number;
  }>;
  capital_gains?: {
    sale_price: number;
    acquisition_cost: number;
    works_cost: number;
    sale_costs: number;
    gross_capital_gain: number;
    allowances_applied: number;
    taxable_capital_gain: number;
    income_tax: number;
    social_charges: number;
    surcharge: number;
    total_tax: number;
    net_proceeds: number;
  };
}

// Monthly Event with Fiscal Impact
export interface FiscalMonthlyEvent {
  id: string;
  property_id: string;
  legal_entity_id: string;
  period: string; // YYYY-MM
  event_type: 'rental_income' | 'expense' | 'depreciation' | 'capital_gain' | 'tax_payment';
  category: string;
  amount: number;
  tax_deductible: boolean;
  fiscal_impact: {
    regime: FiscalRegime;
    deduction_amount: number;
    tax_effect: number;
  };
  supporting_documents?: Array<{
    type: string;
    filename: string;
    url: string;
  }>;
  created_at: string;
  updated_at: string;
}

// Tax Reference Data (Parameterizable)
export interface TaxReferenceData {
  year: number;
  income_tax_brackets: Array<{
    min_income: number;
    max_income: number | null;
    rate: number;
  }>;
  social_charges_rate: number; // 17.2% in 2023
  corporate_tax_rates: {
    standard: number; // 25%
    reduced: number; // 15%
    reduced_threshold: number; // 42,500€
  };
  irl_index: Array<{
    quarter: string; // YYYY-Q1
    value: number;
  }>;
  inflation_rate: number;
  capital_gains_allowances: {
    lmnp: {
      income_tax: Array<{
        years: number;
        rate: number;
      }>;
      social_charges: Array<{
        years: number;
        rate: number;
      }>;
    };
    surcharge_thresholds: Array<{
      threshold: number;
      rate: number;
    }>;
  };
}

// Legal Entity with Enhanced Fiscal Settings
export interface EnhancedLegalEntity {
  id: string;
  portfolio_id: string;
  name: string;
  type: FiscalRegime;
  fiscal_settings: {
    lmnp?: LMNPSettings;
    sci_is?: SCIISSettings;
    capital_gains: CapitalGainsSettings;
  };
  default_settings: {
    depreciation_start_mode: 'acquisition_date' | 'rental_start' | 'custom';
    accounting_method: 'cash' | 'accrual';
    fiscal_year_end: string; // MM-DD format
  };
  incorporation_date: string | null;
  created_at: string;
  updated_at: string;
}

// Default tax reference data for 2024
export const DEFAULT_TAX_REFERENCE: TaxReferenceData = {
  year: 2024,
  income_tax_brackets: [
    { min_income: 0, max_income: 11294, rate: 0 },
    { min_income: 11295, max_income: 28797, rate: 0.11 },
    { min_income: 28798, max_income: 82341, rate: 0.30 },
    { min_income: 82342, max_income: 177106, rate: 0.41 },
    { min_income: 177107, max_income: null, rate: 0.45 }
  ],
  social_charges_rate: 0.172,
  corporate_tax_rates: {
    standard: 0.25,
    reduced: 0.15,
    reduced_threshold: 42500
  },
  irl_index: [
    { quarter: '2024-Q1', value: 142.78 },
    { quarter: '2024-Q2', value: 143.12 },
    { quarter: '2024-Q3', value: 143.45 },
    { quarter: '2024-Q4', value: 143.80 }
  ],
  inflation_rate: 0.025,
  capital_gains_allowances: {
    lmnp: {
      income_tax: [
        { years: 5, rate: 0.06 },
        { years: 10, rate: 0.04 },
        { years: 15, rate: 0.02 },
        { years: 22, rate: 0.02 }
      ],
      social_charges: [
        { years: 5, rate: 0.0165 },
        { years: 10, rate: 0.0165 },
        { years: 15, rate: 0.0165 },
        { years: 22, rate: 0.0165 }
      ]
    },
    surcharge_thresholds: [
      { threshold: 50000, rate: 0.02 },
      { threshold: 60000, rate: 0.03 },
      { threshold: 100000, rate: 0.04 },
      { threshold: 150000, rate: 0.05 },
      { threshold: 200000, rate: 0.06 }
    ]
  }
};