import request from 'supertest';
import app from '../index';
import * as rabbitmq from '../config/rabbitmq';

// Mock RabbitMQ
jest.mock('../config/rabbitmq', () => ({
  connectRabbitMQ: jest.fn(),
  publishToQueue: jest.fn(),
  closeRabbitMQ: jest.fn(),
  getChannel: jest.fn()
}));

describe('Payment Service API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPaymentData = {
    customerId: '507f1f77bcf86cd799439011',
    orderId: 'ORD-20251009-ABC123',
    productId: '507f1f77bcf86cd799439012',
    amount: 50000
  };

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe('Payment Service');
    });
  });

  describe('POST /payments', () => {
    it('should process payment successfully', async () => {
      (rabbitmq.publishToQueue as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/payments')
        .send(mockPaymentData);
      
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.body).toHaveProperty('paymentId');
      expect(response.body).toHaveProperty('transactionId');
      expect(response.body).toHaveProperty('status');
      expect(rabbitmq.publishToQueue).toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/payments')
        .send({ customerId: mockPaymentData.customerId });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .post('/payments')
        .send({ ...mockPaymentData, amount: -100 });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for zero amount', async () => {
      const response = await request(app)
        .post('/payments')
        .send({ ...mockPaymentData, amount: 0 });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle queue publish failure gracefully', async () => {
      (rabbitmq.publishToQueue as jest.Mock).mockRejectedValue(
        new Error('Queue connection failed')
      );

      const response = await request(app)
        .post('/payments')
        .send(mockPaymentData);
      
      // Should still return a response even if queue fails
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.body).toHaveProperty('paymentId');
    });
  });

  describe('GET /payments/:paymentId', () => {
    it('should return payment details', async () => {
      const paymentId = 'PAY-1234567890-ABCD1234';
      const response = await request(app).get(`/payments/${paymentId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentId).toBe(paymentId);
    });
  });
});