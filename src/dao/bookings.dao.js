import { BookingModel } from '../models/booking.model.js';

/**
 * DAO de reservas: acceso directo al modelo, sin reglas de negocio.
 * El populate de services.service lo aplica un hook del propio modelo.
 */
export class BookingsDAO {
  async getAll(filter = {}, options = {}) {
    const { limit = 50, page = 1, sort = { date: 1, time: 1 } } = options;
    const skip = (page - 1) * limit;

    const [docs, totalDocs] = await Promise.all([
      BookingModel.find(filter).sort(sort).skip(skip).limit(limit),
      BookingModel.countDocuments(filter),
    ]);

    return { docs, totalDocs };
  }

  async getById(id) {
    return BookingModel.findById(id);
  }

  async create(data) {
    const created = await BookingModel.create(data);
    // create() no dispara el hook de populate (no es una query find)
    return created.populate('services.service');
  }

  async update(id, data) {
    return BookingModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return BookingModel.findByIdAndDelete(id);
  }
}

export const bookingsDAO = new BookingsDAO();

export default bookingsDAO;
