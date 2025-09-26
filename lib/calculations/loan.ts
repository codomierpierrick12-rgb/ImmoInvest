import { Loan } from '@/lib/types/database';

/**
 * Loan Amortization and Analysis Calculator
 * Comprehensive loan calculations for real estate financing
 */

export interface AmortizationPayment {
  payment_number: number;
  payment_date: string;
  principal_payment: number;
  interest_payment: number;
  total_payment: number;
  remaining_balance: number;
  cumulative_principal: number;
  cumulative_interest: number;
}

export interface LoanSummary {
  loan_amount: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number;
  total_payments: number;
  total_interest: number;
  total_cost: number;
}

export interface RefinancingAnalysis {
  current_loan: LoanSummary;
  new_loan: LoanSummary;
  closing_costs: number;
  monthly_savings: number;
  total_interest_savings: number;
  breakeven_months: number;
  net_present_value: number;
  recommended: boolean;
}

/**
 * Calculate monthly payment for a loan
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate (as percentage)
 * @param termMonths - Loan term in months
 * @returns Monthly payment amount
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (annualRate === 0) {
    return principal / termMonths;
  }

  const monthlyRate = annualRate / 100 / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
                  (Math.pow(1 + monthlyRate, termMonths) - 1);

  return Math.round(payment * 100) / 100;
}

/**
 * Generate complete amortization schedule
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate (as percentage)
 * @param termMonths - Loan term in months
 * @param startDate - Loan start date
 * @returns Array of payment details for each month
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate: string
): AmortizationPayment[] {
  const schedule: AmortizationPayment[] = [];
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const monthlyRate = annualRate / 100 / 12;

  let remainingBalance = principal;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  const start = new Date(startDate);

  for (let month = 1; month <= termMonths; month++) {
    const interestPayment = remainingBalance * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;

    // Handle final payment rounding
    if (month === termMonths) {
      principalPayment = remainingBalance;
    }

    remainingBalance -= principalPayment;
    cumulativePrincipal += principalPayment;
    cumulativeInterest += interestPayment;

    // Calculate payment date
    const paymentDate = new Date(start);
    paymentDate.setMonth(paymentDate.getMonth() + month - 1);

    schedule.push({
      payment_number: month,
      payment_date: paymentDate.toISOString().split('T')[0],
      principal_payment: Math.round(principalPayment * 100) / 100,
      interest_payment: Math.round(interestPayment * 100) / 100,
      total_payment: Math.round((principalPayment + interestPayment) * 100) / 100,
      remaining_balance: Math.round(Math.max(0, remainingBalance) * 100) / 100,
      cumulative_principal: Math.round(cumulativePrincipal * 100) / 100,
      cumulative_interest: Math.round(cumulativeInterest * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Calculate remaining balance at a specific point in time
 * @param principal - Original loan principal
 * @param annualRate - Annual interest rate (as percentage)
 * @param termMonths - Loan term in months
 * @param paymentsCompletedNumber of payments already made
 * @returns Remaining loan balance
 */
export function calculateRemainingBalance(
  principal: number,
  annualRate: number,
  termMonths: number,
  paymentsCompleted: number
): number {
  if (paymentsCompleted >= termMonths) return 0;
  if (paymentsCompleted <= 0) return principal;

  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);

  if (annualRate === 0) {
    return principal - (monthlyPayment * paymentsCompleted);
  }

  const remainingBalance = principal * Math.pow(1 + monthlyRate, paymentsCompleted) -
                          monthlyPayment * ((Math.pow(1 + monthlyRate, paymentsCompleted) - 1) / monthlyRate);

  return Math.round(Math.max(0, remainingBalance) * 100) / 100;
}

/**
 * Calculate loan summary statistics
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate (as percentage)
 * @param termMonths - Loan term in months
 * @returns Loan summary with key metrics
 */
export function calculateLoanSummary(
  principal: number,
  annualRate: number,
  termMonths: number
): LoanSummary {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const totalPayments = monthlyPayment * termMonths;
  const totalInterest = totalPayments - principal;

  return {
    loan_amount: principal,
    interest_rate: annualRate,
    term_months: termMonths,
    monthly_payment: monthlyPayment,
    total_payments: Math.round(totalPayments * 100) / 100,
    total_interest: Math.round(totalInterest * 100) / 100,
    total_cost: Math.round(totalPayments * 100) / 100,
  };
}

