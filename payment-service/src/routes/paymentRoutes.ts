// payment-service/src/routes/paymentRoutes.ts
import { Router, Request, Response } from 'express';
import { publishToQueue } from '../config/rabbitmq';
import { v4 as uuidv4 } from 'uuid';
import { PaymentStatus } from '../types/enums';
import { validate } from '../middleware/validation';
import { processPaymentSchema, paymentIdSchema } from '../validation/payment';

const router = Router();

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Process payment and publish to queue (Joi Validated)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Validation error
 *       402:
 *         description: Payment failed
 */
router.post('/', validate(processPaymentSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, orderId, productId, amount } = req.body;

    console.log(`Processing payment for Order: ${orderId}`);
    console.log(`Customer: ${customerId}, Amount: ₦${amount.toLocaleString()}`);

    const paymentId = `PAY-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const transactionId = `TXN-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Simulate payment processing (90% success rate)
    const isSuccess = Math.random() > 0.1;
    const paymentStatus = isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

    console.log(`Payment Status: ${paymentStatus}`);

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
        processingTime: Math.floor(Math.random() * 500) + 100,
        paymentMethod: 'card',
      }
    };

    try {
      await publishToQueue(transactionDetails);
      console.log(`Transaction details published to queue: ${transactionId}`);
    } catch (queueError) {
      console.error('Failed to publish to queue:', queueError);
    }

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
 * @swagger
 * /payments/{paymentId}:
 *   get:
 *     summary: Get payment status (mock endpoint)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details
 */
router.get('/:paymentId', validate(paymentIdSchema, 'params'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;

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