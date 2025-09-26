import { Transaction, Property, LegalEntity } from '@/lib/types/database';

/**
 * SCI IS (Société Civile Immobilière à l'Impôt sur les Sociétés) Tax Calculation Engine
 * French corporate tax regime for real estate investment companies
 */

export interface SCIISTaxCalculation {
  gross_rental_income: number;
  operating_expenses: number;
  depreciation_allowance: number;
  interest_expenses: number;
  corporate_taxable_income: number;
  corporate_tax: number;
  distribution_income: number;
  personal_tax_on_distributions: number;
  total_tax_burden: number;
  net_after_tax_income: number;
  effective_tax_rate: number;
}

export interface SCIISDepreciationSchedule {
  building_value: number;
  annual_building_depreciation: number;
  furniture_value: number;
  annual_furniture_depreciation: number;
  total_annual_depreciation: number;
  remaining_depreciation_years: number;
}

export interface SCIISDistribution {
  net_profit: number;
  distribution_rate: number;
  distributed_amount: number;
  retained_earnings: number;
  personal_tax_rate: number;
  personal_tax_due: number;
}

/**
 * Calculate SCI IS depreciation schedule
 * @param propertyValue - Total property value
 * @param landValue - Value of land (not depreciable)
 * @param furnishingValue - Value of furniture and equipment
 * @param acquisitionDate - Property acquisition date
 * @param currentYear - Current tax year
 * @returns Depreciation schedule breakdown
 */
export function calculateSCIISDepreciation(
  propertyValue: number,
  landValue: number,
  furnishingValue: number,
  acquisitionDate: string,
  currentYear: number = new Date().getFullYear()
): SCIISDepreciationSchedule {
  const acquisitionYear = new Date(acquisitionDate).getFullYear();
  const yearsOwned = currentYear - acquisitionYear + 1;

  // Building depreciation (excluding land)
  const buildingValue = propertyValue - landValue;
  const BUILDING_DEPRECIATION_PERIOD = 40; // 40 years for buildings in SCI IS
  const annualBuildingDepreciation = yearsOwned <= BUILDING_DEPRECIATION_PERIOD
    ? buildingValue / BUILDING_DEPRECIATION_PERIOD
    : 0;

  // Furniture depreciation
  const FURNITURE_DEPRECIATION_PERIOD = 10; // 10 years for furniture
  const annualFurnitureDepreciation = yearsOwned <= FURNITURE_DEPRECIATION_PERIOD
    ? furnishingValue / FURNITURE_DEPRECIATION_PERIOD
    : 0;

  const totalAnnualDepreciation = annualBuildingDepreciation + annualFurnitureDepreciation;
  const remainingYears = Math.max(0, BUILDING_DEPRECIATION_PERIOD - yearsOwned + 1);

  return {
    building_value: buildingValue,
    annual_building_depreciation: Math.round(annualBuildingDepreciation * 100) / 100,
    furniture_value: furnishingValue,
    annual_furniture_depreciation: Math.round(annualFurnitureDepreciation * 100) / 100,
    total_annual_depreciation: Math.round(totalAnnualDepreciation * 100) / 100,
    remaining_depreciation_years: remainingYears,
  };
}

/**
 * Calculate SCI IS operating expenses from transactions
 * @param transactions - Property transactions for the tax year
 * @returns Categorized operating expenses
 */
export function calculateSCIISOperatingExpenses(transactions: Transaction[]): {
  property_management: number;
  insurance: number;
  maintenance_repairs: number;
  utilities: number;
  local_taxes: number;
  administrative_expenses: number;
  other_operating: number;
  total_operating_expenses: number;
} {
  const expenses = {
    property_management: 0,
    insurance: 0,
    maintenance_repairs: 0,
    utilities: 0,
    local_taxes: 0,
    administrative_expenses: 0,
    other_operating: 0,
    total_operating_expenses: 0,
  };

  transactions.forEach(transaction => {
    if (transaction.amount >= 0) return; // Only consider expense transactions

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
      case 'tax_payment':
        expenses.local_taxes += amount;
        break;
      case 'operating_expense':
        expenses.other_operating += amount;
        break;
      // Note: loan payments are handled separately for interest deduction
    }
  });

  expenses.total_operating_expenses = Object.values(expenses)
    .filter((_, index) => index < Object.keys(expenses).length - 1) // Exclude total
    .reduce((sum, expense) => sum + expense, 0);

  return expenses;
}

