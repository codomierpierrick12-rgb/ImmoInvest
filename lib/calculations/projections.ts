import { Scenario, ScenarioEvent, Property, Portfolio, Transaction } from '@/lib/types/database';
import { calculatePropertyKPIs, calculatePortfolioKPIs } from './kpi';
import { calculateLMNPTax } from './tax-lmnp';
import { calculateSCIISTax } from './tax-sci-is';
import { generateAmortizationSchedule, calculateRemainingBalance } from './loan';

/**
 * Scenario Projection Engine
 * Simulates the financial impact of various real estate scenarios
 */

export interface ProjectionParameters {
  inflation_rate: number;
  rent_increase_rate: number;
  property_appreciation_rate: number;
  discount_rate: number;
  tax_regime: 'lmnp' | 'sci_is' | 'individual';
  marginal_tax_rate: number;
}

export interface ProjectionResult {
  scenario_id: string;
  year: number;
  date: string;
  property_value: number;
  rental_income: number;
  operating_expenses: number;
  financing_costs: number;
  gross_cash_flow: number;
  tax_impact: number;
  net_cash_flow: number;
  cumulative_cash_flow: number;
  portfolio_value: number;
  portfolio_debt: number;
  net_worth: number;
  irr: number;
  roi: number;
  events_applied: ScenarioEvent[];
}

export interface ScenarioComparison {
  baseline_scenario: ProjectionResult[];
  test_scenario: ProjectionResult[];
  impact_analysis: {
    total_value_difference: number;
    cash_flow_difference: number;
    roi_difference: number;
    irr_difference: number;
    recommendation: string;
  };
}

/**
 * Default projection parameters for French real estate market
 */
export const DEFAULT_PROJECTION_PARAMS: ProjectionParameters = {
  inflation_rate: 0.02, // 2% annual inflation
  rent_increase_rate: 0.025, // 2.5% annual rent increase
  property_appreciation_rate: 0.03, // 3% annual property appreciation
  discount_rate: 0.04, // 4% discount rate for NPV calculations
  tax_regime: 'lmnp',
  marginal_tax_rate: 0.30, // 30% marginal tax rate
};

/**
 * Apply scenario events to baseline projection
 * @param baselineProjection - Baseline projection without events
 * @param events - Scenario events to apply
 * @param parameters - Projection parameters
 * @returns Modified projection with events applied
 */
