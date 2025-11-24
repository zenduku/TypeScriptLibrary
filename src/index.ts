import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/database';
import { UpdateAuthorBookCount } from './listeners/UpdateAuthorBookCount';
import routes from './routes';
import { config } from './config/env';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar base de datos
initializeDatabase();

// Inicializar listeners de eventos para actualizar books_count
UpdateAuthorBookCount.initialize();

// Rutas
app.use('/api', routes);

// Ruta de salud
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// Manejo de errores
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Iniciar servidor
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;

