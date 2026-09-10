import { badRequest } from '../utils/AppError.js';

/** Convierte los issues de Zod en una lista legible para el cliente. */
const formatIssues = (error) =>
  error.issues.map((issue) => {
    const path = issue.path.join('.');
    if (issue.code === 'unrecognized_keys') {
      return {
        field: issue.keys.join(', '),
        message: `Campo no permitido: ${issue.keys.join(', ')}. El id se genera automaticamente y no puede enviarse.`,
      };
    }
    return { field: path || '(body)', message: issue.message };
  });

/**
 * Valida req.body contra un esquema de Zod.
 * Si falla, corta el flujo con 400 antes de llegar a la capa de negocio y a MongoDB.
 */
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    return next(badRequest('Datos invalidos en el body', formatIssues(result.error)));
  }
  req.body = result.data;
  return next();
};

/**
 * Valida req.query. En Express 5 req.query es de solo lectura,
 * por eso el resultado validado se expone en req.validatedQuery.
 */
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query ?? {});
  if (!result.success) {
    return next(badRequest('Query params invalidos', formatIssues(result.error)));
  }
  req.validatedQuery = result.data;
  return next();
};

/** Valida req.params (ids de MongoDB). */
export const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params ?? {});
  if (!result.success) {
    return next(badRequest('Parametros de ruta invalidos', formatIssues(result.error)));
  }
  return next();
};

export default { validateBody, validateQuery, validateParams };
