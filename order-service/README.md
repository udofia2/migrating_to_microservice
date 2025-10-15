# Build the service
cd order-service
npm install
npm run build

# Run tests
npm test

# Start with Docker (ensure payment-service will be available)
cd ..
docker-compose up --build order-service payment-service



# Health check
curl http://localhost:3003/health

# Create an order (use actual customer and product IDs from previous stages)
curl -X POST http://localhost:3003/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "YOUR_CUSTOMER_ID",
    "productId": "YOUR_PRODUCT_ID",
    "amount": 50000
  }'

# Get order by orderId
curl http://localhost:3003/ORD-20251009-XXXXXX

# Get all orders
curl http://localhost:3003

# Get orders for specific customer
curl http://localhost:3003?customerId=YOUR_CUSTOMER_ID