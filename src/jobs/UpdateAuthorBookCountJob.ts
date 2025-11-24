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

