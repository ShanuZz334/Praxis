import { Queue } from 'bullmq';
import redisConnection from '../../config/redis.js';

const QUEUE_OPTS = {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 200      // Keep last 200 failed jobs
    }
};

// Define Queues
export const queues = {
    realtimeQuotes: redisConnection ? new Queue('realtime-quotes', QUEUE_OPTS) : null,
    optionsChain: redisConnection ? new Queue('options-chain', QUEUE_OPTS) : null,
    fundamentals: redisConnection ? new Queue('fundamentals', QUEUE_OPTS) : null
};

// Graceful Shutdown
export const closeQueues = async () => {
    if (!redisConnection) return;
    await Promise.all(Object.values(queues).map(q => q.close()));
};
