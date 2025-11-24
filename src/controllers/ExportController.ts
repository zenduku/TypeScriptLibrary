import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { AuthorModel } from '../models/Author';
import { BookModel } from '../models/Book';

export class ExportController {
  static exportToXlsx(_req: Request, res: Response): void {
    try {
      const authors = AuthorModel.findAll();
      const books = BookModel.findAll();

      // Crear workbook
      const workbook = XLSX.utils.book_new();

      // Hoja de Autores
      const authorsData = authors.map(author => ({
        ID: author.id,
        Name: author.name,
        'Books Count': author.books_count, // Updated by Jobs, calculated dynamically as backup
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

