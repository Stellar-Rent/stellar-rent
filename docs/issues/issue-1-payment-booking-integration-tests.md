## 📘 Issue Description

Priority: CRITICAL

Current: Backend booking tests only cover basic GETs. Critical payment + booking + smart contract flow is not covered end-to-end. We must validate business rules, security checks, and failure recovery for a financial flow (USDC on Stellar + escrow) with realistic scenarios.

Goal: Comprehensive integration tests for booking creation, payment confirmation (Trustless Work), and smart contract interactions, including error paths, race conditions, and authorization.

## 🔍 Steps

1. Extend `apps/backend/tests/integration/` with a booking flow suite (new file: `booking-flow.int.test.ts`).
2. Add fixtures for users/properties/dates under `apps/backend/tests/fixtures/`.
3. Add blockchain/payment mocks under `apps/backend/tests/mocks/` (Trustless Work API + Soroban interactions).
4. Cover scenarios:
   - Property availability validation
   - POST /bookings (pending)
   - Payment confirmation (Trustless Work) → PUT /bookings/:id/confirm
   - Status transitions: pending → confirmed → completed → cancelled
   - Race conditions: concurrent bookings on same dates
   - Validation: amount matching between backend and on-chain intent
   - Security: unauthorized access, invalid tokens, replay/challenge expiry
   - Failure modes: network timeouts, Trustless errors, contract failures (use mocks)
5. Ensure idempotency of payment confirmation; protect against replay.
6. Document how to run integration tests locally and in CI.

## ✅ Acceptance Criteria

- [ ] High coverage (≥90% critical paths) of booking endpoints, including error branches
- [ ] Race condition tests that prevent double-booking
- [ ] Amount validation between backend and on-chain intent
- [ ] Security checks: authZ/authN, replay/nonce/expiry enforced
- [ ] Robust mocks for blockchain/payment with deterministic outcomes
- [ ] Test suite completes under ~90s in CI with parallelization
- [ ] README/docs for setup, running, and conventions

## 🌎 References

- Current tests: `apps/backend/tests/integration/booking.test.ts`
- Booking service: `apps/backend/src/services/booking.service.ts`
- Smart contracts: `apps/stellar-contracts/contracts/booking/`
- Trustless Work: `apps/backend/src/blockchain/trustlessWork.ts`

## 📜 Additional Notes

- Start with mocks (contract tests) before wiring real network calls.
- Consider chaos tests (timeouts/retries) and rate limiting tests for payment endpoints.

