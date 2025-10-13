import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Transaction } from '../models/Transaction';
import { processTransaction } from '../consumer';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Transaction.deleteMany({});
});

describe('Transaction Consumer', () => {
  const mockTransactionMessage = {
    transactionId: 'TXN-1234567890-ABCD1234',
    paymentId: 'PAY-1234567890-ABCD1234',
    customerId: '507f1f77bcf86cd799439011',
    orderId: 'ORD-20251009-ABC123',
    productId: '507f1f77bcf86cd799439012',
    amount: 50000,
    status: 'success',
    timestamp: new Date().toISOString(),
    metadata: {
      processingTime: 250,
      paymentMethod: 'card'
    }
  };

  describe('processTransaction', () => {
    it('should save transaction successfully', async () => {
      await processTransaction(mockTransactionMessage);

      const transaction = await Transaction.findOne({ 
        transactionId: mockTransactionMessage.transactionId 
      });

      expect(transaction).toBeTruthy();
      expect(transaction?.transactionId).toBe(mockTransactionMessage.transactionId);
      expect(transaction?.paymentId).toBe(mockTransactionMessage.paymentId);
      expect(transaction?.customerId).toBe(mockTransactionMessage.customerId);
      expect(transaction?.orderId).toBe(mockTransactionMessage.orderId);
      expect(transaction?.amount).toBe(mockTransactionMessage.amount);
      expect(transaction?.status).toBe('success');
    });

    it('should handle duplicate transactions (idempotency)', async () => {
      // Process once
      await processTransaction(mockTransactionMessage);

      // Process again with same transaction ID
      await processTransaction(mockTransactionMessage);

      // Should only have one transaction
      const count = await Transaction.countDocuments({ 
        transactionId: mockTransactionMessage.transactionId 
      });
      expect(count).toBe(1);
    });

    it('should save metadata correctly', async () => {
      await processTransaction(mockTransactionMessage);

      const transaction = await Transaction.findOne({ 
        transactionId: mockTransactionMessage.transactionId 
      });

      expect(transaction?.metadata?.processingTime).toBe(250);
      expect(transaction?.metadata?.paymentMethod).toBe('card');
    });

    it('should handle failed transaction status', async () => {
      const failedMessage = {
        ...mockTransactionMessage,
        transactionId: 'TXN-FAILED-TEST',
        status: 'failed'
      };

      await processTransaction(failedMessage);

      const transaction = await Transaction.findOne({ 
        transactionId: failedMessage.transactionId 
      });

      expect(transaction?.status).toBe('failed');
    });

    it('should throw error for invalid message', async () => {
      const invalidMessage: any = {
        transactionId: 'TXN-INVALID',
        // Missing required fields
      };

      await expect(processTransaction(invalidMessage)).rejects.toThrow();
    });
  });
});