/**
 * Calculate interest expenses from loan payments
 * @param transactions - Loan payment transactions
 * @param loanDetails - Optional loan details for precise calculation
 * @returns Total deductible interest expenses
 */
export function calculateSCIISInterestExpenses(
  transactions: Transaction[],
  loanDetails?: {
    principal_balance: number;
    interest_rate: number;
    monthly_payment: number;
  }
): number {
  let totalInterest = 0;

  // If loan details provided, calculate precise interest
  if (loanDetails) {
    const annualInterest = loanDetails.principal_balance * (loanDetails.interest_rate / 100);
    return Math.round(annualInterest * 100) / 100;
  }

  // Otherwise, estimate from loan payments (simplified)
  const loanPayments = transactions.filter(t => t.transaction_type === 'loan_payment');
  const totalLoanPayments = loanPayments.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Assume 75% of loan payments are interest (simplified estimation)
  totalInterest = totalLoanPayments * 0.75;

  return Math.round(totalInterest * 100) / 100;
}

/**
 * Calculate corporate tax for SCI IS
 * @param taxableIncome - Corporate taxable income
 * @returns Corporate tax due
 */
export function calculateSCIISCorporateTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  // French corporate tax rates for 2024
  const REDUCED_RATE_THRESHOLD = 42500; // €42,500 threshold for reduced rate
  const REDUCED_RATE = 0.15; // 15% for profits up to €42,500
  const STANDARD_RATE = 0.25; // 25% for profits above €42,500

  let corporateTax = 0;

  if (taxableIncome <= REDUCED_RATE_THRESHOLD) {
    corporateTax = taxableIncome * REDUCED_RATE;
  } else {
    corporateTax = REDUCED_RATE_THRESHOLD * REDUCED_RATE +
                   (taxableIncome - REDUCED_RATE_THRESHOLD) * STANDARD_RATE;
  }

  return Math.round(corporateTax * 100) / 100;
}

/**
 * Calculate distributions and personal tax impact
 * @param netProfit - Net profit after corporate tax
 * @param distributionRate - Percentage of profit to distribute (0-1)
 * @param personalTaxRate - Partner's marginal personal tax rate
 * @returns Distribution calculation
 */
export function calculateSCIISDistributions(
  netProfit: number,
  distributionRate: number = 0.8, // Default 80% distribution
  personalTaxRate: number = 0.30 // Default 30% personal tax rate
): SCIISDistribution {
  const distributedAmount = netProfit * distributionRate;
  const retainedEarnings = netProfit - distributedAmount;

  // Personal tax on distributions (simplified - actual calculation more complex)
  const personalTaxDue = distributedAmount * personalTaxRate;

  return {
    net_profit: Math.round(netProfit * 100) / 100,
    distribution_rate: distributionRate,
    distributed_amount: Math.round(distributedAmount * 100) / 100,
    retained_earnings: Math.round(retainedEarnings * 100) / 100,
    personal_tax_rate: personalTaxRate,
    personal_tax_due: Math.round(personalTaxDue * 100) / 100,
  };
}

/**
 * Calculate complete SCI IS tax analysis
 * @param grossRentalIncome - Annual gross rental income
 * @param transactions - Property transactions for tax year
 * @param property - Property details
 * @param landValue - Value of land portion
 * @param furnishingValue - Value of furniture and equipment
 * @param legalEntity - SCI legal entity details
 * @param distributionRate - Distribution rate (default 80%)
 * @param personalTaxRate - Partner's personal tax rate (default 30%)
 * @returns Complete SCI IS tax calculation
 */
