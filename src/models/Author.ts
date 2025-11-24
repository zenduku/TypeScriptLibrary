import db from '../database/database';
import { Author, AuthorWithBooks } from '../types';

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
      let books: any[] = [];
      if (row.books) {
        const parsedBooks = JSON.parse(row.books);
        // Filter out null objects that SQLite creates when there are no books
        books = Array.isArray(parsedBooks) 
          ? parsedBooks.filter((book: any) => book && book.id !== null)
          : [];
      }
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
    
    let books: any[] = [];
    if (result.books) {
      const parsedBooks = JSON.parse(result.books);
      // Filter out null objects that SQLite creates when there are no books
      books = Array.isArray(parsedBooks) 
        ? parsedBooks.filter((book: any) => book && book.id !== null)
        : [];
    }
    
    return {
      ...result,
      books_count: books.length, // Updated by Jobs, calculated dynamically as backup
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

