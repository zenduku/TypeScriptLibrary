# Instrucciones para Configurar el Proyecto TypeScript - TypeScriptLibrary

## ⚠️ IMPORTANTE: Convenciones de Código

**TODO EL CÓDIGO DEBE ESTAR EN INGLÉS:**
- ✅ Nombres de variables, funciones, clases, métodos: **English**
- ✅ Nombres de campos en base de datos: **English**
- ✅ Comentarios en código: **English**
- ✅ Mensajes de respuesta API: **English**
- ✅ Nombres de archivos: **English**

**La configuración de idiomas (i18n) se manejará a nivel de interfaz/pantallas:**
- El sistema soportará **English** y **Español** para la interfaz de usuario
- Pero el código fuente siempre será en inglés

---

## 📋 Índice

1. [Configuración Inicial](#1-configuración-inicial)
2. [Configuración de Base de Datos SQLite](#2-configuración-de-base-de-datos-sqlite)
3. [Estructura de Entidades/Modelos](#3-estructura-de-entidadesmodelos)
4. [Configuración de JWT](#4-configuración-de-jwt)
5. [Creación de Controladores](#5-creación-de-controladores)
6. [Configuración de Rutas API](#6-configuración-de-rutas-api)
7. [Implementación de Eventos y Listeners](#7-implementación-de-eventos-y-listeners)
8. [Exportación a XLSX](#8-exportación-a-xlsx)
9. [Middleware de Autenticación](#9-middleware-de-autenticación)
10. [Validaciones](#10-validaciones)
11. [Testing](#11-testing)
12. [Ejecutar el Proyecto](#12-ejecutar-el-proyecto)

---

## 1. Configuración Inicial

### Paso 1.1: Crear el proyecto

```bash
mkdir TypeScriptLibrary
cd TypeScriptLibrary
npm init -y
```

### Paso 1.2: Instalar TypeScript y dependencias básicas

```bash
# TypeScript y herramientas de desarrollo
npm install --save-dev typescript @types/node ts-node nodemon

# Framework web (Express)
npm install express
npm install --save-dev @types/express

# Variables de entorno
npm install dotenv

# Base de datos SQLite
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3

# JWT
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken

# Bcrypt para hash de passwords
npm install bcryptjs
npm install --save-dev @types/bcryptjs

# Validación
npm install express-validator

# CORS
npm install cors
npm install --save-dev @types/cors

# Exportación a Excel
npm install xlsx

# UUID para IDs (opcional)
npm install uuid
npm install --save-dev @types/uuid
```

### Paso 1.3: Configurar TypeScript

Crear archivo `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Paso 1.4: Configurar scripts en `package.json`

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon --exec ts-node src/index.ts",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### Paso 1.5: Crear estructura de carpetas

```bash
mkdir -p src/{controllers,models,routes,middleware,services,utils,types,events,listeners}
mkdir -p src/database
mkdir -p tests
```

Estructura final:
```
TypeScriptLibrary/
├── src/
│   ├── controllers/      # Controladores de la API
│   ├── models/           # Modelos/Entidades
│   ├── routes/           # Definición de rutas
│   ├── middleware/       # Middlewares (auth, validators)
│   ├── services/         # Lógica de negocio
│   ├── utils/            # Utilidades
│   ├── types/            # Tipos TypeScript
│   ├── events/           # Eventos
│   ├── listeners/        # Listeners
│   ├── database/         # Configuración de BD y migraciones
│   └── index.ts          # Punto de entrada
├── tests/                # Tests
├── dist/                 # Código compilado (generado)
├── node_modules/         # Dependencias
├── tsconfig.json         # Configuración TypeScript
├── package.json          # Dependencias y scripts
└── .env                  # Variables de entorno
```

---

## 2. Configuración de Base de Datos SQLite

### Paso 2.1: Crear archivo de configuración de base de datos

Crear `src/database/database.ts`:

```typescript
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

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
```

### Paso 2.2: Crear archivo `.env`

Crear archivo `.env` en la raíz del proyecto:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
DB_PATH=./database.sqlite
```

### Paso 2.3: Crear archivo `.env.example`

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
DB_PATH=./database.sqlite
```

### Paso 2.4: Configurar variables de entorno

Crear `src/config/env.ts`:

```typescript
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  dbPath: process.env.DB_PATH || './database.sqlite',
};
```

---

## 3. Estructura de Entidades/Modelos

### Paso 3.1: Crear tipos TypeScript

Crear `src/types/index.ts`:

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface Author {
  id: number;
  name: string;
  books_count: number;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: number;
  title: string;
  publication_date: number; // Year only (e.g., 1967), required, not a full date
  author_id: number;
  created_at: string;
  updated_at: string;
}

/**
 * Nota: publication_date es number | null en lugar de string (date) porque:
 * - Para libros generalmente solo se conoce el año de publicación
 * - Simplifica la entrada de datos (solo un número)
 * - Permite registrar libros antiguos con año aproximado
 * - Validación más simple (rango de años vs fechas completas)
 */

export interface AuthorWithBooks extends Author {
  books?: Book[];
}

export interface BookWithAuthor extends Book {
  author?: Author;
}
```

### Paso 3.2: Crear modelo User

Crear `src/models/User.ts`:

```typescript
import db from '../database/database';
import bcrypt from 'bcryptjs';
import { User } from '../types';

export class UserModel {
  static findAll(): User[] {
    const stmt = db.prepare('SELECT id, name, email, created_at, updated_at FROM users');
    return stmt.all() as User[];
  }

  static findById(id: number): User | undefined {
    const stmt = db.prepare('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  static findByEmail(email: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | undefined;
  }

  static create(userData: { name: string; email: string; password: string }): User {
    const hashedPassword = bcrypt.hashSync(userData.password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(userData.name, userData.email, hashedPassword);
    
    const user = this.findById(result.lastInsertRowid as number);
    if (!user) {
      throw new Error('Failed to create user');
    }
    
    return user;
  }

  static update(id: number, userData: Partial<{ name: string; email: string; password: string }>): User | undefined {
    const updates: string[] = [];
    const values: any[] = [];

    if (userData.name !== undefined) {
      updates.push('name = ?');
      values.push(userData.name);
    }
    if (userData.email !== undefined) {
      updates.push('email = ?');
      values.push(userData.email);
    }
    if (userData.password !== undefined) {
      updates.push('password = ?');
      values.push(bcrypt.hashSync(userData.password, 10));
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }

  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static verifyPassword(user: User, password: string): boolean {
    const stmt = db.prepare('SELECT password FROM users WHERE id = ?');
    const result = stmt.get(user.id) as { password: string };
    return bcrypt.compareSync(password, result.password);
  }
}
```

### Paso 3.3: Crear modelo Author

Crear `src/models/Author.ts`:

```typescript
import db from '../database/database';
import { Author, AuthorWithBooks, Book } from '../types';

export class AuthorModel {
  /**
   * Calculate books_count dynamically from the books relationship (used as backup)
   * This ensures the count is always accurate even if Jobs fail or data is manually deleted
   * Made public so it can be used by VerifyAndFixAuthorBookCountJob
   */
  static calculateBooksCount(authorId: number): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM books WHERE author_id = ?');
    const result = stmt.get(authorId) as { count: number };
    return result.count;
  }

  static findAll(): AuthorWithBooks[] {
    const stmt = db.prepare(`
      SELECT a.*, 
             json_group_array(
               json_object(
                 'id', b.id,
                 'title', b.title,
                 'publication_date', b.publication_date,
                 'author_id', b.author_id,
                 'created_at', b.created_at,
                 'updated_at', b.updated_at
               )
             ) as books
      FROM authors a
      LEFT JOIN books b ON a.id = b.author_id
      GROUP BY a.id
    `);
    
    const results = stmt.all() as any[];
    return results.map(row => {
      const books = row.books[0] ? JSON.parse(row.books) : [];
      return {
        ...row,
        books_count: books.length, // Updated by Jobs, calculated dynamically as backup
        books: books
      };
    }) as AuthorWithBooks[];
  }

  static findById(id: number): AuthorWithBooks | undefined {
    const stmt = db.prepare(`
      SELECT a.*, 
             json_group_array(
               json_object(
                 'id', b.id,
                 'title', b.title,
                 'publication_date', b.publication_date,
                 'author_id', b.author_id,
                 'created_at', b.created_at,
                 'updated_at', b.updated_at
               )
             ) as books
      FROM authors a
      LEFT JOIN books b ON a.id = b.author_id
      WHERE a.id = ?
      GROUP BY a.id
    `);
    
    const result = stmt.get(id) as any;
    if (!result) return undefined;
    
    const books = result.books[0] ? JSON.parse(result.books) : [];
    return {
      ...result,
      books_count: books.length, // Calculate dynamically
      books: books
    } as AuthorWithBooks;
  }

  static create(authorData: { name: string }): Author {
    const stmt = db.prepare(`
      INSERT INTO authors (name, books_count)
      VALUES (?, 0)
    `);
    
    const result = stmt.run(authorData.name);
    const author = this.findByIdSimple(result.lastInsertRowid as number);
    
    if (!author) {
      throw new Error('Failed to create author');
    }
    
    return author;
  }

  static findByIdSimple(id: number): Author | undefined {
    const stmt = db.prepare('SELECT * FROM authors WHERE id = ?');
    const author = stmt.get(id) as Author | undefined;
    
    if (!author) return undefined;
    
    // Updated by Jobs, calculated dynamically as backup
    return {
      ...author,
      books_count: this.calculateBooksCount(id)
    };
  }

  static update(id: number, authorData: { name: string }): Author | undefined {
    const stmt = db.prepare(`
      UPDATE authors 
      SET name = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    stmt.run(authorData.name, id);
    return this.findByIdSimple(id);
  }

  static delete(id: number): boolean {
    // Verificar si tiene libros asociados
    const booksStmt = db.prepare('SELECT COUNT(*) as count FROM books WHERE author_id = ?');
    const booksResult = booksStmt.get(id) as { count: number };
    
    if (booksResult.count > 0) {
      throw new Error('Cannot delete author with associated books');
    }
    
    const stmt = db.prepare('DELETE FROM authors WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Increment books_count (used by Jobs)
   */
  static incrementBooksCount(authorId: number): void {
    const stmt = db.prepare('UPDATE authors SET books_count = books_count + 1 WHERE id = ?');
    stmt.run(authorId);
  }

  /**
   * Decrement books_count (used by Jobs)
   */
  static decrementBooksCount(authorId: number): void {
    const stmt = db.prepare('UPDATE authors SET books_count = books_count - 1 WHERE id = ?');
    stmt.run(authorId);
  }

  /**
   * Recalculate books_count based on actual count (used by verification Job)
   */
  static recalculateBooksCount(authorId: number): void {
    const actualCount = this.calculateBooksCount(authorId);
    const stmt = db.prepare('UPDATE authors SET books_count = ? WHERE id = ?');
    stmt.run(actualCount, authorId);
  }
}
```

**Nota importante sobre `books_count`:**

El sistema implementa un enfoque híbrido:

1. **Jobs actualizan el contador** (cumpliendo el requisito):
   - Cuando se crea/actualiza/elimina un libro, se dispara un Job que actualiza `books_count`
   - Los métodos `incrementBooksCount()`, `decrementBooksCount()`, y `recalculateBooksCount()` actualizan el campo en la base de datos

2. **Cálculo dinámico como respaldo**:
   - El método `calculateBooksCount()` siempre calcula el valor real desde la relación
   - Garantiza precisión incluso si hay desincronización o los Jobs fallan

3. **Job de verificación**:
   - `VerifyAndFixAuthorBookCountJob` verifica y corrige desincronizaciones automáticamente
   - Compara el valor almacenado con el real y corrige si hay diferencias

**Ventajas:**
- ✅ Cumple el requisito literal: Jobs que actualizan el contador
- ✅ Previene desincronizaciones: Job de verificación automática
- ✅ Garantiza precisión: Cálculo dinámico como respaldo
- ✅ Robusto: Funciona correctamente incluso si se borran datos manualmente

### Paso 3.4: Crear modelo Book

Crear `src/models/Book.ts`:

```typescript
import db from '../database/database';
import { Book, BookWithAuthor, Author } from '../types';
import { EventEmitter } from 'events';

// Event emitter para manejar eventos de libros
export const bookEvents = new EventEmitter();

export class BookModel {
  static findAll(): BookWithAuthor[] {
    const stmt = db.prepare(`
      SELECT b.*, 
             json_object(
               'id', a.id,
               'name', a.name,
               'books_count', (SELECT COUNT(*) FROM books WHERE author_id = a.id),
               'created_at', a.created_at,
               'updated_at', a.updated_at
             ) as author
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
    `);
    
    const results = stmt.all() as any[];
    return results.map(row => ({
      ...row,
      author: JSON.parse(row.author)
    })) as BookWithAuthor[];
  }

  static findById(id: number): BookWithAuthor | undefined {
    const stmt = db.prepare(`
      SELECT b.*, 
             json_object(
               'id', a.id,
               'name', a.name,
               'books_count', (SELECT COUNT(*) FROM books WHERE author_id = a.id),
               'created_at', a.created_at,
               'updated_at', a.updated_at
             ) as author
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.id = ?
    `);
    
    const result = stmt.get(id) as any;
    if (!result) return undefined;
    
    return {
      ...result,
      author: JSON.parse(result.author)
    } as BookWithAuthor;
  }

  static create(bookData: { title: string; publication_date: number; author_id: number }): Book {
    const stmt = db.prepare(`
      INSERT INTO books (title, publication_date, author_id)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      bookData.title,
      bookData.publication_date, // Required field
      bookData.author_id
    );
    
    const book = this.findByIdSimple(result.lastInsertRowid as number);
    
    if (!book) {
      throw new Error('Failed to create book');
    }
    
    // Emit event for Job to update books_count
    bookEvents.emit('book:created', book);
    
    return book;
  }

  static findByIdSimple(id: number): Book | undefined {
    const stmt = db.prepare('SELECT * FROM books WHERE id = ?');
    return stmt.get(id) as Book | undefined;
  }

  static update(id: number, bookData: Partial<{ title: string; publication_date: number; author_id: number }>): Book | undefined {
    const oldBook = this.findByIdSimple(id);
    if (!oldBook) return undefined;

    const updates: string[] = [];
    const values: any[] = [];

    if (bookData.title !== undefined) {
      updates.push('title = ?');
      values.push(bookData.title);
    }
    if (bookData.publication_date !== undefined) {
      updates.push('publication_date = ?');
      values.push(bookData.publication_date);
    }
    if (bookData.author_id !== undefined) {
      updates.push('author_id = ?');
      values.push(bookData.author_id);
    }

    if (updates.length === 0) {
      return oldBook;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE books SET ${updates.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
    
    const updatedBook = this.findByIdSimple(id);
    
    // Emit event if author changed (for Job to update books_count)
    if (updatedBook && bookData.author_id !== undefined && oldBook.author_id !== bookData.author_id) {
      bookEvents.emit('book:updated', updatedBook, oldBook.author_id);
    }
    
    return updatedBook;
  }

  static delete(id: number): boolean {
    const book = this.findByIdSimple(id);
    if (!book) return false;

    const stmt = db.prepare('DELETE FROM books WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes > 0) {
      // Emit event for Job to update books_count
      bookEvents.emit('book:deleted', book);
      return true;
    }
    
    return false;
  }
}
```

---

## 4. Configuración de JWT

### Paso 4.1: Crear utilidad JWT

Crear `src/utils/jwt.ts`:

```typescript
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../types';

export interface JWTPayload {
  id: number;
  email: string;
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    id: user.id,
    email: user.email,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### Paso 4.2: Crear middleware de autenticación

Crear `src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserModel } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Unauthenticated.' });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
}
```

---

## 5. Creación de Controladores

### Paso 5.1: Crear AuthController

Crear `src/controllers/AuthController.ts`:

```typescript
import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { generateToken } from '../utils/jwt';
import { body, validationResult } from 'express-validator';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        error: 'Validation failed',
        messages: errors.array(),
      });
      return;
    }

    const { email, password } = req.body;

    const user = UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValidPassword = UserModel.verifyPassword(user, password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    try {
      const token = generateToken(user);
      res.status(200).json({
        token,
        token_type: 'bearer',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Could not create token' });
    }
  }

  static async register(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        error: 'Validation failed',
        messages: errors.array(),
      });
      return;
    }

    const { name, email, password } = req.body;

    // Verificar si el email ya existe
    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
      res.status(422).json({
        error: 'Validation failed',
        messages: { email: ['The email has already been taken.'] },
      });
      return;
    }

    try {
      const user = UserModel.create({ name, email, password });
      const token = generateToken(user);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        token_type: 'bearer',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Could not create user' });
    }
  }

  static async me(req: any, res: Response): Promise<void> {
    const user = UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  }

  static async logout(req: Request, res: Response): Promise<void> {
    // En JWT stateless, el logout se maneja en el cliente
    // Aquí solo confirmamos que el token fue válido
    res.status(200).json({ message: 'Successfully logged out' });
  }

  static async refresh(req: any, res: Response): Promise<void> {
    const user = UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    try {
      const token = generateToken(user);
      res.status(200).json({
        token,
        token_type: 'bearer',
      });
    } catch (error) {
      res.status(500).json({ error: 'Could not refresh token' });
    }
  }
}
```

### Paso 5.2: Crear UserController

Crear `src/controllers/UserController.ts`:

```typescript
import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { body, validationResult } from 'express-validator';

export class UserController {
  static index(req: Request, res: Response): void {
    const users = UserModel.findAll();
    res.status(200).json(users);
  }

  static async store(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        error: 'Validation failed',
        messages: errors.array(),
      });
      return;
    }

    const { name, email, password } = req.body;

    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
      res.status(422).json({
        error: 'Validation failed',
        messages: { email: ['The email has already been taken.'] },
      });
      return;
    }

    try {
      const user = UserModel.create({ name, email, password });
      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Could not create user' });
    }
  }

  static show(req: Request, res: Response): void {
    const id = parseInt(req.params.id);
    const user = UserModel.findById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json(user);
  }

  static async update(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        error: 'Validation failed',
        messages: errors.array(),
      });
      return;
    }

    const id = parseInt(req.params.id);
    const user = UserModel.findById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { name, email, password } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.password = password;

    try {
      const updatedUser = UserModel.update(id, updateData);
      if (!updatedUser) {
        res.status(500).json({ error: 'Could not update user' });
        return;
      }

      res.status(200).json({
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Could not update user' });
    }
  }

  static destroy(req: Request, res: Response): void {
    const id = parseInt(req.params.id);
    const user = UserModel.findById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const deleted = UserModel.delete(id);
    if (deleted) {
      res.status(200).json({ message: 'User deleted successfully' });
    } else {
      res.status(500).json({ error: 'Could not delete user' });
    }
  }
}
```

### Paso 5.3: Crear AuthorController

Crear `src/controllers/AuthorController.ts`:

```typescript
import { Request, Response } from 'express';
import { AuthorModel } from '../models/Author';
import { body, validationResult } from 'express-validator';

export class AuthorController {
  static index(req: Request, res: Response): void {
    const authors = AuthorModel.findAll();
    res.status(200).json(authors);
  }

  static async store(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        error: 'Validation failed',
        messages: errors.array(),
      });
      return;
    }

    const { name } = req.body;

    try {
      const author = AuthorModel.create({ name });
      // Note: books_count is set to 0 on creation, updated by Jobs when books are created/deleted
      res.status(201).json({
        message: 'Author created successfully',
        author,
      });
    } catch (error) {
      res.status(500).json({ error: 'Could not create author' });
    }
  }

  static show(req: Request, res: Response): void {
    const id = parseInt(req.params.id);
    const author = AuthorModel.findById(id);

    if (!author) {
      res.status(404).json({ error: 'Author not found' });
      return;
    }

    res.status(200).json(author);
  }

  static async update(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        error: 'Validation failed',
        messages: errors.array(),
      });
      return;
    }

    const id = parseInt(req.params.id);
    const author = AuthorModel.findByIdSimple(id);

    if (!author) {
      res.status(404).json({ error: 'Author not found' });
      return;
    }

    const { name } = req.body;

    try {
      const updatedAuthor = AuthorModel.update(id, { name });
      if (!updatedAuthor) {
        res.status(500).json({ error: 'Could not update author' });
        return;
      }

      res.status(200).json({
        message: 'Author updated successfully',
        author: updatedAuthor,
      });
    } catch (error) {
      res.status(500).json({ error: 'Could not update author' });
    }
  }

  static destroy(req: Request, res: Response): void {
    const id = parseInt(req.params.id);
    const author = AuthorModel.findByIdSimple(id);

    if (!author) {
      res.status(404).json({ error: 'Author not found' });
      return;
    }

    try {
      const deleted = AuthorModel.delete(id);
      if (deleted) {
        res.status(200).json({ message: 'Author deleted successfully' });
      } else {
        res.status(500).json({ error: 'Could not delete author' });
      }
    } catch (error: any) {
      if (error.message === 'Cannot delete author with associated books') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Could not delete author' });
      }
    }
  }
}
```

### Paso 5.4: Crear BookController

Crear `src/controllers/BookController.ts`:

```typescript
import { Request, Response } from 'express';
import { BookModel } from '../models/Book';
import { body, validationResult } from 'express-validator';

