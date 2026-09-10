import { Router } from 'express';
import {
  getBookings,
  createBooking,
  getBookingById,
  updateBooking,
  deleteBooking,
  addServiceToBooking,
  updateServiceQuantity,
  removeServiceFromBooking,
  clearBookingServices,
} from '../controllers/bookings.controller.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validate.middleware.js';
import {
  createBookingSchema,
  updateBookingSchema,
  addServiceToBookingSchema,
  updateServiceQuantitySchema,
  bookingsQuerySchema,
} from '../validations/booking.validation.js';
import { bidParamSchema, bookingServiceParamsSchema } from '../validations/common.validation.js';

/**
 * Router de reservas: define endpoints, valida entrada y delega en el controller.
 */
const router = Router();

router.get('/', validateQuery(bookingsQuerySchema), getBookings);

router.post('/', validateBody(createBookingSchema), createBooking);

router.get('/:bid', validateParams(bidParamSchema), getBookingById);

router.put('/:bid', validateParams(bidParamSchema), validateBody(updateBookingSchema), updateBooking);

router.delete('/:bid', validateParams(bidParamSchema), deleteBooking);

// Vaciar la reserva (elimina todos sus servicios, conserva la reserva)
router.delete('/:bid/services', validateParams(bidParamSchema), clearBookingServices);

// Agregar servicio a la reserva (si ya existe, incrementa quantity)
router.post(
  '/:bid/services/:sid',
  validateParams(bookingServiceParamsSchema),
  validateBody(addServiceToBookingSchema),
  addServiceToBooking
);

// Fijar la cantidad de un servicio dentro de la reserva
router.put(
  '/:bid/services/:sid',
  validateParams(bookingServiceParamsSchema),
  validateBody(updateServiceQuantitySchema),
  updateServiceQuantity
);

// Eliminar un servicio puntual de la reserva
router.delete('/:bid/services/:sid', validateParams(bookingServiceParamsSchema), removeServiceFromBooking);

export default router;
