# TypeScript Library API

A RESTful API built with TypeScript, Express.js, and SQLite for managing a library system with users, authors, and books.

## 📋 Features

- 🔐 JWT Authentication
- 👥 User Management (CRUD)
- ✍️ Author Management (CRUD)
- 📚 Book Management (CRUD)
- 🔄 Event-driven `books_count` updates using Jobs
- 📊 XLSX Export functionality
- ✅ Input validation with express-validator
- 🧪 Testing support with Jest

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Export**: xlsx (SheetJS)

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd TypeScriptLibrary
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
DB_PATH=./database.sqlite
```

4. Build the project:
```bash
npm run build
```

5. Run the server:
```bash
npm start
```

For development with hot reload:
```bash
npm run dev
```

## 🚀 API Endpoints

### Public Routes
- `POST /api/register` - Register a new user
- `POST /api/login` - Login and get JWT token

### Protected Routes (Require JWT Authentication)

#### Authentication
- `GET /api/me` - Get authenticated user
- `POST /api/logout` - Logout
- `POST /api/refresh` - Refresh JWT token

#### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get a specific user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

#### Authors
- `GET /api/authors` - List all authors
- `POST /api/authors` - Create a new author
- `GET /api/authors/:id` - Get a specific author
- `PUT /api/authors/:id` - Update an author
- `DELETE /api/authors/:id` - Delete an author

#### Books
- `GET /api/books` - List all books
- `POST /api/books` - Create a new book
- `GET /api/books/:id` - Get a specific book
- `PUT /api/books/:id` - Update a book
- `DELETE /api/books/:id` - Delete a book

#### Export
- `GET /api/export/xlsx` - Export authors and books to Excel

## 📝 Database Schema

### Users
- `id` (INTEGER, PRIMARY KEY)
- `name` (TEXT, NOT NULL)
- `email` (TEXT, NOT NULL, UNIQUE)
- `password` (TEXT, NOT NULL, hashed)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Authors
- `id` (INTEGER, PRIMARY KEY)
- `name` (TEXT, NOT NULL)
- `books_count` (INTEGER, DEFAULT 0) - Updated by Jobs, also calculated dynamically as backup
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Books
- `id` (INTEGER, PRIMARY KEY)
- `title` (TEXT, NOT NULL)
- `publication_date` (INTEGER, NOT NULL) - Year only (e.g., 1967)
- `author_id` (INTEGER, NOT NULL, FOREIGN KEY)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

## 🔄 Event-Driven Architecture

The API uses an event-driven system to automatically update the `books_count` field:

- **Events**: `book:created`, `book:updated`, `book:deleted`
- **Jobs**: 
  - `UpdateAuthorBookCountJob` - Updates the counter (increment/decrement/recalculate)
  - `VerifyAndFixAuthorBookCountJob` - Verifies and fixes any desynchronizations
- **Listener**: `UpdateAuthorBookCount` - Handles events and dispatches Jobs

This hybrid approach ensures:
- ✅ Jobs update the counter (fulfilling the literal requirement)
- ✅ Automatic verification prevents desynchronizations
- ✅ Dynamic calculation as backup guarantees accuracy

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 📚 Documentation

For detailed setup and implementation instructions, see [INSTRUCCIONES_TYPESCRIPT.md](INSTRUCCIONES_TYPESCRIPT.md)

## 🔒 Security

- Passwords are hashed using bcryptjs
- JWT tokens for authentication
- Input validation on all endpoints
- SQL injection protection with parameterized queries

## 📄 License

ISC

## 👤 Author

Developed as part of a technical test.

---

**Status**: 🚧 In Development

