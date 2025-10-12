import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../index";
import { Order, OrderStatus } from "../models/Order";
import { PaymentClient } from "../services/paymentClient";

let mongoServer: MongoMemoryServer;

// Mock PaymentClient
jest.mock("../services/paymentClient");

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
  await Order.deleteMany({});
  jest.clearAllMocks();
});

describe("Order Service API", () => {
  const mockOrderData = {
    customerId: new mongoose.Types.ObjectId().toString(),
    productId: new mongoose.Types.ObjectId().toString(),
    amount: 50000,
  };

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe("Order Service");
    });
  });

  describe("POST /orders", () => {
    it("should create a new order successfully", async () => {
      // Mock successful payment
      (PaymentClient.processPayment as jest.Mock).mockResolvedValue({
        success: true,
        paymentId: "PAY-12345",
        status: "processing",
      });

      const response = await request(app).post("/orders").send(mockOrderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customerId).toBe(mockOrderData.customerId);
      expect(response.body.data.productId).toBe(mockOrderData.productId);
      expect(response.body.data.amount).toBe(mockOrderData.amount);
      expect(response.body.data.orderStatus).toBe(OrderStatus.PENDING);
      expect(response.body.data.orderId).toMatch(/^ORD-\d{8}-[A-Z0-9]{6}$/);
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/orders")
        .send({ customerId: mockOrderData.customerId });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Missing required fields");
    });

    it("should return 400 for invalid amount", async () => {
      const response = await request(app)
        .post("/orders")
        .send({ ...mockOrderData, amount: -100 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 for zero amount", async () => {
      const response = await request(app)
        .post("/orders")
        .send({ ...mockOrderData, amount: 0 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /orders/:id", () => {
    it("should return order by orderId", async () => {
      const order = await Order.create({
        orderId: "ORD-20251009-TEST01",
        ...mockOrderData,
        orderStatus: OrderStatus.PENDING,
      });

      const response = await request(app).get(`/orders/${order.orderId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orderId).toBe(order.orderId);
    });

    it("should return order by MongoDB _id", async () => {
      const order = await Order.create({
        orderId: "ORD-20251009-TEST02",
        ...mockOrderData,
        orderStatus: OrderStatus.PENDING,
      });

      const response = await request(app).get(`/orders/${order._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(order._id.toString());
    });

    it("should return 404 for non-existent order", async () => {
      const response = await request(app).get("/orders/ORD-20251009-FAKE01");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /orders", () => {
    it("should return all orders", async () => {
      await Order.create({
        orderId: "ORD-20251009-TEST03",
        ...mockOrderData,
        orderStatus: OrderStatus.PENDING,
      });

      const response = await request(app).get("/orders");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it("should filter orders by customerId", async () => {
      const customerId = new mongoose.Types.ObjectId().toString();
      await Order.create({
        orderId: "ORD-20251009-TEST04",
        ...mockOrderData,
        customerId,
        orderStatus: OrderStatus.PENDING,
      });

      const response = await request(app).get(
        `/orders?customerId=${customerId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data[0].customerId).toBe(customerId);
    });

    it("should filter orders by status", async () => {
      await Order.create({
        orderId: "ORD-20251009-TEST05",
        ...mockOrderData,
        orderStatus: OrderStatus.COMPLETED,
      });

      const response = await request(app).get(
        `/orders?orderStatus=${OrderStatus.COMPLETED}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data[0].orderStatus).toBe(OrderStatus.COMPLETED);
    });
  });
});
