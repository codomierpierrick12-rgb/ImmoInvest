import { Property, Transaction } from '@/lib/types/database';
import { EnhancedLegalEntity, FiscalRegime } from '@/lib/types/fiscal';
import { calculatePropertyKPIs, calculatePortfolioKPIs } from './kpi';
import { compareRegimes } from './tax-optimization';

/**
 * Stoneverse Scenario Simulator
 * Advanced financial projections and investment scenario analysis
 */

export interface InvestmentScenario {
  id: string;
  name: string;
  description: string;
  base_year: number;
  projection_years: number;
  initial_investment: number;
  financing: {
    loan_amount: number;
    interest_rate: number;
    loan_term_years: number;
    down_payment: number;
  };
  assumptions: {
    annual_rent_increase: number;
    annual_property_appreciation: number;
    annual_expense_increase: number;
    vacancy_rate: number;
    exit_year?: number;
    exit_strategy: 'hold' | 'sell' | 'refinance';
  };
  properties: ScenarioProperty[];
}

export interface ScenarioProperty {
  property: Property;
  acquisition_year: number;
  financing: {
    loan_amount: number;
    interest_rate: number;
    loan_term_years: number;
  };
  rental_projections: {
    initial_monthly_rent: number;
    annual_increase_rate: number;
  };
  expense_projections: {
    annual_expenses: number;
    annual_increase_rate: number;
  };
}

export interface ScenarioResults {
  scenario_id: string;
  yearly_projections: YearlyProjection[];
  summary_metrics: {
    total_cash_invested: number;
    total_rental_income: number;
    total_expenses: number;
    total_tax_savings: number;
    net_cash_flow: number;
    final_portfolio_value: number;
    total_return: number;
    irr: number; // Internal Rate of Return
    roi: number; // Return on Investment
    cash_on_cash_return: number;
    break_even_year: number;
  };
  sensitivity_analysis: {
    scenarios: {
      optimistic: ScenarioResults['summary_metrics'];
      realistic: ScenarioResults['summary_metrics'];
      pessimistic: ScenarioResults['summary_metrics'];
    };
  };
}

export interface YearlyProjection {
  year: number;
  properties_owned: number;
  total_property_value: number;
  total_debt: number;
  net_worth: number;
  annual_rental_income: number;
  annual_expenses: number;
  annual_tax_burden: number;
  annual_debt_service: number;
  net_cash_flow: number;
  cash_on_cash_return: number;
  cumulative_cash_flow: number;
}

export interface ComparisonScenario {
  name: string;
  scenario: InvestmentScenario;
  results: ScenarioResults;
}

/**
 * Run investment scenario simulation
 */
