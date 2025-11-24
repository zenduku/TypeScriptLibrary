# TypeScript Library API - Prueba Técnica

API REST desarrollada en TypeScript con Express.js para gestión de una biblioteca (Autores y Libros) con autenticación JWT.

## 📋 Requisitos

- Node.js >= 14.0.0
- npm >= 6.0.0
- SQLite (incluido con better-sqlite3)

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

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd TypeScriptLibrary
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar el entorno

Copia el archivo `.env.example` a `.env`:

```bash
# Windows PowerShell
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

### 4. Generar clave JWT

Genera una clave secreta segura para JWT:

```bash
# Generar una clave JWT segura (32+ caracteres)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Edita el archivo `.env` y actualiza `JWT_SECRET` con la clave generada:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=tu-clave-generada-aqui
JWT_EXPIRES_IN=24h
DB_PATH=./database.sqlite
```

**⚠️ IMPORTANTE:**
- **NUNCA** compartas tu archivo `.env` o tu `JWT_SECRET` en producción
- Usa una clave diferente para desarrollo y producción
- La clave debe tener al menos 32 caracteres para ser segura

### 5. Inicializar la base de datos

Ejecuta el script de inicialización (equivalente a `php artisan migrate` en Laravel):

```bash
npm run db:init
```

Esto creará las tablas: `users`, `authors`, y `books`.

**Alternativa:** La base de datos también se inicializa automáticamente cuando ejecutas la aplicación por primera vez.

### 6. Compilar el proyecto

```bash
npm run build
```

### 7. Iniciar el servidor

**Producción:**
```bash
npm start
```

**Desarrollo (con hot reload):**
```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:3000`

## 🔧 Configuración

### Variables de entorno importantes

En el archivo `.env`:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=tu_clave_secreta_generada
JWT_EXPIRES_IN=24h
DB_PATH=./database.sqlite
```

## 📚 Estructura del Proyecto

```
TypeScriptLibrary/
├── src/
│   ├── config/              # Configuración (env.ts)
│   ├── controllers/         # Controladores de la API
│   ├── database/            # Configuración de base de datos
│   ├── jobs/                # Jobs (UpdateAuthorBookCountJob, VerifyAndFixAuthorBookCountJob)
│   ├── listeners/           # Listeners (UpdateAuthorBookCount)
│   ├── middleware/          # Middleware (auth.ts)
│   ├── models/              # Modelos (User, Author, Book)
│   ├── routes/              # Rutas de la API
│   ├── scripts/             # Scripts (init-database.ts, verify-database.ts)
│   ├── types/               # Interfaces TypeScript
│   ├── utils/               # Utilidades (jwt.ts)
│   └── index.ts             # Archivo principal
├── database.sqlite          # Base de datos SQLite
├── POSTMAN_DOCUMENTATION.md # Documentación completa para Postman
└── README.md                # Este archivo
```

## 🔐 Autenticación JWT

La API utiliza autenticación JWT. Todas las rutas (excepto login y register) requieren un token válido.

### Obtener token (Login)

```http
POST /api/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password"
}
```

**Respuesta:**

```json
{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer",
    "user": {
        "id": 1,
        "name": "User Name",
        "email": "user@example.com"
    }
}
```

### Usar el token

Incluye el token en el header `Authorization`:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

## 📡 Endpoints de la API

### Autenticación (Públicas)

- `POST /api/login` - Iniciar sesión
- `POST /api/register` - Registrar nuevo usuario

### Autenticación (Protegidas)

- `POST /api/logout` - Cerrar sesión
- `GET /api/me` - Obtener usuario autenticado
- `POST /api/refresh` - Refrescar token

### Usuarios (CRUD) - Protegidas

- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `GET /api/users/{id}` - Obtener usuario
- `PUT /api/users/{id}` - Actualizar usuario
- `DELETE /api/users/{id}` - Eliminar usuario

