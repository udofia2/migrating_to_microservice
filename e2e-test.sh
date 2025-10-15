#!/bin/bash

echo " Starting End-to-End Test..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Wait for services to be ready
echo " Waiting for services to be ready..."
sleep 10

# Test 1: Health checks
echo ""
echo "${YELLOW}Test 1: Health Checks${NC}"
echo "----------------------------------------"

echo -n "Customer Service: "
curl -s http://localhost:3005/health | jq -r '.service' && echo "${GREEN}✓${NC}" || echo "${RED}✗${NC}"

echo -n "Product Service: "
curl -s http://localhost:3002/health | jq -r '.service' && echo "${GREEN}✓${NC}" || echo "${RED}✗${NC}"

echo -n "Order Service: "
curl -s http://localhost:3003/health | jq -r '.service' && echo "${GREEN}✓${NC}" || echo "${RED}✗${NC}"

echo -n "Payment Service: "
curl -s http://localhost:3004/health | jq -r '.service' && echo "${GREEN}✓${NC}" || echo "${RED}✗${NC}"

# Test 2: Get customer and product
echo ""
echo "${YELLOW}Test 2: Fetching Customer and Product${NC}"
echo "----------------------------------------"

CUSTOMER_ID=$(curl -s http://localhost:3005/customers | jq -r '.data[0]._id')
echo "Customer ID: ${CUSTOMER_ID}"

PRODUCT_ID=$(curl -s http://localhost:3002/products | jq -r '.data[0]._id')
PRODUCT_NAME=$(curl -s http://localhost:3002/products | jq -r '.data[0].name')
PRODUCT_PRICE=$(curl -s http://localhost:3002/products | jq -r '.data[0].price')
echo "Product ID: ${PRODUCT_ID}"
echo "Product: ${PRODUCT_NAME} (₦${PRODUCT_PRICE})"

# Test 3: Create order
echo ""
echo "${YELLOW}Test 3: Creating Order${NC}"
echo "----------------------------------------"

ORDER_RESPONSE=$(curl -s -X POST http://localhost:3003/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"${CUSTOMER_ID}\",
    \"productId\": \"${PRODUCT_ID}\",
    \"amount\": ${PRODUCT_PRICE}
  }")

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.orderId')
echo "Order ID: ${ORDER_ID}"
echo "Order Status: $(echo $ORDER_RESPONSE | jq -r '.data.orderStatus')"

# Test 4: Wait and check transaction
echo ""
echo "${YELLOW}Test 4: Checking Transaction (waiting 5 seconds)${NC}"
echo "----------------------------------------"
sleep 5

echo ""
echo "${GREEN} End-to-End Test Complete!${NC}"
echo ""
echo "Summary:"
echo "- Order Created: ${ORDER_ID}"
echo "- Customer: ${CUSTOMER_ID}"
echo "- Product: ${PRODUCT_ID}"
echo "- Amount: ₦${PRODUCT_PRICE}"
echo ""
