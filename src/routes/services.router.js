import { Router } from 'express';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from '../controllers/services.controller.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validate.middleware.js';
import { createServiceSchema, updateServiceSchema, servicesQuerySchema } from '../validations/service.validation.js';
import { sidParamSchema } from '../validations/common.validation.js';

/**
 * Router de servicios: solo define endpoints, valida la entrada y delega
 * en el controller. No contiene logica ni accede a datos.
 */
const router = Router();

router.get('/', validateQuery(servicesQuerySchema), getServices);

router.get('/:sid', validateParams(sidParamSchema), getServiceById);

router.post('/', validateBody(createServiceSchema), createService);

router.put('/:sid', validateParams(sidParamSchema), validateBody(updateServiceSchema), updateService);

router.delete('/:sid', validateParams(sidParamSchema), deleteService);

export default router;
