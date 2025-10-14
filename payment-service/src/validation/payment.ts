import Joi from 'joi';

export const objectIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message('Invalid ObjectId format');

export const processPaymentSchema = Joi.object({
  customerId: objectIdSchema
    .required()
    .messages({
      'any.required': 'Customer ID is required',
      'string.pattern.base': 'Customer ID must be a valid MongoDB ObjectId'
    }),

  orderId: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'Order ID is required'
    }),

  productId: objectIdSchema
    .optional()
    .messages({
      'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId'
    }),

  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Amount must be greater than 0',
      'any.required': 'Payment amount is required'
    })
});

export const paymentIdSchema = Joi.object({
  paymentId: Joi.string().required()
});