import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Product Service API',
      version: '1.0.0',
      description: 'Product catalog microservice with Joi validation'
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Product: {
          type: 'object',
          required: ['name', 'description', 'price', 'stock', 'category'],
          properties: {
            _id: {
              type: 'string',
              example: '507f191e810c19729de860ea'
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 200,
              example: 'Laptop Pro 15"'
            },
            description: {
              type: 'string',
              minLength: 10,
              example: 'High-performance laptop'
            },
            price: {
              type: 'number',
              format: 'float',
              minimum: 0,
              example: 1299.99
            },
            stock: {
              type: 'integer',
              minimum: 0,
              example: 50
            },
            category: {
              type: 'string',
              example: 'Electronics'
            },
            imageUrl: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/image.jpg'
            },
            isActive: {
              type: 'boolean',
              example: true
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
};

export default swaggerJsdoc(options);