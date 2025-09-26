# Data Model: Stoneverse Real Estate Portfolio Management

**Feature**: Complete Real Estate Portfolio Management Platform
**Date**: 2025-09-26

## Entity Relationship Overview

```
User
├── Portfolio (1:N)
    ├── LegalEntity (1:N)
    │   └── Property (1:N)
    │       ├── Loan (1:N)
    │       ├── Transaction (1:N)
    │       └── Budget (1:N)
    └── Scenario (1:N)
        └── ScenarioEvent (1:N)
```

## Core Entities

### User
Primary actor in the system with authentication and profile management.

**Fields**:
- `id`: UUID (Primary Key)
- `email`: String (Unique, Required)
- `role`: Enum (individual, professional, admin)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `profile`: JSONB (name, preferences, settings)

**Relationships**:
- One-to-many with Portfolio
- Many-to-many with Portfolio (via sharing permissions)

**Validation Rules**:
- Email must be valid format
- Role determines feature access levels
- Profile must include required fields for tax calculations

### Portfolio
Top-level container for an investor's complete real estate holdings.

**Fields**:
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to User)
- `name`: String (Required)
- `base_currency`: String (EUR, USD, etc.)
- `baseline_date`: Date (T0 for calculations)
- `sharing_settings`: JSONB (permissions, shared_users)
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Relationships**:
- Belongs to User
- One-to-many with LegalEntity
- One-to-many with Scenario
- Many-to-many with User (sharing)

**Validation Rules**:
- Name must be unique per user
- Baseline date cannot be future
- Currency must be supported

### LegalEntity
Tax structures that own properties (Personal, LMNP, SCI IS).

**Fields**:
- `id`: UUID (Primary Key)
- `portfolio_id`: UUID (Foreign Key to Portfolio)
- `type`: Enum (personal, lmnp, sci_is)
- `name`: String (Required)
- `tax_settings`: JSONB (rates, thresholds, jurisdiction)
- `incorporation_date`: Date (nullable for personal)
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Relationships**:
- Belongs to Portfolio
- One-to-many with Property

**Validation Rules**:
- Type determines available tax calculation rules
- SCI IS requires incorporation date
- Tax settings must match entity type

### Property
Individual real estate assets with acquisition and operational details.

**Fields**:
- `id`: UUID (Primary Key)
- `legal_entity_id`: UUID (Foreign Key to LegalEntity)
- `address`: Text (Required)
- `city`: String (Required)
- `postal_code`: String
- `country`: String (Default: FR)
- `acquisition_price`: Decimal (Required)
- `acquisition_date`: Date (Required)
- `acquisition_costs`: JSONB (notary, agency, works, etc.)
- `current_value`: Decimal (Required)
- `valuation_date`: Date
- `property_type`: Enum (apartment, house, commercial, etc.)
- `surface_area`: Decimal (m²)
- `rental_yield_target`: Decimal (%)
- `status`: Enum (active, sold, under_renovation)
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Relationships**:
- Belongs to LegalEntity
- One-to-many with Loan
- One-to-many with Transaction
- One-to-many with Budget

**Validation Rules**:
- Acquisition price must be positive
- Current value must be positive
- Yield target must be between 0 and 50%
- Address must be valid format

### Loan
Financing instruments associated with properties.

**Fields**:
- `id`: UUID (Primary Key)
- `property_id`: UUID (Foreign Key to Property)
- `name`: String (Required)
- `loan_type`: Enum (amortizing, interest_only, bridge)
- `initial_amount`: Decimal (Required)
- `current_balance`: Decimal (Required)
- `interest_rate`: Decimal (%) (Required)
- `rate_type`: Enum (fixed, variable)
- `term_months`: Integer (Required)
- `start_date`: Date (Required)
- `monthly_payment`: Decimal
- `insurance_rate`: Decimal (%)
- `early_repayment_penalty`: JSONB (rate, conditions)
- `guarantees`: JSONB (mortgage, personal, etc.)
- `status`: Enum (active, paid_off, refinanced)
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Relationships**:
- Belongs to Property
- One-to-many with Transaction (interest payments)

**Validation Rules**:
- Current balance cannot exceed initial amount
- Interest rate must be positive
- Term must be positive
- Start date cannot be future

### Transaction
Monthly operational events including rent, expenses, and capital improvements.

**Fields**:
- `id`: UUID (Primary Key)
- `property_id`: UUID (Foreign Key to Property)
- `transaction_type`: Enum (rental_income, operating_expense, capex, loan_payment, tax_payment)
- `category`: String (rent, maintenance, insurance, etc.)
- `description`: Text (Required)
- `amount`: Decimal (Required, can be negative)
- `transaction_date`: Date (Required)
- `payment_method`: String
- `is_budgeted`: Boolean (Default: false)
- `tax_deductible`: Boolean (Default: true)
- `supporting_documents`: JSONB (file URLs, references)
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Relationships**:
- Belongs to Property
- References Budget (if budgeted)

