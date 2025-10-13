import * as amqp from 'amqplib';
import { ChannelModel, Channel, ConsumeMessage } from 'amqplib';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const QUEUE_NAME = 'transaction_queue';
const EXCHANGE_NAME = 'payment_exchange';
const ROUTING_KEY = 'transaction.created';

/**
 * Connects to RabbitMQ
 */
export const connectRabbitMQ = async (): Promise<void> => {
  try {
    console.log(`🔌 Transaction Worker: Connecting to RabbitMQ at ${RABBITMQ_URL}...`);

    // Create connection with retry logic
    let retries = 5;
    while (retries > 0) {
      try {
        connection = await amqp.connect(RABBITMQ_URL);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        console.log(`⚠️ Connection failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Ensure connection is not null
    if (!connection) {
      throw new Error('Failed to establish RabbitMQ connection after retries');
    }

    console.log('✅ Transaction Worker: RabbitMQ connection established');

    // Create channel
    channel = await connection.createChannel();
    console.log('✅ Transaction Worker: RabbitMQ channel created');

    // Ensure channel is not null
    if (!channel) {
      throw new Error('Failed to create RabbitMQ channel');
    }

    // Set prefetch to process one message at a time
    await channel.prefetch(1);

    // Assert queue (ensure it exists)
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log(`✅ Transaction Worker: Queue '${QUEUE_NAME}' asserted`);

    // Handle connection errors
    connection.on('error', (error) => {
      console.error('❌ RabbitMQ connection error:', error);
    });

    connection.on('close', () => {
      console.log('⚠️ RabbitMQ connection closed, attempting to reconnect...');
      setTimeout(connectRabbitMQ, 5000);
    });

  } catch (error) {
    console.error('❌ Failed to connect to RabbitMQ:', error);
    throw error;
  }
};

/**
 * Consumes messages from the queue
 * @param callback - Function to handle each message
 */
export const consumeFromQueue = async (
  callback: (message: any) => Promise<void>
): Promise<void> => {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }

    console.log(`👂 Transaction Worker: Listening for messages on queue '${QUEUE_NAME}'...`);

    await channel.consume(
      QUEUE_NAME,
      async (msg: ConsumeMessage | null) => {
        if (!msg || !channel) return;

        try {
          const messageContent = msg.content.toString();
          const parsedMessage = JSON.parse(messageContent);

          console.log(`📥 Message received: ${parsedMessage.transactionId}`);

          // Process the message
          await callback(parsedMessage);

          // Acknowledge the message
          channel.ack(msg);
          console.log(`✅ Message acknowledged: ${parsedMessage.transactionId}`);

        } catch (error) {
          console.error('❌ Error processing message:', error);

          // Reject and requeue the message (with a limit to prevent infinite loops)
          const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;

          if (retryCount < 3) {
            console.log(`⚠️ Requeuing message (retry ${retryCount}/3)`);
            // Requeue by publishing with updated headers
            await channel.publish(
              EXCHANGE_NAME,
              ROUTING_KEY,
              msg.content,
              {
                persistent: true,
                contentType: 'application/json',
                headers: { 'x-retry-count': retryCount },
              }
            );
            channel.ack(msg); // Ack original to avoid duplicates
          } else {
            console.log('❌ Max retries reached, rejecting message');
            channel.nack(msg, false, false); // Don't requeue
            // In production, send to a dead letter queue
          }
        }
      },
      { noAck: false } // Manual acknowledgment
    );

  } catch (error) {
    console.error('❌ Error setting up consumer:', error);
    throw error;
  }
};

/**
 * Closes RabbitMQ connection
 */
export const closeRabbitMQ = async (): Promise<void> => {
  try {
    if (channel) {
      await channel.close();
      console.log('✅ Transaction Worker: RabbitMQ channel closed');
      channel = null;
    }
    if (connection) {
      await connection.close();
      console.log('✅ Transaction Worker: RabbitMQ connection closed');
      connection = null;
    }
  } catch (error) {
    console.error('❌ Error closing RabbitMQ connection:', error);
  }
};