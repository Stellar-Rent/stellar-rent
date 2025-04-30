# StellarRent Contribution Guide

## Development Environment Setup

### Prerequisites
- Node.js v18 or higher
- Bun v1.0.0 or higher
- A Supabase account

### Supabase Configuration
1. Create a new project in Supabase (you can use Supabase's AI assistant for help)
2. Create the `users` table with the following structure:
   ```sql
   create table public.users (
     id uuid default gen_random_uuid() primary key,
     email text unique not null,
     password text not null,
     name text not null,
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );
   ```

### Environment Variables
1. In the `apps/backend` folder, create a `.env` file with:
   ```
   PORT=3000
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_secure_secret
   ```

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/stellar-rent.git
   cd stellar-rent
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the backend:
   ```bash
   cd apps/backend
   bun run dev
   ```

4. Start the frontend:
   ```bash
   cd apps/web
   bun run dev
   ```

## Workflow
1. Fork the repository
2. Create a branch for your feature: `git checkout -b feature/feature-name`
3. Commit your changes
4. Create a Pull Request

## Code Standards
- Use TypeScript
- Follow existing code style
- Write tests for new features
- Document important changes

## Useful Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Stellar Documentation](https://developers.stellar.org/docs) 