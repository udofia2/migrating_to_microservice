import * as amqp from 'amqplib';
import { Channel, ChannelModel } from 'amqplib';  // Import ChannelModel for connection

let connection: ChannelModel | null = null;  // Use ChannelModel instead of Connection
let channel: Channel | null = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE_NAME = 'payment_exchange';
const QUEUE_NAME = 'transaction_queue';
const ROUTING_KEY = 'transaction.created';

console.log(`RabbitMQ URL: ${RABBITMQ_URL}`);

/**
 * Connects to RabbitMQ and sets up exchange and queue
 */
export const connectRabbitMQ = async (): Promise<void> => {
  try {
    console.log(`🔌 Connecting to RabbitMQ at ${RABBITMQ_URL}...`);

    // Create connection (returns ChannelModel)
    connection = await amqp.connect(RABBITMQ_URL);
    console.log('RabbitMQ connection established');

    // Create channel
    if (!connection) {
      throw new Error('Connection is null after creation');
    }
    channel = await connection.createChannel();
    console.log('RabbitMQ channel created');

    // Assert exchange (topic type for flexible routing)
    if (!channel) {
      throw new Error('Channel is null after creation');
    }
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    console.log(`Exchange '${EXCHANGE_NAME}' asserted`);

    // Assert queue
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log(`Queue '${QUEUE_NAME}' asserted`);

    // Bind queue to exchange with routing key
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);
    console.log(`Queue bound to exchange with routing key '${ROUTING_KEY}'`);

    // Handle connection errors (ChannelModel supports EventEmitter)
    connection.on('error', (error) => {
      console.error('RabbitMQ connection error:', error);
    });

    connection.on('close', () => {
      console.log('RabbitMQ connection closed');
    });
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
};

/**
 * Publishes a message to RabbitMQ
 * @param message - The message object to publish
 */
export const publishToQueue = async (message: any): Promise<void> => {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }

    const messageBuffer = Buffer.from(JSON.stringify(message));

    const published = channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEY,
      messageBuffer,
      {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
      }
    );

    if (published) {
      console.log(`📤 Message published to queue: ${ROUTING_KEY}`);
      console.log(`   Transaction ID: ${message.transactionId || 'N/A'}`);
    } else {
      throw new Error('Failed to publish message to queue (channel buffer full)');
    }
  } catch (error) {
    console.error('Error publishing to queue:', error);
    throw error;
  }
};

/**
 * Gets the current channel
 */
export const getChannel = (): Channel | null => {
  return channel;
};

/**
 * Closes RabbitMQ connection
 */
export const closeRabbitMQ = async (): Promise<void> => {
  try {
    if (channel) {
      await channel.close();
      console.log('RabbitMQ channel closed');
      channel = null;
    }
    if (connection) {
      await connection.close();
      console.log('RabbitMQ connection closed');
      connection = null;
    }
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
};