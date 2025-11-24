import { bookEvents } from '../models/Book';
import { Book } from '../types';
import { UpdateAuthorBookCountJob } from '../jobs/UpdateAuthorBookCountJob';
import { VerifyAndFixAuthorBookCountJob } from '../jobs/VerifyAndFixAuthorBookCountJob';

export class UpdateAuthorBookCount {
  static initialize(): void {
    // Listener para cuando se crea un libro
    bookEvents.on('book:created', (book: Book) => {
      const job = new UpdateAuthorBookCountJob(book.author_id, 'increment');
      job.execute();
      
      const verifyJob = new VerifyAndFixAuthorBookCountJob(book.author_id);
      verifyJob.execute();
    });

    // Listener para cuando se actualiza un libro (cambio de autor)
    bookEvents.on('book:updated', (book: Book, oldAuthorId: number) => {
      if (oldAuthorId !== book.author_id) {
        // Decrement old author's count
        const decrementJob = new UpdateAuthorBookCountJob(oldAuthorId, 'decrement');
        decrementJob.execute();
        
        const verifyOldJob = new VerifyAndFixAuthorBookCountJob(oldAuthorId);
        verifyOldJob.execute();
        
        // Increment new author's count
        if (book.author_id) {
          const incrementJob = new UpdateAuthorBookCountJob(book.author_id, 'increment');
          incrementJob.execute();
          
          const verifyNewJob = new VerifyAndFixAuthorBookCountJob(book.author_id);
          verifyNewJob.execute();
        }
      }
    });

    // Listener para cuando se elimina un libro
    bookEvents.on('book:deleted', (book: Book) => {
      const job = new UpdateAuthorBookCountJob(book.author_id, 'decrement');
      job.execute();
      
      const verifyJob = new VerifyAndFixAuthorBookCountJob(book.author_id);
      verifyJob.execute();
    });
  }
}

