import { Request, Response } from 'express';
import { BookModel } from '../models/Book';
import { validationResult } from 'express-validator';

export class BookController {
  static index(_req: Request, res: Response): void {
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

