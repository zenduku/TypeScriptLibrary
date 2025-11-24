import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../database.sqlite');
const db: Database.Database = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Función para inicializar la base de datos
export function initializeDatabase(): void {
  // Crear tabla users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crear tabla authors
  db.exec(`
    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      books_count INTEGER DEFAULT 0, -- Updated by Jobs, also calculated dynamically as backup
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crear tabla books
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      publication_date INTEGER NOT NULL, -- Year only (e.g., 1967), required
      author_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE RESTRICT
    )
  `);

  /**
   * Nota sobre publication_date (INTEGER vs DATE):
   * 
   * El campo publication_date se define como INTEGER en lugar de DATE por las siguientes razones:
   * 
   * 1. Práctica común en bibliotecas: Para la mayoría de los libros, solo se conoce el año 
   *    de publicación, no el día y mes exactos. Muchas bibliografías solo registran el año.
   * 
   * 2. Simplicidad de uso: Los usuarios solo necesitan ingresar un número (ej: 1967) en lugar 
   *    de una fecha completa (ej: 1967-05-30), lo que simplifica la entrada de datos.
   * 
   * 3. Flexibilidad: Permite registrar libros antiguos donde solo se conoce el año aproximado, 
   *    sin necesidad de inventar un día y mes específicos.
   * 
   * 4. Validación más simple: Es más fácil validar que un año esté en un rango razonable 
   *    (1000 - año actual) que validar fechas completas.
   * 
   * 5. Menor complejidad: Evita problemas de formato de fecha, zonas horarias y conversiones 
   *    innecesarias cuando solo se necesita el año.
   * 
   * Si en el futuro se requiere almacenar fechas completas, se puede modificar el esquema.
   */

  // Crear índices
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id)
  `);
}

export default db;

