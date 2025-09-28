import {
  FiscalRegime,
  LMNPSettings,
  SCIISSettings,
  TaxCalculationResult,
  CapitalGainsSettings,
  TaxReferenceData,
  EnhancedLegalEntity
} from '@/lib/types/fiscal';
import { Transaction, Property } from '@/lib/types/database';

/**
 * Stoneverse Fiscal Calculation Engine
 * Handles LMNP, SCI IS tax calculations according to French tax law
 */

// Default tax reference data for 2023
export const DEFAULT_TAX_REFERENCE: TaxReferenceData = {
  year: 2023,
  income_tax_brackets: [
    { min_income: 0, max_income: 10777, rate: 0 },
    { min_income: 10777, max_income: 27478, rate: 0.11 },
    { min_income: 27478, max_income: 78570, rate: 0.30 },
    { min_income: 78570, max_income: 168994, rate: 0.41 },
    { min_income: 168994, max_income: null, rate: 0.45 }
  ],
  social_charges_rate: 0.172, // 17.2%
  corporate_tax_rates: {
    standard: 0.25, // 25%
    reduced: 0.15, // 15%
    reduced_threshold: 42500 // 42,500€
  },
  irl_index: [
    { quarter: '2023-Q1', value: 135.41 },
    { quarter: '2023-Q2', value: 137.56 },
    { quarter: '2023-Q3', value: 139.98 },
    { quarter: '2023-Q4', value: 142.01 }
  ],
  inflation_rate: 0.048, // 4.8% in 2023
  capital_gains_allowances: {
    lmnp: {
      income_tax: [
        { years: 5, rate: 0 },
        { years: 6, rate: 0.06 },
        { years: 21, rate: 0.06 },
        { years: 22, rate: 0.04 }
      ],
      social_charges: [
        { years: 5, rate: 0 },
        { years: 6, rate: 0.0165 },
        { years: 21, rate: 0.0165 },
        { years: 22, rate: 0.09 }
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

/**
 * Calculate annual depreciation for LMNP regime
 */
export function calculateLMNPDepreciation(
  property: Property,
  lmnpSettings: LMNPSettings,
  acquisitionYear: number,
  currentYear: number
): { [component: string]: number } {
  const yearsHeld = currentYear - acquisitionYear;
  const depreciation: { [component: string]: number } = {};

  // Building depreciation (excluding land)
  const buildingValue = property.acquisition_price * (1 - lmnpSettings.land_percentage / 100);
  depreciation.building = Math.min(
    buildingValue * lmnpSettings.depreciation_components.building.rate / 100,
    lmnpSettings.depreciation_components.building.base_amount
  );

  // Furniture depreciation
  depreciation.furniture = Math.min(
    lmnpSettings.depreciation_components.furniture.base_amount *
    lmnpSettings.depreciation_components.furniture.rate / 100,
    lmnpSettings.depreciation_components.furniture.base_amount
  );

  // Equipment depreciation
  depreciation.equipment = Math.min(
    lmnpSettings.depreciation_components.equipment.base_amount *
    lmnpSettings.depreciation_components.equipment.rate / 100,
    lmnpSettings.depreciation_components.equipment.base_amount
  );

  // Works depreciation
  depreciation.works = Math.min(
    lmnpSettings.depreciation_components.works.base_amount *
    lmnpSettings.depreciation_components.works.rate / 100,
    lmnpSettings.depreciation_components.works.base_amount
  );

  return depreciation;
}

/**
 * Calculate LMNP annual tax result
 */
export function calculateLMNPTaxResult(
  property: Property,
  entity: EnhancedLegalEntity,
  transactions: Transaction[],
  year: number,
  taxRef: TaxReferenceData = DEFAULT_TAX_REFERENCE
): TaxCalculationResult {
  const lmnpSettings = entity.fiscal_settings.lmnp!;

  // Filter transactions for the year
  const yearTransactions = transactions.filter(t =>
    new Date(t.transaction_date).getFullYear() === year
  );

  // Calculate gross rental income
  const grossRentalIncome = yearTransactions
    .filter(t => t.transaction_type === 'rental_income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate deductible expenses
  const deductibleExpenses = yearTransactions
    .filter(t => t.tax_deductible && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Calculate annual depreciation
  const acquisitionYear = new Date(property.acquisition_date).getFullYear();
  const depreciationComponents = calculateLMNPDepreciation(
    property,
    lmnpSettings,
    acquisitionYear,
    year
  );

  const totalDepreciation = Object.values(depreciationComponents).reduce((sum, amount) => sum + amount, 0);

  // LMNP rule: Cannot create BIC deficit with depreciation
  const operatingResult = grossRentalIncome - deductibleExpenses;
  const applicableDepreciation = lmnpSettings.depreciation_limit.prevent_bic_deficit ?
    Math.min(totalDepreciation, Math.max(0, operatingResult)) :
    totalDepreciation;

  const taxableResult = Math.max(0, operatingResult - applicableDepreciation);

  // For LMNP, no direct tax calculation (integrated with personal income tax)
  // This would be handled at portfolio/user level
  const taxDue = 0; // Placeholder
  const effectiveTaxRate = taxableResult > 0 ? taxDue / taxableResult : 0;

  return {
    fiscal_regime: 'lmnp',
    annual_result: {
      gross_rental_income: grossRentalIncome,
      deductible_expenses: deductibleExpenses,
      depreciation_total: applicableDepreciation,
      taxable_result: taxableResult,
      tax_due: taxDue,
      effective_tax_rate: effectiveTaxRate
    },
    depreciation_detail: Object.entries(depreciationComponents).map(([component, amount]) => ({
      component: component as 'building' | 'furniture' | 'equipment' | 'works',
      annual_amount: amount,
      remaining_base: lmnpSettings.depreciation_components[component as keyof typeof lmnpSettings.depreciation_components].base_amount,
      years_remaining: Math.ceil(lmnpSettings.depreciation_components[component as keyof typeof lmnpSettings.depreciation_components].base_amount / amount)
    }))
  };
}

/**
 * Calculate SCI IS annual tax result
 */
export function calculateSCIISTaxResult(
  property: Property,
  entity: EnhancedLegalEntity,
  transactions: Transaction[],
  year: number,
  taxRef: TaxReferenceData = DEFAULT_TAX_REFERENCE
): TaxCalculationResult {
  const sciSettings = entity.fiscal_settings.sci_is!;

  // Filter transactions for the year
  const yearTransactions = transactions.filter(t =>
    new Date(t.transaction_date).getFullYear() === year
  );

  // Calculate gross rental income
  const grossRentalIncome = yearTransactions
    .filter(t => t.transaction_type === 'rental_income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate deductible expenses
  const deductibleExpenses = yearTransactions
    .filter(t => t.tax_deductible && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Calculate annual depreciation (similar to LMNP but no deficit limitation)
  const acquisitionYear = new Date(property.acquisition_date).getFullYear();
  const depreciationComponents = Object.entries(sciSettings.depreciation_components).reduce((acc, [component, settings]) => {
    acc[component] = settings.base_amount * settings.rate / 100;
    return acc;
  }, {} as { [key: string]: number });

  const totalDepreciation = Object.values(depreciationComponents).reduce((sum, amount) => sum + amount, 0);

  // SCI IS: Result can be negative (deficit carryforward allowed)
  const taxableResult = grossRentalIncome - deductibleExpenses - totalDepreciation;

  // Calculate corporate tax (IS)
  let taxDue = 0;
  if (taxableResult > 0) {
    // Reduced rate on first 42,500€
    const reducedTaxBase = Math.min(taxableResult, sciSettings.corporate_tax.reduced_rate_threshold);
    const standardTaxBase = Math.max(0, taxableResult - sciSettings.corporate_tax.reduced_rate_threshold);

    taxDue = (reducedTaxBase * sciSettings.corporate_tax.reduced_rate / 100) +
             (standardTaxBase * sciSettings.corporate_tax.standard_rate / 100);
  }

  const effectiveTaxRate = taxableResult > 0 ? taxDue / taxableResult : 0;

  return {
    fiscal_regime: 'sci_is',
    annual_result: {
      gross_rental_income: grossRentalIncome,
      deductible_expenses: deductibleExpenses,
      depreciation_total: totalDepreciation,
      taxable_result: taxableResult,
      tax_due: taxDue,
      effective_tax_rate: effectiveTaxRate
    },
    depreciation_detail: Object.entries(depreciationComponents).map(([component, amount]) => ({
      component: component as 'building' | 'furniture' | 'equipment' | 'works',
      annual_amount: amount,
      remaining_base: sciSettings.depreciation_components[component as keyof typeof sciSettings.depreciation_components].base_amount,
      years_remaining: Math.ceil(sciSettings.depreciation_components[component as keyof typeof sciSettings.depreciation_components].base_amount / amount)
    }))
  };
}

/**
 * Calculate capital gains on property sale
 */
export function calculateCapitalGains(
  property: Property,
  entity: EnhancedLegalEntity,
  salePrice: number,
  saleCosts: number,
  saleDate: Date,
  taxRef: TaxReferenceData = DEFAULT_TAX_REFERENCE
): TaxCalculationResult['capital_gains'] {
  const acquisitionDate = new Date(property.acquisition_date);
  const yearsHeld = Math.floor((saleDate.getTime() - acquisitionDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  const grossCapitalGain = salePrice - property.acquisition_price - property.acquisition_costs.total_acquisition_costs! - saleCosts;

  if (entity.type === 'lmnp') {
    // LMNP: Private capital gains with allowances
    const capitalGainsSettings = entity.fiscal_settings.capital_gains.lmnp;

    // Calculate allowances for income tax
    let incomeTaxAllowance = 0;
    for (const bracket of capitalGainsSettings.income_tax_allowances) {
      if (yearsHeld >= bracket.years_held) {
        const applicableYears = yearsHeld - bracket.years_held;
        incomeTaxAllowance += applicableYears * bracket.allowance_rate;
      }
    }
    incomeTaxAllowance = Math.min(incomeTaxAllowance, 1); // Max 100%

    // Calculate allowances for social charges
    let socialChargesAllowance = 0;
    for (const bracket of capitalGainsSettings.social_charges_allowances) {
      if (yearsHeld >= bracket.years_held) {
        const applicableYears = yearsHeld - bracket.years_held;
        socialChargesAllowance += applicableYears * bracket.allowance_rate;
      }
    }
    socialChargesAllowance = Math.min(socialChargesAllowance, 1); // Max 100%

    const taxableGainIncomeTax = grossCapitalGain * (1 - incomeTaxAllowance);
    const taxableGainSocialCharges = grossCapitalGain * (1 - socialChargesAllowance);

    // Standard rates: 19% income tax + 17.2% social charges
    const incomeTax = Math.max(0, taxableGainIncomeTax * 0.19);
    const socialCharges = Math.max(0, taxableGainSocialCharges * taxRef.social_charges_rate);

    // Calculate surcharge if applicable
    let surcharge = 0;
    if (grossCapitalGain > capitalGainsSettings.surcharge_threshold) {
      for (const tier of taxRef.capital_gains_allowances.surcharge_thresholds) {
        if (grossCapitalGain > tier.threshold) {
          surcharge = grossCapitalGain * tier.rate;
        }
      }
    }

    const totalTax = incomeTax + socialCharges + surcharge;
    const netProceeds = salePrice - saleCosts - totalTax;

    return {
      sale_price: salePrice,
      acquisition_cost: property.acquisition_price + property.acquisition_costs.total_acquisition_costs!,
      works_cost: 0, // Would need to be tracked separately
      sale_costs: saleCosts,
      gross_capital_gain: grossCapitalGain,
      allowances_applied: (incomeTaxAllowance + socialChargesAllowance) / 2 * grossCapitalGain,
      taxable_capital_gain: (taxableGainIncomeTax + taxableGainSocialCharges) / 2,
      income_tax: incomeTax,
      social_charges: socialCharges,
      surcharge: surcharge,
      total_tax: totalTax,
      net_proceeds: netProceeds
    };
  } else if (entity.type === 'sci_is') {
    // SCI IS: Professional capital gains (integrated with IS)
    const corporateTaxRate = taxRef.corporate_tax_rates.standard;

    // TODO: Calculate book value (acquisition cost - accumulated depreciation)
    const bookValue = property.acquisition_price; // Simplified - should subtract accumulated depreciation
    const accountingGain = salePrice - saleCosts - bookValue;

    const totalTax = Math.max(0, accountingGain * corporateTaxRate);
    const netProceeds = salePrice - saleCosts - totalTax;

    return {
      sale_price: salePrice,
      acquisition_cost: property.acquisition_price,
      works_cost: 0,
      sale_costs: saleCosts,
      gross_capital_gain: accountingGain,
      allowances_applied: 0,
      taxable_capital_gain: accountingGain,
      income_tax: 0,
      social_charges: 0,
      surcharge: 0,
      total_tax: totalTax,
      net_proceeds: netProceeds
    };
  }

  return undefined;
}

/**
 * Get default fiscal settings for entity type
 */
export function getDefaultFiscalSettings(entityType: FiscalRegime): EnhancedLegalEntity['fiscal_settings'] {
  const defaultSettings: EnhancedLegalEntity['fiscal_settings'] = {
    capital_gains: {
      lmnp: {
        income_tax_allowances: DEFAULT_TAX_REFERENCE.capital_gains_allowances.lmnp.income_tax,
        social_charges_allowances: DEFAULT_TAX_REFERENCE.capital_gains_allowances.lmnp.social_charges,
        surcharge_threshold: 50000,
        surcharge_rates: DEFAULT_TAX_REFERENCE.capital_gains_allowances.surcharge_thresholds,
        depreciation_recapture: false
      },
      sci_is: {
        corporate_tax_rate: DEFAULT_TAX_REFERENCE.corporate_tax_rates.standard,
        depreciation_recapture: true,
        special_allowances: []
      }
    }
  };

  if (entityType === 'lmnp') {
    defaultSettings.lmnp = {
      depreciation_components: {
        building: { rate: 2.5, base_amount: 0 },
        furniture: { rate: 10, base_amount: 0 },
        equipment: { rate: 20, base_amount: 0 },
        works: { rate: 10, base_amount: 0 }
      },
      land_percentage: 10,
      depreciation_limit: {
        prevent_bic_deficit: true
      }
    };
  } else if (entityType === 'sci_is') {
    defaultSettings.sci_is = {
      corporate_tax: {
        standard_rate: DEFAULT_TAX_REFERENCE.corporate_tax_rates.standard,
        reduced_rate: DEFAULT_TAX_REFERENCE.corporate_tax_rates.reduced,
        reduced_rate_threshold: DEFAULT_TAX_REFERENCE.corporate_tax_rates.reduced_threshold
      },
      depreciation_components: {
        building: { rate: 2.5, base_amount: 0 },
        furniture: { rate: 10, base_amount: 0 },
        equipment: { rate: 20, base_amount: 0 },
        works: { rate: 10, base_amount: 0 }
      },
      deficit_carryforward: {
        enabled: true,
        max_years: 999 // Unlimited for SCI IS
      }
    };
  }

  return defaultSettings;
}