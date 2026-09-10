/**
 * Puente entre la capa de negocio y Socket.io.
 *
 * Guarda la instancia de io creada en server.js para que cualquier capa pueda
 * emitir eventos sin depender de req/res ni de Socket.io directamente.
 * Si todavia no hay servidor de sockets (por ejemplo, al correr el seed),
 * las emisiones simplemente se ignoran.
 */
let io = null;

export const setIO = (instance) => {
  io = instance;
};

export const getIO = () => io;

export const emit = (event, payload) => {
  if (!io) return;
  io.emit(event, payload);
};

export const EVENTS = {
  SERVICES_UPDATED: 'services:updated',
  BOOKINGS_UPDATED: 'bookings:updated',
  MESSAGE_NEW: 'message:new',
};

export default { setIO, getIO, emit, EVENTS };
