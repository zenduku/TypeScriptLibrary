import { Router } from 'express';
import { ExportController } from '../controllers/ExportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken); // Requiere autenticación

router.get('/xlsx', ExportController.exportToXlsx);

export default router;

