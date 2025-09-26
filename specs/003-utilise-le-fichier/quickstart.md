# Quickstart Guide: Stoneverse Real Estate Portfolio Management

**Feature**: Complete Real Estate Portfolio Management Platform
**Date**: 2025-09-26

## Overview
This quickstart guide validates the core user stories through step-by-step testing scenarios. Each scenario maps to the acceptance criteria defined in the feature specification.

## Prerequisites

### Environment Setup
1. **Database**: Supabase project with PostgreSQL
2. **Authentication**: Supabase Auth configured
3. **Frontend**: Next.js 15+ with TypeScript
4. **Node.js**: Version 20+
5. **Package Manager**: npm or yarn

### Initial Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

## Scenario 1: New User Onboarding

**User Story**: New user with existing properties completes onboarding wizard

### Test Steps

#### 1.1 User Registration
1. Navigate to `/auth/signup`
2. Enter email: `test@example.com`
3. Enter password: `SecurePass123!`
4. Click "Sign Up"
5. Verify email confirmation sent

**Expected Result**: User account created, redirect to onboarding

#### 1.2 Portfolio Creation
1. Enter portfolio name: "My Real Estate Portfolio"
2. Select base currency: "EUR"
3. Set baseline date: "2024-01-01"
4. Click "Create Portfolio"

**Expected Result**: Portfolio created with unique ID

#### 1.3 Legal Entity Setup
1. Click "Add Legal Entity"
2. Select type: "Personal"
3. Enter name: "Personal Holdings"
4. Click "Create Entity"

**Expected Result**: Legal entity created and available for property assignment

#### 1.4 First Property Addition
1. Click "Add Property"
2. Fill property details:
   - Address: "123 Rue de la Paix, Paris"
   - City: "Paris"
   - Acquisition Price: €500,000
   - Acquisition Date: "2023-06-15"
   - Current Value: €520,000
   - Property Type: "Apartment"
   - Rental Yield Target: 4.5%
3. Click "Save Property"

**Expected Result**: Property saved with calculated initial KPIs

### Validation Criteria
- [ ] User can complete registration flow
- [ ] Portfolio baseline is established
- [ ] Property is associated with legal entity
- [ ] Initial KPIs are calculated and displayed
- [ ] Database contains complete property record

## Scenario 2: Monthly Transaction Recording

**User Story**: User enters monthly transactions and KPIs are recalculated

### Test Steps

#### 2.1 Record Rental Income
1. Navigate to property detail page
2. Click "Add Transaction"
3. Fill transaction details:
   - Type: "Rental Income"
   - Category: "Monthly Rent"
   - Description: "January 2024 rent"
   - Amount: €1,800
   - Date: "2024-01-31"
4. Click "Save Transaction"

**Expected Result**: Transaction recorded, monthly cash flow updated

#### 2.2 Record Operating Expense
1. Click "Add Transaction"
2. Fill expense details:
   - Type: "Operating Expense"
   - Category: "Maintenance"
   - Description: "Plumbing repair"
   - Amount: €-350
   - Date: "2024-01-15"
3. Click "Save Transaction"

**Expected Result**: Expense recorded, net cash flow recalculated

#### 2.3 Verify KPI Updates
1. Navigate to portfolio dashboard
2. Check updated metrics:
   - Monthly Cash Flow
   - Annual ROI
   - DSCR (if loans exist)

**Expected Result**: KPIs reflect new transaction data

### Validation Criteria
- [ ] Transactions are properly categorized
- [ ] Cash flow calculations are accurate
- [ ] Portfolio-level KPIs update automatically
- [ ] Transaction history is maintained
- [ ] Alerts trigger for significant variances

## Scenario 3: Acquisition Scenario Simulation

**User Story**: User creates what-if scenario for new property acquisition

### Test Steps

#### 3.1 Create Acquisition Scenario
1. Navigate to scenarios page
2. Click "Create New Scenario"
3. Fill scenario details:
   - Name: "Acquisition - Lyon Apartment"
   - Type: "Acquisition"
   - Base Date: "2024-03-01"
   - Projection Years: 10
4. Click "Create Scenario"

**Expected Result**: Scenario created in draft status

#### 3.2 Add New Property to Scenario
1. Click "Add Property Event"
2. Fill new property details:
   - Address: "456 Avenue de Lyon"
   - City: "Lyon"
   - Acquisition Price: €300,000
   - Financing: 80% LTV at 3.5% interest
   - Expected Rental Yield: 5.2%
3. Click "Add to Scenario"

**Expected Result**: Property event added with financing calculations

#### 3.3 Compare Scenario Impact
1. Click "Calculate Impact"
2. Review comparison metrics:
   - Current Portfolio vs Scenario Portfolio
   - Cash flow projections
   - ROI and risk metrics
3. View 10-year projection charts

**Expected Result**: Detailed impact analysis displayed

### Validation Criteria
- [ ] Scenario can be created and saved
- [ ] Property acquisition properly modeled
- [ ] Financing calculations are accurate
- [ ] Portfolio impact clearly displayed
- [ ] Long-term projections are realistic

## Scenario 4: Property Disposal Simulation

**User Story**: User simulates property sale with tax calculations

### Test Steps

