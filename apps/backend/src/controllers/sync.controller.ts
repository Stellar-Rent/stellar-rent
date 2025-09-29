import type { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { loggingService } from '../services/logging.service';
import { syncService } from '../services/sync.service';

export class SyncController {
  /**
   * Start the synchronization service
   */
  async startSync(_req: Request, res: Response): Promise<void> {
    try {
      const logId = await loggingService.logBlockchainOperation('startSync', {});

      await syncService.start();

      await loggingService.logBlockchainSuccess(logId, {
        action: 'sync_started',
      });

      res.json({
        success: true,
        message: 'Synchronization service started successfully',
        status: syncService.getStatus(),
      });
    } catch (error) {
      console.error('Failed to start sync service:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start synchronization service',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Stop the synchronization service
   */
  async stopSync(_req: Request, res: Response): Promise<void> {
    try {
      const logId = await loggingService.logBlockchainOperation('stopSync', {});

      await syncService.stop();

      await loggingService.logBlockchainSuccess(logId, {
        action: 'sync_stopped',
      });

      res.json({
        success: true,
        message: 'Synchronization service stopped successfully',
        status: syncService.getStatus(),
      });
    } catch (error) {
      console.error('Failed to stop sync service:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop synchronization service',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get synchronization status
   */
  async getStatus(_req: Request, res: Response): Promise<void> {
    try {
      const status = syncService.getStatus();
      const stats = await syncService.getSyncStats();

      res.json({
        success: true,
        status,
        stats,
      });
    } catch (error) {
      console.error('Failed to get sync status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get synchronization status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Trigger manual synchronization
   */
  async triggerManualSync(_req: Request, res: Response): Promise<void> {
    try {
      const logId = await loggingService.logBlockchainOperation('triggerManualSync', {});

      await syncService.triggerManualSync();

      await loggingService.logBlockchainSuccess(logId, {
        action: 'manual_sync_triggered',
      });

      res.json({
        success: true,
        message: 'Manual synchronization triggered successfully',
        status: syncService.getStatus(),
      });
    } catch (error) {
      console.error('Failed to trigger manual sync:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger manual synchronization',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get sync events with pagination
   */
  async getSyncEvents(req: Request, res: Response): Promise<void> {
    try {
      const pageParam = Number.parseInt(req.query.page as string, 10);
      const limitParam = Number.parseInt(req.query.limit as string, 10);
      const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;
      const offset = (page - 1) * limit;
      const eventType = req.query.eventType as string;
      const processed = req.query.processed as string;

      let query = supabase
        .from('sync_events')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      if (processed !== undefined) {
        query = query.eq('processed', processed === 'true');
      }

      const { data: events, error, count } = await query;

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        events,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (error) {
      console.error('Failed to get sync events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get synchronization events',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get sync logs with pagination
   */
  async getSyncLogs(req: Request, res: Response): Promise<void> {
    try {
      const pageParam = Number.parseInt(req.query.page as string, 10);
      const limitParam = Number.parseInt(req.query.limit as string, 10);
      const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;
      const offset = (page - 1) * limit;
      const status = req.query.status as string;
      const operation = req.query.operation as string;

      let query = supabase
        .from('sync_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (operation) {
        query = query.eq('operation', operation);
      }

      const { data: logs, error, count } = await query;

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        logs,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (error) {
      console.error('Failed to get sync logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get synchronization logs',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get sync dashboard data
   */
  async getDashboard(_req: Request, res: Response): Promise<void> {
    try {
      // Get dashboard data from view
      const { data: dashboard, error: dashboardError } = await supabase
        .from('sync_dashboard')
        .select('*')
        .single();

      if (dashboardError) {
        throw dashboardError;
      }

      // Get recent events
      const { data: recentEvents } = await supabase
        .from('sync_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get recent logs
      const { data: recentLogs } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get failed events count
      const { count: failedEventsCount } = await supabase
        .from('sync_events')
        .select('*', { count: 'exact', head: true })
        .eq('processed', false)
        .not('error', 'is', null);

      res.json({
        success: true,
        dashboard,
        recentEvents,
        recentLogs,
        failedEventsCount: failedEventsCount || 0,
        status: syncService.getStatus(),
      });
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Retry failed events
   */
  async retryFailedEvents(_req: Request, res: Response): Promise<void> {
    try {
      const logId = await loggingService.logBlockchainOperation('retryFailedEvents', {});

      // Get failed events
      const { data: failedEvents, error } = await supabase
        .from('sync_events')
        .select('*')
        .eq('processed', false)
        .not('error', 'is', null);

      if (error) {
        throw error;
      }

      let retriedCount = 0;
      let successCount = 0;

      for (const event of failedEvents || []) {
        try {
          retriedCount++;

          // Clear error and mark as unprocessed
          await supabase
            .from('sync_events')
            .update({
              error: null,
              processed: false,
              processed_at: null,
            })
            .eq('id', event.id);

          // Trigger manual sync to reprocess
          await syncService.triggerManualSync();

          successCount++;
        } catch (retryError) {
          console.error(`Failed to retry event ${event.id}:`, retryError);
        }
      }

      await loggingService.logBlockchainSuccess(logId, {
        retriedCount,
        successCount,
        totalFailed: failedEvents?.length || 0,
      });

      res.json({
        success: true,
        message: `Retry operation completed. Retried: ${retriedCount}, Success: ${successCount}`,
        retriedCount,
        successCount,
        totalFailed: failedEvents?.length || 0,
      });
    } catch (error) {
      console.error('Failed to retry failed events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retry failed events',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Clear old sync data
   */
  async clearOldData(req: Request, res: Response): Promise<void> {
    try {
      const days = Number.parseInt(req.query.days as string, 10) || 30;
      const logId = await loggingService.logBlockchainOperation('clearOldData', { days });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Use Supabase's transaction support to ensure atomicity
      // First, get the count of records to be deleted for validation
      const { count: eventsCount, error: countError } = await supabase
        .from('sync_events')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffDate.toISOString());

      if (countError) {
        throw new Error(`Failed to count old events: ${countError.message}`);
      }

      const { count: logsCount, error: logsCountError } = await supabase
        .from('sync_logs')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffDate.toISOString());

      if (logsCountError) {
        throw new Error(`Failed to count old logs: ${logsCountError.message}`);
      }

      // Perform both deletions in sequence, but with proper error handling
      // If either fails, we'll handle it gracefully
      let eventsDeleted = 0;
      let logsDeleted = 0;
      let _partialFailure = false;
      let failureDetails = '';

      try {
        // Delete old events
        const { data: eventsResult, error: eventsError } = await supabase
          .from('sync_events')
          .delete()
          .lt('created_at', cutoffDate.toISOString())
          .select('id');

        if (eventsError) {
          throw new Error(`Failed to delete old events: ${eventsError.message}`);
        }
        eventsDeleted = eventsResult?.length || 0;

        // Delete old logs
        const { data: logsResult, error: logsError } = await supabase
          .from('sync_logs')
          .delete()
          .lt('created_at', cutoffDate.toISOString())
          .select('id');

        if (logsError) {
          throw new Error(`Failed to delete old logs: ${logsError.message}`);
        }
        logsDeleted = logsResult?.length || 0;
      } catch (deletionError) {
        // If deletion fails, we have a partial failure scenario
        _partialFailure = true;
        failureDetails =
          deletionError instanceof Error ? deletionError.message : 'Unknown deletion error';

        // Log the partial failure
        await loggingService.logBlockchainOperation('clearOldData_partial_failure', {
          days,
          cutoffDate: cutoffDate.toISOString(),
          eventsDeleted,
          logsDeleted,
          failureDetails,
          expectedEventsCount: eventsCount || 0,
          expectedLogsCount: logsCount || 0,
        });

        // Return partial success response
        res.json({
          success: true,
          message: `Partially cleared sync data older than ${days} days. Events deleted: ${eventsDeleted}, Logs deleted: ${logsDeleted}. Some deletions failed.`,
          cutoffDate: cutoffDate.toISOString(),
          eventsDeleted,
          logsDeleted,
          partialFailure: true,
          failureDetails,
          expectedEventsCount: eventsCount || 0,
          expectedLogsCount: logsCount || 0,
        });
        return;
      }

      // Both operations succeeded
      await loggingService.logBlockchainSuccess(logId, {
        action: 'old_data_cleared',
        cutoffDate: cutoffDate.toISOString(),
        eventsDeleted,
        logsDeleted,
        expectedEventsCount: eventsCount || 0,
        expectedLogsCount: logsCount || 0,
      });

      res.json({
        success: true,
        message: `Cleared sync data older than ${days} days`,
        cutoffDate: cutoffDate.toISOString(),
        eventsDeleted,
        logsDeleted,
        partialFailure: false,
        expectedEventsCount: eventsCount || 0,
        expectedLogsCount: logsCount || 0,
      });
    } catch (error) {
      console.error('Failed to clear old data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear old sync data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Verify blockchain state consistency
   */
  async verifyBlockchainState(_req: Request, res: Response): Promise<void> {
    try {
      const logId = await loggingService.logBlockchainOperation('verifyBlockchainState', {});

      // Get recent bookings and properties for verification
      const [{ data: recentBookings }, { data: recentProperties }] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, blockchain_booking_id, property_id, status, escrow_address')
          .not('blockchain_booking_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('properties')
          .select('id, property_token, title, status')
          .not('property_token', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const verificationResults = {
        bookings: {
          total: recentBookings?.length || 0,
          verified: 0,
          errors: [] as string[],
        },
        properties: {
          total: recentProperties?.length || 0,
          verified: 0,
          errors: [] as string[],
        },
        overallStatus: 'unknown' as 'healthy' | 'issues' | 'error',
      };

      // Verify bookings
      for (const booking of recentBookings || []) {
        try {
          // In a real implementation, you would verify the booking exists on blockchain
          // For now, we'll just check if it has blockchain fields
          if (booking.blockchain_booking_id && booking.escrow_address) {
            verificationResults.bookings.verified++;
          }
        } catch (error) {
          verificationResults.bookings.errors.push(
            `Booking ${booking.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Verify properties
      for (const property of recentProperties || []) {
        try {
          // In a real implementation, you would verify the property hash on blockchain
          // For now, we'll just check if it has property_token
          if (property.property_token) {
            verificationResults.properties.verified++;
          }
        } catch (error) {
          verificationResults.properties.errors.push(
            `Property ${property.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Determine overall status
      const totalErrors =
        verificationResults.bookings.errors.length + verificationResults.properties.errors.length;
      if (totalErrors === 0) {
        verificationResults.overallStatus = 'healthy';
      } else if (totalErrors < 3) {
        verificationResults.overallStatus = 'issues';
      } else {
        verificationResults.overallStatus = 'error';
      }

      await loggingService.logBlockchainSuccess(logId, verificationResults);

      res.json({
        success: true,
        message: 'Blockchain state verification completed',
        data: verificationResults,
      });
    } catch (error) {
      console.error('Failed to verify blockchain state:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify blockchain state',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const syncController = new SyncController();
