# Contributing to StellarRent

We welcome contributions from the community! Whether you're fixing a bug, adding a feature, or improving documentation, your help is appreciated.

## Getting Started
1. Check out our open issues on GitHub or [OnlyDust](https://app.onlydust.com/projects/stellarrent).
2. Comment on an issue to explain why you're eligible to work on it, mentioning your experience and skills.

## Contribution Guidelines
- **Picking an Issue on OnlyDust**: Select an open issue and provide details about your qualifications in the comments.
- **Code Style**: Use Biome for auto-formatting. Ensure Biome is set as your default formatter in your IDE (`vscode://settings/editor.defaultFormatter`). Install the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome).

## 🚀 Quick Start for Contributors

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/stellar-rent.git
   cd stellar-rent
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Development Setup**

   **Option A: Docker (Recommended for beginners)**
   ```bash
   # Navigate to backend and start with Docker
   cd apps/backend
   docker-compose up
   
   # Test that it's working
   curl http://localhost:3000/health
   ```

   **Option B: Local Development**
   ```bash
   # Setup environment variables (see apps/backend/README.md)
   # Then start development
   bun run dev
   ```

4. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Make Changes & Format**
   ```bash
   # Make your changes...
   bun run format-and-lint:fix  # Auto-fixes formatting
   ```

6. **Create Pull Request**
   - Add a description (any length is fine!)
   - Our CI will handle the rest

## 🐳 Docker Development (Recommended)

For easier onboarding, we provide a **simple Docker setup** especially for the backend:

### Quick Docker Setup
```bash
# 1. Clone and navigate
git clone https://github.com/yourusername/stellar-rent.git
cd stellar-rent/apps/backend

# 2. Create .env file (minimal setup for Docker)
echo "PORT=3000
SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_ANON_KEY=placeholder_key
SUPABASE_SERVICE_ROLE_KEY=placeholder_service_key
JWT_SECRET=test_jwt_secret_for_docker_testing
CORS_ORIGIN=http://localhost:3001
NODE_ENV=development" > .env

# 3. Start Docker containers
docker-compose up

# 4. Test the API
curl http://localhost:3000/health
```

### Docker Benefits for Contributors
- ✅ **No local setup needed**: Works out of the box
- ✅ **Environment consistency**: Same setup for everyone
- ✅ **Hot reload**: Code changes automatically restart the server
- ✅ **Health monitoring**: Built-in health checks
- ✅ **Easy cleanup**: `docker-compose down` removes everything

### Docker Commands
```bash
# Start development environment
docker-compose up

# Run in background
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs backend

# Restart after changes
docker-compose restart backend
```

### Working with Docker
- **Edit code normally**: Changes sync automatically with the container
- **Install new packages**: Restart container after adding dependencies
- **Database changes**: You'll still need Supabase setup for full functionality
- **Debugging**: Use `docker-compose logs backend` to see server logs

## ✅ Automated Quality Checks

Our CI/CD is designed to be **contributor-friendly** while maintaining code quality:

- **Code Formatting**: Auto-formatted with Biome
- **Build Validation**: Ensures your changes don't break anything
- **Security**: Basic check for exposed secrets
- **Smart Testing**: Only tests the apps you modify (faster CI)
- **Large PR Warning**: Friendly reminder for large changes (doesn't block merge)

### 🎯 Contributor-Friendly Features

- **Auto-formatting**: Code gets formatted automatically
- **No strict commit rules**: Write commits however you prefer (though conventional commits are encouraged)
- **No required labels**: We don't enforce labels on PRs
- **Draft PRs**: Skip validation until you're ready
- **Warnings vs Errors**: Most issues are warnings, not blockers

## 🛠️ Development Commands

```bash
# Format code automatically
bun run format-and-lint:fix

# Check formatting
bun run format-and-lint

# Build all apps
bun run build

# Start development
bun run dev
```

## Git conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification as configured in our `commitlint.config.js`. Keep commit messages concise and descriptive.

### Commit Best Practices

1. **Atomic Commits**: Each commit should represent a single, complete change. This means:
   - One logical change per commit
   - Don't mix different types of changes (e.g., don't mix features with bug fixes)
   - Keep commits focused and small

2. **Commit Message Structure**:
   - First line: type and short description (max 72 characters)
   - Body: detailed explanation if needed
   - Footer: references to issues/tickets if applicable

3. **When to Commit**:
   - After completing a logical unit of work
   - When the code is in a working state
   - Before making a different type of change

The following commit types are allowed:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes
- `revert`: Reverting previous commits

For breaking changes, append `!` after the type/scope.

# Examples

```bash
# Good: Atomic commit with single change
feat: add user authentication

# Good: Atomic commit with scope
feat(auth): implement JWT token validation

# Bad: Multiple changes in one commit
feat: add auth and fix login bug and update docs

# Good: Breaking change
feat!: migrate to new API version
```

Please refer to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) for more information.

**Naming branches**

| Category | Description                                                           |
| -------- | --------------------------------------------------------------------- |
| hotfix   | for quickly fixing critical issues, usually with a temporary solution |
| bugfix   | for fixing a bug                                                      |
| feature  | for adding, removing or modifying a feature                           |
| test     | for experimenting something which is not an issue                     |
| wip      | for a work in progress                                                |

Example

```bash
feat/your-feature-name
```

---

## Process for summiting a PR

1. Create a new branch with the name of the feature you want to add

```bash
git checkout -b feat/your-feature-name
```

2. Make your changes and commit them

```bash
git add .
git commit -S -m "feat: your feature name"
git push origin feat/your-feature-name
```

3. Create a pull request on github

- Check for conflicts and resolve them
- On the description provide a summary of the changes you have made
- On the reviewers add the reviewers you want to review your PR
- Wait for the reviewers to review your PR

## 🤝 What We Need vs What We Don't

### What We Need
- **Description**: Tell us what you changed and why
- **Working code**: Should build without errors

### What We Don't Require
- Perfect commit message format (conventional commits encouraged but not enforced by CI)
- Labels on PRs
- Detailed descriptions (brief is fine!)
- Perfect code style (we auto-format)

## 🆘 Need Help?

- **Formatting issues?** Run `bun run format-and-lint:fix`
- **Build errors?** Check the CI logs for specific errors
- **Large PR warning?** Consider splitting into smaller PRs (but it won't block merge)
- **Questions?** Open an issue or ask in your PR

Thanks for contributing! 🎉

---