import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectRabbitMQ, closeRabbitMQ } from './config/rabbitmq';
import paymentRoutes from './routes/paymentRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PAYMENT_SERVICE_PORT || 3004;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'Payment Service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.use('/payments', paymentRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const startServer = async () => {
  try {
  
    await connectRabbitMQ();

    app.listen(PORT, () => {
      console.log(`Payment Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log('Shutting down gracefully...');
  await closeRabbitMQ();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();

export default app;