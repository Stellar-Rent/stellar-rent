# StellarRent Documentation 📖

## Overview 🌟

**StellarRent** is a decentralized platform built on the Stellar blockchain, designed to facilitate peer-to-peer (P2P) rentals between property owners and tenants. By eliminating intermediaries such as real estate agencies or centralized platforms (e.g., Airbnb), StellarRent offers a cost-efficient, transparent, and secure rental experience.

Leveraging Stellar’s capabilities, including fast transactions (3-5 seconds), minimal fees (~$0.00001), and smart contracts powered by Soroban, StellarRent provides an innovative solution for both short- and long-term rentals.

### Key Features 🔑

- **P2P Marketplace**: Property owners list properties (houses, apartments, rooms) on a decentralized application (dApp), allowing tenants to negotiate directly.
- **Stablecoin Payments**: Transactions use USDC on Stellar, ensuring instant and stable payments, avoiding crypto volatility.
- **Escrow via Smart Contracts**: Payments are locked in a Soroban smart contract until predefined conditions are met (e.g., tenant confirms the property’s condition at the end of the rental period).
- **Transparency**: All transactions are recorded on Stellar’s public ledger.
- **Reputation System**: User ratings based on past rental history enhance trust within the platform.
- **Low Costs**: Avoids high fees from traditional platforms (e.g., Airbnb charges up to 14.2% per booking).

### Problems Solved 🚩

- High intermediary costs (real estate agencies, rental platforms).
- Slow or insecure payments.
- Lack of transparency in rental agreements.
- Exclusion of small property owners/tenants from emerging markets.

---

## Why StellarRent? 🤔

Traditional rental platforms and agencies charge high fees, impose lengthy processing times, and often lack transparency. StellarRent addresses these challenges by leveraging blockchain technology to create an open, efficient, and fair rental marketplace.

StellarRent utilizes smart contracts on the Stellar blockchain to:

- **List properties** as an owner
- **Rent properties** as a tenant
- **Confirm rentals** as an owner
- **Make secure payments** using blockchain technology

---

### BEFORE ANYTHING ELSE

> 👀 To make Biome work with auto-formatting, make sure to have `Biome` as the **default code formatter**. You can find the configuration with the command `CTRL + ,` or `CMD + ,` for MacOS users and search for the `vscode://settings/editor.defaultFormatter`. This will read the monorepo Biome configuration. Make sure to have the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) in your IDE before doing any installation.

### Basic project structure

In this project we have the frontend, backend and contract on the `apps` directory.

```
stellar-rent/
├── README.md
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── supabase.ts
│   │   │   ├── controllers/
│   │   │   │   └── authController.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── error.middleware.ts
│   │   │   │   └── rateLimiter.ts
│   │   │   ├── routes/
│   │   │   │   └── auth.ts
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts
│   │   │   ├── types/
│   │   │   │   └── auth.types.ts
│   │   │   ├── validators/
│   │   │   │   └── auth.validator.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── contract/
│   └── web/
│       ├── public/
│       │   ├── file.svg
│       │   ├── globe.svg
│       │   ├── next.svg
│       │   ├── vercel.svg
│       │   └── window.svg
│       ├── src/
│       │   ├── app/
│       │   │   ├── globals.css
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   └── components/
│       │       └── shared/
│       │           └── layout/
│       ├── package.json
│       └── next.config.ts
├── README.md
└── biome.json
```

## Before start configuring you will need to have this requirements

- [Bun](https://bun.sh/)
- [Node.js](https://nodejs.org/en/download/)

Please refer to the bun and node.js installation guide for more information depending on your OS.

Once you have bun and node.js installed, you can run the following commands to install the dependencies:

- Position on the project you want to install for example `cd apps/web`
- Run `bun init` and `bun install`
- Same will be for the backend `cd apps/backend` and run `bun init` and `bun install`

---

## setting up supabase

- Fist create a supabase account at [https://supabase.com/](https://supabase.com/)
- Create a new project with name of stellar-rent and select the region closest to you
- To get the .env values navigate to `project settings section` on the sidebar and click on `Data Api` there you will have listed the values you need, copy them to the `apps/backend/.env` file

```bash
SUPABASE_URL="your supabase url" # project url
SUPABASE_ANON_KEY="your supabase anon key" # project api keys anon public
JWT_SECRET="your jwt secret"
SUPABASE_SERVICE_ROLE_KEY="your supabase service role key" # service_role secret
```

# running the projects

now with our `.env` set up we can start the backend and frontend

```bash
cd apps/backend
bun run dev
```

```bash
cd apps/web
bun run dev
```

you now will have the frontend and backend up and running

---

## Contribution guidelines

- Picking an issue on onlydust
  - First select an open issue and comment on why you are eligible to work on it mention your experience and your profile information to review your skills

## Git conventions

`fix`: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).

`feat`: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).
`BREAKING CHANGE`: a commit that has a footer BREAKING CHANGE:, or appends a ! after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any type.

- types other than `fix`: and `feat`: are allowed
- recommends `build:`, `chore:`, `ci:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, and `others`.

# Examples

Commit message with ! to draw attention to breaking change

```bash
feat!: send an email to the customer when a product is shipped
```

Commit message with scope and ! to draw attention to breaking change

```bash
feat(api)!: send an email to the customer when a product is shipped
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
git commit -m "feat: your feature name"
git push origin feat/your-feature-name
```

3. Create a pull request on github

- Check for conflicts and resolve them
- On the description provide a summary of the changes you have made
- On the reviewers add the reviewers you want to review your PR
- Wait for the reviewers to review your PR

---

👉 **[Visit the StellarRent GitBook Now!](https://stellar-rent.gitbook.io/stellar-rent)**

Let’s build a fairer, more efficient rental ecosystem together—powered by Stellar! 🌟

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/Stellar-Rent/stellar-rent?utm_source=oss&utm_medium=github&utm_campaign=Stellar-Rent%2Fstellar-rent&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
