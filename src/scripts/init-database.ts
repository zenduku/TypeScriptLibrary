import { initializeDatabase } from '../database/database';

console.log('Initializing database...');

try {
  initializeDatabase();
  console.log('✅ Database initialized successfully!');
  console.log('Tables created: users, authors, books');
  process.exit(0);
} catch (error) {
  console.error('❌ Error initializing database:', error);
  process.exit(1);
}

