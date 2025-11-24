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
 * Nota: publication_date es number en lugar de string (date) porque:
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