### Autores (CRUD) - Protegidas

- `GET /api/authors` - Listar autores
- `POST /api/authors` - Crear autor
- `GET /api/authors/{id}` - Obtener autor
- `PUT /api/authors/{id}` - Actualizar autor
- `DELETE /api/authors/{id}` - Eliminar autor

**Ejemplo crear autor:**

```json
{
    "name": "Gabriel García Márquez"
}
```

### Libros (CRUD) - Protegidas

- `GET /api/books` - Listar libros
- `POST /api/books` - Crear libro
- `GET /api/books/{id}` - Obtener libro
- `PUT /api/books/{id}` - Actualizar libro
- `DELETE /api/books/{id}` - Eliminar libro

**Ejemplo crear libro:**

```json
{
    "title": "Cien años de soledad",
    "publication_date": 1967,
    "author_id": 1
}
```

**Nota sobre `publication_date`:**

El campo `publication_date` es **requerido** y debe ser un año (número entero, por ejemplo: `1967`). El año mínimo es 1000 y el máximo es el año actual.

**¿Por qué usar Integer en lugar de Date?**

Se utiliza `integer` (año) en lugar de `date` (fecha completa) porque:

1. **Práctica común**: Para la mayoría de los libros solo se conoce el año de publicación, no el día y mes exactos.
2. **Simplicidad**: Los usuarios solo ingresan un número (ej: `1967`) en lugar de una fecha completa.
3. **Flexibilidad**: Permite registrar libros antiguos donde solo se conoce el año aproximado.
4. **Validación simple**: Es más fácil validar un rango de años que fechas completas.
5. **Menor complejidad**: Evita problemas de formato de fecha y conversiones innecesarias.

**Nota:** El campo `books_count` del autor se actualiza automáticamente mediante Jobs cuando se crea/actualiza/elimina un libro (cumpliendo el requisito de la prueba técnica). También se calcula dinámicamente como respaldo para garantizar que siempre refleje el número real de libros asociados. Un Job de verificación corrige automáticamente cualquier desincronización.

**Importante:** El sistema filtra correctamente los objetos `null` que SQLite puede crear en el array de libros cuando no hay libros asociados, asegurando que el `books_count` siempre refleje solo libros reales (con `id` no null) y que el array `books` esté vacío `[]` en lugar de contener objetos null.

### Exportación - Protegida

- `GET /api/export/xlsx` - Exportar autores y libros a Excel

## 🎯 Funcionalidades Implementadas

✅ Autenticación JWT completa (login, register, logout, refresh, me)
✅ CRUD completo de Usuarios
✅ CRUD completo de Autores
✅ CRUD completo de Libros
✅ Actualización automática de `books_count` mediante eventos/listeners/jobs
✅ Exportación a XLSX
✅ Validaciones mediante express-validator en todos los endpoints
✅ Manejo de excepciones JWT
✅ Códigos HTTP apropiados (200, 201, 400, 401, 404, 422, 500)
✅ Relaciones entre modelos
✅ Tests automatizados (Jest configurado)

## 📊 Base de Datos

### Estructura de Tablas

#### `users`

- `id` (PK)
- `name`
- `email` (unique)
- `password` (hashed)
- `created_at`
- `updated_at`

#### `authors`

- `id` (PK)
- `name`
- `books_count` (default: 0) - Se actualiza automáticamente mediante Jobs cuando se crea/actualiza/elimina un libro. También se calcula dinámicamente como respaldo.
- `created_at`
- `updated_at`

#### `books`

- `id` (PK)
- `title`
- `publication_date` (integer, required) - Year only (e.g., 1967)
- `author_id` (FK -> authors.id)
- `created_at`
- `updated_at`

## 🔄 Eventos y Listeners

El sistema utiliza eventos de Node.js (EventEmitter) para actualizar automáticamente el contador de libros:

