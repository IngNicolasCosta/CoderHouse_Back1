import { MessageModel } from '../models/message.model.js';

/**
 * DAO de mensajes: acceso directo al modelo, sin reglas de negocio.
 */
export class MessagesDAO {
  async getAll(filter = {}, options = {}) {
    const { limit = 50, sort = { createdAt: 1 } } = options;
    return MessageModel.find(filter).sort(sort).limit(limit);
  }

  async getById(id) {
    return MessageModel.findById(id);
  }

  async create(data) {
    return MessageModel.create(data);
  }

  async deleteAll() {
    return MessageModel.deleteMany({});
  }
}

export const messagesDAO = new MessagesDAO();

export default messagesDAO;
