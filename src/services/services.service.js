import { servicesRepository } from '../repositories/services.repository.js';
import { AppError, notFound } from '../utils/AppError.js';
import { emit, EVENTS } from '../utils/realtime.js';

/**
 * Capa de negocio de servicios.
 * No conoce req/res ni accede a la base de datos directamente:
 * todo pasa por el repository.
 */
export class ServicesService {
  constructor(repository) {
    this.repository = repository;
  }

  /** Arma el filtro de Mongo a partir de los query params ya validados. */
  #buildFilter({ category, available, search }) {
    const filter = {};
    if (category !== undefined) filter.category = category.toLowerCase();
    if (available !== undefined) filter.available = available;
    if (search) filter.name = { $regex: search, $options: 'i' };
    return filter;
  }

  /** Traduce sortBy/order a un objeto de ordenamiento de Mongo. */
  #buildSort(sortBy, order) {
    if (!sortBy) return { createdAt: -1 };
    return { [sortBy]: order === 'asc' ? 1 : -1 };
  }

  /** Construye el link de una pagina conservando el resto de los filtros. */
  #buildLink(baseUrl, query, page) {
    if (!baseUrl || page === null) return null;
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'page') {
        params.set(key, String(value));
      }
    });
    params.set('page', String(page));
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Listado con filtros, paginacion y ordenamiento.
   * @param {object} query   Query params validados por Zod.
   * @param {string} baseUrl Ruta base para armar prevLink/nextLink.
   */
  async getServices(query = {}, baseUrl = '/api/services') {
    const { page = 1, limit = 10, sortBy, order = 'asc' } = query;

    const filter = this.#buildFilter(query);
    const sort = this.#buildSort(sortBy, order);

    const { docs, totalDocs } = await this.repository.getAll(filter, { page, limit, sort });

    const totalPages = Math.max(Math.ceil(totalDocs / limit), 1);
    const hasPrevPage = page > 1 && page <= totalPages;
    const hasNextPage = page < totalPages;
    const prevPage = hasPrevPage ? page - 1 : null;
    const nextPage = hasNextPage ? page + 1 : null;

    return {
      payload: docs,
      totalDocs,
      limit,
      totalPages,
      page,
      hasPrevPage,
      hasNextPage,
      prevPage,
      nextPage,
      prevLink: this.#buildLink(baseUrl, query, prevPage),
      nextLink: this.#buildLink(baseUrl, query, nextPage),
    };
  }

  async getServiceById(id) {
    const service = await this.repository.getById(id);
    if (!service) throw notFound(`No existe un servicio con id ${id}`);
    return service;
  }

  async createService(data) {
    const created = await this.repository.create(data);
    await this.#broadcastServices();
    return created;
  }

  async updateService(id, data) {
    // El id nunca se modifica: se descarta si viene en el body.
    const { id: _ignoredId, _id: _ignoredMongoId, ...payload } = data;

    if (Object.keys(payload).length === 0) {
      throw new AppError(400, 'No se enviaron campos validos para actualizar');
    }

    const updated = await this.repository.update(id, payload);
    if (!updated) throw notFound(`No existe un servicio con id ${id}`);

    await this.#broadcastServices();
    return updated;
  }

  async deleteService(id) {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw notFound(`No existe un servicio con id ${id}`);

    await this.#broadcastServices();
    return deleted;
  }

  /** Lista completa usada por las vistas y por los eventos de tiempo real. */
  async getAllForViews() {
    const { docs } = await this.repository.getAll({}, { page: 1, limit: 200, sort: { name: 1 } });
    return docs;
  }

  async getCategories() {
    return this.repository.getCategories();
  }

  /** Notifica a los clientes conectados que el listado de servicios cambio. */
  async #broadcastServices() {
    const services = await this.getAllForViews();
    emit(EVENTS.SERVICES_UPDATED, JSON.parse(JSON.stringify(services)));
  }
}

export const servicesService = new ServicesService(servicesRepository);

export default servicesService;
