# API Contract Tests

This directory contains contract tests for the Stoneverse API endpoints.

## Test Status

- ✅ **portfolios-post.test.ts** - Complete contract test for POST /api/v1/portfolios
- ✅ **portfolios-get.test.ts** - Basic contract test for GET /api/v1/portfolios
- 🚧 **Remaining tests** - Following the same pattern as above

## Test Pattern

Each contract test follows this structure:

1. **Authentication Tests** - Verify 401 responses for unauthenticated requests
2. **Validation Tests** - Test input validation and 400 responses
3. **Success Cases** - Test valid requests and expected response formats
4. **Error Handling** - Test database errors and edge cases
5. **Response Schema** - Verify response structure matches OpenAPI spec

## Running Tests

```bash
# Run all contract tests
npm run test:contracts

# Run specific test
npm test tests/api/portfolios-post.test.ts

# Run with coverage
npm run test:coverage
```

## TDD Approach

⚠️ **IMPORTANT**: These tests are designed to **FAIL** initially (before API implementation).

This follows Test-Driven Development (TDD):
1. Write failing tests (contract definition)
2. Implement minimal API to make tests pass
3. Refactor and improve

## Remaining Contract Tests to Implement

Following the pattern established in `portfolios-post.test.ts`:

- **T018** PUT /api/v1/portfolios/{id}
- **T019** DELETE /api/v1/portfolios/{id}
- **T020** POST /api/v1/portfolios/{id}/properties
- **T021** GET /api/v1/portfolios/{id}/properties
- **T022** POST /api/v1/portfolios/{id}/scenarios
- **T023** GET /api/v1/portfolios/{id}/scenarios
- **T024** GET /api/v1/portfolios/{id}/kpi

Each test should cover:
- Authentication requirements
- Input validation per OpenAPI schema
- Success response format
- Error handling scenarios
- Database constraint validation