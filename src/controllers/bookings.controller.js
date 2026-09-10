import { bookingsService } from '../services/bookings.service.js';

/**
 * Controller de reservas: lee req.params / req.query / req.body,
 * delega en bookings.service y responde.
 */

export const getBookings = async (req, res, next) => {
  try {
    const query = req.validatedQuery ?? req.query;
    const { payload, totalDocs } = await bookingsService.getBookings(query);

    res.status(200).json({ status: 'success', totalDocs, payload });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const created = await bookingsService.createBooking(req.body);

    res.status(201).json({
      status: 'success',
      message: 'Reserva creada correctamente',
      payload: created,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const { bid } = req.params;
    const booking = await bookingsService.getBookingById(bid);

    res.status(200).json({ status: 'success', payload: booking });
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req, res, next) => {
  try {
    const { bid } = req.params;
    const updated = await bookingsService.updateBooking(bid, req.body);

    res.status(200).json({
      status: 'success',
      message: 'Reserva actualizada correctamente',
      payload: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBooking = async (req, res, next) => {
  try {
    const { bid } = req.params;
    const deleted = await bookingsService.deleteBooking(bid);

    res.status(200).json({
      status: 'success',
      message: 'Reserva eliminada correctamente',
      payload: deleted,
    });
  } catch (error) {
    next(error);
  }
};

export const addServiceToBooking = async (req, res, next) => {
  try {
    const { bid, sid } = req.params;
    const { quantity } = req.body;
    const updated = await bookingsService.addServiceToBooking(bid, sid, quantity);

    res.status(200).json({
      status: 'success',
      message: 'Servicio agregado a la reserva',
      payload: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateServiceQuantity = async (req, res, next) => {
  try {
    const { bid, sid } = req.params;
    const { quantity } = req.body;
    const updated = await bookingsService.updateServiceQuantity(bid, sid, quantity);

    res.status(200).json({
      status: 'success',
      message: 'Cantidad actualizada',
      payload: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const removeServiceFromBooking = async (req, res, next) => {
  try {
    const { bid, sid } = req.params;
    const updated = await bookingsService.removeServiceFromBooking(bid, sid);

    res.status(200).json({
      status: 'success',
      message: 'Servicio eliminado de la reserva',
      payload: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const clearBookingServices = async (req, res, next) => {
  try {
    const { bid } = req.params;
    const updated = await bookingsService.clearBookingServices(bid);

    res.status(200).json({
      status: 'success',
      message: 'Se vaciaron los servicios de la reserva',
      payload: updated,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getBookings,
  createBooking,
  getBookingById,
  updateBooking,
  deleteBooking,
  addServiceToBooking,
  updateServiceQuantity,
  removeServiceFromBooking,
  clearBookingServices,
};
