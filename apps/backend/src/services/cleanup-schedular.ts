import cron, { type ScheduledTask } from 'node-cron';
import { cleanupAllExpiredChallenges } from './wallet-challenge.service';

let cleanupJob: ScheduledTask | null = null;
export function startCleanupScheduler() {
  // Run cleanup every 2 minutes
  cleanupJob = cron.schedule('*/2 * * * *', async () => {
    try {
      console.log('Running expired challenges cleanup...');
      await cleanupAllExpiredChallenges();
      console.log('Expired challenges cleanup completed');
    } catch (error) {
      console.error('Error during challenges cleanup:', error);
    }
  });

  console.log('Challenge cleanup scheduler started (runs every 2 minutes)');
}

export function stopCleanupScheduler() {
  if (cleanupJob) {
    cleanupJob.stop();
    cleanupJob = null;
    console.log('Challenge cleanup scheduler stopped');
  }
}

// Run initial cleanup on startup
export async function runInitialCleanup() {
  try {
    console.log('Running initial expired challenges cleanup...');
    await cleanupAllExpiredChallenges();
    console.log('Initial cleanup completed');
  } catch (error) {
    console.error('Error during initial cleanup:', error);
  }
}
