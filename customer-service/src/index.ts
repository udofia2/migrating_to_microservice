import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import customerRoutes from "./routes/customerRoutes";
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';


dotenv.config();

const app: Application = express();
const PORT = process.env.CUSTOMER_SERVICE_PORT || 3005;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Customer Service API Docs'
}));

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: "Customer Service",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/customers", customerRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Customer Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

startServer();

export default app;
