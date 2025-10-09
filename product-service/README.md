# Build the service
cd product-service
npm install
npm run build

# Seed database
npm run seed

# Run tests
npm test

# Start with Docker
cd ..
docker-compose up --build product-service



# Health check
curl http://localhost:3002/health

# Get all products
curl http://localhost:3002/products

# Get specific product (use ID from seed output)
curl http://localhost:3002/products/<PRODUCT_ID>

# Get product by SKU
curl http://localhost:3002/products/sku/SAMS23U-BLK-256

# Filter by category
curl http://localhost:3002/products?category=Electronics