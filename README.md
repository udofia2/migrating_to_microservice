# Youverify E-Commerce Microservices migration system architecture

Youverify microservices-based e-commerce system with asynchronous communication using RabbitMQ.

## Architecture

- **Customer Service** (Port 3005): Manages customer data
- **Product Service** (Port 3002): Manages product catalog
- **Order Service** (Port 3003): Handles order creation
- **Payment Service** (Port 3004): Processes payments
- **Transaction Worker**: Consumes payment events and saves transactions

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)

