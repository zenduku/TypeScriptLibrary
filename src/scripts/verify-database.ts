import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

console.log('Verifying database structure...\n');

try {
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as Array<{ name: string }>;
  
  console.log('📊 Tables found:', tables.length);
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });

  // Get schema for each table
  console.log('\n📋 Table Schemas:');
  tables.forEach(table => {
    const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(table.name) as { sql: string };
    console.log(`\n${table.name}:`);
    console.log(schema.sql);
  });

  console.log('\n✅ Database structure verified!');
  db.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Error verifying database:', error);
  db.close();
  process.exit(1);
}

