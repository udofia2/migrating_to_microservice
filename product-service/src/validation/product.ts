import Joi from 'joi';

export const objectIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message('Invalid ObjectId format');

const validCategories = [
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports',
  'Food & Beverages',
  'Health & Beauty',
  'Toys',
  'Other'
];

export const productSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(200)
    .required()
    .trim()
    .messages({
      'string.min': 'Product name must be at least 3 characters long',
      'string.max': 'Product name cannot exceed 200 characters',
      'any.required': 'Product name is required'
    }),

  description: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .trim()
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 1000 characters',
      'any.required': 'Product description is required'
    }),

  price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Price must be greater than 0',
      'any.required': 'Product price is required'
    }),

  category: Joi.string()
    .valid(...validCategories)
    .required()
    .messages({
      'any.only': `Category must be one of: ${validCategories.join(', ')}`,
      'any.required': 'Product category is required'
    }),

  stock: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.min': 'Stock cannot be negative',
      'any.required': 'Stock quantity is required'
    }),

  imageUrl: Joi.string()
    .uri()
    .optional()
    .trim()
    .messages({
      'string.uri': 'Please provide a valid URL for the image'
    }),

  sku: Joi.string()
    .required()
    .uppercase()
    .trim()
    .messages({
      'any.required': 'SKU is required'
    }),

  isActive: Joi.boolean()
    .optional()
    .default(true)
});

export const productIdSchema = Joi.object({
  id: objectIdSchema.required()
});


export const skuSchema = Joi.object({
  sku: Joi.string().required().trim()
});

export const productQuerySchema = Joi.object({
  category: Joi.string().valid(...validCategories).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  inStock: Joi.string().valid('true', 'false').optional()
}).custom((value: { minPrice: number; maxPrice: number; }, helpers: { error: (arg0: string, arg1: { message: string; }) => any; }) => {
  if (value.minPrice && value.maxPrice && value.minPrice > value.maxPrice) {
    return helpers.error('any.invalid', { 
      message: 'minPrice cannot be greater than maxPrice' 
    });
  }
  return value;
});