- **book:created**: Se dispara al crear un libro → Incrementa `books_count`
- **book:updated**: Se dispara al actualizar un libro → Ajusta contadores si cambia el autor
- **book:deleted**: Se dispara al eliminar un libro → Decrementa `books_count`

**Jobs implementados:**
- `UpdateAuthorBookCountJob` - Actualiza el contador (increment/decrement/recalculate)
- `VerifyAndFixAuthorBookCountJob` - Verifica y corrige cualquier desincronización

Este enfoque híbrido garantiza:
- ✅ Jobs actualizan el contador (cumpliendo el requisito literal)
- ✅ Verificación automática previene desincronizaciones
- ✅ Cálculo dinámico como respaldo garantiza precisión

## 🧪 Probar la API

### 1. Iniciar el servidor de desarrollo

```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:3000`

### 2. Usar Postman

Para una guía completa y detallada sobre cómo probar la API con Postman, consulta el archivo **[POSTMAN_DOCUMENTATION.md](POSTMAN_DOCUMENTATION.md)** que incluye:

- Configuración paso a paso de Postman
- Variables de entorno
- Ejemplos de todos los endpoints
- Scripts para guardar tokens automáticamente
- Checklist de pruebas
- Manejo de errores

### 3. Ejecutar Tests

```bash
npm test
```

O para ejecutar tests en modo watch:

```bash
npm run test:watch
```

## 🛠️ Comandos Útiles

```bash
# Inicializar base de datos
npm run db:init

# Verificar estructura de base de datos
npm run db:verify

# Compilar TypeScript
npm run build

# Iniciar servidor (producción)
npm start

# Iniciar servidor (desarrollo con hot reload)
npm run dev

# Ejecutar tests
npm test

# Ejecutar tests en modo watch
npm run test:watch
```

## 📝 Notas

- **Todos los nombres de código están en inglés** (variables, funciones, clases, métodos, campos de BD, comentarios, respuestas API, nombres de archivos)
- La base de datos SQLite se encuentra en `database.sqlite` (raíz del proyecto)
- El archivo `.env` no debe subirse a Git (está en .gitignore)
- Para producción, cambiar `NODE_ENV=production`
- Se utilizan **express-validator** para validaciones en todos los endpoints
- El manejo de excepciones JWT está implementado en todos los métodos de autenticación

## 🐛 Solución de Problemas

### Error: "Cannot find module 'better-sqlite3'"

- Asegúrate de haber ejecutado `npm install`
- Si el error persiste, intenta: `npm install better-sqlite3 --save`

### Error: "JWT secret not set"

- Verifica que el archivo `.env` existe y contiene `JWT_SECRET`
- Genera una nueva clave: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Actualiza el archivo `.env` con la clave generada

### Error: "Database file not found"

- Ejecuta `npm run db:init` para crear la base de datos y las tablas
- O simplemente inicia el servidor, la base de datos se creará automáticamente

### Error al compilar TypeScript

- Verifica que todas las dependencias estén instaladas: `npm install`
- Revisa los errores de TypeScript: `npm run build`
- Asegúrate de tener TypeScript instalado globalmente o localmente

## 📖 Documentación Adicional

- **[POSTMAN_DOCUMENTATION.md](POSTMAN_DOCUMENTATION.md)**: Guía completa para probar la API con Postman
- **[INSTRUCCIONES_TYPESCRIPT.md](INSTRUCCIONES_TYPESCRIPT.md)**: Instrucciones detalladas de implementación

## 🔒 Security

- Passwords are hashed using bcryptjs
- JWT tokens for authentication
- Input validation on all endpoints
- SQL injection protection with parameterized queries

## 📄 Licencia

Este proyecto fue desarrollado como parte de una prueba técnica.

## 👤 Autor

Desarrollado para la prueba técnica de Intelli-Next.

---

**Fecha de creación:** Noviembre 2025
**Versión Node.js:** >= 14.0.0
**Última actualización:** Noviembre 2025