/**
 * Calculate extra payment impact
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate (as percentage)
 * @param termMonths - Loan term in months
 * @param extraPayment - Additional monthly payment amount
 * @returns Analysis of extra payment impact
 */
export function calculateExtraPaymentImpact(
  principal: number,
  annualRate: number,
  termMonths: number,
  extraPayment: number
): {
  original_summary: LoanSummary;
  with_extra_payment: LoanSummary;
  months_saved: number;
  interest_saved: number;
  total_savings: number;
} {
  const originalSummary = calculateLoanSummary(principal, annualRate, termMonths);

  // Calculate new payment schedule with extra payment
  const newMonthlyPayment = originalSummary.monthly_payment + extraPayment;
  const monthlyRate = annualRate / 100 / 12;

  let newTermMonths = termMonths;
  if (annualRate > 0) {
    // Calculate new term with extra payments
    newTermMonths = Math.ceil(
      -Math.log(1 - (principal * monthlyRate) / newMonthlyPayment) / Math.log(1 + monthlyRate)
    );
  } else {
    newTermMonths = Math.ceil(principal / newMonthlyPayment);
  }

  const newTotalPayments = newMonthlyPayment * newTermMonths;
  const newTotalInterest = newTotalPayments - principal;

  const withExtraPayment: LoanSummary = {
    loan_amount: principal,
    interest_rate: annualRate,
    term_months: newTermMonths,
    monthly_payment: newMonthlyPayment,
    total_payments: Math.round(newTotalPayments * 100) / 100,
    total_interest: Math.round(newTotalInterest * 100) / 100,
    total_cost: Math.round(newTotalPayments * 100) / 100,
  };

  const monthsSaved = termMonths - newTermMonths;
  const interestSaved = originalSummary.total_interest - newTotalInterest;

  return {
    original_summary: originalSummary,
    with_extra_payment: withExtraPayment,
    months_saved: monthsSaved,
    interest_saved: Math.round(interestSaved * 100) / 100,
    total_savings: Math.round(interestSaved * 100) / 100,
  };
}

/**
 * Analyze refinancing opportunity
 * @param currentLoan - Current loan details
 * @param newRate - New interest rate (as percentage)
 * @param newTermMonths - New loan term in months (optional, defaults to remaining term)
 * @param closingCosts - Refinancing closing costs
 * @param discountRate - Discount rate for NPV calculation (default 3%)
 * @returns Refinancing analysis
 */
export function analyzeRefinancing(
  currentLoan: {
    principal: number;
    current_balance: number;
    annual_rate: number;
    remaining_months: number;
  },
  newRate: number,
  newTermMonths?: number,
  closingCosts: number = 0,
  discountRate: number = 3
): RefinancingAnalysis {
  const remainingTerm = newTermMonths || currentLoan.remaining_months;

  // Current loan summary
  const currentSummary = calculateLoanSummary(
    currentLoan.current_balance,
    currentLoan.annual_rate,
    currentLoan.remaining_months
  );

  // New loan summary
  const newSummary = calculateLoanSummary(
    currentLoan.current_balance,
    newRate,
    remainingTerm
  );

  const monthlySavings = currentSummary.monthly_payment - newSummary.monthly_payment;
  const totalInterestSavings = currentSummary.total_interest - newSummary.total_interest;

  // Calculate breakeven point
  const breakevenMonths = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : Infinity;

  // Calculate NPV of refinancing
  const monthlyDiscountRate = discountRate / 100 / 12;
  let npv = -closingCosts; // Initial cost

  for (let month = 1; month <= remainingTerm; month++) {
    const presentValue = monthlySavings / Math.pow(1 + monthlyDiscountRate, month);
    npv += presentValue;
  }

  const recommended = npv > 0 && breakevenMonths <= 60; // Recommend if NPV positive and breakeven within 5 years

  return {
    current_loan: currentSummary,
    new_loan: newSummary,
    closing_costs: closingCosts,
    monthly_savings: Math.round(monthlySavings * 100) / 100,
    total_interest_savings: Math.round(totalInterestSavings * 100) / 100,
    breakeven_months: breakevenMonths === Infinity ? 0 : breakevenMonths,
    net_present_value: Math.round(npv * 100) / 100,
    recommended: recommended,
  };
}

