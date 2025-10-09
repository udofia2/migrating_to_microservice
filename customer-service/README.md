# Build the service
cd customer-service
npm install
npm run build

# Run locally (optional)
npm run dev

# Seed database
docker-compose up -d mongodb
npm run seed

# Run tests
npm test

# Start with Docker
cd ..
docker-compose up --build customer-service


# Health check
curl http://localhost:3001/health

# Get all customers
curl http://localhost:3001/customers

# Get specific customer (use ID from seed output)
curl http://localhost:3001/customers/<CUSTOMER_ID>