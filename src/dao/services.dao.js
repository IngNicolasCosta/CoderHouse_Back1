import { ServiceModel } from '../models/service.model.js';

/**
 * DAO de servicios: unico punto del proyecto que habla con el modelo de Mongoose.
 * No contiene reglas de negocio ni conoce req/res.
 */
export class ServicesDAO {
  /**
   * @param {object} filter  Filtro de Mongo ya armado por capas superiores.
   * @param {object} options { limit, page, sort }
   * @returns {Promise<{docs: Array, totalDocs: number}>}
   */
  async getAll(filter = {}, options = {}) {
    const { limit = 10, page = 1, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const [docs, totalDocs] = await Promise.all([
      ServiceModel.find(filter).sort(sort).skip(skip).limit(limit),
      ServiceModel.countDocuments(filter),
    ]);

    return { docs, totalDocs };
  }

  async getById(id) {
    return ServiceModel.findById(id);
  }

  async create(data) {
    return ServiceModel.create(data);
  }

  async update(id, data) {
    return ServiceModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return ServiceModel.findByIdAndDelete(id);
  }

  async exists(id) {
    const doc = await ServiceModel.exists({ _id: id });
    return Boolean(doc);
  }

  async distinctCategories() {
    return ServiceModel.distinct('category');
  }
}

export const servicesDAO = new ServicesDAO();

export default servicesDAO;
