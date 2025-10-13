import { Router, Request, Response } from 'express';
import { Order, OrderStatus } from '../models/Order';
import { PaymentClient } from '../services/paymentClient';

const router = Router();


/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order (Main Flow - Joi Validated)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order created successfully
 *                 data:
 *                   $ref: '#/components/schemas/OrderResponse'
 *       400:
 *         description: Validation error (Joi) or business logic error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Order validation failed
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: customerId
 *                       message:
 *                         type: string
 *                         example: customerId must be a valid MongoDB ObjectId
 *       404:
 *         description: Customer or product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Customer not found
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, productId, amount } = req.body;

    // Validate required fields
    if (!customerId || !productId || !amount) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: customerId, productId, amount'
      });
      return;
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
      return;
    }

    // Generate unique order ID
    const orderId = (Order as any).generateOrderId();

    // Create order with pending status
    const order = await Order.create({
      orderId,
      customerId,
      productId,
      amount,
      orderStatus: OrderStatus.PENDING
    });

    console.log(`Order created: ${orderId} for customer: ${customerId}`);

    // Initiate payment processing (async - don't wait for completion)
    PaymentClient.processPayment({
      customerId,
      orderId,
      productId,
      amount
    })
      .then((paymentResponse) => {
        console.log(`Payment initiated for order ${orderId}: ${paymentResponse.paymentId}`);
        // Update order with payment ID (optional - in background)
        Order.findOneAndUpdate(
          { orderId },
          { paymentId: paymentResponse.paymentId }
        ).catch(err => console.error('Error updating order with payment ID:', err));
      })
      .catch((error) => {
        console.error(`Payment initiation failed for order ${orderId}:`, error.message);
        // Update order status to failed (optional - in background)
        Order.findOneAndUpdate(
          { orderId },
          { orderStatus: OrderStatus.FAILED }
        ).catch(err => console.error('Error updating order status:', err));
      });

    // Return response immediately to customer
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        customerId: order.customerId,
        orderId: order.orderId,
        productId: order.productId,
        orderStatus: order.orderStatus,
        amount: order.amount,
        createdAt: order.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error creating order:', error);
    
    // Handle duplicate order ID (unlikely but possible)
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'Order ID conflict. Please try again.'
      });
      return;
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map((e: any) => e.message)
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});


/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Get order by order ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: ORD-1634567890-1234
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Try to find by orderId first, then by _id
    let order = await Order.findOne({ orderId: id.toUpperCase() });
    
    if (!order) {
      order = await Order.findById(id);
    }

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});


/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of all orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderResponse'
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, orderStatus, limit = '50', page = '1' } = req.query;

    // Build filter object
    const filter: any = {};

    if (customerId) {
      filter.customerId = customerId;
    }

    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }

    // Pagination
    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .select('-__v');

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: orders
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;