export function applyScenarioEvents(
  baselineProjection: ProjectionResult[],
  events: ScenarioEvent[],
  parameters: ProjectionParameters
): ProjectionResult[] {
  const projection = [...baselineProjection];

  // Sort events by date
  const sortedEvents = events.sort((a, b) =>
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  for (const event of sortedEvents) {
    const eventDate = new Date(event.event_date);
    const eventYear = eventDate.getFullYear();

    // Find the projection year that corresponds to this event
    const projectionIndex = projection.findIndex(p =>
      new Date(p.date).getFullYear() === eventYear
    );

    if (projectionIndex === -1) continue;

    // Apply event based on type
    switch (event.event_type) {
      case 'property_acquisition':
        applyPropertyAcquisition(projection, projectionIndex, event, parameters);
        break;
      case 'property_disposal':
        applyPropertyDisposal(projection, projectionIndex, event, parameters);
        break;
      case 'rent_increase':
        applyRentIncrease(projection, projectionIndex, event);
        break;
      case 'refinancing':
        applyRefinancing(projection, projectionIndex, event, parameters);
        break;
      case 'renovation':
        applyRenovation(projection, projectionIndex, event);
        break;
      case 'market_adjustment':
        applyMarketAdjustment(projection, projectionIndex, event);
        break;
    }

    // Mark event as applied in relevant projection periods
    for (let i = projectionIndex; i < projection.length; i++) {
      projection[i].events_applied.push(event);
    }
  }

  // Recalculate cumulative values and KPIs
  recalculateProjectionMetrics(projection, parameters);

  return projection;
}

/**
 * Apply property acquisition event
 */
function applyPropertyAcquisition(
  projection: ProjectionResult[],
  startIndex: number,
  event: ScenarioEvent,
  parameters: ProjectionParameters
): void {
  const eventData = event.event_data as any;
  const acquisitionPrice = eventData.acquisition_price || 0;
  const financingAmount = eventData.financing_amount || 0;
  const monthlyRent = eventData.monthly_rent || 0;
  const downPayment = acquisitionPrice - financingAmount;

  for (let i = startIndex; i < projection.length; i++) {
    const year = projection[i];

    // Add property value to portfolio
    year.property_value += acquisitionPrice;
    year.portfolio_value += acquisitionPrice;

    // Add debt
    if (financingAmount > 0) {
      year.portfolio_debt += financingAmount;
    }

    // Add rental income (adjusted for year)
    const yearsFromAcquisition = i - startIndex;
    const adjustedRent = monthlyRent * 12 * Math.pow(1 + parameters.rent_increase_rate, yearsFromAcquisition);
    year.rental_income += adjustedRent;

    // Add financing costs if applicable
    if (financingAmount > 0) {
      const interestRate = eventData.interest_rate || 0.035; // Default 3.5%
      const annualInterest = financingAmount * interestRate * Math.pow(0.98, yearsFromAcquisition); // Decreasing as principal is paid
      year.financing_costs += annualInterest;
    }

    // Add operating expenses (estimated at 20% of rental income)
    year.operating_expenses += adjustedRent * 0.20;
  }
}

/**
 * Apply property disposal event
 */
function applyPropertyDisposal(
  projection: ProjectionResult[],
  startIndex: number,
  event: ScenarioEvent,
  parameters: ProjectionParameters
): void {
  const eventData = event.event_data as any;
  const salePrice = eventData.sale_price || 0;
  const transactionCosts = eventData.transaction_costs || 0;
  const capitalGainsTax = eventData.capital_gains_tax || 0;
  const propertyValue = eventData.property_value || 0;
  const outstandingDebt = eventData.outstanding_debt || 0;

  // Add one-time sale proceeds in the sale year
  const saleYear = projection[startIndex];
  const netProceeds = salePrice - transactionCosts - capitalGainsTax - outstandingDebt;
  saleYear.net_cash_flow += netProceeds;

  // Remove property from portfolio from sale year onwards
  for (let i = startIndex; i < projection.length; i++) {
    const year = projection[i];
    year.property_value -= propertyValue;
    year.portfolio_value -= propertyValue;
    year.portfolio_debt -= outstandingDebt;

    // Remove rental income and expenses
    const annualRent = eventData.annual_rent || 0;
    year.rental_income -= annualRent;
    year.operating_expenses -= annualRent * 0.20;

    if (outstandingDebt > 0) {
      year.financing_costs -= outstandingDebt * 0.035; // Estimated interest
    }
  }
}

/**
 * Apply rent increase event
 */
function applyRentIncrease(
  projection: ProjectionResult[],
  startIndex: number,
  event: ScenarioEvent
): void {
  const eventData = event.event_data as any;
  const increasePercentage = eventData.rent_increase_percentage || 0;
  const propertyId = eventData.property_id;

  for (let i = startIndex; i < projection.length; i++) {
    const year = projection[i];
    // Apply rent increase (simplified - applies to all rental income)
    const currentRent = year.rental_income;
    const additionalRent = currentRent * (increasePercentage / 100);
    year.rental_income += additionalRent;
  }
}

/**
 * Apply refinancing event
 */
function applyRefinancing(
  projection: ProjectionResult[],
  startIndex: number,
  event: ScenarioEvent,
  parameters: ProjectionParameters
): void {
  const eventData = event.event_data as any;
  const newInterestRate = eventData.new_interest_rate || 0;
  const closingCosts = eventData.closing_costs || 0;
  const oldRate = eventData.old_interest_rate || 0.035;
  const loanBalance = eventData.loan_balance || 0;

  // Add closing costs in refinancing year
  projection[startIndex].operating_expenses += closingCosts;

  // Adjust financing costs from refinancing year onwards
  const interestSavings = loanBalance * (oldRate - newInterestRate);

  for (let i = startIndex; i < projection.length; i++) {
    projection[i].financing_costs -= interestSavings;
  }
}

/**
 * Apply renovation event
 */
function applyRenovation(
  projection: ProjectionResult[],
  startIndex: number,
  event: ScenarioEvent
): void {
  const eventData = event.event_data as any;
  const renovationCost = eventData.renovation_cost || 0;
  const valueIncrease = eventData.value_increase || 0;
  const rentIncrease = eventData.rent_increase || 0;

  // Add renovation cost in renovation year
  projection[startIndex].operating_expenses += renovationCost;

  // Add value increase and rent increase from renovation year onwards
  for (let i = startIndex; i < projection.length; i++) {
    const year = projection[i];
    year.property_value += valueIncrease;
    year.portfolio_value += valueIncrease;
    year.rental_income += rentIncrease * 12; // Assuming monthly rent increase
  }
}

/**
 * Apply market adjustment event
 */
function applyMarketAdjustment(
  projection: ProjectionResult[],
  startIndex: number,
  event: ScenarioEvent
): void {
  const eventData = event.event_data as any;
  const valueAdjustment = eventData.value_adjustment_percentage || 0;
  const rentAdjustment = eventData.rent_adjustment_percentage || 0;

  for (let i = startIndex; i < projection.length; i++) {
    const year = projection[i];

    // Apply market adjustments
    const propertyValueAdjustment = year.property_value * (valueAdjustment / 100);
    year.property_value += propertyValueAdjustment;
    year.portfolio_value += propertyValueAdjustment;

    const rentalIncomeAdjustment = year.rental_income * (rentAdjustment / 100);
    year.rental_income += rentalIncomeAdjustment;
  }
}

/**
 * Recalculate projection metrics after events are applied
 */
function recalculateProjectionMetrics(
  projection: ProjectionResult[],
  parameters: ProjectionParameters
): void {
  let cumulativeCashFlow = 0;

  for (let i = 0; i < projection.length; i++) {
    const year = projection[i];

    // Recalculate cash flows
    year.gross_cash_flow = year.rental_income - year.operating_expenses - year.financing_costs;

    // Apply tax calculations (simplified)
    year.tax_impact = year.gross_cash_flow * parameters.marginal_tax_rate;
    year.net_cash_flow = year.gross_cash_flow - year.tax_impact;

    // Update cumulative cash flow
    cumulativeCashFlow += year.net_cash_flow;
    year.cumulative_cash_flow = cumulativeCashFlow;

    // Recalculate net worth
    year.net_worth = year.portfolio_value - year.portfolio_debt;

    // Calculate ROI (simplified)
    if (i === 0) {
      year.roi = 0;
    } else {
      const initialValue = projection[0].portfolio_value - projection[0].portfolio_debt;
      year.roi = initialValue > 0 ? ((year.net_worth - initialValue) / initialValue) * 100 : 0;
    }
  }

  // Calculate IRR for the entire projection
  calculateProjectionIRR(projection);
}

/**
 * Calculate Internal Rate of Return for projection
 */
function calculateProjectionIRR(projection: ProjectionResult[]): void {
  const cashFlows = projection.map(p => p.net_cash_flow);
  const irr = calculateIRR(cashFlows);

  // Apply IRR to all years
  projection.forEach(year => {
    year.irr = irr;
  });
}

/**
 * Calculate IRR using Newton-Raphson method
 */
function calculateIRR(cashFlows: number[]): number {
  let rate = 0.1; // Initial guess
  const maxIterations = 100;
  const tolerance = 0.0001;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + rate, j);
      dnpv -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
    }

    const newRate = rate - npv / dnpv;

    if (Math.abs(newRate - rate) < tolerance) {
      return Math.round(newRate * 10000) / 100; // Return as percentage
    }

    rate = newRate;
  }

  return 0; // Return 0 if no convergence
}

