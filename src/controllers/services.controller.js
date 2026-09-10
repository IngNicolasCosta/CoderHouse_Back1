import { servicesService } from '../services/services.service.js';

/**
 * Controller de servicios.
 * Unica capa que conoce req/res: lee la request, delega en la capa de negocio
 * y responde con el codigo HTTP correspondiente.
 */

export const getServices = async (req, res, next) => {
  try {
    const query = req.validatedQuery ?? req.query;
    const result = await servicesService.getServices(query, req.baseUrl || '/api/services');

    res.status(200).json({ status: 'success', ...result });
  } catch (error) {
    next(error);
  }
};

export const getServiceById = async (req, res, next) => {
  try {
    const { sid } = req.params;
    const service = await servicesService.getServiceById(sid);

    res.status(200).json({ status: 'success', payload: service });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req, res, next) => {
  try {
    const created = await servicesService.createService(req.body);

    res.status(201).json({
      status: 'success',
      message: 'Servicio creado correctamente',
      payload: created,
    });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const { sid } = req.params;
    const updated = await servicesService.updateService(sid, req.body);

    res.status(200).json({
      status: 'success',
      message: 'Servicio actualizado correctamente',
      payload: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const { sid } = req.params;
    const deleted = await servicesService.deleteService(sid);

    res.status(200).json({
      status: 'success',
      message: 'Servicio eliminado correctamente',
      payload: deleted,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
