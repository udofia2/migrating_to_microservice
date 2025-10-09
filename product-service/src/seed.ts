import dotenv from 'dotenv';
import { connectDatabase, closeDatabase } from './config/database';
import { Product } from './models/Product';

dotenv.config();

/**
 * Seed data for products
 */
const productsData = [
  {
    name: 'Samsung Galaxy S23 Ultra',
    description: 'Flagship smartphone with 200MP camera, 6.8-inch display, and S Pen support. Perfect for professionals and content creators.',
    price: 450000,
    category: 'Electronics',
    stock: 25,
    sku: 'SAMS23U-BLK-256',
    imageUrl: 'https://via.placeholder.com/300x300?text=Samsung+S23'
  },
  {
    name: 'Apple MacBook Air M2',
    description: 'Lightweight laptop with Apple M2 chip, 13.6-inch Liquid Retina display, and up to 18 hours battery life.',
    price: 850000,
    category: 'Electronics',
    stock: 15,
    sku: 'APPL-MBA-M2-256',
    imageUrl: 'https://via.placeholder.com/300x300?text=MacBook+Air'
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise canceling wireless headphones with exceptional sound quality and 30-hour battery life.',
    price: 180000,
    category: 'Electronics',
    stock: 40,
    sku: 'SONY-WH1000XM5-BLK',
    imageUrl: 'https://via.placeholder.com/300x300?text=Sony+Headphones'
  },
  {
    name: 'Nike Air Max 270',
    description: 'Comfortable running shoes with Max Air cushioning and breathable mesh upper. Available in multiple colors.',
    price: 65000,
    category: 'Sports',
    stock: 50,
    sku: 'NIKE-AM270-WHT-42',
    imageUrl: 'https://via.placeholder.com/300x300?text=Nike+Shoes'
  },
  {
    name: 'Instant Pot Duo 7-in-1',
    description: 'Multi-functional pressure cooker that replaces 7 kitchen appliances. Perfect for quick and healthy meals.',
    price: 95000,
    category: 'Home & Garden',
    stock: 30,
    sku: 'INST-POT-DUO-6QT',
    imageUrl: 'https://via.placeholder.com/300x300?text=Instant+Pot'
  },
  {
    name: 'The Lean Startup Book',
    description: 'Essential reading for entrepreneurs. Learn how to build a successful startup using lean methodology.',
    price: 8500,
    category: 'Books',
    stock: 100,
    sku: 'BOOK-LEAN-STARTUP',
    imageUrl: 'https://via.placeholder.com/300x300?text=Book'
  },
  {
    name: 'Organic Green Tea 100 Bags',
    description: 'Premium organic green tea packed with antioxidants. Perfect for daily wellness routine.',
    price: 4500,
    category: 'Food & Beverages',
    stock: 200,
    sku: 'TEA-GRN-ORG-100',
    imageUrl: 'https://via.placeholder.com/300x300?text=Green+Tea'
  },
  {
    name: 'Yoga Mat Premium',
    description: 'Non-slip yoga mat with extra cushioning. Eco-friendly and durable for all yoga styles.',
    price: 15000,
    category: 'Sports',
    stock: 75,
    sku: 'YOGA-MAT-PREM-BLU',
    imageUrl: 'https://via.placeholder.com/300x300?text=Yoga+Mat'
  },
  {
    name: 'Bluetooth Speaker Waterproof',
    description: 'Portable wireless speaker with 360-degree sound, waterproof design, and 12-hour battery life.',
    price: 35000,
    category: 'Electronics',
    stock: 60,
    sku: 'SPKR-BT-WP-BLK',
    imageUrl: 'https://via.placeholder.com/300x300?text=Speaker'
  },
  {
    name: 'Vitamin C Serum 30ml',
    description: 'Anti-aging serum with 20% Vitamin C. Brightens skin and reduces fine lines.',
    price: 12000,
    category: 'Health & Beauty',
    stock: 120,
    sku: 'VITC-SER-30ML',
    imageUrl: 'https://via.placeholder.com/300x300?text=Vitamin+C'
  }
];

/**
 * Seeds product data into the database
 */
const seedProducts = async (): Promise<void> => {
  try {
    console.log('🌱 Starting product seeding process...');

    await connectDatabase();

    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    const products = await Product.insertMany(productsData);
    console.log(`✅ Successfully seeded ${products.length} products`);

    console.log('\n📋 Seeded Products:');
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   ID: ${product._id}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Price: ₦${product.price.toLocaleString()}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Stock: ${product.stock} units`);
    });

    await closeDatabase();
    console.log('\n✅ Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    await closeDatabase();
    process.exit(1);
  }
};

seedProducts();