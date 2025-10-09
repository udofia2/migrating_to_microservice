import dotenv from 'dotenv';
import { connectDatabase, closeDatabase } from './config/database';
import { Customer } from './models/Customer';

dotenv.config();

/**
 * Seed data for customers
 */
const customersData = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+234-801-234-5678',
    address: {
      street: '123 Marina Street',
      city: 'Lagos',
      state: 'Lagos',
      zipCode: '100001',
      country: 'Nigeria'
    }
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+234-802-345-6789',
    address: {
      street: '456 Victoria Island',
      city: 'Lagos',
      state: 'Lagos',
      zipCode: '100261',
      country: 'Nigeria'
    }
  },
  {
    name: 'Chukwu Emeka',
    email: 'chukwu.emeka@example.com',
    phone: '+234-803-456-7890',
    address: {
      street: '789 Independence Avenue',
      city: 'Abuja',
      state: 'FCT',
      zipCode: '900001',
      country: 'Nigeria'
    }
  }
];

/**
 * Seeds customer data into the database
 */
const seedCustomers = async (): Promise<void> => {
  try {
    console.log('🌱 Starting customer seeding process...');

    // Connect to database
    await connectDatabase();

    // Clear existing customers
    await Customer.deleteMany({});
    console.log('🗑️  Cleared existing customers');

    // Insert seed data
    const customers = await Customer.insertMany(customersData);
    console.log(`✅ Successfully seeded ${customers.length} customers`);

    // Display seeded customers
    console.log('\n📋 Seeded Customers:');
    customers.forEach((customer, index) => {
      console.log(`\n${index + 1}. ${customer.name}`);
      console.log(`   ID: ${customer._id}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Phone: ${customer.phone}`);
    });

    // Close database connection
    await closeDatabase();
    console.log('\n✅ Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding customers:', error);
    await closeDatabase();
    process.exit(1);
  }
};

// Run seeder
seedCustomers();