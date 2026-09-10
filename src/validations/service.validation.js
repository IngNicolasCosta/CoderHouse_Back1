import { z } from 'zod';
import { booleanish } from './common.validation.js';

/**
 * Esquemas de validacion del recurso services.
 * Se aplican como middleware ANTES de llegar a la capa de negocio y a MongoDB.
 */

export const createServiceSchema = z
  .object({
    name: z
      .string({ required_error: 'name es obligatorio' })
      .trim()
      .min(3, 'name debe tener al menos 3 caracteres')
      .max(80, 'name no puede superar los 80 caracteres'),
    description: z
      .string({ required_error: 'description es obligatorio' })
      .trim()
      .min(10, 'description debe tener al menos 10 caracteres')
      .max(500, 'description no puede superar los 500 caracteres'),
    duration: z
      .number({ required_error: 'duration es obligatorio', invalid_type_error: 'duration debe ser un numero' })
      .int('duration debe ser un numero entero de minutos')
      .positive('duration debe ser mayor a 0')
      .max(1440, 'duration no puede superar los 1440 minutos'),
    price: z
      .number({ required_error: 'price es obligatorio', invalid_type_error: 'price debe ser un numero' })
      .nonnegative('price no puede ser negativo'),
    category: z
      .string({ required_error: 'category es obligatorio' })
      .trim()
      .min(3, 'category debe tener al menos 3 caracteres')
      .toLowerCase(),
    available: booleanish,
  })
  // strict() rechaza cualquier campo extra, en particular el id:
  // el id lo genera MongoDB, nunca se recibe desde el cliente.
  .strict();

export const updateServiceSchema = createServiceSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export const servicesQuerySchema = z
  .object({
    category: z.string().trim().min(1).optional(),
    available: booleanish.optional(),
    search: z.string().trim().min(1).optional(),
    page: z.coerce.number().int('page debe ser un entero').positive('page debe ser mayor a 0').default(1),
    limit: z.coerce
      .number()
      .int('limit debe ser un entero')
      .positive('limit debe ser mayor a 0')
      .max(100, 'limit no puede superar 100')
      .default(10),
    sortBy: z
      .enum(['name', 'price', 'duration', 'category', 'createdAt'], {
        invalid_type_error: 'sortBy invalido',
      })
      .optional(),
    order: z.enum(['asc', 'desc'], { invalid_type_error: 'order debe ser asc o desc' }).default('asc'),
  })
  .strict();