export function simulateInvestmentScenario(
  scenario: InvestmentScenario,
  existingProperties: Property[] = [],
  existingEntities: EnhancedLegalEntity[] = [],
  existingTransactions: Transaction[] = []
): ScenarioResults {
  const yearlyProjections: YearlyProjection[] = [];
  let cumulativeCashFlow = 0;
  let totalCashInvested = scenario.initial_investment;

  // Simulate each year
  for (let year = 0; year < scenario.projection_years; year++) {
    const currentYear = scenario.base_year + year;
    const propertiesAcquiredByYear = scenario.properties.filter(sp => sp.acquisition_year <= currentYear);

    let totalPropertyValue = 0;
    let totalDebt = 0;
    let annualRentalIncome = 0;
    let annualExpenses = 0;
    let annualDebtService = 0;

    // Calculate metrics for each property
    propertiesAcquiredByYear.forEach(scenarioProperty => {
      const yearsOwned = currentYear - scenarioProperty.acquisition_year;
      const property = scenarioProperty.property;

      // Property value appreciation
      const appreciatedValue = property.current_value *
        Math.pow(1 + scenario.assumptions.annual_property_appreciation, yearsOwned);
      totalPropertyValue += appreciatedValue;

      // Remaining debt calculation
      const remainingDebt = calculateRemainingDebt(
        scenarioProperty.financing.loan_amount,
        scenarioProperty.financing.interest_rate,
        scenarioProperty.financing.loan_term_years,
        yearsOwned
      );
      totalDebt += remainingDebt;

      // Rental income with increases
      const currentRent = scenarioProperty.rental_projections.initial_monthly_rent * 12 *
        Math.pow(1 + scenarioProperty.rental_projections.annual_increase_rate, yearsOwned);
      const adjustedRent = currentRent * (1 - scenario.assumptions.vacancy_rate);
      annualRentalIncome += adjustedRent;

      // Expenses with increases
      const currentExpenses = scenarioProperty.expense_projections.annual_expenses *
        Math.pow(1 + scenarioProperty.expense_projections.annual_increase_rate, yearsOwned);
      annualExpenses += currentExpenses;

      // Debt service
      const monthlyPayment = calculateMonthlyPayment(
        scenarioProperty.financing.loan_amount,
        scenarioProperty.financing.interest_rate,
        scenarioProperty.financing.loan_term_years
      );
      annualDebtService += monthlyPayment * 12;
    });

    // Tax calculation (simplified - would use full fiscal engine)
    const annualTaxBurden = Math.max(0, (annualRentalIncome - annualExpenses) * 0.3); // Simplified 30% rate

    // Net cash flow
    const netCashFlow = annualRentalIncome - annualExpenses - annualTaxBurden - annualDebtService;
    cumulativeCashFlow += netCashFlow;

    // Cash on cash return
    const cashOnCashReturn = totalCashInvested > 0 ? (netCashFlow / totalCashInvested) * 100 : 0;

    yearlyProjections.push({
      year: currentYear,
      properties_owned: propertiesAcquiredByYear.length,
      total_property_value: totalPropertyValue,
      total_debt: totalDebt,
      net_worth: totalPropertyValue - totalDebt,
      annual_rental_income: annualRentalIncome,
      annual_expenses: annualExpenses,
      annual_tax_burden: annualTaxBurden,
      annual_debt_service: annualDebtService,
      net_cash_flow: netCashFlow,
      cash_on_cash_return: cashOnCashReturn,
      cumulative_cash_flow: cumulativeCashFlow
    });
  }

  // Calculate summary metrics
  const finalProjection = yearlyProjections[yearlyProjections.length - 1];
  const totalRentalIncome = yearlyProjections.reduce((sum, p) => sum + p.annual_rental_income, 0);
  const totalExpenses = yearlyProjections.reduce((sum, p) => sum + p.annual_expenses, 0);
  const totalTaxSavings = yearlyProjections.reduce((sum, p) => sum + p.annual_tax_burden, 0);

  const totalReturn = finalProjection.net_worth + cumulativeCashFlow - totalCashInvested;
  const roi = totalCashInvested > 0 ? (totalReturn / totalCashInvested) * 100 : 0;
  const irr = calculateIRR(yearlyProjections, totalCashInvested);
  const breakEvenYear = findBreakEvenYear(yearlyProjections);

  const summaryMetrics = {
    total_cash_invested: totalCashInvested,
    total_rental_income: totalRentalIncome,
    total_expenses: totalExpenses,
    total_tax_savings: totalTaxSavings,
    net_cash_flow: cumulativeCashFlow,
    final_portfolio_value: finalProjection.total_property_value,
    total_return: totalReturn,
    irr: irr,
    roi: roi,
    cash_on_cash_return: finalProjection.cash_on_cash_return,
    break_even_year: breakEvenYear
  };

  // Generate sensitivity analysis
  const sensitivityAnalysis = generateSensitivityAnalysis(scenario);

  return {
    scenario_id: scenario.id,
    yearly_projections: yearlyProjections,
    summary_metrics: summaryMetrics,
    sensitivity_analysis: sensitivityAnalysis
  };
}

/**
 * Compare multiple investment scenarios
 */
export function compareScenarios(scenarios: InvestmentScenario[]): ComparisonScenario[] {
  return scenarios.map(scenario => ({
    name: scenario.name,
    scenario: scenario,
    results: simulateInvestmentScenario(scenario)
  })).sort((a, b) => b.results.summary_metrics.irr - a.results.summary_metrics.irr);
}

/**
 * Generate buy vs hold analysis
 */
