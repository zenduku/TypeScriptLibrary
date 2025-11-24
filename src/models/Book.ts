import db from '../database/database';
import { Book, BookWithAuthor } from '../types';
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

