import mongoose, { Document, Schema } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface IOrder extends Document {
  _id: string;
  orderId: string;
  customerId: string;
  productId: string;
  amount: number;
  orderStatus: OrderStatus;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    customerId: {
      type: String,
      required: [true, 'Customer ID is required'],
      ref: 'Customer'
    },
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      ref: 'Product'
    },
    amount: {
      type: Number,
      required: [true, 'Order amount is required'],
      min: [0, 'Amount cannot be negative'],
      validate: {
        validator: function(value: number) {
          return value > 0;
        },
        message: 'Amount must be greater than 0'
      }
    },
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      required: true
    },
    paymentId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

orderSchema.index({ orderId: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

/**
 * Generate unique order ID
 * Format: ORD-YYYYMMDD-RANDOM
 */
orderSchema.statics.generateOrderId = function(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return `ORD-${year}${month}${day}-${random}`;
};

export const Order = mongoose.model<IOrder>('Order', orderSchema);