export class BookController {
  static index(req: Request, res: Response): void {
    const books = BookModel.findAll();
    res.status(200).json(books);
  }

  static async store(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        error: 'Validation failed',
        messages: errors.array(),
      });
      return;
    }

    const { title, publication_date, author_id } = req.body;

    try {
      const book = BookModel.create({
        title,
        publication_date, // Required field
        author_id,
      });

      // Note: books_count is updated automatically by Jobs when book is created
      // The event 'book:created' is emitted and handled by UpdateAuthorBookCount listener

      // Cargar el autor para la respuesta
      const bookWithAuthor = BookModel.findById(book.id);
      res.status(201).json({
        message: 'Book created successfully',
        book: bookWithAuthor,
      });
    } catch (error) {
      res.status(500).json({ error: 'Could not create book' });
    }
  }

  static show(req: Request, res: Response): void {
    const id = parseInt(req.params.id);
    const book = BookModel.findById(id);

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    res.status(200).json(book);
  }

  static async update(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        error: 'Validation failed',
        messages: errors.array(),
      });
      return;
    }

    const id = parseInt(req.params.id);
    const book = BookModel.findByIdSimple(id);

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    const { title, publication_date, author_id } = req.body;
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (publication_date !== undefined) updateData.publication_date = publication_date;
    if (author_id !== undefined) updateData.author_id = author_id;

    try {
      const updatedBook = BookModel.update(id, updateData);
      if (!updatedBook) {
        res.status(500).json({ error: 'Could not update book' });
        return;
      }

      const bookWithAuthor = BookModel.findById(updatedBook.id);
      // Note: books_count is updated automatically by Jobs when author changes
      // The event 'book:updated' is emitted and handled by UpdateAuthorBookCount listener
      res.status(200).json({
        message: 'Book updated successfully',
        book: bookWithAuthor,
      });
    } catch (error) {
      res.status(500).json({ error: 'Could not update book' });
    }
  }

  static destroy(req: Request, res: Response): void {
    const id = parseInt(req.params.id);
    const book = BookModel.findByIdSimple(id);

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    const deleted = BookModel.delete(id);
    if (deleted) {
      // Note: books_count is updated automatically by Jobs when book is deleted
      // The event 'book:deleted' is emitted and handled by UpdateAuthorBookCount listener
      res.status(200).json({ message: 'Book deleted successfully' });
    } else {
      res.status(500).json({ error: 'Could not delete book' });
    }
  }
}
```

### Paso 5.5: Crear ExportController

Crear `src/controllers/ExportController.ts`:

```typescript
import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { AuthorModel } from '../models/Author';
import { BookModel } from '../models/Book';