/**
 * Calculate optimal loan-to-value ratio analysis
 * @param propertyValue - Property value
 * @param availableDownPayment - Available down payment
 * @param interestRate - Interest rate (as percentage)
 * @param termMonths - Loan term in months
 * @param expectedAppreciation - Expected annual appreciation rate (as percentage)
 * @param expectedRentalYield - Expected annual rental yield (as percentage)
 * @returns LTV optimization analysis
 */
export function optimizeLTV(
  propertyValue: number,
  availableDownPayment: number,
  interestRate: number,
  termMonths: number,
  expectedAppreciation: number = 2,
  expectedRentalYield: number = 5
): Array<{
  ltv_ratio: number;
  loan_amount: number;
  down_payment: number;
  monthly_payment: number;
  cash_on_cash_return: number;
  leveraged_return: number;
  risk_score: number;
}> {
  const analysis = [];
  const ltvOptions = [60, 65, 70, 75, 80, 85, 90]; // Different LTV scenarios

  for (const ltv of ltvOptions) {
    const loanAmount = propertyValue * (ltv / 100);
    const downPayment = propertyValue - loanAmount;

    // Skip if down payment exceeds available funds
    if (downPayment > availableDownPayment) continue;

    const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, termMonths);
    const annualDebtService = monthlyPayment * 12;
    const annualRentalIncome = propertyValue * (expectedRentalYield / 100);

    // Calculate cash-on-cash return
    const annualCashFlow = annualRentalIncome - annualDebtService;
    const cashOnCashReturn = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;

    // Calculate leveraged return
    const annualAppreciation = propertyValue * (expectedAppreciation / 100);
    const totalReturn = annualCashFlow + annualAppreciation;
    const leveragedReturn = downPayment > 0 ? (totalReturn / downPayment) * 100 : 0;

    // Calculate risk score (higher LTV = higher risk)
    const riskScore = ltv * 0.01 + (interestRate * 0.1) + (termMonths > 360 ? 0.2 : 0);

    analysis.push({
      ltv_ratio: ltv,
      loan_amount: Math.round(loanAmount),
      down_payment: Math.round(downPayment),
      monthly_payment: Math.round(monthlyPayment),
      cash_on_cash_return: Math.round(cashOnCashReturn * 100) / 100,
      leveraged_return: Math.round(leveragedReturn * 100) / 100,
      risk_score: Math.round(riskScore * 100) / 100,
    });
  }

  return analysis;
}

/**
 * Update loan with actual payments made
 * @param loan - Original loan details
 * @param paymentsToDate - Number of payments made
 * @returns Updated loan status
 */
export function updateLoanStatus(
  loan: Loan,
  paymentsToDate: number
): {
  updated_balance: number;
  payments_remaining: number;
  interest_paid_to_date: number;
  principal_paid_to_date: number;
  percent_paid_off: number;
} {
  const schedule = generateAmortizationSchedule(
    loan.principal_amount,
    loan.interest_rate,
    loan.term_months,
    loan.start_date
  );

  if (paymentsToDate >= schedule.length) {
    return {
      updated_balance: 0,
      payments_remaining: 0,
      interest_paid_to_date: schedule[schedule.length - 1]?.cumulative_interest || 0,
      principal_paid_to_date: loan.principal_amount,
      percent_paid_off: 100,
    };
  }

  const currentPayment = schedule[paymentsToDate - 1] || schedule[0];
  const percentPaidOff = (currentPayment.cumulative_principal / loan.principal_amount) * 100;

  return {
    updated_balance: currentPayment.remaining_balance,
    payments_remaining: loan.term_months - paymentsToDate,
    interest_paid_to_date: currentPayment.cumulative_interest,
    principal_paid_to_date: currentPayment.cumulative_principal,
    percent_paid_off: Math.round(percentPaidOff * 100) / 100,
  };
}