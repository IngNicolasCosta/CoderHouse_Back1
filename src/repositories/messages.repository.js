import { messagesDAO } from '../dao/messages.dao.js';

/**
 * Repository de mensajes: acceso a datos sin reglas de negocio.
 */
export class MessagesRepository {
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

  deleteAll() {
    return this.dao.deleteAll();
  }
}

export const messagesRepository = new MessagesRepository(messagesDAO);

export default messagesRepository;
