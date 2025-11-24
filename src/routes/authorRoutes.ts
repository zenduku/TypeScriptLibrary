import { Router } from 'express';
import { AuthorController } from '../controllers/AuthorController';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

router.use(authenticateToken); // Todas las rutas requieren autenticación

router.get('/', AuthorController.index);
router.post(
  '/',
  [body('name').notEmpty().withMessage('The author name is required.')],
  AuthorController.store
);
router.get('/:id', AuthorController.show);
router.put(
  '/:id',
  [body('name').optional().notEmpty().withMessage('The author name cannot be empty.')],
  AuthorController.update
);
router.delete('/:id', AuthorController.destroy);

export default router;

