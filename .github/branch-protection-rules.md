# Branch Protection Setup

Simple guide to configure repository protection rules in GitHub.

## 🔒 GitHub Settings Configuration

Go to **Settings > Branches** in your GitHub repository and configure:

### Main Branch Protection

1. **Create rule for `main` branch**:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: `1`
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

2. **Required status checks**:
   - `CI / lint-and-format`
   - `CI / test-web` (if web changes)
   - `CI / test-backend` (if backend changes)
   - `CI / test-contracts` (if contract changes)
   - `PR Validation / validate-pr`
   - `PR Validation / security-check`

3. **Additional settings**:
   - ✅ Restrict pushes that create files
   - ✅ Do not allow bypassing the above settings

## 🚀 For Contributors

### Quick Start
1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes
4. Ensure code is formatted: `bun run format-and-lint:fix`
5. Create a Pull Request with a description

### What Gets Checked
- ✅ Code formatting (automatic with Biome)
- ✅ Build passes
- ✅ No secrets in code
- ✅ PR has description

### Tips
- PRs are automatically formatted if possible
- Large PRs (30+ files, 1000+ lines) get a warning but don't fail
- Draft PRs skip validation until marked ready
- Only changed apps get tested (faster CI)

## 🛠️ Maintenance

### Optional Enhancements
You can add these later if needed:
- CODEOWNERS file for code review assignments
- Additional labels for better organization
- Commit message validation (currently disabled for contributor friendliness)

### Emergency Access
Repository admins can bypass protections when necessary for critical fixes. 