export function analyzeBuyVsHold(
  newPropertyScenario: InvestmentScenario,
  currentPortfolio: {
    properties: Property[];
    entities: EnhancedLegalEntity[];
    transactions: Transaction[];
  }
): {
  buy_scenario: ScenarioResults;
  hold_scenario: ScenarioResults;
  recommendation: {
    decision: 'buy' | 'hold';
    reasoning: string[];
    risk_factors: string[];
  };
} {
  // Simulate buying the new property
  const buyScenario = simulateInvestmentScenario(
    newPropertyScenario,
    currentPortfolio.properties,
    currentPortfolio.entities,
    currentPortfolio.transactions
  );

  // Create hold scenario (status quo)
  const holdScenario: InvestmentScenario = {
    id: 'hold-scenario',
    name: 'Hold Current Portfolio',
    description: 'Maintain current portfolio without new acquisitions',
    base_year: newPropertyScenario.base_year,
    projection_years: newPropertyScenario.projection_years,
    initial_investment: 0,
    financing: { loan_amount: 0, interest_rate: 0, loan_term_years: 0, down_payment: 0 },
    assumptions: newPropertyScenario.assumptions,
    properties: []
  };

  const holdResults = simulateInvestmentScenario(
    holdScenario,
    currentPortfolio.properties,
    currentPortfolio.entities,
    currentPortfolio.transactions
  );

  // Decision logic
  const irrDifference = buyScenario.summary_metrics.irr - holdResults.summary_metrics.irr;
  const cashFlowDifference = buyScenario.summary_metrics.net_cash_flow - holdResults.summary_metrics.net_cash_flow;

  const decision: 'buy' | 'hold' = (irrDifference > 2 && cashFlowDifference > 0) ? 'buy' : 'hold';

  const reasoning = decision === 'buy' ? [
    `IRR supérieur de ${irrDifference.toFixed(1)}%`,
    `Cash-flow additionnel de ${cashFlowDifference.toFixed(0)}€`,
    'Diversification du portefeuille'
  ] : [
    'IRR insuffisant par rapport au risque',
    'Cash-flow impact négatif',
    'Maintenir la liquidité actuelle'
  ];

  const riskFactors = [
    'Évolution des taux d\'intérêt',
    'Vacance locative',
    'Dépréciation immobilière',
    'Changements réglementaires'
  ];

  return {
    buy_scenario: buyScenario,
    hold_scenario: holdResults,
    recommendation: {
      decision,
      reasoning,
      risk_factors: riskFactors
    }
  };
}

/**
 * Portfolio rebalancing analysis
 */
export function analyzePortfolioRebalancing(
  currentPortfolio: {
    properties: Property[];
    entities: EnhancedLegalEntity[];
    transactions: Transaction[];
  },
  targetAllocation: {
    by_location: { [city: string]: number };
    by_property_type: { [type: string]: number };
    by_fiscal_regime: { [regime: string]: number };
  }
): {
  current_allocation: any;
  rebalancing_suggestions: Array<{
    action: 'buy' | 'sell' | 'convert';
    property_type: string;
    location: string;
    fiscal_regime: string;
    reasoning: string;
    priority: 'high' | 'medium' | 'low';
  }>;
} {
  // Calculate current allocation
  const totalValue = currentPortfolio.properties.reduce((sum, p) => sum + p.current_value, 0);

  const currentAllocation = {
    by_location: calculateAllocationByLocation(currentPortfolio.properties, totalValue),
    by_property_type: calculateAllocationByPropertyType(currentPortfolio.properties, totalValue),
    by_fiscal_regime: calculateAllocationByRegime(currentPortfolio.properties, currentPortfolio.entities, totalValue)
  };

  // Generate rebalancing suggestions
  const suggestions = generateRebalancingSuggestions(currentAllocation, targetAllocation);

  return {
    current_allocation: currentAllocation,
    rebalancing_suggestions: suggestions
  };
}

/**
 * Helper functions
 */
function calculateRemainingDebt(
  loanAmount: number,
  annualRate: number,
  termYears: number,
  yearsElapsed: number
): number {
  if (yearsElapsed >= termYears) return 0;

  const monthlyRate = annualRate / 12;
  const totalPayments = termYears * 12;
  const paymentsElapsed = yearsElapsed * 12;

  const monthlyPayment = loanAmount *
    (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);

  let remainingBalance = loanAmount;
  for (let i = 0; i < paymentsElapsed; i++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance -= principalPayment;
  }

  return Math.max(0, remainingBalance);
}

function calculateMonthlyPayment(
  loanAmount: number,
  annualRate: number,
  termYears: number
): number {
  const monthlyRate = annualRate / 12;
  const totalPayments = termYears * 12;

  if (monthlyRate === 0) return loanAmount / totalPayments;

  return loanAmount *
    (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);
}

