import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Order Service API',
      version: '1.0.0',
      description: 'Order orchestration microservice with Joi validation and REST communication'
    },
    servers: [
      {
        url: 'http://localhost:3003',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        OrderRequest: {
          type: 'object',
          required: ['customerId', 'productId', 'amount'],
          properties: {
            customerId: {
              type: 'string',
              pattern: '^[0-9a-fA-F]{24}$',
              description: 'Valid MongoDB ObjectId (Joi validated)',
              example: '507f191e810c19729de860ea'
            },
            productId: {
              type: 'string',
              pattern: '^[0-9a-fA-F]{24}$',
              description: 'Valid MongoDB ObjectId (Joi validated)',
              example: '507f191e810c19729de860eb'
            },
            amount: {
              type: 'number',
              format: 'float',
              minimum: 0,
              description: 'Order amount (Joi validated positive number)',
              example: 1299.99
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              default: 1,
              example: 1
            }
          }
        },
        OrderResponse: {
          type: 'object',
          properties: {
            customerId: {
              type: 'string',
              example: '507f191e810c19729de860ea'
            },
            productId: {
              type: 'string',
              example: '507f191e810c19729de860eb'
            },
            orderId: {
              type: 'string',
              example: 'ORD-1634567890-1234'
            },
            amount: {
              type: 'number',
              example: 1299.99
            },
            quantity: {
              type: 'integer',
              example: 1
            },
            orderStatus: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
              example: 'pending'
            },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed'],
              example: 'pending'
            },
            createdAt: {
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