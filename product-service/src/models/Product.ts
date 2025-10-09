import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  sku: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters long'],
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: function(value: number) {
          return value > 0;
        },
        message: 'Price must be greater than 0'
      }
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      enum: {
        values: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Food & Beverages', 'Health & Beauty', 'Toys', 'Other'],
        message: '{VALUE} is not a valid category'
      }
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    imageUrl: {
      type: String,
      trim: true,
      default: 'https://via.placeholder.com/300x300?text=No+Image'
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });

productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

export const Product = mongoose.model<IProduct>('Product', productSchema);