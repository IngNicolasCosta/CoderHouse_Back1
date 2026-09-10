import { z } from 'zod';
import { objectId } from './common.validation.js';

/**
 * Esquemas de validacion del recurso bookings.
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const bookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled', 'completed'], {
  invalid_type_error: 'status debe ser pending, confirmed, cancelled o completed',
});

const bookingServiceItemSchema = z
  .object({
    service: objectId,
    quantity: z.coerce.number().int().positive('quantity debe ser mayor a 0').default(1),
  })
  .strict();

export const createBookingSchema = z
  .object({
    clientName: z
      .string({ required_error: 'clientName es obligatorio' })
      .trim()
      .min(3, 'clientName debe tener al menos 3 caracteres'),
    clientEmail: z
      .string({ required_error: 'clientEmail es obligatorio' })
      .trim()
      .email('clientEmail debe ser un email valido')
      .toLowerCase(),
    date: z
      .string({ required_error: 'date es obligatorio' })
      .regex(DATE_REGEX, 'date debe tener formato YYYY-MM-DD'),
    time: z
      .string({ required_error: 'time es obligatorio' })
      .regex(TIME_REGEX, 'time debe tener formato HH:mm'),
    status: bookingStatusSchema.default('pending'),
    // Una reserva puede crearse con services vacio.
    services: z.array(bookingServiceItemSchema).default([]),
  })
  .strict();

export const updateBookingSchema = z
  .object({
    clientName: z.string().trim().min(3).optional(),
    clientEmail: z.string().trim().email('clientEmail debe ser un email valido').toLowerCase().optional(),
    date: z.string().regex(DATE_REGEX, 'date debe tener formato YYYY-MM-DD').optional(),
    time: z.string().regex(TIME_REGEX, 'time debe tener formato HH:mm').optional(),
    status: bookingStatusSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });

/** Body opcional de POST /api/bookings/:bid/services/:sid */
export const addServiceToBookingSchema = z
  .object({
    quantity: z.coerce.number().int().positive('quantity debe ser mayor a 0').default(1),
  })
  .strict();

/** Body de PUT /api/bookings/:bid/services/:sid */
export const updateServiceQuantitySchema = z
  .object({
    quantity: z.coerce
      .number({ required_error: 'quantity es obligatorio' })
      .int('quantity debe ser un entero')
      .positive('quantity debe ser mayor a 0'),
  })
  .strict();

export const bookingsQuerySchema = z
  .object({
    status: bookingStatusSchema.optional(),
    date: z.string().regex(DATE_REGEX, 'date debe tener formato YYYY-MM-DD').optional(),
    clientEmail: z.string().trim().email().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
  })
  .strict();

export const createMessageSchema = z
  .object({
    user: z.string({ required_error: 'user es obligatorio' }).trim().min(2, 'user debe tener al menos 2 caracteres'),
    text: z.string({ required_error: 'text es obligatorio' }).trim().min(1, 'text no puede estar vacio').max(500),
  })
  .strict();
