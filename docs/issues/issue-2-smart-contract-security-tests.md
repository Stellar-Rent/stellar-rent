## 📘 Issue Description

Priority: HIGH

Current: Soroban contract tests exist but focus on happy paths. We need security-focused tests covering reentrancy, invalid state transitions, timestamp manipulation, and economic attacks relevant to bookings/escrow.

Goal: Expand Rust tests to include security, invariants, and fuzzing across booking/property-listing/review contracts, plus cross-contract interactions.

## 🔍 Steps

1. Audit existing tests in `apps/stellar-contracts/contracts/*/src/test.rs`.
2. Add security suites:
   - Reentrancy prevention
   - Overflow/underflow checks
   - Timestamp manipulation resistance
   - Unauthorized access/state transitions
3. Economic simulations:
   - Front-running on bookings
   - Price/amount manipulation attempts
   - Cancellation abuse
4. Property-based/fuzzing tests (e.g., `proptest`) with seeded randomness.
5. Cross-contract tests (booking ↔ property-listing ↔ review) for state consistency.
6. Gas/footprint checks to prevent regressions (relative thresholds).
7. Network-specific deployment validation (Testnet/Mainnet config).

## ✅ Acceptance Criteria

- [ ] Security test coverage for known vulnerability classes
- [ ] Fuzzing with ≥1000 random inputs and reproducible seeds
- [ ] Economic attack simulations with assertions against exploits
- [ ] Cross-contract integration tests pass and keep state coherent
- [ ] Gas bounds enforced via regression thresholds
- [ ] Docs describing assumptions, mitigations, and how to run

## 🌎 References

- Contracts: `apps/stellar-contracts/contracts/`
- Current tests: `apps/stellar-contracts/contracts/booking/src/test.rs`
- Soroban testing: https://developers.stellar.org/docs/smart-contracts/testing

## 📜 Additional Notes

- Emphasize invariants (escrow sum never negative, total balances conserved).
- Make tests independent and fast; parallelize where possible.