function calculateIRR(projections: YearlyProjection[], initialInvestment: number): number {
  // Simplified IRR calculation using approximation
  // In reality, would use Newton-Raphson method
  const cashFlows = [-initialInvestment, ...projections.map(p => p.net_cash_flow)];

  // Add final value to last cash flow (assuming sale)
  if (cashFlows.length > 1) {
    const lastProjection = projections[projections.length - 1];
    cashFlows[cashFlows.length - 1] += lastProjection.net_worth;
  }

  // Simplified approximation
  const totalReturn = cashFlows.slice(1).reduce((sum, cf) => sum + cf, 0);
  const years = projections.length;

  if (years === 0 || initialInvestment === 0) return 0;

  return (Math.pow(totalReturn / initialInvestment, 1 / years) - 1) * 100;
}

function findBreakEvenYear(projections: YearlyProjection[]): number {
  for (let i = 0; i < projections.length; i++) {
    if (projections[i].cumulative_cash_flow >= 0) {
      return projections[i].year;
    }
  }
  return projections.length > 0 ? projections[projections.length - 1].year + 1 : 0;
}

function generateSensitivityAnalysis(scenario: InvestmentScenario) {
  // Create optimistic scenario (+20% rent, +50% appreciation, -20% expenses)
  const optimisticScenario = { ...scenario };
  optimisticScenario.assumptions.annual_rent_increase *= 1.2;
  optimisticScenario.assumptions.annual_property_appreciation *= 1.5;
  optimisticScenario.assumptions.annual_expense_increase *= 0.8;

  // Create pessimistic scenario (-20% rent, -50% appreciation, +20% expenses)
  const pessimisticScenario = { ...scenario };
  pessimisticScenario.assumptions.annual_rent_increase *= 0.8;
  pessimisticScenario.assumptions.annual_property_appreciation *= 0.5;
  pessimisticScenario.assumptions.annual_expense_increase *= 1.2;

  return {
    scenarios: {
      optimistic: simulateInvestmentScenario(optimisticScenario).summary_metrics,
      realistic: simulateInvestmentScenario(scenario).summary_metrics,
      pessimistic: simulateInvestmentScenario(pessimisticScenario).summary_metrics
    }
  };
}

function calculateAllocationByLocation(properties: Property[], totalValue: number) {
  const allocation: { [city: string]: number } = {};
  properties.forEach(property => {
    const city = property.city || 'Unknown';
    allocation[city] = (allocation[city] || 0) + (property.current_value / totalValue) * 100;
  });
  return allocation;
}

function calculateAllocationByPropertyType(properties: Property[], totalValue: number) {
  const allocation: { [type: string]: number } = {};
  properties.forEach(property => {
    const type = property.property_type || 'Unknown';
    allocation[type] = (allocation[type] || 0) + (property.current_value / totalValue) * 100;
  });
  return allocation;
}

function calculateAllocationByRegime(
  properties: Property[],
  entities: EnhancedLegalEntity[],
  totalValue: number
) {
  const allocation: { [regime: string]: number } = {};

  // This would require linking properties to entities through transactions
  // Simplified for now
  entities.forEach(entity => {
    allocation[entity.type] = 33.33; // Simplified equal distribution
  });

  return allocation;
}

function generateRebalancingSuggestions(currentAllocation: any, targetAllocation: any) {
  const suggestions: Array<{
    action: 'buy' | 'sell' | 'convert';
    property_type: string;
    location: string;
    fiscal_regime: string;
    reasoning: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  // Location rebalancing
  Object.entries(targetAllocation.by_location).forEach(([city, targetPercent]) => {
    const currentPercent = currentAllocation.by_location[city] || 0;
    const difference = (targetPercent as number) - currentPercent;

    if (Math.abs(difference) > 5) { // 5% threshold
      suggestions.push({
        action: difference > 0 ? 'buy' : 'sell',
        property_type: 'apartment',
        location: city,
        fiscal_regime: 'lmnp',
        reasoning: `Allocation ${city}: ${currentPercent.toFixed(1)}% → ${targetPercent}%`,
        priority: Math.abs(difference) > 15 ? 'high' : 'medium'
      });
    }
  });

  return suggestions;
}