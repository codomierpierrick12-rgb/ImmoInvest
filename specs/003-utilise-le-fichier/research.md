# Research Phase: Stoneverse Implementation

**Feature**: Complete Real Estate Portfolio Management Platform
**Date**: 2025-09-26

## Technology Stack Decisions

### Frontend Framework
**Decision**: Next.js 15.5.4 with React 19.1.0 and App Router
**Rationale**:
- Already established in the project
- Excellent for complex financial applications with server-side rendering
- App Router provides modern routing and layout capabilities
- Strong TypeScript support for financial calculations
**Alternatives considered**:
- Vue.js with Nuxt: Good but would require migration
- Vanilla React: Less structured, missing SSR benefits

### Backend & Database
**Decision**: Supabase with PostgreSQL and Row Level Security (RLS)
**Rationale**:
- Already integrated in the project
- PostgreSQL excellent for complex financial queries and calculations
- RLS perfect for multi-tenant portfolio management
- Real-time capabilities for live KPI updates
- Built-in authentication and authorization
**Alternatives considered**:
- Firebase: Less suitable for complex relational data
- Custom Node.js API: More complexity, reinventing auth/security

### Styling & UI
**Decision**: TailwindCSS 4 with custom component library
**Rationale**:
- Already configured in the project
- Excellent for financial dashboards and complex layouts
- Good performance and maintainability
- Version 4 offers modern features
**Alternatives considered**:
- Material-UI: Too opinionated for financial apps
- Styled Components: More verbose, less performant

### Testing Strategy
**Decision**: Jest + React Testing Library for components, Vitest for calculations
**Rationale**:
- Industry standard for React applications
- Jest excellent for complex financial calculation testing
- React Testing Library for user interaction testing
- Vitest for faster calculation unit tests
**Alternatives considered**:
- Cypress only: Slower for unit testing calculations
- Playwright: Better for E2E but overkill for unit tests

## Financial Calculation Patterns

### Tax Calculation Engine
**Decision**: Modular calculation engine with pluggable tax rules
**Rationale**:
- Support for LMNP and SCI IS tax structures
- Easy to add new tax jurisdictions
- Testable and auditable calculations
- Configurable tax rates and thresholds

### Performance Optimization
**Decision**: Client-side caching with React Query + server-side calculations
**Rationale**:
- Real-time KPI updates without full page refresh
- Complex calculations performed server-side for accuracy
- Caching prevents redundant calculations
- Progressive loading for large portfolios

### Data Modeling
**Decision**: Normalized relational model with calculated views
**Rationale**:
- Complex relationships between portfolios, properties, loans
- Materialized views for aggregated KPIs
- Event sourcing for transaction history
- Audit trail for all modifications

## Security & Compliance

### Authentication
**Decision**: Supabase Auth with email/password and social providers
**Rationale**:
- Integrated with RLS policies
- GDPR compliant by default
- Support for professional user management
- Audit trails built-in

### Data Protection
**Decision**: RLS policies + client-side validation
**Rationale**:
- Portfolio isolation at database level
- Sharing permissions (read/comment/edit)
- Professional user access to client portfolios
- GDPR compliance with data retention policies

## Integration Patterns

### Real-time Updates
**Decision**: Supabase Realtime for KPI updates
**Rationale**:
- Live portfolio performance monitoring
- Multi-user collaboration on scenarios
- Immediate feedback on calculations

### Export Capabilities
**Decision**: Server-side PDF/Excel generation
**Rationale**:
- Complex financial reports with charts
- Audit-quality document generation
- Large dataset handling

## Development Workflow

### Code Organization
**Decision**: Feature-based modules with shared calculation libraries
**Rationale**:
- Clear separation of concerns
- Reusable calculation logic
- Easy testing and maintenance
- Scalable architecture

### Database Migrations
**Decision**: Supabase migrations with seed data
**Rationale**:
- Version controlled schema changes
- Reproducible development environments
- Easy rollback capabilities

## Implementation Priorities

1. **Core Data Model**: Portfolio, Property, Loan entities
2. **Basic CRUD Operations**: Property management with simple calculations
3. **Financial Engine**: KPI calculations and tax rules
4. **Scenario System**: What-if simulation capabilities
5. **Advanced Features**: Budgets, exports, advanced analytics

## Risks and Mitigations

**Risk**: Complex French tax calculations
**Mitigation**: Modular tax engine with extensive unit tests

**Risk**: Performance with large portfolios
**Mitigation**: Materialized views, calculated columns, pagination

**Risk**: Data integrity in financial calculations
**Mitigation**: Database constraints, server-side validation, audit logs

**Risk**: User experience complexity
**Mitigation**: Progressive disclosure, wizards, contextual help