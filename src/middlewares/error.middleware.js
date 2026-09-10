import { config } from '../config/env.config.js';
import { AppError } from '../utils/AppError.js';

/** 404 para rutas de API inexistentes. */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    error: `La ruta ${req.method} ${req.originalUrl} no existe en esta API`,
  });
};

/**
 * Manejador central de errores: traduce cualquier error a una respuesta JSON
 * con el codigo HTTP correcto.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      error: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  // Id con formato invalido que llego hasta Mongoose
  if (error.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      error: `El valor "${error.value}" no es un ${error.kind} valido`,
    });
  }

  // Validaciones del schema de Mongoose (segunda linea de defensa)
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      error: 'Datos invalidos',
      details: Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      })),
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      status: 'error',
      error: 'Ya existe un registro con esos datos',
      details: error.keyValue,
    });
  }

  console.error('[error]', error);

  return res.status(500).json({
    status: 'error',
    error: 'Error interno del servidor',
    ...(config.isProduction ? {} : { detail: error.message }),
  });
};

export default { notFoundHandler, errorHandler };
