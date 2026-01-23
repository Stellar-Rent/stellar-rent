import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import { errorMiddleware } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rateLimiter';

import { locationRoutes, profileRoutes, propertyRoutes } from './routes';
import authRoutes from './routes/auth';
import bookingRoutes from './routes/booking.routes';
// wallet-auth routes removed - replaced by client-side Stellar Social SDK

import { connectRedis } from './config/redis';
import syncRoutes from './routes/sync.routes';
import { runInitialCleanup, startCleanupScheduler } from './services/cleanup-schedular';
import { syncService } from './services/sync.service';

// Environment variables configuration
dotenv.config();

async function initializeServices() {
  // Initialize Redis connection
  try {
    await connectRedis();
    console.log('✅ Redis connection established');
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    console.log('⚠️  Caching will be disabled - search performance may be impacted');
  }

  // Initialize cleanup scheduler
  await runInitialCleanup();
  startCleanupScheduler();

  // Initialize blockchain sync service
  try {
    await syncService.start();
    console.log('✅ Blockchain synchronization service started');
  } catch (error) {
    console.error('❌ Failed to start blockchain sync service:', error);
  }
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
// wallet-auth endpoint removed - authentication now handled by client-side Stellar Social SDK
app.use('/api/bookings', bookingRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/sync', syncRoutes);

// Test route
app.get('/', (_req, res) => {
  res.json({ message: 'Stellar Rent API is running successfully 🚀' });
});

// Error handling
app.use(errorMiddleware);

// Start server
app.listen(PORT, async () => {
  console.log(`Running on port http://localhost:${PORT}`);

  try {
    await initializeServices();
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    console.error('⚠️  Server is running but some services may not be fully functional');
  }
});
