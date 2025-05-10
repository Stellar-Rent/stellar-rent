# Usage Guide for StellarRent

### BEFORE ANYTHING ELSE

> 👀 To make Biome work with auto-formatting, make sure to have `Biome` as the **default code formatter**. You can find the configuration with the command `CTRL + ,` or `CMD + ,` for MacOS users and search for the `vscode://settings/editor.defaultFormatter`. This will read the monorepo Biome configuration. Make sure to have the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) in your IDE before doing any installation.

### Git Hooks with Husky

This project uses Husky to manage Git hooks. These hooks ensure code quality and consistency:

- **pre-commit**: Runs before each commit to:
  - Format code using Biome
  - Run linting checks
  - Only processes staged files

- **commit-msg**: Validates commit messages to ensure they follow our conventions

## Installation
1. Clone the repository:
```bash
git clone https://github.com/Stellar-Rent/stellar-rent.git
cd stellar-rent
```

2. To install all dependencies, run the following command in the root:

```bash
bun install
```

> This will install all dependencies for the frontend, backend, and development tools (Biome, husky, etc.)

## setting up supabase

- Fist create a supabase account at [https://supabase.com/](https://supabase.com/)
- Create a new project with name of stellar-rent and select the region closest to you
- To get the .env values navigate to `project settings section` on the sidebar and click on `Data Api` there you will have listed the values you need, copy them to the `apps/backend/.env` file

```bash
PORT="your port"
SUPABASE_URL="your supabase url"
SUPABASE_ANON_KEY="your supabase anon key" 
JWT_SECRET="your jwt secret"
SUPABASE_SERVICE_ROLE_KEY="your supabase service role key" 
```

# Running the projects

Once the `.env` is set up, you can start the backend and frontend:

```bash
# In one terminal
cd apps/backend
bun dev

# In another terminal
cd apps/web
bun dev
```

You now will have the frontend and backend up and running