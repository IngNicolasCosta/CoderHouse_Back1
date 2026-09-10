import { z } from 'zod';
import mongoose from 'mongoose';

/** ObjectId de MongoDB valido (24 caracteres hexadecimales). */
export const objectId = z
  .string({ required_error: 'El id es obligatorio' })
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'El id debe ser un ObjectId de MongoDB valido',
  });

/**
 * Booleano tolerante: acepta true/false reales y los strings "true"/"false"
 * que llegan por query params.
 */
export const booleanish = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
}, z.boolean({
  required_error: 'El campo es obligatorio y debe ser true o false',
  invalid_type_error: 'El valor debe ser true o false',
}));

export const sidParamSchema = z.object({ sid: objectId });
export const bidParamSchema = z.object({ bid: objectId });
export const bookingServiceParamsSchema = z.object({ bid: objectId, sid: objectId });
