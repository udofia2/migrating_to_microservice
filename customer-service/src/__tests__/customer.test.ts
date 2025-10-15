import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Customer } from "../models/Customer";

let mongoServer: MongoMemoryServer;
let app: any;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  app = (await import("./../index")).default;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Customer.deleteMany({});
});

describe("Customer Service API", () => {
  const mockCustomer = {
    name: "Test Customer",
    email: "test@example.com",
    phone: "+234-801-234-5678",
    address: {
      street: "123 Test Street",
      city: "Lagos",
      state: "Lagos",
      zipCode: "100001",
      country: "Nigeria",
    },
  };

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe("Customer Service");
    });
  });

  describe("GET /customers/:id", () => {
    it("should return customer by ID", async () => {
      const customer = await Customer.create(mockCustomer);

      const response = await request(app).get(`/customers/${customer._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(mockCustomer.email);
    });

    it("should return 404 for non-existent customer", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/customers/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid ID format", async () => {
      const response = await request(app).get("/customers/invalid-id");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });
  });

  describe("GET /customers", () => {
    it("should return all customers", async () => {
      await Customer.create(mockCustomer);

      const response = await request(app).get("/customers");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
    });
  });
});