import { Router } from 'express';
import { renderHome, renderServices, renderAvailability } from '../controllers/views.controller.js';

/**
 * Router de vistas renderizadas con Handlebars.
 */
const router = Router();

router.get('/', renderHome);
router.get('/services', renderServices);
router.get('/availability', renderAvailability);

export default router;
