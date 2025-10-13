import mongoose, { Schema } from 'mongoose';
import { ITransaction } from '../types/transaction.interface';
import { TransactionStatus } from '../types/transaction.emum';


/**
 * Transaction Schema definition
 */
const transactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      unique: true,
      uppercase: true,
      index: true
    },
    paymentId: {
      type: String,
      required: [true, 'Payment ID is required'],
      uppercase: true,
      index: true
    },
    customerId: {
      type: String,
      required: [true, 'Customer ID is required'],
      index: true
    },
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      uppercase: true,
      index: true
    },
    productId: {
      type: String,
      required: [true, 'Product ID is required']
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      required: [true, 'Transaction status is required'],
      index: true
    },
    timestamp: {
      type: Date,
      required: [true, 'Transaction timestamp is required']
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for common queries
transactionSchema.index({ customerId: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1, status: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);