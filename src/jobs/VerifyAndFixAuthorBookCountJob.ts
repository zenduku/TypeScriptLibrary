import db from '../database/database';
import { AuthorModel } from '../models/Author';

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

