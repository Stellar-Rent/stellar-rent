import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req): string => {
    // Handle localhost and development environments
    return req.ip || 'localhost';
  },
});

//===================
// Rate limiter for traditional auth routes
//===================
export const authLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many auth attempts. Try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req): string => {
    return req.ip || 'localhost';
  },
});

//===================
// Rate limiter specifically for wallet authentication endpoints
//===================
export const walletAuthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: 'Too many wallet authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

//===================
// More restrictive rate limiter for challenge generation
//===================
export const challengeRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: {
    error: 'Too many challenge requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

