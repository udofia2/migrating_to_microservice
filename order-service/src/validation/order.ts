import Joi from 'joi';

export const objectIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message('Invalid ObjectId format');

export const createOrderSchema = Joi.object({
  customerId: objectIdSchema
    .required()
    .messages({
      'any.required': 'Customer ID is required',
      'string.pattern.base': 'Customer ID must be a valid MongoDB ObjectId'
    }),

  productId: objectIdSchema
    .required()
    .messages({
      'any.required': 'Product ID is required',
      'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId'
    }),

  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Amount must be greater than 0',
      'any.required': 'Order amount is required'
    }),

  quantity: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.min': 'Quantity must be at least 1'
    })
});

export const orderIdSchema = Joi.object({
  id: Joi.string().required()
});

export const orderQuerySchema = Joi.object({
  customerId: objectIdSchema.optional(),
  orderStatus: Joi.string()
    .valid('pending', 'processing', 'completed', 'failed', 'cancelled')
    .optional(),
  limit: Joi.number().integer().min(1).max(100).optional().default(50),
  page: Joi.number().integer().min(1).optional().default(1)
});