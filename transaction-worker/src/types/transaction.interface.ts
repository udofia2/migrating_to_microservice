import { Document } from 'mongoose';
import { TransactionStatus } from './transaction.emum';


export interface TransactionMessage {
  transactionId: string;
  paymentId: string;
  customerId: string;
  orderId: string;
  productId: string;
  amount: number;
  status: string;
  timestamp: string;
  metadata?: {
    processingTime?: number;
    paymentMethod?: string;
    [key: string]: any;
  };
}


export interface ITransaction extends Document {
  _id: string;
  transactionId: string;
  paymentId: string;
  customerId: string;
  orderId: string;
  productId: string;
  amount: number;
  status: TransactionStatus;
  timestamp: Date;
  metadata?: {
    processingTime?: number;
    paymentMethod?: string;
    [key: string]: any;
  };
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}