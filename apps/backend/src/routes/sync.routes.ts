/**
 * Sync Routes - Admin Only Access
 *
 * This module provides administrative endpoints for managing blockchain synchronization.
 * All routes require proper admin authentication and include security headers.
 *
 * Security Features:
 * - JWT token validation
 * - Admin role verification
 * - Security headers (XSS protection, content type options, etc.)
 * - Comprehensive error handling
 * - Audit logging for admin access
 * - Pagination parameter validation and sanitization
 * - SQL injection prevention
 * - Rate limiting considerations
 *
 * Environment Variables Required:
 * - ADMIN_EMAILS: Comma-separated list of admin email addresses
 * - ADMIN_USER_IDS: Comma-separated list of admin user IDs
 * - NODE_ENV: Environment mode (development/production)
 *
 * Pagination Validation:
 * - Page numbers: 1 to 10,000
 * - Page sizes: 1 to 1,000 (default: 50)
 * - Automatic offset calculation
 * - Parameter sanitization and validation
 */

import { Router } from 'express';
import type { NextFunction, Response } from 'express';
import { supabase } from '../config/supabase';
import { syncController } from '../controllers/sync.controller';
import type { AuthRequest } from '../types/auth.types';

const router = Router();

// Helper function to check if a user has admin privileges
async function checkUserAdminStatus(userId: string, userEmail?: string): Promise<boolean> {
  try {
    // Validate inputs
    if (!userId) {
      console.warn('⚠️  No user ID provided for admin check');
      return false;
    }

    // Option 1: Check against a user_roles table (recommended for production)
    // Uncomment and implement this for production use:
    // const { data: userRole, error } = await supabase
    //   .from('user_roles')
    //   .select('role')
    //   .eq('user_id', userId)
    //   .single();
    //
    // if (error) {
    //   console.error('Error querying user_roles table:', error);
    //   return false;
    // }
    //
    // return userRole?.role === 'admin';

    // Option 2: Check against environment variable for allowed admin emails
    const adminEmails =
      process.env.ADMIN_EMAILS?.split(',')
        .map((email) => email.trim())
        .filter(Boolean) || [];
    if (userEmail && adminEmails.includes(userEmail.trim())) {
      console.log(`✅ Admin access granted via email: ${userEmail}`);
      return true;
    }

    // Option 3: Check against a specific admin user ID
    const adminUserIds =
      process.env.ADMIN_USER_IDS?.split(',')
        .map((id) => id.trim())
        .filter(Boolean) || [];
    if (adminUserIds.includes(userId)) {
      console.log(`✅ Admin access granted via user ID: ${userId}`);
      return true;
    }

    // Option 4: For development/testing, allow specific emails
    if (process.env.NODE_ENV === 'development') {
      const devAdminEmails = ['admin@example.com', 'test@example.com'];
      if (userEmail && devAdminEmails.includes(userEmail)) {
        console.warn('⚠️  Development admin access granted to:', userEmail);
        return true;
      }
    }

    console.log(`❌ Admin access denied for user: ${userId} (${userEmail || 'no email'})`);
    return false;
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    return false;
  }
}

// Admin authentication middleware
const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authorization header required',
        code: 'MISSING_AUTH_HEADER',
      });
    }

    // Extract the token
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      return res.status(401).json({
        error: 'Valid token required',
        code: 'INVALID_TOKEN_FORMAT',
      });
    }

    // Verify the token with Supabase and get user with role information
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }

    // For now, we'll use a simple approach to check admin status
    // In a production environment, you might want to:
    // 1. Check against a user_roles table in your database
    // 2. Use Supabase's built-in role system
    // 3. Implement a custom admin verification system

    // Check if user has admin role by looking at email or other criteria
    // This is a placeholder - replace with your actual admin verification logic
    const isAdmin = await checkUserAdminStatus(user.id, user.email);

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    // Add user info to request for use in controllers
    req.user = user;

    // Log successful admin access
    console.log(`🔐 Admin access granted for user: ${user.id} (${user.email || 'wallet user'})`);

    // Add security headers for admin routes
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    });

    // Add rate limiting for admin operations (optional)
    // You can implement additional rate limiting here if needed

    next();
  } catch (error) {
    console.error('❌ Admin authentication error:', error);

    // Don't expose internal error details in production
    const errorMessage =
      process.env.NODE_ENV === 'production'
        ? 'Authentication service error'
        : error instanceof Error
          ? error.message
          : 'Unknown error';

    return res.status(500).json({
      error: errorMessage,
      code: 'AUTH_SERVICE_ERROR',
    });
  }
};

