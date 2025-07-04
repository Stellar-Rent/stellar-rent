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

export const featuredLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many requests to featured properties. Try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req): string => {
    return req.ip || 'localhost';
  },
});