export class ExportController {
  static exportToXlsx(req: Request, res: Response): void {
    try {
      const authors = AuthorModel.findAll();
      const books = BookModel.findAll();

      // Crear workbook
      const workbook = XLSX.utils.book_new();

      // Hoja de Autores
      const authorsData = authors.map(author => ({
        ID: author.id,
        Name: author.name,
        'Books Count': author.books_count,
        'Created At': author.created_at,
        'Updated At': author.updated_at,
      }));

      const authorsSheet = XLSX.utils.json_to_sheet(authorsData);
      XLSX.utils.book_append_sheet(workbook, authorsSheet, 'Authors');

      // Hoja de Libros
      const booksData = books.map(book => ({
        ID: book.id,
        Title: book.title,
        'Publication Year': book.publication_date || 'N/A',
        'Author ID': book.author_id,
        'Author Name': book.author ? book.author.name : 'N/A',
        'Created At': book.created_at,
        'Updated At': book.updated_at,
      }));

      const booksSheet = XLSX.utils.json_to_sheet(booksData);
      XLSX.utils.book_append_sheet(workbook, booksSheet, 'Books');

      // Generar buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Configurar headers
      const fileName = `library_export_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // Enviar archivo
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: 'Could not export data' });
    }
  }
}
```

---

## 6. Configuración de Rutas API

### Paso 6.1: Crear rutas de autenticación

Crear `src/routes/authRoutes.ts`:

```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

// Public routes
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('The email must be a valid email address.'),
    body('password').isLength({ min: 6 }).withMessage('The password must be at least 6 characters.'),
  ],
  AuthController.login
);

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('The name is required.'),
    body('email').isEmail().withMessage('The email must be a valid email address.'),
    body('password').isLength({ min: 6 }).withMessage('The password must be at least 6 characters.'),
    body('password_confirmation').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password.');
      }
      return true;
    }),
  ],
  AuthController.register
);

// Protected routes
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/me', authenticateToken, AuthController.me);
router.post('/refresh', authenticateToken, AuthController.refresh);

export default router;
```

### Paso 6.2: Crear rutas de usuarios

Crear `src/routes/userRoutes.ts`:

```typescript
import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

router.use(authenticateToken); // Todas las rutas requieren autenticación

router.get('/', UserController.index);
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('The name is required.'),
    body('email').isEmail().withMessage('The email must be a valid email address.'),
    body('password').isLength({ min: 6 }).withMessage('The password must be at least 6 characters.'),
  ],
  UserController.store
);
router.get('/:id', UserController.show);
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('The name cannot be empty.'),
    body('email').optional().isEmail().withMessage('The email must be a valid email address.'),
    body('password').optional().isLength({ min: 6 }).withMessage('The password must be at least 6 characters.'),
  ],
  UserController.update
);
router.delete('/:id', UserController.destroy);

export default router;
```

### Paso 6.3: Crear rutas de autores

Crear `src/routes/authorRoutes.ts`:

```typescript
import { Router } from 'express';
import { AuthorController } from '../controllers/AuthorController';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

router.use(authenticateToken); // Todas las rutas requieren autenticación

router.get('/', AuthorController.index);
router.post(
  '/',
  [body('name').notEmpty().withMessage('The author name is required.')],
  AuthorController.store
);
router.get('/:id', AuthorController.show);
router.put(
  '/:id',
  [body('name').optional().notEmpty().withMessage('The author name cannot be empty.')],
  AuthorController.update
);
router.delete('/:id', AuthorController.destroy);

export default router;
```

### Paso 6.4: Crear rutas de libros

Crear `src/routes/bookRoutes.ts`:

```typescript
import { Router } from 'express';
import { BookController } from '../controllers/BookController';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';
import db from '../database/database';

const router = Router();

router.use(authenticateToken); // Todas las rutas requieren autenticación

router.get('/', BookController.index);
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('The book title is required.'),
    body('publication_date').isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('The publication date must be a valid year.'),
    body('author_id')
      .isInt()
      .withMessage('The author ID must be an integer.')
      .custom((value) => {
        const stmt = db.prepare('SELECT id FROM authors WHERE id = ?');
        const author = stmt.get(value);
        if (!author) {
          throw new Error('The selected author does not exist.');
        }
        return true;
      }),
  ],
  BookController.store
);
router.get('/:id', BookController.show);
router.put(
  '/:id',
  [
    body('title').optional().notEmpty().withMessage('The book title cannot be empty.'),
    body('publication_date').isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('The publication date must be a valid year.'),
    body('author_id')
      .optional()
      .isInt()
      .withMessage('The author ID must be an integer.')
      .custom((value) => {
        const stmt = db.prepare('SELECT id FROM authors WHERE id = ?');
        const author = stmt.get(value);
        if (!author) {
          throw new Error('The selected author does not exist.');
        }
        return true;
      }),
  ],
  BookController.update
);
router.delete('/:id', BookController.destroy);

export default router;
```

### Paso 6.5: Crear rutas de exportación

Crear `src/routes/exportRoutes.ts`:

```typescript
import { Router } from 'express';
import { ExportController } from '../controllers/ExportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken); // Requiere autenticación

router.get('/xlsx', ExportController.exportToXlsx);

export default router;
```

### Paso 6.6: Crear archivo principal de rutas

Crear `src/routes/index.ts`:

```typescript
import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import authorRoutes from './authorRoutes';
import bookRoutes from './bookRoutes';
import exportRoutes from './exportRoutes';

const router = Router();

// Public routes
router.use('/login', authRoutes);
router.use('/register', authRoutes);

// Protected routes (authentication handled in individual route files)
router.use('/me', authRoutes);
router.use('/logout', authRoutes);
router.use('/refresh', authRoutes);
router.use('/users', userRoutes);
router.use('/authors', authorRoutes);
router.use('/books', bookRoutes);
router.use('/export', exportRoutes);

export default router;
```

---

## 7. Implementación de Eventos y Listeners

### Paso 7.1: Crear Jobs para actualizar contador

Crear `src/jobs/UpdateAuthorBookCountJob.ts`:

```typescript
import { AuthorModel } from '../models/Author';

export class UpdateAuthorBookCountJob {
  constructor(
    private authorId: number,
    private action: 'increment' | 'decrement' | 'recalculate' = 'recalculate'
  ) {}

  execute(): void {
    switch (this.action) {
      case 'increment':
        AuthorModel.incrementBooksCount(this.authorId);
        break;
      case 'decrement':
        AuthorModel.decrementBooksCount(this.authorId);
        break;
      case 'recalculate':
      default:
        AuthorModel.recalculateBooksCount(this.authorId);
        break;
    }
  }
}
```

Crear `src/jobs/VerifyAndFixAuthorBookCountJob.ts`:

```typescript
import db from '../database/database';
import { AuthorModel } from '../models/Author';
import { Author } from '../types';

export class VerifyAndFixAuthorBookCountJob {
  constructor(private authorId?: number) {}

  execute(): void {
    if (this.authorId) {
      this.verifyAndFixAuthor(this.authorId);
    } else {
      const authors = AuthorModel.findAll();
      authors.forEach(author => {
        this.verifyAndFixAuthor(author.id);
      });
    }
  }

  private verifyAndFixAuthor(authorId: number): void {
    const author = AuthorModel.findByIdSimple(authorId);
    
    if (!author) {
      return;
    }

    // Get actual count from database
    const actualCount = AuthorModel.calculateBooksCount(authorId);
    
    // Get stored count directly from database
    const stmt = db.prepare('SELECT books_count FROM authors WHERE id = ?');
    const storedCount = (stmt.get(authorId) as { books_count: number })?.books_count ?? 0;
    
    // If counts don't match, fix it
    if (actualCount !== storedCount) {
      AuthorModel.recalculateBooksCount(authorId);
      console.log(`Fixed books_count for author ${authorId}: ${storedCount} -> ${actualCount}`);
    }
  }
}
```

### Paso 7.2: Crear listener para actualizar contador

Crear `src/listeners/UpdateAuthorBookCount.ts`:

```typescript
import { AuthorModel } from '../models/Author';
import { bookEvents } from '../models/Book';
import { Book } from '../types';
import { UpdateAuthorBookCountJob } from '../jobs/UpdateAuthorBookCountJob';
import { VerifyAndFixAuthorBookCountJob } from '../jobs/VerifyAndFixAuthorBookCountJob';

export class UpdateAuthorBookCount {
  static initialize(): void {
    // Listener para cuando se crea un libro
    bookEvents.on('book:created', (book: Book) => {
      const job = new UpdateAuthorBookCountJob(book.author_id, 'increment');
      job.execute();
      
      const verifyJob = new VerifyAndFixAuthorBookCountJob(book.author_id);
      verifyJob.execute();
    });

    // Listener para cuando se actualiza un libro (cambio de autor)
    bookEvents.on('book:updated', (book: Book, oldAuthorId: number) => {
      if (oldAuthorId !== book.author_id) {
        // Decrement old author's count
        const decrementJob = new UpdateAuthorBookCountJob(oldAuthorId, 'decrement');
        decrementJob.execute();
        
        const verifyOldJob = new VerifyAndFixAuthorBookCountJob(oldAuthorId);
        verifyOldJob.execute();
        
        // Increment new author's count
        if (book.author_id) {
          const incrementJob = new UpdateAuthorBookCountJob(book.author_id, 'increment');
          incrementJob.execute();
          
          const verifyNewJob = new VerifyAndFixAuthorBookCountJob(book.author_id);
          verifyNewJob.execute();
        }
      }
    });

    // Listener para cuando se elimina un libro
    bookEvents.on('book:deleted', (book: Book) => {
      const job = new UpdateAuthorBookCountJob(book.author_id, 'decrement');
      job.execute();
      
      const verifyJob = new VerifyAndFixAuthorBookCountJob(book.author_id);
      verifyJob.execute();
    });
  }
}
```

### Paso 7.3: Inicializar listeners en el archivo principal

Esto se hará en el paso 12 cuando creemos `src/index.ts`.

**Nota importante sobre el sistema híbrido:**

El sistema implementa un enfoque híbrido que combina lo mejor de ambos mundos:

1. **Jobs que actualizan el contador** (cumpliendo el requisito literal):
   - `UpdateAuthorBookCountJob` se ejecuta cuando se crea/actualiza/elimina un libro
   - Actualiza el campo `books_count` en la base de datos usando `incrementBooksCount()`, `decrementBooksCount()`, o `recalculateBooksCount()`

2. **Job de verificación y corrección**:
   - `VerifyAndFixAuthorBookCountJob` verifica que el contador almacenado coincida con el real
   - Corrige automáticamente cualquier desincronización
   - Se puede ejecutar manualmente o automáticamente después de cada operación

3. **Cálculo dinámico como respaldo**:
   - El método `calculateBooksCount()` siempre calcula el valor real desde la relación
   - Garantiza que `books_count` siempre sea preciso, incluso si hay desincronización

**Ventajas de este enfoque:**
- ✅ Cumple el requisito literal: Jobs que actualizan el contador
- ✅ Previene desincronizaciones: Job de verificación automática
- ✅ Garantiza precisión: Cálculo dinámico como respaldo
- ✅ Robusto: Funciona correctamente incluso si se borran datos manualmente

---

## 8. Exportación a XLSX

Ya está implementado en el `ExportController` (Paso 5.5).

---

## 9. Middleware de Autenticación

Ya está implementado en `src/middleware/auth.ts` (Paso 4.2).

---

## 10. Validaciones

Las validaciones se implementan usando `express-validator` en cada archivo de rutas. Ejemplos:

- **Login**: email válido, password mínimo 6 caracteres
- **Register**: name requerido, email válido, password mínimo 6 caracteres, password_confirmation debe coincidir
- **Authors**: name requerido
- **Books**: title requerido, publication_date requerido (debe ser un año válido, integer, mínimo 1000, máximo año actual), author_id debe existir

**Nota importante sobre `books_count`:**
- Se actualiza automáticamente mediante Jobs cuando se crea/actualiza/elimina un libro
- También se calcula dinámicamente como respaldo para garantizar precisión
- Un Job de verificación (`VerifyAndFixAuthorBookCountJob`) corrige automáticamente cualquier desincronización
- El método `calculateBooksCount()` en `AuthorModel` debe ser `public static` (no `private`) para que pueda ser usado por el Job de verificación

---

## 11. Testing

### Paso 11.1: Instalar dependencias de testing

```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

### Paso 11.2: Configurar Jest

Crear `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
};
```

### Paso 11.3: Actualizar scripts en package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Paso 11.4: Ejemplo de test

Crear `tests/auth.test.ts`:

```typescript
import request from 'supertest';
import app from '../src/index';

describe('Auth API', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
  });

