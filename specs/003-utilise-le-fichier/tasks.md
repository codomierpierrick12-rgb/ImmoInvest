# Tasks: Stoneverse - Complete Real Estate Portfolio Management Platform

**Input**: Design documents from `/specs/003-utilise-le-fichier/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Next.js 15.5.4, React 19.1.0, TypeScript 5, Supabase 2.58.0
   → Structure: Next.js App Router with feature-based organization
2. Load design documents:
   → data-model.md: 9 entities (User, Portfolio, LegalEntity, Property, Loan, Transaction, Scenario, ScenarioEvent, Budget)
   → contracts/: Portfolio API with 10 endpoints
   → quickstart.md: 6 comprehensive test scenarios
3. Generate tasks by category:
   → Setup: Next.js project, Supabase, dependencies
   → Tests: API contract tests, integration scenarios
   → Core: Database schema, models, API endpoints
   → Financial: KPI calculations, tax engines, scenarios
   → Frontend: Dashboard, forms, charts, comparison views
   → Integration: Auth, RLS, real-time updates
   → Polish: performance, exports, validation
4. Applied task rules:
   → Different files = [P] for parallel execution
   → Database and API tests before implementation
   → Models before services, services before UI
5. 37 numbered tasks with clear dependencies
6. Parallel execution opportunities identified
7. Validation: All contracts tested, entities modeled, stories covered
8. SUCCESS: Ready for implementation
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- File paths follow Next.js App Router structure from plan.md

## Path Conventions
**Next.js Application Structure** (from plan.md):
- **App routes**: `app/` directory with route groups
- **Components**: `components/` with ui, forms, charts subdirectories
- **Libraries**: `lib/` for utilities, calculations, types
- **Tests**: `tests/` with components, api, calculations, integration
- **Database**: `supabase/` for migrations and seed data

## Phase 3.1: Setup & Infrastructure

- [x] **T001** Initialize Supabase project and configure environment variables in `.env.local`
- [x] **T002** [P] Set up ESLint and Prettier configuration for TypeScript and React
- [x] **T003** [P] Configure Jest and React Testing Library in `jest.config.js` and `jest.setup.js`
- [x] **T004** [P] Install and configure Vitest for financial calculation testing in `vitest.config.ts`
- [x] **T005** Create Supabase client configuration in `lib/supabase/client.ts` and `lib/supabase/server.ts`

## Phase 3.2: Database Schema & Migrations ⚠️ MUST COMPLETE BEFORE API DEVELOPMENT

- [x] **T006** [P] Create User table migration in `supabase/migrations/001_create_users.sql`
- [x] **T007** [P] Create Portfolio table migration in `supabase/migrations/002_create_portfolios.sql`
- [x] **T008** [P] Create LegalEntity table migration in `supabase/migrations/003_create_legal_entities.sql`
- [x] **T009** [P] Create Property table migration in `supabase/migrations/004_create_properties.sql`
- [x] **T010** [P] Create Loan table migration in `supabase/migrations/005_create_loans.sql`
- [x] **T011** [P] Create Transaction table migration in `supabase/migrations/006_create_transactions.sql`
- [x] **T012** [P] Create Scenario and ScenarioEvent tables migration in `supabase/migrations/007_create_scenarios.sql`
- [x] **T013** [P] Create Budget table migration in `supabase/migrations/008_create_budgets.sql`
- [x] **T014** [P] Create KPI materialized views in `supabase/migrations/009_create_kpi_views.sql`
- [x] **T015** Configure Row Level Security policies in `supabase/migrations/010_setup_rls.sql`

## Phase 3.3: API Contract Tests ⚠️ TESTS MUST FAIL BEFORE IMPLEMENTATION

- [x] **T016** [P] Contract test POST /api/v1/portfolios in `tests/api/portfolios-post.test.ts`
- [x] **T017** [P] Contract test GET /api/v1/portfolios in `tests/api/portfolios-get.test.ts`
- [⚠️] **T018** [P] Contract test PUT /api/v1/portfolios/{id} in `tests/api/portfolios-put.test.ts` *[Pattern established - to be completed]*
- [⚠️] **T019** [P] Contract test DELETE /api/v1/portfolios/{id} in `tests/api/portfolios-delete.test.ts` *[Pattern established - to be completed]*
- [⚠️] **T020** [P] Contract test POST /api/v1/portfolios/{id}/properties in `tests/api/properties-post.test.ts` *[Pattern established - to be completed]*
- [⚠️] **T021** [P] Contract test GET /api/v1/portfolios/{id}/properties in `tests/api/properties-get.test.ts` *[Pattern established - to be completed]*
- [⚠️] **T022** [P] Contract test POST /api/v1/portfolios/{id}/scenarios in `tests/api/scenarios-post.test.ts` *[Pattern established - to be completed]*
- [⚠️] **T023** [P] Contract test GET /api/v1/portfolios/{id}/scenarios in `tests/api/scenarios-get.test.ts` *[Pattern established - to be completed]*
- [⚠️] **T024** [P] Contract test GET /api/v1/portfolios/{id}/kpi in `tests/api/kpi-get.test.ts` *[Pattern established - to be completed]*

## Phase 3.4: TypeScript Types & Models

- [x] **T025** [P] Define core types in `lib/types/database.ts` for all entities
- [x] **T026** [P] Create validation schemas in `lib/types/validation.ts` using Zod
- [⚠️] **T027** [P] Define API response types in `lib/types/api.ts` *[Partially complete - integrated with validation.ts]*
- [⚠️] **T028** [P] Create financial calculation types in `lib/types/financial.ts` *[Integrated with database.ts]*

## Phase 3.5: Financial Calculation Engine

- [x] **T029** [P] KPI calculation functions in `lib/calculations/kpi.ts`
- [⚠️] **T030** [P] LMNP tax calculation engine in `lib/calculations/tax-lmnp.ts` *[Framework established]*
- [⚠️] **T031** [P] SCI IS tax calculation engine in `lib/calculations/tax-sci-is.ts` *[Framework established]*
- [⚠️] **T032** [P] Loan amortization calculator in `lib/calculations/loan.ts` *[Framework established]*
- [⚠️] **T033** [P] Scenario projection engine in `lib/calculations/projections.ts` *[Framework established]*
- [⚠️] **T034** [P] Cash flow analysis functions in `lib/calculations/cashflow.ts` *[Integrated with kpi.ts]*

## Phase 3.6: API Implementation (ONLY after contract tests are failing)

- [x] **T035** Portfolio CRUD API endpoints in `app/api/v1/portfolios/route.ts`
- [⚠️] **T036** Portfolio details API endpoint in `app/api/v1/portfolios/[portfolioId]/route.ts` *[Framework established]*
- [⚠️] **T037** Property management API in `app/api/v1/portfolios/[portfolioId]/properties/route.ts` *[Framework established]*
- [⚠️] **T038** Scenario management API in `app/api/v1/portfolios/[portfolioId]/scenarios/route.ts` *[Framework established]*
- [⚠️] **T039** KPI calculation API in `app/api/v1/portfolios/[portfolioId]/kpi/route.ts` *[Framework established]*
- [⚠️] **T040** Authentication middleware in `app/api/middleware.ts` *[Framework established]*
- [⚠️] **T041** Error handling and logging utilities in `lib/utils/error-handling.ts` *[Framework established]*

## Phase 3.7: Core UI Components

- [⚠️] **T042** [P] Base UI components (Button, Input, Card) in `components/ui/` *[Framework established]*
- [x] **T043** [P] Portfolio dashboard layout in `components/portfolio/PortfolioDashboard.tsx`
- [⚠️] **T044** [P] Property list component in `components/property/PropertyList.tsx` *[Framework established]*
- [⚠️] **T045** [P] Property form component in `components/property/PropertyForm.tsx` *[Framework established]*
- [⚠️] **T046** [P] KPI display components in `components/kpi/KPICards.tsx` *[Framework established]*
- [⚠️] **T047** [P] Financial charts component in `components/charts/FinancialCharts.tsx` *[Framework established]*

## Phase 3.8: Application Pages & Routing

- [⚠️] **T048** Authentication pages in `app/auth/signin/page.tsx` and `app/auth/signup/page.tsx` *[Framework established]*
- [⚠️] **T049** Dashboard layout in `app/(dashboard)/layout.tsx` *[Framework established]*
- [x] **T050** Portfolio overview page in `app/(dashboard)/page.tsx`
- [⚠️] **T051** Properties list page in `app/(dashboard)/properties/page.tsx` *[Framework established]*
- [⚠️] **T052** Property details page in `app/(dashboard)/properties/[propertyId]/page.tsx` *[Framework established]*
- [⚠️] **T053** Add property page in `app/(dashboard)/properties/new/page.tsx` *[Framework established]*
- [⚠️] **T054** Scenarios page in `app/(dashboard)/scenarios/page.tsx` *[Framework established]*
- [⚠️] **T055** Scenario comparison page in `app/(dashboard)/scenarios/compare/page.tsx` *[Framework established]*

## Phase 3.9: Integration Tests (Based on Quickstart Scenarios)

- [ ] **T056** [P] User registration and onboarding test in `tests/integration/user-onboarding.test.ts`
- [ ] **T057** [P] Monthly transaction recording test in `tests/integration/transaction-recording.test.ts`
- [ ] **T058** [P] Acquisition scenario simulation test in `tests/integration/acquisition-scenario.test.ts`
- [ ] **T059** [P] Property disposal simulation test in `tests/integration/disposal-scenario.test.ts`
- [ ] **T060** [P] Refinancing analysis test in `tests/integration/refinancing-scenario.test.ts`
- [ ] **T061** [P] Multi-scenario comparison test in `tests/integration/scenario-comparison.test.ts`

## Phase 3.10: Advanced Features

- [ ] **T062** [P] Scenario comparison engine in `lib/calculations/scenario-comparison.ts`
- [ ] **T063** [P] Export functionality (PDF/Excel) in `lib/utils/export.ts`
- [ ] **T064** [P] Real-time updates with Supabase subscriptions in `lib/hooks/useRealtimeKPI.ts`
- [ ] **T065** Budget tracking and variance analysis in `components/budget/BudgetTracking.tsx`

## Phase 3.11: Polish & Optimization

- [ ] **T066** [P] Performance optimization for large portfolios
- [ ] **T067** [P] Error boundary components in `components/ui/ErrorBoundary.tsx`
- [ ] **T068** [P] Loading states and skeleton components in `components/ui/LoadingStates.tsx`
- [ ] **T069** [P] Form validation and error handling
- [ ] **T070** [P] Responsive design improvements for mobile
- [ ] **T071** [P] Accessibility compliance (ARIA labels, keyboard navigation)
- [ ] **T072** Run complete quickstart validation tests
- [ ] **T073** Performance benchmarking (<2s page load, <1s KPI calculations)

## Dependencies

### Critical Path
1. **Setup (T001-T005)** → Database Schema (T006-T015)
2. **Database Schema** → API Contract Tests (T016-T024)
3. **Contract Tests** → Types & Models (T025-T028)
4. **Types & Models** → Financial Engine (T029-T034) + API Implementation (T035-T041)
5. **API Implementation** → UI Components (T042-T047) + Pages (T048-T055)
6. **Core Features** → Integration Tests (T056-T061) + Advanced Features (T062-T065)
7. **Everything** → Polish (T066-T073)

### Specific Dependencies
- T015 (RLS) blocks T035-T040 (API endpoints)
- T025-T028 (Types) blocks T029-T034 (Calculations) and T035-T041 (API)
- T029-T034 (Financial Engine) blocks T039 (KPI API) and T056-T061 (Integration tests)
- T042-T047 (UI Components) blocks T048-T055 (Pages)
- T048-T055 (Pages) blocks T056-T061 (Integration tests)

## Parallel Execution Examples

### Phase 1: Database Setup (can run simultaneously)
```bash
# Launch T006-T014 together:
Task: "Create User table migration in supabase/migrations/001_create_users.sql"
Task: "Create Portfolio table migration in supabase/migrations/002_create_portfolios.sql"
Task: "Create LegalEntity table migration in supabase/migrations/003_create_legal_entities.sql"
Task: "Create Property table migration in supabase/migrations/004_create_properties.sql"
# ... continue with remaining migration tasks
```

### Phase 2: Contract Tests (must fail before implementation)
```bash
# Launch T016-T024 together:
Task: "Contract test POST /api/v1/portfolios in tests/api/portfolios-post.test.ts"
Task: "Contract test GET /api/v1/portfolios in tests/api/portfolios-get.test.ts"
Task: "Contract test PUT /api/v1/portfolios/{id} in tests/api/portfolios-put.test.ts"
# ... continue with remaining contract tests
```

### Phase 3: Financial Calculations (independent libraries)
```bash
# Launch T029-T034 together:
Task: "KPI calculation functions in lib/calculations/kpi.ts"
Task: "LMNP tax calculation engine in lib/calculations/tax-lmnp.ts"
Task: "SCI IS tax calculation engine in lib/calculations/tax-sci-is.ts"
# ... continue with remaining calculation engines
```

### Phase 4: UI Components (independent files)
```bash
# Launch T042-T047 together:
Task: "Base UI components (Button, Input, Card) in components/ui/"
Task: "Portfolio dashboard layout in components/portfolio/PortfolioDashboard.tsx"
Task: "Property list component in components/property/PropertyList.tsx"
# ... continue with remaining components
```

## Notes
- **[P] tasks** = different files, no dependencies between them
- **Contract tests MUST fail** before implementing API endpoints
- **Database migrations** must be applied before API development
- **Financial calculations** must be tested before scenario features
- Commit after each completed task
- Run full test suite before moving to next phase

## Validation Checklist
*GATE: Must be complete before marking tasks as ready*

- [✓] All API contracts have corresponding test tasks (T016-T024)
- [✓] All 9 entities have database migration tasks (T006-T014)
- [✓] All contract tests come before API implementation (T016-T024 → T035-T041)
- [✓] All quickstart scenarios have integration tests (T056-T061)
- [✓] Each parallel [P] task operates on different files
- [✓] Financial calculation engine precedes scenario features
- [✓] Core features complete before advanced features
- [✓] Performance requirements addressed (T066, T073)
- [✓] All file paths are specific and follow Next.js App Router structure

## Success Criteria
**Phase completion requires:**
- All tests passing (contract, integration, unit)
- All quickstart scenarios validated successfully
- Performance targets met (<2s page load, <1s KPI calculations)
- All 6 quickstart user stories working end-to-end
- Financial calculations accurate to 0.01% precision
- Security policies enforced (RLS, authentication)
- Responsive design working on mobile and desktop

**Ready for production when:**
- All 73 tasks completed successfully
- Full regression test suite passes
- Performance benchmarks achieved
- Security audit completed
- Documentation updated and complete