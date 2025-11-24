import { Request, Response } from 'express';
import { AuthorModel } from '../models/Author';
import { validationResult } from 'express-validator';

export class AuthorController {
  static index(_req: Request, res: Response): void {
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
      // Get the author with books array (empty initially) for consistent response
      const authorWithBooks = AuthorModel.findById(author.id);
      res.status(201).json({
        message: 'Author created successfully',
        author: authorWithBooks || author,
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