// Pagination validation middleware
const validatePagination = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, ...otherParams } = req.query;

    // Security: Check for excessive pagination requests that could indicate abuse
    const maxPageNumber = 10000; // Prevent extremely deep pagination
    const maxPageSize = 1000; // Prevent excessive data retrieval

    // Validate page parameter
    let pageNumber = 1;
    if (page !== undefined) {
      const parsedPage = Number(page);
      if (Number.isNaN(parsedPage) || parsedPage < 1 || parsedPage > maxPageNumber) {
        return res.status(400).json({
          error: `Page number must be a positive integer between 1 and ${maxPageNumber}`,
          code: 'INVALID_PAGE_PARAMETER',
          received: page,
          expected: `positive integer between 1 and ${maxPageNumber}`,
        });
      }
      pageNumber = parsedPage;
    }

    // Validate limit parameter
    let pageSize = 50; // Default page size
    if (limit !== undefined) {
      const parsedLimit = Number(limit);
      if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > maxPageSize) {
        return res.status(400).json({
          error: `Page size must be between 1 and ${maxPageSize}`,
          code: 'INVALID_LIMIT_PARAMETER',
          received: limit,
          expected: `integer between 1 and ${maxPageSize}`,
        });
      }
      pageSize = parsedLimit;
    }

    // Security: Check for potential abuse patterns
    if (pageNumber > 1000) {
      console.warn(`⚠️  Large page number requested: ${pageNumber} by user ${req.user?.id}`);
    }

    if (pageSize > 500) {
      console.warn(`⚠️  Large page size requested: ${pageSize} by user ${req.user?.id}`);
    }

    // Validate other query parameters if they exist
    const validationErrors: string[] = [];

    // Check for unexpected parameters
    const allowedParams = ['page', 'limit', 'eventType', 'processed', 'status', 'operation'];
    const unexpectedParams = Object.keys(otherParams).filter(
      (param) => !allowedParams.includes(param)
    );

    if (unexpectedParams.length > 0) {
      validationErrors.push(`Unexpected query parameters: ${unexpectedParams.join(', ')}`);
    }

    // Validate eventType if provided
    if (otherParams.eventType && typeof otherParams.eventType === 'string') {
      const validEventTypes = [
        'booking_created',
        'booking_updated',
        'booking_cancelled',
        'payment_confirmed',
      ];
      if (!validEventTypes.includes(otherParams.eventType)) {
        validationErrors.push(`Invalid eventType. Must be one of: ${validEventTypes.join(', ')}`);
      }
    }

    // Validate processed parameter if provided
    if (otherParams.processed !== undefined) {
      if (!['true', 'false'].includes(otherParams.processed as string)) {
        validationErrors.push('Processed parameter must be "true" or "false"');
      }
    }

    // Validate status parameter if provided
    if (otherParams.status && typeof otherParams.status === 'string') {
      const validStatuses = ['success', 'error', 'pending'];
      if (!validStatuses.includes(otherParams.status)) {
        validationErrors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Validate operation parameter if provided
    if (otherParams.operation && typeof otherParams.operation === 'string') {
      const validOperations = [
        'startSync',
        'stopSync',
        'triggerManualSync',
        'getSyncEvents',
        'getSyncLogs',
        'getDashboard',
        'retryFailedEvents',
        'clearOldData',
      ];
      if (!validOperations.includes(otherParams.operation)) {
        validationErrors.push(`Invalid operation. Must be one of: ${validOperations.join(', ')}`);
      }
    }

    // Security: Check for potential SQL injection patterns in string parameters
    const stringParams = ['eventType', 'status', 'operation'];
    for (const param of stringParams) {
      if (otherParams[param] && typeof otherParams[param] === 'string') {
        const value = otherParams[param] as string;
        // Check for common SQL injection patterns
        if (
          value.includes(';') ||
          value.includes('--') ||
          value.includes('/*') ||
          value.includes('*/') ||
          value.includes('union') ||
          value.includes('select')
        ) {
          console.warn(
            `⚠️  Potential SQL injection attempt detected in parameter ${param}: ${value} by user ${req.user?.id}`
          );
          validationErrors.push(`Invalid characters detected in ${param} parameter`);
        }
      }
    }

    // If there are validation errors, return them all at once
    if (validationErrors.length > 0) {
      // Log validation failures for security monitoring
      console.warn(`❌ Pagination validation failed for user ${req.user?.id}:`, {
        errors: validationErrors,
        query: req.query,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });

      return res.status(400).json({
        error: 'Query parameter validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors,
        received: req.query,
        help: 'Please check the API documentation for valid parameter values',
      });
    }

    // Add validated and sanitized values to request for use in controllers
    req.query.page = pageNumber.toString();
    req.query.limit = pageSize.toString();

    // Calculate offset for database queries
    const offset = (pageNumber - 1) * pageSize;
    req.query.offset = offset.toString();

    // Log successful validation with additional context
    console.log(`✅ Pagination validation passed for user ${req.user?.id}:`, {
      page: pageNumber,
      limit: pageSize,
      offset,
      totalParams: Object.keys(req.query).length,
    });

    next();
  } catch (error) {
    console.error('❌ Pagination validation error:', error);

    // Don't expose internal error details in production
    const errorMessage =
      process.env.NODE_ENV === 'production'
        ? 'Pagination validation service error'
        : error instanceof Error
          ? error.message
          : 'Unknown validation error';

    return res.status(500).json({
      error: errorMessage,
      code: 'VALIDATION_SERVICE_ERROR',
    });
  }
};

// Sync service management
router.post('/start', requireAdmin, syncController.startSync.bind(syncController));
router.post('/stop', requireAdmin, syncController.stopSync.bind(syncController));
router.get('/status', requireAdmin, syncController.getStatus.bind(syncController));
router.post('/trigger', requireAdmin, syncController.triggerManualSync.bind(syncController));

// Sync data management
router.get(
  '/events',
  requireAdmin,
  validatePagination,
  syncController.getSyncEvents.bind(syncController)
);
router.get(
  '/logs',
  requireAdmin,
  validatePagination,
  syncController.getSyncLogs.bind(syncController)
);
router.get(
  '/dashboard',
  requireAdmin,
  validatePagination,
  syncController.getDashboard.bind(syncController)
);

// Blockchain verification
router.get('/verify', requireAdmin, syncController.verifyBlockchainState.bind(syncController));

// Sync operations
router.post('/retry-failed', requireAdmin, syncController.retryFailedEvents.bind(syncController));
router.delete('/clear-old', requireAdmin, syncController.clearOldData.bind(syncController));

export default router;