export function calculateSCIISTax(
  grossRentalIncome: number,
  transactions: Transaction[],
  property: Property,
  landValue: number,
  furnishingValue: number,
  legalEntity?: LegalEntity,
  distributionRate: number = 0.8,
  personalTaxRate: number = 0.30
): SCIISTaxCalculation {
  // Calculate operating expenses
  const operatingExpenses = calculateSCIISOperatingExpenses(transactions);

  // Calculate depreciation
  const depreciation = calculateSCIISDepreciation(
    property.current_value,
    landValue,
    furnishingValue,
    property.acquisition_date
  );

  // Calculate interest expenses
  const interestExpenses = calculateSCIISInterestExpenses(transactions);

  // Calculate corporate taxable income
  const corporateTaxableIncome = Math.max(0,
    grossRentalIncome -
    operatingExpenses.total_operating_expenses -
    depreciation.total_annual_depreciation -
    interestExpenses
  );

  // Calculate corporate tax
  const corporateTax = calculateSCIISCorporateTax(corporateTaxableIncome);

  // Calculate net profit after corporate tax
  const netProfit = corporateTaxableIncome - corporateTax;

  // Calculate distributions and personal tax
  const distributions = calculateSCIISDistributions(netProfit, distributionRate, personalTaxRate);

  // Calculate total tax burden and net income
  const totalTaxBurden = corporateTax + distributions.personal_tax_due;
  const netAfterTaxIncome = grossRentalIncome - operatingExpenses.total_operating_expenses - totalTaxBurden;
  const effectiveTaxRate = grossRentalIncome > 0 ? (totalTaxBurden / grossRentalIncome) * 100 : 0;

  return {
    gross_rental_income: grossRentalIncome,
    operating_expenses: operatingExpenses.total_operating_expenses,
    depreciation_allowance: depreciation.total_annual_depreciation,
    interest_expenses: interestExpenses,
    corporate_taxable_income: corporateTaxableIncome,
    corporate_tax: corporateTax,
    distribution_income: distributions.distributed_amount,
    personal_tax_on_distributions: distributions.personal_tax_due,
    total_tax_burden: totalTaxBurden,
    net_after_tax_income: netAfterTaxIncome,
    effective_tax_rate: Math.round(effectiveTaxRate * 100) / 100,
  };
}

/**
 * Calculate SCI IS cash flow projection over multiple years
 * @param property - Property details
 * @param landValue - Land value
 * @param furnishingValue - Initial furnishing value
 * @param annualRent - Annual rental income
 * @param annualExpenses - Annual operating expenses
 * @param annualInterest - Annual interest expenses
 * @param distributionRate - Distribution rate
 * @param personalTaxRate - Personal tax rate
 * @param projectionYears - Number of years to project
 * @returns Year-by-year cash flow projection
 */
