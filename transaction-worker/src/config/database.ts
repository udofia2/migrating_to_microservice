import mongoose from 'mongoose';

/**
 * Connects to MongoDB database
 * @returns Promise<void>
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
    
    await mongoose.connect(mongoUri);
    
    console.log('✅ Transaction Worker: MongoDB connected successfully');
  } catch (error) {
    console.error('❌ Transaction Worker: MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Gracefully closes database connection
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('Transaction Worker: MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};