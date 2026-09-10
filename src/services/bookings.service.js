import { bookingsRepository } from '../repositories/bookings.repository.js';
import { servicesService } from './services.service.js';
import { AppError, notFound } from '../utils/AppError.js';
import { emit, EVENTS } from '../utils/realtime.js';

/**
 * Capa de negocio de reservas.
 * Aca viven las reglas del dominio (por ejemplo, incrementar quantity cuando se
 * agrega dos veces el mismo servicio). No conoce req/res ni la base de datos.
 */
export class BookingsService {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Normaliza el array de servicios de una reserva a su forma persistible:
   * siempre { service: ObjectId, quantity: Number }, nunca el objeto completo.
   */
  #toPersistableServices(services = []) {
    return services.map((item) => ({
      service: item.service?._id ?? item.service,
      quantity: item.quantity,
    }));
  }

  /** Agrega al documento el total estimado de precio y duracion de la reserva. */
  #withSummary(booking) {
    const plain = typeof booking.toJSON === 'function' ? booking.toJSON() : booking;
    const summary = (plain.services ?? []).reduce(
      (acc, item) => {
        const service = item.service;
        if (service && typeof service === 'object') {
          acc.totalPrice += (service.price ?? 0) * item.quantity;
          acc.totalDuration += (service.duration ?? 0) * item.quantity;
        }
        return acc;
      },
      { totalPrice: 0, totalDuration: 0 }
    );

    return { ...plain, ...summary };
  }

  async getBookings(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.date) filter.date = query.date;
    if (query.clientEmail) filter.clientEmail = query.clientEmail.toLowerCase();

    const { docs, totalDocs } = await this.repository.getAll(filter, {
      page: query.page ?? 1,
      limit: query.limit ?? 50,
      sort: { date: 1, time: 1 },
    });

    return { payload: docs.map((doc) => this.#withSummary(doc)), totalDocs };
  }

  async createBooking(data) {
    // Una reserva puede crearse con services vacio.
    const services = this.#toPersistableServices(data.services ?? []);

    // Si vienen servicios en la creacion, se valida que todos existan.
    for (const item of services) {
      await servicesService.getServiceById(item.service);
    }

    const created = await this.repository.create({ ...data, services });
    await this.#broadcastBookings();
    return this.#withSummary(created);
  }

  async getBookingById(id) {
    const booking = await this.repository.getById(id);
    if (!booking) throw notFound(`No existe una reserva con id ${id}`);
    return this.#withSummary(booking);
  }

  async updateBooking(id, data) {
    const { id: _ignoredId, _id: _ignoredMongoId, services: _ignoredServices, ...payload } = data;

    if (Object.keys(payload).length === 0) {
      throw new AppError(400, 'No se enviaron campos validos para actualizar');
    }

    const updated = await this.repository.update(id, payload);
    if (!updated) throw notFound(`No existe una reserva con id ${id}`);

    await this.#broadcastBookings();
    return this.#withSummary(updated);
  }

  async deleteBooking(id) {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw notFound(`No existe una reserva con id ${id}`);

    await this.#broadcastBookings();
    return this.#withSummary(deleted);
  }

  /**
   * Agrega un servicio a una reserva existente.
   * Regla de negocio: si el servicio ya estaba en la reserva, se incrementa quantity.
   */
  async addServiceToBooking(bookingId, serviceId, quantity = 1) {
    const booking = await this.repository.getById(bookingId);
    if (!booking) throw notFound(`No existe una reserva con id ${bookingId}`);

    // Lanza 404 si el servicio no existe.
    const service = await servicesService.getServiceById(serviceId);

    if (service.available === false) {
      throw new AppError(409, `El servicio "${service.name}" no esta disponible para reservar`);
    }

    const services = this.#toPersistableServices(booking.services);
    const existing = services.find((item) => String(item.service) === String(serviceId));

    if (existing) {
      existing.quantity += quantity;
    } else {
      services.push({ service: serviceId, quantity });
    }

    const updated = await this.repository.update(bookingId, { services });
    await this.#broadcastBookings();
    return this.#withSummary(updated);
  }

  /** Fija (no incrementa) la cantidad de un servicio dentro de la reserva. */
  async updateServiceQuantity(bookingId, serviceId, quantity) {
    const booking = await this.repository.getById(bookingId);
    if (!booking) throw notFound(`No existe una reserva con id ${bookingId}`);

    const services = this.#toPersistableServices(booking.services);
    const existing = services.find((item) => String(item.service) === String(serviceId));

    if (!existing) {
      throw notFound(`El servicio ${serviceId} no forma parte de la reserva ${bookingId}`);
    }

    existing.quantity = quantity;

    const updated = await this.repository.update(bookingId, { services });
    await this.#broadcastBookings();
    return this.#withSummary(updated);
  }

  /** Elimina un servicio puntual de la reserva. */
  async removeServiceFromBooking(bookingId, serviceId) {
    const booking = await this.repository.getById(bookingId);
    if (!booking) throw notFound(`No existe una reserva con id ${bookingId}`);

    const services = this.#toPersistableServices(booking.services);
    const remaining = services.filter((item) => String(item.service) !== String(serviceId));

    if (remaining.length === services.length) {
      throw notFound(`El servicio ${serviceId} no forma parte de la reserva ${bookingId}`);
    }

    const updated = await this.repository.update(bookingId, { services: remaining });
    await this.#broadcastBookings();
    return this.#withSummary(updated);
  }

  /** Vacia la reserva: elimina todos sus servicios pero conserva la reserva. */
  async clearBookingServices(bookingId) {
    const booking = await this.repository.getById(bookingId);
    if (!booking) throw notFound(`No existe una reserva con id ${bookingId}`);

    const updated = await this.repository.update(bookingId, { services: [] });
    await this.#broadcastBookings();
    return this.#withSummary(updated);
  }

  /** Lista completa usada por las vistas y por los eventos de tiempo real. */
  async getAllForViews() {
    const { payload } = await this.getBookings({ limit: 100 });
    return payload;
  }

  async #broadcastBookings() {
    const bookings = await this.getAllForViews();
    emit(EVENTS.BOOKINGS_UPDATED, JSON.parse(JSON.stringify(bookings)));
  }
}

export const bookingsService = new BookingsService(bookingsRepository);

export default bookingsService;
