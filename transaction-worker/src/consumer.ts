import { Transaction } from './models/Transaction';
import { TransactionStatus } from './types/transaction.emum';
import { TransactionMessage } from './types/transaction.interface';


/**
 * Processes transaction message and saves to database
 * @param message - Transaction message from queue
 */
export const processTransaction = async (message: TransactionMessage): Promise<void> => {
  try {
    console.log(` Processing transaction: ${message.transactionId}`);
    console.log(`   Order: ${message.orderId}, Amount: ₦${message.amount.toLocaleString()}`);

    // Validate message data
    if (!message.transactionId || !message.paymentId || !message.orderId) {
      throw new Error('Invalid transaction message: missing required fields');
    }

    // Check if transaction already exists (idempotency)
    const existingTransaction = await Transaction.findOne({ 
      transactionId: message.transactionId 
    });

    if (existingTransaction) {
      console.log(`  Transaction already exists: ${message.transactionId}`);
      return;
    }

    // Map status from message to enum
    let transactionStatus: TransactionStatus;
    switch (message.status.toLowerCase()) {
      case 'success':
        transactionStatus = TransactionStatus.SUCCESS;
        break;
      case 'failed':
        transactionStatus = TransactionStatus.FAILED;
        break;
      case 'processing':
        transactionStatus = TransactionStatus.PROCESSING;
        break;
      default:
        transactionStatus = TransactionStatus.PENDING;
    }

    // Create transaction document
    const transaction = await Transaction.create({
      transactionId: message.transactionId,
      paymentId: message.paymentId,
      customerId: message.customerId,
      orderId: message.orderId,
      productId: message.productId,
      amount: message.amount,
      status: transactionStatus,
      timestamp: new Date(message.timestamp),
      metadata: message.metadata || {},
      processedAt: new Date()
    });

    console.log(` Transaction saved successfully: ${transaction.transactionId}`);
    console.log(`   Database ID: ${transaction._id}`);
    console.log(`   Status: ${transaction.status}`);

  } catch (error: any) {
    console.error(`Error processing transaction:`, error.message);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.values(error.errors).map((e: any) => e.message));
    }
    
    throw error;
  }
};