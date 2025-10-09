import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../index';
import { Product } from '../models/Product';

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
  await Product.deleteMany({});
});

describe('Product Service API', () => {
  const mockProduct = {
    name: 'Test Product',
    description: 'This is a test product description',
    price: 10000,
    category: 'Electronics',
    stock: 50,
    sku: 'TEST-PROD-001'
  };

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe('Product Service');
    });
  });

  describe('GET /products/:id', () => {
    it('should return product by ID', async () => {
      const product = await Product.create(mockProduct);
      
      const response = await request(app).get(`/products/${product._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(mockProduct.name);
      expect(response.body.data.sku).toBe(mockProduct.sku);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/products/${fakeId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app).get('/products/invalid-id');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not return inactive products', async () => {
      const product = await Product.create({ ...mockProduct, isActive: false });
      
      const response = await request(app).get(`/products/${product._id}`);
      
      expect(response.status).toBe(404);
    });
  });

  describe('GET /products', () => {
    it('should return all active products', async () => {
      await Product.create(mockProduct);
      await Product.create({ ...mockProduct, sku: 'TEST-PROD-002', isActive: false });
      
      const response = await request(app).get('/products');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
    });

    it('should filter products by category', async () => {
      await Product.create(mockProduct);
      await Product.create({ ...mockProduct, sku: 'TEST-PROD-002', category: 'Books' });
      
      const response = await request(app).get('/products?category=Electronics');
      
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].category).toBe('Electronics');
    });
  });

  describe('GET /products/sku/:sku', () => {
    it('should return product by SKU', async () => {
      await Product.create(mockProduct);
      
      const response = await request(app).get(`/products/sku/${mockProduct.sku}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sku).toBe(mockProduct.sku);
    });

    it('should be case insensitive for SKU', async () => {
      await Product.create(mockProduct);
      
      const response = await request(app).get(`/products/sku/${mockProduct.sku.toLowerCase()}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.sku).toBe(mockProduct.sku);
    });
  });
});