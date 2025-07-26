import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import { errorMiddleware } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rateLimiter';

import { locationRoutes, profileRoutes, propertyRoutes } from './routes';
import authRoutes from './routes/auth';
import bookingRoutes from './routes/booking.routes';
import walletAuthRoutes from './routes/wallet-auth.routes';

import { runInitialCleanup, startCleanupScheduler } from './services/cleanup-schedular';

// Environment variables configuration
dotenv.config();

async function initializeCronJob() {
  await runInitialCleanup();
  startCleanupScheduler();
}

console.log('Loaded environment variables:', {
  supabaseUrl: process.env.SUPABASE_URL ? '✅' : '❌',
  supabaseKey: process.env.SUPABASE_ANON_KEY ? '✅' : '❌',
  jwtSecret: process.env.JWT_SECRET ? '✅' : '❌',
});

export const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200, // Para IE11
  })
);
app.use(rateLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/api/auth', walletAuthRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/properties', propertyRoutes);

// Test route
app.get('/', (_req, res) => {
  res.json({ message: 'Stellar Rent API is running successfully 🚀' });
});

// Error handling
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  initializeCronJob();
  console.log('Cron job initialized for expired challenges cleanup');
  console.log(`Running on port http://localhost:${PORT}`);
});