**Validation Rules**:
- Amount cannot be zero
- Transaction date cannot be future
- Type determines sign convention

### Scenario
Simulation environments for testing investment decisions.

**Fields**:
- `id`: UUID (Primary Key)
- `portfolio_id`: UUID (Foreign Key to Portfolio)
- `name`: String (Required)
- `scenario_type`: Enum (acquisition, disposal, refinancing, mixed)
- `base_date`: Date (Required)
- `projection_years`: Integer (Default: 10)
- `description`: Text
- `assumptions`: JSONB (market growth, inflation, etc.)
- `status`: Enum (draft, active, archived)
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Relationships**:
- Belongs to Portfolio
- One-to-many with ScenarioEvent

**Validation Rules**:
- Base date cannot be before portfolio baseline
- Projection years between 1 and 30
- Name must be unique per portfolio

### ScenarioEvent
Individual events within a scenario (buy, sell, refinance).

**Fields**:
- `id`: UUID (Primary Key)
- `scenario_id`: UUID (Foreign Key to Scenario)
- `event_type`: Enum (property_acquisition, property_disposal, loan_refinancing)
- `event_date`: Date (Required)
- `property_id`: UUID (nullable, references existing property)
- `event_data`: JSONB (property details, loan terms, sale price, etc.)
- `financial_impact`: JSONB (calculated cash flows, tax implications)
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Relationships**:
- Belongs to Scenario
- References Property (for existing properties)

**Validation Rules**:
- Event date must be within scenario timeframe
- Event data structure depends on event type
- Financial impact calculated server-side

### Budget
Planned income and expense targets with variance tracking.

**Fields**:
- `id`: UUID (Primary Key)
- `property_id`: UUID (Foreign Key to Property)
- `budget_year`: Integer (Required)
- `budget_month`: Integer (nullable, for monthly budgets)
- `category`: String (Required)
- `budgeted_amount`: Decimal (Required)
- `actual_amount`: Decimal (calculated)
- `variance_threshold`: Decimal (%) (Default: 10)
- `notes`: Text
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Relationships**:
- Belongs to Property
- Calculated from Transaction records

**Validation Rules**:
- Budget year must be current or future
- Category must be valid transaction category
- Threshold must be positive

## Calculated Views

### KPI Snapshots
Time-series performance indicators calculated from base data.

**Materialized View Fields**:
- `portfolio_id`: UUID
- `calculation_date`: Date
- `total_property_value`: Decimal
- `total_debt`: Decimal
- `net_worth`: Decimal
- `ltv_ratio`: Decimal (%)
- `dscr_ratio`: Decimal
- `monthly_cashflow`: Decimal
- `annual_roi`: Decimal (%)
- `tax_liability`: Decimal

**Refresh Strategy**: Daily or on-demand for real-time updates

### Monthly Cashflow Summary
Aggregated income vs expenses per property per month.

**Materialized View Fields**:
- `property_id`: UUID
- `year_month`: Date (first day of month)
- `rental_income`: Decimal
- `operating_expenses`: Decimal
- `loan_payments`: Decimal
- `capex`: Decimal
- `net_cashflow`: Decimal
- `cumulative_cashflow`: Decimal

**Refresh Strategy**: Updated on transaction insert/update

## Data Integrity Rules

### Constraints
- Portfolio baseline date cannot change after transactions exist
- Property cannot be deleted with active loans
- Loan balance must equal sum of payments + interest
- Scenario events must maintain chronological order

### Audit Trail
- All entities track created_at and updated_at
- Critical changes logged to audit table
- User actions tracked for compliance

### RLS Policies
- Users can only access their own portfolios
- Shared portfolios based on sharing_settings
- Professional users can access client portfolios
- Admin users have read-only access to all data

## State Transitions

### Property Lifecycle
Draft → Active → Under Renovation → Sold/Archived

### Scenario Lifecycle
Draft → Active → Executed → Archived

### Loan Lifecycle
Pending → Active → Paid Off/Refinanced

## Performance Considerations

### Indexing Strategy
- B-tree indexes on foreign keys
- Composite indexes on (portfolio_id, date) for time-series queries
- GIN indexes on JSONB fields for settings and metadata

### Partitioning
- Transaction table partitioned by year
- KPI snapshots partitioned by quarter
- Large portfolios use horizontal scaling

### Caching
- KPI calculations cached for 1 hour
- Scenario results cached until parameters change
- User sessions cached for performance