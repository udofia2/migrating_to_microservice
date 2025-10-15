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

## Start the service
- run `docker-compose up build`
- visit localhost:8080/docs - for documentation
- visit localhost:8080/api/serviceName - example localhost:8080/api/customers


## Video Demo

https://youtu.be/FfFaGTIhSIY

[![IMAGE ALT TEXT](https://img.youtube.com/vi/FfFaGTIhSIY/0.jpg)](https://www.youtube.com/watch?v=FfFaGTIhSIY)

## Test
ensure the services are running before running the test.
first make the file executable
- ` run chmod +x e2e-test.sh`

then run
- `./e2e-test.sh`

NOTE: Please check the readme of each of the services for more details.