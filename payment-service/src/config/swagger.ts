import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Payment Service API',
      version: '1.0.0',
      description: 'Payment processing with RabbitMQ async messaging and Joi validation'
    },
    servers: [
      {
        url: 'http://localhost:3004',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        PaymentRequest: {
          type: 'object',
          required: ['customerId', 'orderId', 'productId', 'amount'],
          properties: {
            customerId: {
              type: 'string',
              pattern: '^[0-9a-fA-F]{24}$',
              description: 'Customer MongoDB ObjectId',
              example: '507f191e810c19729de860ea'
            },
            orderId: {
              type: 'string',
              description: 'Order ID from Order Service',
              example: 'ORD-1634567890-1234'
            },
            productId: {
              type: 'string',
              pattern: '^[0-9a-fA-F]{24}$',
              description: 'Product MongoDB ObjectId',
              example: '507f191e810c19729de860eb'
            },
            amount: {
              type: 'number',
              minimum: 0,
              description: 'Payment amount',
              example: 1299.99
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            transactionId: {
              type: 'string',
              example: 'TXN-1634567891-5678'
            },
            customerId: {
              type: 'string',
              example: '507f191e810c19729de860ea'
            },
            orderId: {
              type: 'string',
              example: 'ORD-1634567890-1234'
            },
            productId: {
              type: 'string',
              example: '507f191e810c19729de860eb'
            },
            amount: {
              type: 'number',
              example: 1299.99
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed'],
              example: 'completed'
            },
            paymentMethod: {
              type: 'string',
              example: 'mock_payment'
            },
            processedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
};

export default swaggerJsdoc(options);