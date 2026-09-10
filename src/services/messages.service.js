import { messagesRepository } from '../repositories/messages.repository.js';
import { emit, EVENTS } from '../utils/realtime.js';

/**
 * Capa de negocio de mensajes (consultas enviadas desde las vistas).
 */
export class MessagesService {
  constructor(repository) {
    this.repository = repository;
  }

  async getMessages(limit = 50) {
    return this.repository.getAll({}, { limit, sort: { createdAt: 1 } });
  }

  async createMessage(data) {
    const created = await this.repository.create(data);
    emit(EVENTS.MESSAGE_NEW, JSON.parse(JSON.stringify(created)));
    return created;
  }
}

export const messagesService = new MessagesService(messagesRepository);

export default messagesService;
