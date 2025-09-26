// Database entity types based on the data model

export type UserRole = 'individual' | 'professional' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: {
    name?: string;
    preferences?: {
      currency?: string;
      language?: string;
      timezone?: string;
      notifications?: {
        email?: boolean;
        push?: boolean;
      };
    };
    tax_settings?: {
      jurisdiction?: string;
      tax_year?: string;
      default_entity_type?: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'CAD' | 'AUD' | 'JPY';

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  base_currency: CurrencyCode;
  baseline_date: string; // ISO date string
  sharing_settings: {
    is_shared: boolean;
    shared_users: Array<{
      user_id: string;
      permission: 'read' | 'comment' | 'edit';
      granted_at: string;
      granted_by: string;
    }>;
    share_settings?: {
      allow_export?: boolean;
      allow_copy?: boolean;
      expire_at?: string | null;
    };
  };
  created_at: string;
  updated_at: string;
}

export type LegalEntityType = 'personal' | 'lmnp' | 'sci_is';

export interface LegalEntity {
  id: string;
  portfolio_id: string;
  type: LegalEntityType;
  name: string;
  tax_settings: {
    jurisdiction?: string;
    tax_rates?: {
      income_tax_rate?: number;
      social_charges_rate?: number;
      corporate_tax_rate?: number;
      dividend_tax_rate?: number;
    };
    depreciation?: {
      building_rate?: number;
      furniture_rate?: number;
      equipment_rate?: number;
    };
    capital_gains?: {
      allowance_duration_years?: boolean;
      exemption_duration_years?: number;
      depreciation_recapture?: boolean;
      professional_rate?: number;
    };
    expense_limitations?: {
      max_deduction_percentage?: number;
    };
  };
  incorporation_date: string | null;
  created_at: string;
  updated_at: string;
}

export type PropertyType = 'apartment' | 'house' | 'commercial' | 'parking' | 'land' | 'office' | 'retail' | 'warehouse';
export type PropertyStatus = 'active' | 'sold' | 'under_renovation' | 'vacant' | 'rented';

export interface Property {
  id: string;
  legal_entity_id: string;
  address: string;
  city: string;
  postal_code: string | null;
  country: string;
  acquisition_price: number;
  acquisition_date: string;
  acquisition_costs: {
    notary_fees?: number;
    agency_fees?: number;
    renovation_costs?: number;
    furniture_costs?: number;
    loan_setup_fees?: number;
    inspection_fees?: number;
    insurance_setup?: number;
    other_costs?: number;
    total_acquisition_costs?: number;
  };
  current_value: number;
  valuation_date: string | null;
  property_type: PropertyType;
  surface_area: number | null;
  rental_yield_target: number | null;
  status: PropertyStatus;
  created_at: string;
  updated_at: string;
}

export type LoanType = 'amortizing' | 'interest_only' | 'bridge' | 'balloon' | 'variable_rate';
export type RateType = 'fixed' | 'variable' | 'mixed';
export type LoanStatus = 'pending' | 'active' | 'paid_off' | 'refinanced' | 'defaulted';

export interface Loan {
  id: string;
  property_id: string;
  name: string;
  loan_type: LoanType;
  initial_amount: number;
  current_balance: number;
  interest_rate: number;
  rate_type: RateType;
  term_months: number;
  start_date: string;
  monthly_payment: number | null;
  insurance_rate: number | null;
  early_repayment_penalty: {
    has_penalty?: boolean;
    penalty_type?: 'percentage' | 'fixed_amount' | 'sliding_scale';
    penalty_rate?: number;
    penalty_amount?: number;
    penalty_duration_months?: number;
    conditions?: {
      minimum_amount?: number;
      excluded_periods?: string[];
      partial_repayment_allowed?: boolean;
    };
  };
  guarantees: {
    mortgage?: {
      property_id: string;
      rank: number;
      amount: number;
    };
    personal_guarantee?: {
      guarantor_name: string;
      amount: number;
      joint_liability: boolean;
    };
    insurance?: {
      death_coverage: boolean;
      disability_coverage: boolean;
      unemployment_coverage: boolean;
      provider: string;
      policy_number: string;
    };
  };
  status: LoanStatus;
  created_at: string;
  updated_at: string;
}

export type TransactionType =
  | 'rental_income'
  | 'operating_expense'
  | 'capex'
  | 'loan_payment'
  | 'tax_payment'
  | 'insurance_payment'
  | 'management_fee'
  | 'repair_maintenance'
  | 'utility_payment'
  | 'other_income'
  | 'other_expense';

export interface Transaction {
  id: string;
  property_id: string;
  transaction_type: TransactionType;
  category: string;
  description: string;
  amount: number;
  transaction_date: string;
  payment_method: string | null;
  is_budgeted: boolean;
  tax_deductible: boolean;
  supporting_documents: Array<{
    type: 'invoice' | 'receipt' | 'bank_statement' | 'contract' | 'photo';
    filename: string;
    url: string;
    uploaded_at: string;
    file_size: number;
    mime_type: string;
  }>;
  created_at: string;
  updated_at: string;
}

export type ScenarioType = 'acquisition' | 'disposal' | 'refinancing' | 'mixed';
export type ScenarioStatus = 'draft' | 'active' | 'executed' | 'archived';

export interface Scenario {
  id: string;
  portfolio_id: string;
  name: string;
  scenario_type: ScenarioType;
  base_date: string;
  projection_years: number;
  description: string | null;
  assumptions: {
    market_conditions?: {
      property_appreciation_rate?: number;
      rental_growth_rate?: number;
      inflation_rate?: number;
      interest_rate_trend?: 'stable' | 'rising' | 'falling';
    };
    financing?: {
      default_ltv?: number;
      default_interest_rate?: number;
      default_term_years?: number;
    };
    costs?: {
      transaction_cost_percentage?: number;
      annual_management_rate?: number;
      maintenance_rate?: number;
    };
    taxation?: {
      capital_gains_rate?: number;
      income_tax_rate?: number;
      depreciation_rate?: number;
    };
  };
  status: ScenarioStatus;
  created_at: string;
  updated_at: string;
}

export type ScenarioEventType = 'property_acquisition' | 'property_disposal' | 'loan_refinancing' | 'loan_addition' | 'value_adjustment';

export interface ScenarioEvent {
  id: string;
  scenario_id: string;
  event_type: ScenarioEventType;
  event_date: string;
  property_id: string | null;
  event_data: {
    property?: {
      address: string;
      city: string;
      price: number;
      property_type: PropertyType;
      surface_area: number;
      expected_rental_yield: number;
    };
    financing?: {
      loan_amount: number;
      interest_rate: number;
      term_years: number;
      loan_type: LoanType;
    };
    costs?: {
      acquisition_costs?: number;
      renovation_costs?: number;
      sale_price?: number;
      transaction_costs?: number;
      early_repayment_penalty?: number;
      capital_gains_tax?: number;
      net_proceeds?: number;
    };
    current_loan?: {
      balance: number;
      rate: number;
      remaining_term_months: number;
    };
    new_loan?: {
      amount: number;
      rate: number;
      term_months: number;
      fees: number;
    };
    savings?: {
      monthly_payment_reduction: number;
      total_interest_savings: number;
    };
  };
  financial_impact: {
    [key: string]: any; // Calculated values
  };
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  property_id: string;
  budget_year: number;
  budget_month: number | null;
  category: string;
  budgeted_amount: number;
  actual_amount: number;
  variance_threshold: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// KPI and calculation types
export interface PropertyKPI {
  property_id: string;
  legal_entity_id: string;
  portfolio_id: string;
  address: string;
  city: string;
  current_value: number;
  acquisition_price: number;
  acquisition_date: string;
  total_debt: number;
  total_monthly_payment: number;
  weighted_avg_interest_rate: number;
  ltv_ratio: number;
  annual_cashflow: number;
  avg_monthly_cashflow: number;
  annual_rental_income: number;
  annual_operating_expenses: number;
  annual_capex: number;
  gross_rental_yield: number;
  net_rental_yield: number;
  unrealized_capital_gain: number;
  capital_gain_percentage: number;
  dscr_ratio: number | null;
  calculated_at: string;
}

export interface PortfolioKPI {
  portfolio_id: string;
  user_id: string;
  portfolio_name: string;
  base_currency: CurrencyCode;
  baseline_date: string;
  total_properties: number;
  active_properties: number;
  total_property_value: number;
  total_acquisition_cost: number;
  total_debt: number;
  net_worth: number;
  portfolio_ltv: number;
  total_annual_cashflow: number;
  total_monthly_cashflow: number;
  total_rental_income: number;
  total_operating_expenses: number;
  total_capex: number;
  portfolio_gross_yield: number;
  portfolio_net_yield: number;
  portfolio_dscr: number | null;
  total_unrealized_gains: number;
  portfolio_capital_gain_percentage: number;
  calculated_at: string;
}

export interface MonthlyPortfolioPerformance {
  portfolio_id: string;
  month_year: string;
  monthly_rental_income: number;
  monthly_operating_expenses: number;
  monthly_capex: number;
  monthly_loan_payments: number;
  monthly_net_cashflow: number;
  cumulative_cashflow: number;
  calculated_at: string;
}

// Database type combining all tables
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      portfolios: {
        Row: Portfolio;
        Insert: Omit<Portfolio, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Portfolio, 'id' | 'created_at' | 'updated_at'>>;
      };
      legal_entities: {
        Row: LegalEntity;
        Insert: Omit<LegalEntity, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LegalEntity, 'id' | 'created_at' | 'updated_at'>>;
      };
      properties: {
        Row: Property;
        Insert: Omit<Property, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Property, 'id' | 'created_at' | 'updated_at'>>;
      };
      loans: {
        Row: Loan;
        Insert: Omit<Loan, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Loan, 'id' | 'created_at' | 'updated_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Transaction, 'id' | 'created_at' | 'updated_at'>>;
      };
      scenarios: {
        Row: Scenario;
        Insert: Omit<Scenario, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Scenario, 'id' | 'created_at' | 'updated_at'>>;
      };
      scenario_events: {
        Row: ScenarioEvent;
        Insert: Omit<ScenarioEvent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ScenarioEvent, 'id' | 'created_at' | 'updated_at'>>;
      };
      budgets: {
        Row: Budget;
        Insert: Omit<Budget, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Budget, 'id' | 'created_at' | 'updated_at'>>;
      };
      property_kpis: {
        Row: PropertyKPI;
      };
      portfolio_kpis: {
        Row: PortfolioKPI;
      };
      monthly_portfolio_performance: {
        Row: MonthlyPortfolioPerformance;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_monthly_cashflow: {
        Args: {
          property_uuid: string;
          start_date: string;
          end_date: string;
        };
        Returns: Array<{
          month_year: string;
          rental_income: number;
          operating_expenses: number;
          capex: number;
          net_cashflow: number;
        }>;
      };
      refresh_kpi_views: {
        Args: {};
        Returns: void;
      };
      user_has_portfolio_access: {
        Args: {
          portfolio_uuid: string;
          required_permission?: string;
        };
        Returns: boolean;
      };
      get_accessible_portfolio_ids: {
        Args: {};
        Returns: string[];
      };
    };
    Enums: {
      user_role: UserRole;
      currency_code: CurrencyCode;
      legal_entity_type: LegalEntityType;
      property_type: PropertyType;
      property_status: PropertyStatus;
      loan_type: LoanType;
      rate_type: RateType;
      loan_status: LoanStatus;
      transaction_type: TransactionType;
      scenario_type: ScenarioType;
      scenario_status: ScenarioStatus;
      scenario_event_type: ScenarioEventType;
    };
  };
}