export function calculateSCIISProjection(
  property: Property,
  landValue: number,
  furnishingValue: number,
  annualRent: number,
  annualExpenses: number,
  annualInterest: number,
  distributionRate: number = 0.8,
  personalTaxRate: number = 0.30,
  projectionYears: number = 10
): Array<{
  year: number;
  rental_income: number;
  operating_expenses: number;
  interest_expenses: number;
  depreciation: number;
  corporate_taxable_income: number;
  corporate_tax: number;
  net_profit: number;
  distributions: number;
  personal_tax: number;
  total_tax: number;
  net_cash_flow: number;
  effective_tax_rate: number;
}> {
  const results = [];
  const acquisitionYear = new Date(property.acquisition_date).getFullYear();

  for (let year = 1; year <= projectionYears; year++) {
    const currentYear = acquisitionYear + year - 1;

    // Apply annual increases
    const yearlyRent = annualRent * Math.pow(1.02, year - 1); // 2% rent increase
    const yearlyExpenses = annualExpenses * Math.pow(1.02, year - 1); // 2% expense increase
    const yearlyInterest = annualInterest * Math.pow(0.98, year - 1); // Interest decreases as loan is paid down

    // Calculate depreciation for this year
    const depreciation = calculateSCIISDepreciation(
      property.current_value,
      landValue,
      furnishingValue,
      property.acquisition_date,
      currentYear
    );

    // Calculate corporate taxable income
    const corporateTaxableIncome = Math.max(0,
      yearlyRent - yearlyExpenses - depreciation.total_annual_depreciation - yearlyInterest
    );

    // Calculate corporate tax
    const corporateTax = calculateSCIISCorporateTax(corporateTaxableIncome);

    // Calculate net profit and distributions
    const netProfit = corporateTaxableIncome - corporateTax;
    const distributions = netProfit * distributionRate;
    const personalTax = distributions * personalTaxRate;

    // Calculate totals
    const totalTax = corporateTax + personalTax;
    const netCashFlow = yearlyRent - yearlyExpenses - totalTax;
    const effectiveTaxRate = yearlyRent > 0 ? (totalTax / yearlyRent) * 100 : 0;

    results.push({
      year: year,
      rental_income: Math.round(yearlyRent),
      operating_expenses: Math.round(yearlyExpenses),
      interest_expenses: Math.round(yearlyInterest),
      depreciation: Math.round(depreciation.total_annual_depreciation),
      corporate_taxable_income: Math.round(corporateTaxableIncome),
      corporate_tax: Math.round(corporateTax),
      net_profit: Math.round(netProfit),
      distributions: Math.round(distributions),
      personal_tax: Math.round(personalTax),
      total_tax: Math.round(totalTax),
      net_cash_flow: Math.round(netCashFlow),
      effective_tax_rate: Math.round(effectiveTaxRate * 100) / 100,
    });
  }

  return results;
}

/**
 * Compare SCI IS vs LMNP tax efficiency
 * @param grossRentalIncome - Annual gross rental income
 * @param operatingExpenses - Annual operating expenses
 * @param interestExpenses - Annual interest expenses
 * @param depreciation - Annual depreciation allowance
 * @param personalTaxRate - Personal marginal tax rate
 * @returns Comparison analysis
 */
export function compareSCIISvsLMNP(
  grossRentalIncome: number,
  operatingExpenses: number,
  interestExpenses: number,
  depreciation: number,
  personalTaxRate: number = 0.30
): {
  sci_is_tax: number;
  sci_is_net_income: number;
  lmnp_tax: number;
  lmnp_net_income: number;
  recommended_regime: 'SCI_IS' | 'LMNP';
  tax_savings: number;
} {
  // SCI IS calculation
  const sciTaxableIncome = Math.max(0, grossRentalIncome - operatingExpenses - depreciation - interestExpenses);
  const sciCorporateTax = calculateSCIISCorporateTax(sciTaxableIncome);
  const sciNetProfit = sciTaxableIncome - sciCorporateTax;
  const sciDistributions = sciNetProfit * 0.8; // 80% distribution
  const sciPersonalTax = sciDistributions * personalTaxRate;
  const sciTotalTax = sciCorporateTax + sciPersonalTax;
  const sciNetIncome = grossRentalIncome - operatingExpenses - sciTotalTax;

  // LMNP calculation (simplified)
  const lmnpTaxableIncome = Math.max(0, grossRentalIncome - operatingExpenses - depreciation);
  const lmnpTax = lmnpTaxableIncome * personalTaxRate;
  const lmnpNetIncome = grossRentalIncome - operatingExpenses - lmnpTax;

  const recommended = sciNetIncome > lmnpNetIncome ? 'SCI_IS' : 'LMNP';
  const taxSavings = Math.abs(sciTotalTax - lmnpTax);

  return {
    sci_is_tax: Math.round(sciTotalTax),
    sci_is_net_income: Math.round(sciNetIncome),
    lmnp_tax: Math.round(lmnpTax),
    lmnp_net_income: Math.round(lmnpNetIncome),
    recommended_regime: recommended,
    tax_savings: Math.round(taxSavings),
  };
}