# Contributing to StellarRent

We welcome contributions from the community! Whether you're fixing a bug, adding a feature, or improving documentation, your help is appreciated.

## Getting Started
1. Check out our open issues on GitHub or [OnlyDust](https://app.onlydust.com/projects/stellarrent).
2. Comment on an issue to explain why you're eligible to work on it, mentioning your experience and skills.

## Contribution Guidelines
- **Picking an Issue on OnlyDust**: Select an open issue and provide details about your qualifications in the comments.
- **Code Style**: Use Biome for auto-formatting. Ensure Biome is set as your default formatter in your IDE (`vscode://settings/editor.defaultFormatter`). Install the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome).

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

---