  it('should login with valid credentials', async () => {
    // Primero registrar un usuario
    await request(app)
      .post('/api/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      });

    // Luego hacer login
    const response = await request(app)
      .post('/api/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

---

## 12. Ejecutar el Proyecto

### Paso 12.1: Crear archivo principal

Crear `src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/database';
import { UpdateAuthorBookCount } from './listeners/UpdateAuthorBookCount';
import routes from './routes';
import { config } from './config/env';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar base de datos
initializeDatabase();

// Inicializar listeners de eventos para actualizar books_count
UpdateAuthorBookCount.initialize();

// Rutas
app.use('/api', routes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Iniciar servidor
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
```

### Paso 12.2: Crear archivo .gitignore

Crear `.gitignore`:

```
node_modules/
dist/
*.log
.env
database.sqlite
.DS_Store
coverage/
*.swp
*.swo
.vscode/
.idea/
```

### Paso 12.3: Ejecutar el proyecto

```bash
# Modo desarrollo (con hot reload)
npm run dev

# Modo producción (compilar y ejecutar)
npm run build
npm start
```

El servidor estará disponible en: `http://localhost:3000`

---

## 📝 Notas Adicionales

1. **Códigos HTTP**: Asegurarse de usar códigos apropiados:
   - 200: OK
   - 201: Created
   - 400: Bad Request
   - 401: Unauthorized
   - 404: Not Found
   - 422: Validation Error
   - 500: Server Error

2. **Estructura de Respuestas**: Mantener consistencia en las respuestas JSON

3. **Validaciones**: Validar todos los inputs en cada endpoint usando `express-validator`

4. **Relaciones**: Asegurarse de que las relaciones entre modelos funcionen correctamente

5. **Testing**: Crear tests unitarios y de integración

6. **TypeScript**: Aprovechar los tipos de TypeScript para mayor seguridad de tipos

---

## 🚀 Comandos Útiles

```bash
# Compilar TypeScript
npm run build

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en modo producción
npm start

# Ejecutar tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ver cobertura de tests
npm run test:coverage

# Limpiar archivos compilados
rm -rf dist/
```

---

## 📚 Recursos

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Better-SQLite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [JWT.io](https://jwt.io/)
- [Express Validator](https://express-validator.github.io/docs/)
- [SheetJS (xlsx)](https://sheetjs.com/)

---

**Última actualización:** Enero 2025

