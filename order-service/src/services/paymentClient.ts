import axios, { AxiosError } from 'axios';
import { PaymentRequest, PaymentResponse } from '../types/payment.interface';

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';


/**
 * Payment client for communicating with Payment Service
 */
export class PaymentClient {
  
  /**
   * Process payment through Payment Service
   * @param paymentData - Payment request data
   * @returns Promise<PaymentResponse>
   */
  static async processPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log(`Sending payment request to Payment Service: ${PAYMENT_SERVICE_URL}`);
      console.log(`   Order ID: ${paymentData.orderId}, Amount: ₦${paymentData.amount}`);

      const response = await axios.post<PaymentResponse>(
        `${PAYMENT_SERVICE_URL}`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log(`Payment response received: ${response.data.status}`);
      return response.data;

    } catch (error) {
      console.error('Payment Service communication error:', error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        
        // Handle specific error cases
        if (axiosError.code === 'ECONNREFUSED') {
          throw new Error('Payment Service is unavailable. Please try again later.');
        }

        if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
          throw new Error('Payment request timed out. Please try again.');
        }

        if (axiosError.response) {
          // Payment service returned an error response
          const errorMessage = axiosError.response.data?.message || 'Payment processing failed';
          throw new Error(errorMessage);
        }
      }

      throw new Error('Failed to process payment. Please try again later.');
    }
  }

  /**
   * Health check for Payment Service
   * @returns Promise<boolean>
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${PAYMENT_SERVICE_URL}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('Payment Service health check failed:', error);
      return false;
    }
  }
}