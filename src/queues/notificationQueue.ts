import Queue from 'bull';
import { PrismaClient } from '@Prisma/client';

const prisma = new PrismaClient();



export const notificationQueue = new Queue('notifications', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

// The "worker" that processes jobs
notificationQueue.process(async (job) => {
  const { userId, message } = job.data;
  
  try {
    await prisma.notification.create({
      data: {
        userId,
        message,
      },
    });
    console.log(`[Queue] Processed notification for user ${userId}`);
  } catch (error) {
    console.error('[Queue] Error processing notification job:', error);
  }
});

notificationQueue.on('completed', (job) => {
  console.log(`[Queue] Job ${job.id} (notification) completed`);
});
notificationQueue.on('failed', (job, err) => {
  console.log(`[Queue] Job ${job.id} (notification) failed with error ${err.message}`);
});

console.log('[Queue] Notification queue worker started.');