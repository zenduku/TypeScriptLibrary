import { Router } from 'express';
import { BookController } from '../controllers/BookController';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';
import db from '../database/database';

const router = Router();

router.use(authenticateToken); // Todas las rutas requieren autenticación

router.get('/', BookController.index);
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('The book title is required.'),
    body('publication_date').isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('The publication date must be a valid year.'),
    body('author_id')
      .isInt()
      .withMessage('The author ID must be an integer.')
      .custom((value) => {
        const stmt = db.prepare('SELECT id FROM authors WHERE id = ?');
        const author = stmt.get(value);
        if (!author) {
          throw new Error('The selected author does not exist.');
        }
        return true;
      }),
  ],
  BookController.store
);
router.get('/:id', BookController.show);
router.put(
  '/:id',
  [
    body('title').optional().notEmpty().withMessage('The book title cannot be empty.'),
    body('publication_date').optional().isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('The publication date must be a valid year.'),
    body('author_id')
      .optional()
      .isInt()
      .withMessage('The author ID must be an integer.')
      .custom((value) => {
        const stmt = db.prepare('SELECT id FROM authors WHERE id = ?');
        const author = stmt.get(value);
        if (!author) {
          throw new Error('The selected author does not exist.');
        }
        return true;
      }),
  ],
  BookController.update
);
router.delete('/:id', BookController.destroy);

export default router;

