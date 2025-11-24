import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

router.use(authenticateToken); // Todas las rutas requieren autenticación

router.get('/', UserController.index);
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('The name is required.'),
    body('email').isEmail().withMessage('The email must be a valid email address.'),
    body('password').isLength({ min: 6 }).withMessage('The password must be at least 6 characters.'),
  ],
  UserController.store
);
router.get('/:id', UserController.show);
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('The name cannot be empty.'),
    body('email').optional().isEmail().withMessage('The email must be a valid email address.'),
    body('password').optional().isLength({ min: 6 }).withMessage('The password must be at least 6 characters.'),
  ],
  UserController.update
);
router.delete('/:id', UserController.destroy);

export default router;

