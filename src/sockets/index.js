import { servicesService } from '../services/services.service.js';
import { bookingsService } from '../services/bookings.service.js';
import { messagesService } from '../services/messages.service.js';
import { createServiceSchema } from '../validations/service.validation.js';
import { createBookingSchema, createMessageSchema } from '../validations/booking.validation.js';
import { objectId } from '../validations/common.validation.js';
import { EVENTS } from '../utils/realtime.js';

/**
 * Handlers de Socket.io.
 *
 * Los sockets NO tienen logica de negocio: validan la entrada y llaman a la
 * misma capa de services que usa la API REST. Cada operacion que modifica datos
 * dispara un broadcast desde la capa de negocio, de modo que las vistas se
 * actualizan en tiempo real sin importar si el cambio vino de un socket,
 * de un formulario o de un request REST hecho desde Postman.
 */

const toPlain = (data) => JSON.parse(JSON.stringify(data));

const formatError = (error) => {
  if (error?.details?.length) {
    return error.details.map((detail) => `${detail.field}: ${detail.message}`).join(' | ');
  }
  return error?.message ?? 'Error inesperado';
};

export const registerSocketHandlers = (io) => {
  io.on('connection', async (socket) => {
    console.log(`[socket] Cliente conectado: ${socket.id}`);

    // Snapshot inicial para el cliente que se acaba de conectar.
    try {
      const [services, bookings, messages] = await Promise.all([
        servicesService.getAllForViews(),
        bookingsService.getAllForViews(),
        messagesService.getMessages(30),
      ]);

      socket.emit(EVENTS.SERVICES_UPDATED, toPlain(services));
      socket.emit(EVENTS.BOOKINGS_UPDATED, toPlain(bookings));
      socket.emit('messages:history', toPlain(messages));
    } catch (error) {
      socket.emit('app:error', formatError(error));
    }

    /* ----------------------------- Servicios ----------------------------- */

    socket.on('service:create', async (payload) => {
      const parsed = createServiceSchema.safeParse(payload ?? {});
      if (!parsed.success) {
        return socket.emit('app:error', parsed.error.issues.map((issue) => issue.message).join(' | '));
      }

      try {
        const created = await servicesService.createService(parsed.data);
        socket.emit('app:success', `Servicio "${created.name}" creado`);
      } catch (error) {
        socket.emit('app:error', formatError(error));
      }
    });

    socket.on('service:delete', async (id) => {
      const parsed = objectId.safeParse(id);
      if (!parsed.success) return socket.emit('app:error', 'Id de servicio invalido');

      try {
        const deleted = await servicesService.deleteService(parsed.data);
        socket.emit('app:success', `Servicio "${deleted.name}" eliminado`);
      } catch (error) {
        socket.emit('app:error', formatError(error));
      }
    });

    socket.on('service:toggle', async (id) => {
      const parsed = objectId.safeParse(id);
      if (!parsed.success) return socket.emit('app:error', 'Id de servicio invalido');

      try {
        const service = await servicesService.getServiceById(parsed.data);
        const updated = await servicesService.updateService(parsed.data, { available: !service.available });
        socket.emit(
          'app:success',
          `"${updated.name}" ahora esta ${updated.available ? 'disponible' : 'no disponible'}`
        );
      } catch (error) {
        socket.emit('app:error', formatError(error));
      }
    });

    /* ------------------------------ Reservas ----------------------------- */

    socket.on('booking:create', async (payload) => {
      const parsed = createBookingSchema.safeParse(payload ?? {});
      if (!parsed.success) {
        return socket.emit('app:error', parsed.error.issues.map((issue) => issue.message).join(' | '));
      }

      try {
        const created = await bookingsService.createBooking(parsed.data);
        socket.emit('app:success', `Reserva de ${created.clientName} creada para el ${created.date} ${created.time}`);
      } catch (error) {
        socket.emit('app:error', formatError(error));
      }
    });

    socket.on('booking:delete', async (id) => {
      const parsed = objectId.safeParse(id);
      if (!parsed.success) return socket.emit('app:error', 'Id de reserva invalido');

      try {
        await bookingsService.deleteBooking(parsed.data);
        socket.emit('app:success', 'Reserva eliminada');
      } catch (error) {
        socket.emit('app:error', formatError(error));
      }
    });

    socket.on('booking:status', async ({ id, status } = {}) => {
      const parsed = objectId.safeParse(id);
      if (!parsed.success) return socket.emit('app:error', 'Id de reserva invalido');

      try {
        const updated = await bookingsService.updateBooking(parsed.data, { status });
        socket.emit('app:success', `Reserva de ${updated.clientName} marcada como ${updated.status}`);
      } catch (error) {
        socket.emit('app:error', formatError(error));
      }
    });

    /* ------------------------------ Mensajes ----------------------------- */

    socket.on('message:send', async (payload) => {
      const parsed = createMessageSchema.safeParse(payload ?? {});
      if (!parsed.success) {
        return socket.emit('app:error', parsed.error.issues.map((issue) => issue.message).join(' | '));
      }

      try {
        await messagesService.createMessage(parsed.data);
      } catch (error) {
        socket.emit('app:error', formatError(error));
      }
    });

    socket.on('disconnect', () => {
      console.log(`[socket] Cliente desconectado: ${socket.id}`);
    });
  });
};

export default registerSocketHandlers;
