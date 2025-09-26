# Feature Specification: Stoneverse - Complete Real Estate Portfolio Management Platform

**Feature Branch**: `003-utilise-le-fichier`
**Created**: 2025-09-26
**Status**: Draft
**Input**: User description: "Utilise le fichier SPEC.md de la racine du repo comme base complète de la constitution."

## Execution Flow (main)
```
1. Parse user description from Input
   → Use comprehensive SPEC.md as complete project foundation
2. Extract key concepts from description
   → Actors: Individual investors, Admins, Professional users
   → Actions: Portfolio tracking, scenario simulation, financial analysis
   → Data: Properties, loans, cash flows, tax calculations, scenarios
   → Constraints: Multi-entity support (LMNP/SCI), real-time KPIs
3. For each unclear aspect:
   → [NEEDS CLARIFICATION: Implementation timeline and MVP scope]
4. Fill User Scenarios & Testing section
   → Comprehensive user journey from onboarding to decision-making
5. Generate Functional Requirements
   → Complete platform with 9 main functional areas
6. Identify Key Entities
   → Portfolio, Properties, Loans, Scenarios, Financial calculations
7. Run Review Checklist
   → WARN "Large scope requiring phased implementation"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
Real estate investors need a comprehensive platform to track their existing property portfolio in real-time, simulate acquisition and disposal scenarios, and make informed investment decisions based on detailed financial analysis including tax implications, cash flow projections, and key performance indicators.

### Acceptance Scenarios
1. **Given** a new user with existing properties, **When** they complete the onboarding wizard, **Then** their portfolio baseline is established with current valuations, loan balances, and rental income
2. **Given** an established portfolio, **When** the user enters monthly transactions (rent received, expenses paid, vacancy periods), **Then** KPIs are automatically recalculated and alerts triggered for deviations
3. **Given** a user considering a new acquisition, **When** they create a "what-if" scenario with property details and financing options, **Then** they can compare the impact on portfolio performance over 5-30 years
4. **Given** a user considering selling a property, **When** they simulate the sale with disposal costs and tax calculations, **Then** they see net cash proceeds and portfolio impact including LTV and DSCR changes
5. **Given** a user with multiple financing options, **When** they simulate refinancing scenarios, **Then** they can compare total costs and portfolio impacts to choose the optimal solution
6. **Given** completed scenarios, **When** users access the comparison dashboard, **Then** they can evaluate up to 5 scenarios using TRI, VAN, cumulative cash flow, and risk metrics

### Edge Cases
- What happens when a user tries to delete a property with active loan balances and historical transactions?
- How does the system handle negative cash flow months and portfolio-level covenant breaches?
- What validation occurs for unrealistic property valuations or rental yields?
- How are tax calculations handled across fiscal year boundaries?
- What happens when loan terms change mid-period (rate adjustments, early repayment penalties)?

## Requirements *(mandatory)*

### Functional Requirements

**Portfolio Management (Real Mode)**
- **FR-001**: System MUST allow users to create and manage property portfolios with multiple legal entities (Personal, LMNP, SCI IS)
- **FR-002**: System MUST support onboarding wizard for existing properties with historical data import (purchase price, current loan balances, rental rates)
- **FR-003**: System MUST capture monthly operational events per property (rent received, vacancy periods, operating expenses, capital expenditures, rate indexations)
- **FR-004**: System MUST automatically calculate and update key performance indicators (portfolio value, debt, net worth, LTV, DSCR, cash flow, tax liabilities)
- **FR-005**: System MUST support multiple loan types per property (amortizing, interest-only, fixed/variable rates, payment deferrals, early repayment penalties)

**Scenario Simulation (What-If Mode)**
- **FR-006**: System MUST allow creation of acquisition scenarios with new properties, financing options, and tax structure selection
- **FR-007**: System MUST enable disposal simulation with sale price, transaction costs, early repayment penalties, and tax calculations
- **FR-008**: System MUST support refinancing scenarios including rate renegotiation, loan extension, external refinancing, and cash-out options
- **FR-009**: System MUST allow comparison of up to 5 scenarios with performance metrics over configurable time horizons (5-30 years)
- **FR-010**: System MUST calculate net seller proceeds and portfolio impact for disposal scenarios

**Tax Calculations**
- **FR-011**: System MUST calculate LMNP taxation including component-based depreciation, expense limitations, and private capital gains with duration-based allowances
- **FR-012**: System MUST calculate SCI IS taxation including corporate tax, deficit carryforwards, and professional capital gains with depreciation recapture
- **FR-013**: System MUST support configurable tax rates and thresholds for different jurisdictions and entity types

**Financial Analysis & Reporting**
- **FR-014**: System MUST provide consolidated portfolio views with real vs budget comparisons and variance analysis
- **FR-015**: System MUST generate rolling forecasts and budget alerts for threshold breaches
- **FR-016**: System MUST calculate investment returns (TRI, VAN) and risk metrics at property and portfolio levels
- **FR-017**: System MUST support PDF and Excel exports for all reports and scenarios

**User Management & Security**
- **FR-018**: System MUST implement user authentication and portfolio access controls with sharing permissions (read, comment, edit)
- **FR-019**: System MUST support professional users managing multiple client portfolios
- **FR-020**: System MUST maintain audit trails for all transactions and scenario modifications

**Data Management**
- **FR-021**: System MUST provide data import/export capabilities for transactions and portfolio setup
- **FR-022**: System MUST implement automated backup and GDPR-compliant data retention policies
- **FR-023**: System MUST support tagging, search, and version history for portfolios and scenarios [NEEDS CLARIFICATION: Implementation timeline and MVP scope not specified]

### Key Entities *(include if feature involves data)*
- **Portfolio**: Top-level container representing an investor's complete real estate holdings, including multiple legal entities and consolidated performance metrics
- **Legal Entity**: Tax structures (Personal, LMNP, SCI IS) that own properties and determine taxation rules and reporting requirements
- **Property**: Individual real estate assets with acquisition details, current valuation, physical characteristics, and operational performance
- **Loan**: Financing instruments associated with properties, including terms, payment schedules, balances, and covenants
- **Transaction**: Monthly operational events including rent receipts, expense payments, capital improvements, and vacancy periods
- **Scenario**: Simulation environments for testing acquisition, disposal, or refinancing decisions with comparative analysis
- **Budget**: Planned income and expense targets with variance tracking and alert thresholds
- **Tax Calculation**: Entity-specific tax computations including depreciation, capital gains, and corporate/personal tax liabilities
- **KPI Snapshot**: Time-series performance indicators including LTV, DSCR, cash flow, and investment returns

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [ ] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---
