/**
 * Helpers de Handlebars usados por las vistas.
 */
export const helpers = {
  eq: (a, b) => a === b,

  currency: (value) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(
      Number(value ?? 0)
    ),

  minutes: (value) => `${Number(value ?? 0)} min`,

  statusLabel: (status) =>
    ({
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada',
    }[status] ?? status),

  json: (value) => JSON.stringify(value),
};

export default helpers;