/**
 * Generate baseline projection for a portfolio
 * @param portfolio - Portfolio details
 * @param properties - Portfolio properties
 * @param loans - Portfolio loans
 * @param transactions - Historical transactions
 * @param parameters - Projection parameters
 * @param projectionYears - Number of years to project
 * @returns Baseline projection results
 */
export function generateBaselineProjection(
  portfolio: Portfolio,
  properties: Property[],
  loans: any[],
  transactions: Transaction[],
  parameters: ProjectionParameters = DEFAULT_PROJECTION_PARAMS,
  projectionYears: number = 10
): ProjectionResult[] {
  const results: ProjectionResult[] = [];
  const baseYear = new Date().getFullYear();

  // Calculate initial portfolio metrics
  const currentPropertyValue = properties.reduce((sum, p) => sum + p.current_value, 0);
  const currentDebt = loans.reduce((sum, l) => sum + l.current_balance, 0);
  const currentRentalIncome = calculateAnnualRentalIncome(transactions);
  const currentOperatingExpenses = calculateAnnualOperatingExpenses(transactions);

  for (let year = 0; year < projectionYears; year++) {
    const projectionYear = baseYear + year;
    const projectionDate = `${projectionYear}-12-31`;

    // Apply growth rates
    const propertyValue = currentPropertyValue * Math.pow(1 + parameters.property_appreciation_rate, year);
    const rentalIncome = currentRentalIncome * Math.pow(1 + parameters.rent_increase_rate, year);
    const operatingExpenses = currentOperatingExpenses * Math.pow(1 + parameters.inflation_rate, year);

    // Calculate financing costs (decreasing over time as loans are paid down)
    const financingCosts = currentDebt * 0.035 * Math.pow(0.98, year); // Simplified

    // Calculate cash flows
    const grossCashFlow = rentalIncome - operatingExpenses - financingCosts;
    const taxImpact = grossCashFlow * parameters.marginal_tax_rate;
    const netCashFlow = grossCashFlow - taxImpact;

    // Calculate remaining debt (simplified amortization)
    const remainingDebt = currentDebt * Math.pow(0.96, year); // 4% annual principal reduction

    const result: ProjectionResult = {
      scenario_id: 'baseline',
      year: year + 1,
      date: projectionDate,
      property_value: Math.round(propertyValue),
      rental_income: Math.round(rentalIncome),
      operating_expenses: Math.round(operatingExpenses),
      financing_costs: Math.round(financingCosts),
      gross_cash_flow: Math.round(grossCashFlow),
      tax_impact: Math.round(taxImpact),
      net_cash_flow: Math.round(netCashFlow),
      cumulative_cash_flow: 0, // Will be calculated later
      portfolio_value: Math.round(propertyValue),
      portfolio_debt: Math.round(remainingDebt),
      net_worth: Math.round(propertyValue - remainingDebt),
      irr: 0, // Will be calculated later
      roi: 0, // Will be calculated later
      events_applied: [],
    };

    results.push(result);
  }

  // Calculate cumulative values and metrics
  recalculateProjectionMetrics(results, parameters);

  return results;
}

