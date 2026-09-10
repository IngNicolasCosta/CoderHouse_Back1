/**
 * Error de aplicacion con codigo HTTP asociado.
 * Lo lanzan las capas de service; lo traduce a respuesta el middleware errorHandler.
 */
export class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

export const badRequest = (message, details = null) => new AppError(400, message, details);
export const notFound = (message) => new AppError(404, message);
export const conflict = (message) => new AppError(409, message);

export default AppError;
