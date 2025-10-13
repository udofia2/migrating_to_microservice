
export interface PaymentRequest {
  customerId: string;
  orderId: string;
  productId: string;
  amount: number;
}


export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  status: string;
  message?: string;
}