import { bookingsDAO } from '../dao/bookings.dao.js';

/**
 * Repository de reservas: acceso a datos sin reglas de negocio.
 */
export class BookingsRepository {
  constructor(dao) {
    this.dao = dao;
  }

  getAll(filter, options) {
    return this.dao.getAll(filter, options);
  }

  getById(id) {
    return this.dao.getById(id);
  }

  create(data) {
    return this.dao.create(data);
  }

  update(id, data) {
    return this.dao.update(id, data);
  }

  delete(id) {
    return this.dao.delete(id);
  }
}

export const bookingsRepository = new BookingsRepository(bookingsDAO);

export default bookingsRepository;
