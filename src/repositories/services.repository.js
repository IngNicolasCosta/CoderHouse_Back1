import { servicesDAO } from '../dao/services.dao.js';

/**
 * Repository de servicios.
 * Expone metodos de acceso a datos sin reglas de negocio: es la unica capa
 * que conoce al DAO, de modo que cambiar la persistencia (JSON, Mongo, otra base)
 * solo implica cambiar el DAO inyectado aca.
 */
export class ServicesRepository {
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

  exists(id) {
    return this.dao.exists(id);
  }

  getCategories() {
    return this.dao.distinctCategories();
  }
}

export const servicesRepository = new ServicesRepository(servicesDAO);

export default servicesRepository;
