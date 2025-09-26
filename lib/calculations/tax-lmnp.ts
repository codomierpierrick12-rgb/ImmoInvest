import { Transaction, Property } from '@/lib/types/database';

/**
 * LMNP (Location Meublée Non Professionnelle) Tax Calculation Engine
 * French tax regime for furnished rental properties
 */

export interface LMNPTaxCalculation {
  gross_rental_income: number;
  deductible_expenses: number;
  depreciation_allowance: number;
  taxable_income: number;
  tax_savings: number;
  net_after_tax_income: number;
  micro_bic_income?: number;
  micro_bic_tax?: number;
  regime_recommendation: 'micro_bic' | 'reel';
}

export interface LMNPExpenseBreakdown {
  property_management: number;
  insurance: number;
  maintenance_repairs: number;
  utilities: number;
  financing_costs: number;
  local_taxes: number;
  depreciation: number;
  other: number;
}

/**
 * Calculate LMNP depreciation allowance based on property value and furnishing
 * @param propertyValue - Total property value including furnishing
 * @param furnishingValue - Value of furniture and equipment
 * @param acquisitionDate - Property acquisition date
 * @param currentYear - Current tax year
 * @returns Annual depreciation allowance
 */
export function calculateLMNPDepreciation(
  propertyValue: number,
  furnishingValue: number,
  acquisitionDate: string,
  currentYear: number = new Date().getFullYear()
): number {
  const acquisitionYear = new Date(acquisitionDate).getFullYear();
  const yearsOwned = currentYear - acquisitionYear + 1;

  // Property depreciation: no depreciation for LMNP on property itself
  // Only furniture and equipment can be depreciated

  // Furniture depreciation rates (French tax law)
  const furnitureDepreciationRate = 0.20; // 20% per year for 5 years
  const equipmentDepreciationRate = 0.10; // 10% per year for 10 years

  // Split furnishing value (80% furniture, 20% equipment as typical assumption)
  const furnitureValue = furnishingValue * 0.8;
  const equipmentValue = furnishingValue * 0.2;

  // Calculate depreciation if still within depreciation period
  let totalDepreciation = 0;

  // Furniture (5-year depreciation)
  if (yearsOwned <= 5) {
    totalDepreciation += furnitureValue * furnitureDepreciationRate;
  }

  // Equipment (10-year depreciation)
  if (yearsOwned <= 10) {
    totalDepreciation += equipmentValue * equipmentDepreciationRate;
  }

  return Math.round(totalDepreciation * 100) / 100;
}

/**
 * Calculate LMNP deductible expenses from transactions
 * @param transactions - Property transactions for the tax year
 * @param propertyValue - Property value for depreciation calculation
 * @param furnishingValue - Furnishing value
 * @param acquisitionDate - Property acquisition date
 * @returns Breakdown of deductible expenses
 */
export function calculateLMNPExpenses(
  transactions: Transaction[],
  propertyValue: number,
  furnishingValue: number,
  acquisitionDate: string
): LMNPExpenseBreakdown {
  const expenses: LMNPExpenseBreakdown = {
    property_management: 0,
    insurance: 0,
    maintenance_repairs: 0,
    utilities: 0,
    financing_costs: 0,
    local_taxes: 0,
    depreciation: 0,
    other: 0,
  };

  // Categorize expenses from transactions
  transactions.forEach(transaction => {
    const amount = Math.abs(transaction.amount);

    switch (transaction.transaction_type) {
      case 'management_fee':
        expenses.property_management += amount;
        break;
      case 'insurance_payment':
        expenses.insurance += amount;
        break;
      case 'repair_maintenance':
        expenses.maintenance_repairs += amount;
        break;
      case 'utility_payment':
        expenses.utilities += amount;
        break;
      case 'loan_payment':
        // Only interest portion is deductible, not principal
        // This is a simplified calculation - in practice, need amortization schedule
        expenses.financing_costs += amount * 0.7; // Assume 70% is interest
        break;
      case 'tax_payment':
        expenses.local_taxes += amount;
        break;
      case 'operating_expense':
        expenses.other += amount;
        break;
    }
  });

  // Add depreciation allowance
  expenses.depreciation = calculateLMNPDepreciation(
    propertyValue,
    furnishingValue,
    acquisitionDate
  );

  return expenses;
}

/**
 * Calculate Micro-BIC regime (simplified taxation)
 * @param grossRentalIncome - Annual gross rental income
 * @returns Tax calculation under Micro-BIC regime
 */
export function calculateMicroBIC(grossRentalIncome: number): {
  taxable_income: number;
  allowance: number;
} {
  const MICRO_BIC_ALLOWANCE_RATE = 0.50; // 50% allowance for furnished rentals
  const allowance = grossRentalIncome * MICRO_BIC_ALLOWANCE_RATE;
  const taxableIncome = grossRentalIncome - allowance;

  return {
    taxable_income: Math.max(0, taxableIncome),
    allowance: allowance,
  };
}

/**
 * Calculate LMNP tax under Real regime (with actual expenses)
 * @param grossRentalIncome - Annual gross rental income
 * @param expenses - Breakdown of deductible expenses
 * @returns Tax calculation under Real regime
 */
