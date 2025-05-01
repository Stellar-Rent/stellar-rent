StellarRent Backend

This is the backend API for StellarRent, built with Express, TypeScript, and Supabase for user authentication.

Prerequisites





Node.js (v18+)



Bun (install with curl -fsSL https://bun.sh/install | bash, created with v1.2.10)



Supabase account

Setup





Install dependencies:

cd apps/backend
bun install



Configure .env from .env.example with:





PORT=3000



SUPABASE_URL



SUPABASE_ANON_KEY



SUPABASE_SERVICE_ROLE_KEY



JWT_SECRET (e.g., openssl rand -base64 32)



Create the users table in Supabase:

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);



Run the server:

bun run dev

(API at http://localhost:3000)

API Endpoints





POST /auth/register:





Request: {"email": "user@example.com", "password": "secure123", "name": "John Doe"}



Success (201): {"id": 1, "email": "user@example.com", "name": "John Doe"}



Errors: 400 (invalid input), 409 (email exists), 500 (server error)

Contributing





Branch from main: git checkout -b feature/your-feature



Test changes and update docs if needed



Submit a pull request to main