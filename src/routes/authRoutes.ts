import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

// Public routes
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('The email must be a valid email address.'),
    body('password').isLength({ min: 6 }).withMessage('The password must be at least 6 characters.'),
  ],
  AuthController.login
);

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('The name is required.'),
    body('email').isEmail().withMessage('The email must be a valid email address.'),
    body('password').isLength({ min: 6 }).withMessage('The password must be at least 6 characters.'),
    body('password_confirmation').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password.');
      }
      return true;
    }),
  ],
  AuthController.register
);

// Protected routes
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/me', authenticateToken, AuthController.me);
router.post('/refresh', authenticateToken, AuthController.refresh);

export default router;

