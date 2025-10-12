import { Router, Request, Response } from 'express';
import { publishToQueue } from '../config/rabbitmq';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * Payment status enum
 */
enum PaymentStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PROCESSING = 'processing'
}

/**
 * @route   POST /payments
 * @desc    Process payment and publish to queue
 * @access  Public
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, orderId, productId, amount } = req.body;

    // Validate required fields
    if (!customerId || !orderId || !amount) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: customerId, orderId, amount'
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

    console.log(`💳 Processing payment for Order: ${orderId}`);
    console.log(`   Customer: ${customerId}, Amount: ₦${amount.toLocaleString()}`);

    // Generate unique payment/transaction ID
    const paymentId = `PAY-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const transactionId = `TXN-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Simulate payment processing (90% success rate for demo)
    const isSuccess = Math.random() > 0.1;
    const paymentStatus = isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

    console.log(`   Payment Status: ${paymentStatus}`);

    // Prepare transaction details for queue
    const transactionDetails = {
      transactionId,
      paymentId,
      customerId,
      orderId,
      productId,
      amount,
      status: paymentStatus,
      timestamp: new Date().toISOString(),
      metadata: {
        processingTime: Math.floor(Math.random() * 500) + 100, // Simulated processing time
        paymentMethod: 'card', // Mock payment method
      }
    };

    // Publish transaction details to RabbitMQ
    try {
      await publishToQueue(transactionDetails);
      console.log(`Transaction details published to queue: ${transactionId}`);
    } catch (queueError) {
      console.error('Failed to publish to queue:', queueError);
      // Continue processing even if queue fails
    }

    // Return payment response
    res.status(isSuccess ? 200 : 402).json({
      success: isSuccess,
      paymentId,
      transactionId,
      status: paymentStatus,
      message: isSuccess 
        ? 'Payment processed successfully' 
        : 'Payment processing failed',
      data: {
        orderId,
        amount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error processing payment:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /payments/:paymentId
 * @desc    Get payment status (mock endpoint)
 * @access  Public
 */
router.get('/:paymentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;

    // Mock payment lookup
    res.status(200).json({
      success: true,
      data: {
        paymentId,
        status: PaymentStatus.SUCCESS,
        message: 'This is a mock payment lookup endpoint'
      }
    });

  } catch (error: any) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;