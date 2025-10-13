import dotenv from 'dotenv';
import { connectDatabase, closeDatabase } from './config/database';
import { connectRabbitMQ, consumeFromQueue, closeRabbitMQ } from './config/rabbitmq';
import { processTransaction } from './consumer';

dotenv.config();

/**
 * Starts the transaction worker
 */
const startWorker = async (): Promise<void> => {
  try {
    console.log(' Starting Transaction Worker...');

    await connectDatabase();

    await connectRabbitMQ();

    // Start consuming messages
    await consumeFromQueue(processTransaction);

    console.log('Transaction Worker is running and listening for messages');

  } catch (error) {
    console.error('Failed to start Transaction Worker:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const shutdown = async (): Promise<void> => {
  console.log('\ Shutting down Transaction Worker gracefully...');
  
  try {
    await closeRabbitMQ();
    await closeDatabase();
    console.log('Transaction Worker shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

startWorker();