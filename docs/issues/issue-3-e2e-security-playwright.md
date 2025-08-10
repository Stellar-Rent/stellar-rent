## 📘 Issue Description

Priority: HIGH

Current: No end-to-end coverage of user journey (search → book → pay → confirm). For a financial app, we need Playwright-based E2E tests including wallet flows and security validation.

Goal: Playwright test suite (TypeScript) that validates critical flows, security, visual regressions, and basic performance. Use mocked Freighter wallet and test env.

## 🔍 Steps

1. Scaffold Playwright in `apps/web/` with TS config and scripts.
2. Configure environments: local (docker-compose), staging (Testnet), mocked Freighter provider.
3. Implement journeys:
   - Registration/login (email + wallet)
   - Search → property → booking → payment → confirmation
   - Host: create listing, manage bookings
4. Security checks:
   - Unauthorized access redirects/blocks
   - CSRF/XSS basic probes
   - Session handling and logout
5. Payment validation:
   - Wallet connect + signature
   - Payment status propagation to UI
   - Confirmation flow
6. Visual regression snapshots for critical screens
7. Performance budgets on key paths (<3s TTI target)
8. CI integration with artifacts (screenshots/videos on failure)

## ✅ Acceptance Criteria

- [ ] Coverage of the main journeys listed above
- [ ] Wallet flows pass with mocked provider
- [ ] Security checks validated (no unauthorized access)
- [ ] Cross-browser runs (Chromium, WebKit, Firefox) at least in CI weekly
- [ ] Mobile viewport checks for primary flows
- [ ] Visual regression snapshots committed and stable
- [ ] CI pipeline runs tests and uploads artifacts

## 🌎 References

- Frontend: `apps/web/`
- Auth: `apps/web/src/components/auth/`
- Booking: `apps/web/src/components/booking/`
- Wallet: `apps/web/src/hooks/stellar/`

## 📜 Additional Notes

- Keep selectors resilient; prefer testids and role-based queries.
- Seed data deterministically; reset between tests.