#### 4.1 Create Disposal Scenario
1. Create new scenario: "Sale - Paris Apartment"
2. Select scenario type: "Disposal"
3. Set base date: "2024-06-01"

#### 4.2 Configure Property Sale
1. Select existing property to sell
2. Set sale parameters:
   - Sale Price: €550,000
   - Transaction Costs: €15,000
   - Sale Date: "2024-08-15"
3. Configure tax settings based on entity type

#### 4.3 Calculate Net Proceeds
1. System calculates:
   - Capital gains tax (based on LMNP/SCI rules)
   - Transaction costs
   - Loan repayment (if applicable)
   - Net cash to seller
2. Review tax calculation breakdown

**Expected Result**: Accurate net proceeds and tax liability

### Validation Criteria
- [ ] Sale price validation works
- [ ] Tax calculations match legal requirements
- [ ] Loan repayment calculated correctly
- [ ] Net proceeds accurately determined
- [ ] Portfolio impact clearly shown

## Scenario 5: Refinancing Analysis

**User Story**: User compares refinancing options for existing loan

### Test Steps

#### 5.1 Create Refinancing Scenario
1. Create scenario: "Refinance - Paris Property"
2. Select property with existing loan
3. Choose refinancing type: "Rate Renegotiation"

#### 5.2 Configure New Loan Terms
1. Set new loan parameters:
   - New Interest Rate: 2.8%
   - Extended Term: +5 years
   - Refinancing Costs: €3,000
   - Early Repayment Penalty: €2,500
2. Calculate new payment schedule

#### 5.3 Compare Total Cost
1. Review comparison:
   - Current loan total cost
   - Refinanced loan total cost
   - Monthly payment change
   - Break-even period
2. Analyze impact on DSCR and cash flow

**Expected Result**: Clear refinancing cost-benefit analysis

### Validation Criteria
- [ ] Loan parameters can be modified
- [ ] Payment schedule recalculated correctly
- [ ] Total cost comparison accurate
- [ ] Cash flow impact properly modeled
- [ ] Break-even analysis provided

## Scenario 6: Multi-Scenario Comparison

**User Story**: User evaluates multiple scenarios using comparison dashboard

### Test Steps

#### 6.1 Prepare Multiple Scenarios
1. Ensure 3-5 active scenarios exist:
   - Current Portfolio (baseline)
   - Acquisition scenario
   - Disposal scenario
   - Refinancing scenario
   - Mixed scenario (buy + sell)

#### 6.2 Access Comparison Dashboard
1. Navigate to "Compare Scenarios"
2. Select scenarios to compare (max 5)
3. Set comparison criteria:
   - Time horizon: 10 years
   - Key metrics: TRI, VAN, Cash Flow, Risk

#### 6.3 Analyze Results
1. Review comparison table with key metrics
2. Examine scenario ranking by different criteria
3. View sensitivity analysis
4. Export comparison report

**Expected Result**: Clear scenario ranking and decision support

### Validation Criteria
- [ ] Multiple scenarios can be compared
- [ ] Ranking algorithms work correctly
- [ ] Sensitivity analysis is meaningful
- [ ] Export functionality works
- [ ] Decision criteria are configurable

## Performance Validation

### Response Time Requirements
- Page load: < 2 seconds
- KPI calculation: < 1 second
- Scenario comparison: < 5 seconds
- Report generation: < 10 seconds

### Data Accuracy Requirements
- Financial calculations: 99.99% accuracy
- Tax calculations: Legal compliance
- Currency handling: Precision to cent
- Date calculations: No off-by-one errors

### Scalability Requirements
- 100+ properties per portfolio
- 10+ scenarios per portfolio
- 1000+ transactions per property
- 5-year historical data

## Integration Tests

### Database Tests
```sql
-- Verify portfolio creation
SELECT COUNT(*) FROM portfolios WHERE user_id = 'test-user-id';

-- Check KPI calculation accuracy
SELECT * FROM kpi_snapshots WHERE portfolio_id = 'test-portfolio-id';

-- Validate RLS policies
SET ROLE 'test-user';
SELECT * FROM properties; -- Should only return user's properties
```

### API Tests
```bash
# Test portfolio creation
curl -X POST /api/v1/portfolios \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Portfolio","base_currency":"EUR","baseline_date":"2024-01-01"}'

# Test property addition
curl -X POST /api/v1/portfolios/$PORTFOLIO_ID/properties \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"address":"Test Address","city":"Test City","acquisition_price":100000}'
```

### Frontend Tests
```javascript
// Test component rendering
import { render, screen } from '@testing-library/react';
import PortfolioDashboard from '../components/PortfolioDashboard';

test('renders portfolio KPIs', () => {
  render(<PortfolioDashboard portfolioId="test-id" />);
  expect(screen.getByText('Net Worth')).toBeInTheDocument();
  expect(screen.getByText('Monthly Cash Flow')).toBeInTheDocument();
});
```

## Success Criteria Summary

**All scenarios must pass with:**
- ✅ Functional requirements met
- ✅ Performance targets achieved
- ✅ Data accuracy validated
- ✅ User experience smooth
- ✅ Error handling robust
- ✅ Security policies enforced

**Ready for production when:**
- All quickstart scenarios pass
- Performance metrics meet targets
- Security audit completed
- User acceptance testing passed
- Documentation complete