export function calculateLMNPRealRegime(
  grossRentalIncome: number,
  expenses: LMNPExpenseBreakdown
): {
  taxable_income: number;
  total_deductible_expenses: number;
  tax_savings: number;
} {
  const totalDeductibleExpenses = Object.values(expenses).reduce((sum, expense) => sum + expense, 0);
  const taxableIncome = Math.max(0, grossRentalIncome - totalDeductibleExpenses);

  // Tax savings compared to no deductions
  const marginalTaxRate = 0.30; // Assumed marginal tax rate (simplified)
  const taxSavings = totalDeductibleExpenses * marginalTaxRate;

  return {
    taxable_income: taxableIncome,
    total_deductible_expenses: totalDeductibleExpenses,
    tax_savings: taxSavings,
  };
}

/**
 * Calculate complete LMNP tax analysis
 * @param grossRentalIncome - Annual gross rental income
 * @param transactions - Property transactions for tax year
 * @param property - Property details
 * @param furnishingValue - Value of furniture and equipment
 * @param marginalTaxRate - Taxpayer's marginal tax rate (default 30%)
 * @returns Complete LMNP tax calculation with regime recommendation
 */
export function calculateLMNPTax(
  grossRentalIncome: number,
  transactions: Transaction[],
  property: Property,
  furnishingValue: number,
  marginalTaxRate: number = 0.30
): LMNPTaxCalculation {
  // Calculate Micro-BIC regime
  const microBIC = calculateMicroBIC(grossRentalIncome);
  const microBICTax = microBIC.taxable_income * marginalTaxRate;

  // Calculate Real regime
  const expenses = calculateLMNPExpenses(
    transactions,
    property.current_value,
    furnishingValue,
    property.acquisition_date
  );

  const realRegime = calculateLMNPRealRegime(grossRentalIncome, expenses);
  const realRegimeTax = realRegime.taxable_income * marginalTaxRate;

  // Determine optimal regime
  const shouldUseRealRegime = realRegimeTax < microBICTax;
  const regime: 'micro_bic' | 'reel' = shouldUseRealRegime ? 'reel' : 'micro_bic';

  // Calculate final results based on optimal regime
  const taxableIncome = shouldUseRealRegime ? realRegime.taxable_income : microBIC.taxable_income;
  const finalTax = shouldUseRealRegime ? realRegimeTax : microBICTax;
  const netAfterTaxIncome = grossRentalIncome - finalTax;

  return {
    gross_rental_income: grossRentalIncome,
    deductible_expenses: shouldUseRealRegime ? realRegime.total_deductible_expenses : 0,
    depreciation_allowance: shouldUseRealRegime ? expenses.depreciation : 0,
    taxable_income: taxableIncome,
    tax_savings: shouldUseRealRegime ? realRegime.tax_savings : microBIC.allowance * marginalTaxRate,
    net_after_tax_income: netAfterTaxIncome,
    micro_bic_income: microBIC.taxable_income,
    micro_bic_tax: microBICTax,
    regime_recommendation: regime,
  };
}

/**
 * Calculate LMNP cash flow projection over multiple years
 * @param property - Property details
 * @param furnishingValue - Initial furnishing value
 * @param annualRent - Annual rental income
 * @param annualExpenses - Annual operating expenses (excluding depreciation)
 * @param marginalTaxRate - Taxpayer's marginal tax rate
 * @param projectionYears - Number of years to project
 * @returns Year-by-year cash flow projection
 */
export function calculateLMNPProjection(
  property: Property,
  furnishingValue: number,
  annualRent: number,
  annualExpenses: number,
  marginalTaxRate: number = 0.30,
  projectionYears: number = 10
): Array<{
  year: number;
  rental_income: number;
  operating_expenses: number;
  depreciation: number;
  taxable_income: number;
  tax_due: number;
  net_cash_flow: number;
  regime_used: 'micro_bic' | 'reel';
}> {
  const results = [];
  const acquisitionYear = new Date(property.acquisition_date).getFullYear();

  for (let year = 1; year <= projectionYears; year++) {
    const currentYear = acquisitionYear + year - 1;

    // Apply annual rent increase (2% assumed)
    const yearlyRent = annualRent * Math.pow(1.02, year - 1);
    const yearlyExpenses = annualExpenses * Math.pow(1.02, year - 1);

    // Calculate depreciation for this year
    const depreciation = calculateLMNPDepreciation(
      property.current_value,
      furnishingValue,
      property.acquisition_date,
      currentYear
    );

    // Micro-BIC calculation
    const microBIC = calculateMicroBIC(yearlyRent);
    const microBICTax = microBIC.taxable_income * marginalTaxRate;

    // Real regime calculation
    const totalExpenses = yearlyExpenses + depreciation;
    const realTaxableIncome = Math.max(0, yearlyRent - totalExpenses);
    const realTax = realTaxableIncome * marginalTaxRate;

    // Choose optimal regime
    const shouldUseReal = realTax < microBICTax;
    const regime: 'micro_bic' | 'reel' = shouldUseReal ? 'reel' : 'micro_bic';

    const taxableIncome = shouldUseReal ? realTaxableIncome : microBIC.taxable_income;
    const taxDue = shouldUseReal ? realTax : microBICTax;
    const netCashFlow = yearlyRent - yearlyExpenses - taxDue;

    results.push({
      year: year,
      rental_income: Math.round(yearlyRent),
      operating_expenses: Math.round(yearlyExpenses),
      depreciation: Math.round(depreciation),
      taxable_income: Math.round(taxableIncome),
      tax_due: Math.round(taxDue),
      net_cash_flow: Math.round(netCashFlow),
      regime_used: regime,
    });
  }

  return results;
}