import { Router } from 'express';
import servicesRouter from './services.router.js';
import bookingsRouter from './bookings.router.js';
import messagesRouter from './messages.router.js';

/**
 * Router raiz de la API: agrupa todos los recursos bajo /api.
 */
const router = Router();

router.use('/services', servicesRouter);
router.use('/bookings', bookingsRouter);
router.use('/messages', messagesRouter);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API operativa' });
});

export default router;
