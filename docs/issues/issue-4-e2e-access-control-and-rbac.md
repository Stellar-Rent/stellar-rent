## 📘 Issue Description

Priority: HIGH

Current: We lack end-to-end coverage for access control. Host-only and tenant-only areas (e.g., dashboards, booking actions, property management) must enforce RBAC and session rules across UI and API.

Goal: Add Playwright E2E tests to validate access control, redirections, protected routes, and role separation under realistic sessions (email and wallet).

## 🔍 Steps

1. Seed test users: one host, one tenant (fixtures or API setup).
2. Validate route protection:
   - Anonymous → redirect from protected routes to login/register with return URL
   - Tenant cannot access host dashboard/actions; host cannot access tenant-only features
3. Validate session behavior:
   - Session persists across reload; logout clears session/storage
   - Token expiry/invalid token → redirect and cleanup
4. Check API-level enforcement via UI actions (negative tests): requests blocked, proper errors shown.
5. Cover both auth types (email + wallet) where applicable.

## ✅ Acceptance Criteria

- [ ] Anonymous users are redirected away from protected routes
- [ ] Tenants cannot view/modify host resources; vice versa
- [ ] Sessions persist and logout fully clears client state
- [ ] Expired/invalid tokens trigger safe redirect + cleanup
- [ ] Tests run headless and pass in CI with stable selectors

## 🌎 References

- Web: `apps/web/` (dashboards, guards)
- Auth hooks: `apps/web/src/hooks/auth/`
- Backend auth endpoints: `apps/backend/src/routes/auth.ts`

## 📜 Additional Notes

- Prefer data-testid and role-based selectors; avoid brittle CSS selectors.
- Consider adding a small mock auth provider for deterministic wallet flows.

