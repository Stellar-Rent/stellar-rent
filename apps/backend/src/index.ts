import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { errorMiddleware } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import propertyRoutes from './routes/property.route';
// Environment variables configuration
dotenv.config();

// Validate environment variables at startup to prevent runtime errors
if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable');
}

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

// Debug: verificar variables de entorno
console.log('Variables de entorno cargadas:', {
  supabaseUrl: process.env.SUPABASE_URL ? '✅' : '❌',
  supabaseKey: process.env.SUPABASE_ANON_KEY ? '✅' : '❌',
  jwtSecret: process.env.JWT_SECRET ? '✅' : '❌',
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  })
);
app.use(rateLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/properties', propertyRoutes);

// Health check endpoint for Docker
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});


// Test route
app.get('/', (_req, res) => {
  res.json({ message: 'Stellar Rent API is running successfully 🚀' });
});

// Error handling
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
});