/**
 * Compare two scenarios
 * @param baselineScenario - Baseline scenario projection
 * @param testScenario - Test scenario projection
 * @returns Comparison analysis
 */
export function compareScenarios(
  baselineScenario: ProjectionResult[],
  testScenario: ProjectionResult[]
): ScenarioComparison {
  const baselineFinalYear = baselineScenario[baselineScenario.length - 1];
  const testFinalYear = testScenario[testScenario.length - 1];

  const totalValueDifference = testFinalYear.net_worth - baselineFinalYear.net_worth;
  const cashFlowDifference = testFinalYear.cumulative_cash_flow - baselineFinalYear.cumulative_cash_flow;
  const roiDifference = testFinalYear.roi - baselineFinalYear.roi;
  const irrDifference = testFinalYear.irr - baselineFinalYear.irr;

  let recommendation = 'Neutral';
  if (totalValueDifference > 0 && cashFlowDifference > 0) {
    recommendation = 'Strongly Recommended - Improves both cash flow and total return';
  } else if (totalValueDifference > 0) {
    recommendation = 'Recommended - Improves total return';
  } else if (cashFlowDifference > 0) {
    recommendation = 'Consider - Improves cash flow but may reduce total return';
  } else {
    recommendation = 'Not Recommended - Reduces both cash flow and total return';
  }

  return {
    baseline_scenario: baselineScenario,
    test_scenario: testScenario,
    impact_analysis: {
      total_value_difference: Math.round(totalValueDifference),
      cash_flow_difference: Math.round(cashFlowDifference),
      roi_difference: Math.round(roiDifference * 100) / 100,
      irr_difference: Math.round(irrDifference * 100) / 100,
      recommendation: recommendation,
    },
  };
}

/**
 * Helper function to calculate annual rental income from transactions
 */
function calculateAnnualRentalIncome(transactions: Transaction[]): number {
  const rentalTransactions = transactions.filter(t => t.transaction_type === 'rental_income');
  const totalRental = rentalTransactions.reduce((sum, t) => sum + t.amount, 0);
  return totalRental; // Assumes transactions cover a full year
}

/**
 * Helper function to calculate annual operating expenses from transactions
 */
function calculateAnnualOperatingExpenses(transactions: Transaction[]): number {
  const expenseTypes = ['operating_expense', 'insurance_payment', 'management_fee', 'repair_maintenance', 'utility_payment'];
  const expenseTransactions = transactions.filter(t => expenseTypes.includes(t.transaction_type));
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  return totalExpenses;
}