import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import { initializeDatabase } from './db/init';

import { Router } from 'express';
import { errorMiddleware } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rateLimiter';
import routes from './routes';
import authRouter from './routes/auth';
import profileRouter from './routes/profile.routes';

// Environment variables configuration
dotenv.config();

// Debug: verificar variables de entorno
console.log('Variables de entorno cargadas:', {
  supabaseUrl: process.env.SUPABASE_URL ? '✅' : '❌',
  supabaseKey: process.env.SUPABASE_ANON_KEY ? '✅' : '❌',
  jwtSecret: process.env.JWT_SECRET ? '✅' : '❌',
});

const app = express();
const PORT = process.env.PORT || 3000;

const router = Router();

// Apply prefixes here
router.use('/auth', authRouter);
router.use('/profile', profileRouter);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(rateLimiter);

// Routes
app.use('/api', routes);

// Test route
app.get('/', (_req, res) => {
  res.json({ message: 'Stellar Rent API is running successfully 🚀' });
});

// Error handling
app.use(errorMiddleware);

// Initialize DB and then start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
