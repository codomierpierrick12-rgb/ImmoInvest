import { PropertyKPI, PortfolioKPI, Transaction, Property, Loan } from '@/lib/types/database';

/**
 * Calculate Loan-to-Value ratio
 * @param totalDebt - Total outstanding debt
 * @param propertyValue - Current property value
 * @returns LTV ratio as percentage
 */
export function calculateLTV(totalDebt: number, propertyValue: number): number {
  if (propertyValue <= 0) return 0;
  return Math.round((totalDebt / propertyValue) * 100 * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate Debt Service Coverage Ratio
 * @param netOperatingIncome - Annual net operating income
 * @param totalDebtService - Annual debt service (loan payments)
 * @returns DSCR ratio
 */
export function calculateDSCR(netOperatingIncome: number, totalDebtService: number): number | null {
  if (totalDebtService <= 0) return null;
  return Math.round((netOperatingIncome / totalDebtService) * 100) / 100;
}

/**
 * Calculate rental yield
 * @param annualRentalIncome - Annual rental income
 * @param propertyValue - Property value
 * @returns Rental yield as percentage
 */
export function calculateRentalYield(annualRentalIncome: number, propertyValue: number): number {
  if (propertyValue <= 0) return 0;
  return Math.round((annualRentalIncome / propertyValue) * 100 * 100) / 100;
}

/**
 * Calculate capital gain percentage
 * @param currentValue - Current property value
 * @param acquisitionPrice - Original acquisition price
 * @returns Capital gain as percentage
 */
export function calculateCapitalGainPercentage(currentValue: number, acquisitionPrice: number): number {
  if (acquisitionPrice <= 0) return 0;
  return Math.round(((currentValue - acquisitionPrice) / acquisitionPrice) * 100 * 100) / 100;
}

/**
 * Calculate weighted average interest rate
 * @param loans - Array of loans
 * @returns Weighted average interest rate
 */
export function calculateWeightedAverageRate(loans: Loan[]): number {
  const activeLoans = loans.filter(loan => loan.status === 'active' && loan.current_balance > 0);

  if (activeLoans.length === 0) return 0;

  const totalWeightedRate = activeLoans.reduce((sum, loan) => {
    return sum + (loan.interest_rate * loan.current_balance);
  }, 0);

  const totalBalance = activeLoans.reduce((sum, loan) => sum + loan.current_balance, 0);

  if (totalBalance <= 0) return 0;

  return Math.round((totalWeightedRate / totalBalance) * 100) / 100;
}

/**
 * Calculate annual cash flow from transactions
 * @param transactions - Array of transactions
 * @param months - Number of months to look back (default: 12)
 * @returns Annual cash flow
 */
export function calculateAnnualCashFlow(transactions: Transaction[], months: number = 12): number {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  const recentTransactions = transactions.filter(
    transaction => new Date(transaction.transaction_date) >= cutoffDate
  );

  return recentTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
}

/**
 * Calculate cash flow by category
 * @param transactions - Array of transactions
 * @param months - Number of months to look back
 * @returns Object with categorized cash flows
 */
export function calculateCashFlowByCategory(transactions: Transaction[], months: number = 12) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  const recentTransactions = transactions.filter(
    transaction => new Date(transaction.transaction_date) >= cutoffDate
  );

  const cashFlow = {
    rental_income: 0,
    operating_expenses: 0,
    capex: 0,
    loan_payments: 0,
    other: 0,
  };

  recentTransactions.forEach(transaction => {
    switch (transaction.transaction_type) {
      case 'rental_income':
        cashFlow.rental_income += transaction.amount;
        break;
      case 'operating_expense':
      case 'insurance_payment':
      case 'management_fee':
      case 'repair_maintenance':
      case 'utility_payment':
        cashFlow.operating_expenses += Math.abs(transaction.amount);
        break;
      case 'capex':
        cashFlow.capex += Math.abs(transaction.amount);
        break;
      case 'loan_payment':
        cashFlow.loan_payments += Math.abs(transaction.amount);
        break;
      default:
        cashFlow.other += transaction.amount;
        break;
    }
  });

  return cashFlow;
}

/**
 * Calculate property-level KPIs
 * @param property - Property data
 * @param loans - Associated loans
 * @param transactions - Property transactions
 * @returns PropertyKPI object
 */
export function calculatePropertyKPIs(
  property: Property,
  loans: Loan[],
  transactions: Transaction[]
): Omit<PropertyKPI, 'legal_entity_id' | 'portfolio_id' | 'calculated_at'> {
  const activeLoans = loans.filter(loan => loan.status === 'active');
  const totalDebt = activeLoans.reduce((sum, loan) => sum + loan.current_balance, 0);
  const totalMonthlyPayment = activeLoans.reduce((sum, loan) => sum + (loan.monthly_payment || 0), 0);

  const cashFlow = calculateCashFlowByCategory(transactions, 12);
  const annualCashFlow = cashFlow.rental_income - cashFlow.operating_expenses - cashFlow.capex;
  const avgMonthlyCashFlow = annualCashFlow / 12;

  const ltvRatio = calculateLTV(totalDebt, property.current_value);
  const grossRentalYield = calculateRentalYield(cashFlow.rental_income, property.current_value);
  const netRentalYield = calculateRentalYield(annualCashFlow, property.current_value);
  const weightedAvgRate = calculateWeightedAverageRate(activeLoans);
  const capitalGainPercentage = calculateCapitalGainPercentage(property.current_value, property.acquisition_price);
  const dscrRatio = totalMonthlyPayment > 0 ? calculateDSCR(avgMonthlyCashFlow, totalMonthlyPayment) : null;

  return {
    property_id: property.id,
    address: property.address,
    city: property.city,
    current_value: property.current_value,
    acquisition_price: property.acquisition_price,
    acquisition_date: property.acquisition_date,
    total_debt: totalDebt,
    total_monthly_payment: totalMonthlyPayment,
    weighted_avg_interest_rate: weightedAvgRate,
    ltv_ratio: ltvRatio,
    annual_cashflow: annualCashFlow,
    avg_monthly_cashflow: avgMonthlyCashFlow,
    annual_rental_income: cashFlow.rental_income,
    annual_operating_expenses: cashFlow.operating_expenses,
    annual_capex: cashFlow.capex,
    gross_rental_yield: grossRentalYield,
    net_rental_yield: netRentalYield,
    unrealized_capital_gain: property.current_value - property.acquisition_price,
    capital_gain_percentage: capitalGainPercentage,
    dscr_ratio: dscrRatio,
  };
}

/**
 * Calculate portfolio-level KPIs from property KPIs
 * @param propertyKPIs - Array of property KPIs
 * @param portfolioName - Portfolio name
 * @param baseCurrency - Portfolio base currency
 * @param baselineDate - Portfolio baseline date
 * @returns PortfolioKPI object
 */
export function calculatePortfolioKPIs(
  propertyKPIs: PropertyKPI[],
  portfolioId: string,
  userId: string,
  portfolioName: string,
  baseCurrency: string,
  baselineDate: string
): Omit<PortfolioKPI, 'calculated_at'> {
  const activeProperties = propertyKPIs.length;
  const totalPropertyValue = propertyKPIs.reduce((sum, kpi) => sum + kpi.current_value, 0);
  const totalAcquisitionCost = propertyKPIs.reduce((sum, kpi) => sum + kpi.acquisition_price, 0);
  const totalDebt = propertyKPIs.reduce((sum, kpi) => sum + kpi.total_debt, 0);
  const netWorth = totalPropertyValue - totalDebt;

  const portfolioLTV = calculateLTV(totalDebt, totalPropertyValue);

  const totalAnnualCashflow = propertyKPIs.reduce((sum, kpi) => sum + kpi.annual_cashflow, 0);
  const totalMonthlyCashflow = propertyKPIs.reduce((sum, kpi) => sum + kpi.avg_monthly_cashflow, 0);
  const totalRentalIncome = propertyKPIs.reduce((sum, kpi) => sum + kpi.annual_rental_income, 0);
  const totalOperatingExpenses = propertyKPIs.reduce((sum, kpi) => sum + kpi.annual_operating_expenses, 0);
  const totalCapex = propertyKPIs.reduce((sum, kpi) => sum + kpi.annual_capex, 0);

  const portfolioGrossYield = calculateRentalYield(totalRentalIncome, totalPropertyValue);
  const portfolioNetYield = calculateRentalYield(totalAnnualCashflow, totalPropertyValue);

  const totalMonthlyPayment = propertyKPIs.reduce((sum, kpi) => sum + kpi.total_monthly_payment, 0);
  const portfolioDSCR = totalMonthlyPayment > 0 ? calculateDSCR(totalMonthlyCashflow, totalMonthlyPayment) : null;

  const totalUnrealizedGains = totalPropertyValue - totalAcquisitionCost;
  const portfolioCapitalGainPercentage = calculateCapitalGainPercentage(totalPropertyValue, totalAcquisitionCost);

  return {
    portfolio_id: portfolioId,
    user_id: userId,
    portfolio_name: portfolioName,
    base_currency: baseCurrency as any,
    baseline_date: baselineDate,
    total_properties: activeProperties,
    active_properties: activeProperties,
    total_property_value: totalPropertyValue,
    total_acquisition_cost: totalAcquisitionCost,
    total_debt: totalDebt,
    net_worth: netWorth,
    portfolio_ltv: portfolioLTV,
    total_annual_cashflow: totalAnnualCashflow,
    total_monthly_cashflow: totalMonthlyCashflow,
    total_rental_income: totalRentalIncome,
    total_operating_expenses: totalOperatingExpenses,
    total_capex: totalCapex,
    portfolio_gross_yield: portfolioGrossYield,
    portfolio_net_yield: portfolioNetYield,
    portfolio_dscr: portfolioDSCR,
    total_unrealized_gains: totalUnrealizedGains,
    portfolio_capital_gain_percentage: portfolioCapitalGainPercentage,
  };
}

/**
 * Calculate monthly performance trends
 * @param transactions - Array of all transactions
 * @param months - Number of months to analyze
 * @returns Array of monthly performance data
 */
export function calculateMonthlyPerformance(transactions: Transaction[], months: number = 12) {
  const monthlyData: Array<{
    month_year: string;
    rental_income: number;
    operating_expenses: number;
    capex: number;
    net_cashflow: number;
  }> = [];

  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthYear = date.toISOString().substring(0, 7); // YYYY-MM format

    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });

    const monthlyFlow = calculateCashFlowByCategory(monthTransactions, 1);

    monthlyData.unshift({
      month_year: monthYear,
      rental_income: monthlyFlow.rental_income,
      operating_expenses: monthlyFlow.operating_expenses,
      capex: monthlyFlow.capex,
      net_cashflow: monthlyFlow.rental_income - monthlyFlow.operating_expenses - monthlyFlow.capex,
    });
  }

  return monthlyData;
}