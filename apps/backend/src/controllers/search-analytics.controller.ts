import type { Request, Response } from 'express';
import { z } from 'zod';
import { searchAnalyticsService } from '../services/search-analytics.service';

const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(7),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const suggestionsQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

/**
 * Get search metrics for analytics dashboard
 * GET /api/analytics/search-metrics?days=7&limit=10
 */
export async function getSearchMetrics(req: Request, res: Response): Promise<void> {
  try {
    const validation = analyticsQuerySchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors,
      });
      return;
    }

    const { days, limit } = validation.data;
    const metrics = await searchAnalyticsService.getSearchMetrics(days, limit);

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Search metrics controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Get search suggestions based on popular queries
 * GET /api/analytics/search-suggestions?q=new&limit=5
 */
export async function getSearchSuggestions(req: Request, res: Response): Promise<void> {
  try {
    const validation = suggestionsQuerySchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors,
      });
      return;
    }

    const { q, limit } = validation.data;
    const suggestions = await searchAnalyticsService.getSearchSuggestions(q, limit);

    res.status(200).json({
      success: true,
      data: {
        query: q,
        suggestions,
      },
    });
  } catch (error) {
    console.error('Search suggestions controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Health check for search analytics
 * GET /api/analytics/health
 */
export async function analyticsHealthCheck(_req: Request, res: Response): Promise<void> {
  try {
    // Basic health check
    const metrics = await searchAnalyticsService.getSearchMetrics(1, 1);

    res.status(200).json({
      status: 'healthy',
      service: 'search-analytics',
      timestamp: new Date().toISOString(),
      data: {
        total_searches_last_day: metrics.total_searches,
      },
    });
  } catch (error) {
    console.error('Analytics health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'search-analytics',
      error: 'Service unavailable',
      timestamp: new Date().toISOString(),
    });
  }
}
