import { Router, Request, Response } from 'express';
import { Order, OrderStatus } from '../models/Order';
import { PaymentClient } from '../services/paymentClient';

const router = Router();

/**
 * @route   POST /orders
 * @desc    Create a new order
 * @access  Public
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
 * @route   GET /orders/:id
 * @desc    Get order by order ID or MongoDB _id
 * @access  Public
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
 * @route   GET /orders
 * @desc    Get all orders with optional filters
 * @access  Public
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