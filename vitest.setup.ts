import { vi } from 'vitest';

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Global test utilities for financial calculations
global.testData = {
  // Sample property data for calculations
  sampleProperty: {
    id: 'test-property-id',
    acquisition_price: 500000,
    current_value: 520000,
    acquisition_date: '2023-06-15',
    rental_yield_target: 4.5,
  },

  // Sample loan data
  sampleLoan: {
    id: 'test-loan-id',
    initial_amount: 400000,
    current_balance: 380000,
    interest_rate: 3.5,
    term_months: 240,
    start_date: '2023-06-15',
  },

  // Sample transactions
  sampleTransactions: [
    {
      type: 'rental_income',
      amount: 1800,
      date: '2024-01-31',
      description: 'Monthly rent',
    },
    {
      type: 'operating_expense',
      amount: -350,
      date: '2024-01-15',
      description: 'Maintenance',
    },
  ],

  // Tax calculation constants
  taxRates: {
    lmnp: {
      income_tax_rate: 30,
      social_charges: 17.2,
      depreciation_rate: 2.5,
    },
    sci_is: {
      corporate_tax_rate: 25,
      dividend_tax_rate: 12.8,
      social_charges: 17.2,
    },
  },
};

// Precision helpers for financial calculations
global.financialAssertions = {
  expectCurrency: (actual: number, expected: number, precision = 0.01) => {
    expect(Math.abs(actual - expected)).toBeLessThan(precision);
  },

  expectPercentage: (actual: number, expected: number, precision = 0.001) => {
    expect(Math.abs(actual - expected)).toBeLessThan(precision);
  },

  expectDate: (actual: string, expected: string) => {
    expect(new Date(actual).toISOString().split('T')[0]).toBe(
      new Date(expected).toISOString().split('T')[0]
    );
  },
};

// Mock Date for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
vi.setSystemTime(mockDate);