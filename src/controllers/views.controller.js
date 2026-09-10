import { servicesService } from '../services/services.service.js';
import { bookingsService } from '../services/bookings.service.js';
import { messagesService } from '../services/messages.service.js';

/**
 * Controller de vistas.
 * No tiene logica de negocio propia: usa exactamente las mismas capas que la API
 * (service -> repository -> DAO -> model) y solo adapta los datos para Handlebars.
 */

/** Convierte documentos de Mongoose en objetos planos aptos para Handlebars. */
const toPlain = (data) => JSON.parse(JSON.stringify(data));

export const renderHome = async (req, res, next) => {
  try {
    const [services, bookings] = await Promise.all([
      servicesService.getAllForViews(),
      bookingsService.getAllForViews(),
    ]);

    const plainServices = toPlain(services);

    res.render('home', {
      title: 'Inicio',
      totalServices: plainServices.length,
      availableServices: plainServices.filter((service) => service.available).length,
      totalBookings: bookings.length,
      pendingBookings: bookings.filter((booking) => booking.status === 'pending').length,
    });
  } catch (error) {
    next(error);
  }
};

export const renderServices = async (req, res, next) => {
  try {
    const [services, categories] = await Promise.all([
      servicesService.getAllForViews(),
      servicesService.getCategories(),
    ]);

    res.render('services', {
      title: 'Servicios',
      services: toPlain(services),
      categories: toPlain(categories),
    });
  } catch (error) {
    next(error);
  }
};

export const renderAvailability = async (req, res, next) => {
  try {
    const [services, bookings, messages] = await Promise.all([
      servicesService.getAllForViews(),
      bookingsService.getAllForViews(),
      messagesService.getMessages(30),
    ]);

    const plainServices = toPlain(services);
    const plainBookings = toPlain(bookings);

    // Agrupamiento por fecha para mostrar la agenda ordenada.
    const byDate = plainBookings.reduce((acc, booking) => {
      acc[booking.date] = acc[booking.date] ?? [];
      acc[booking.date].push(booking);
      return acc;
    }, {});

    const agenda = Object.keys(byDate)
      .sort()
      .map((date) => ({
        date,
        bookings: byDate[date].sort((a, b) => a.time.localeCompare(b.time)),
      }));

    res.render('availability', {
      title: 'Disponibilidad y reservas',
      agenda,
      hasBookings: plainBookings.length > 0,
      availableServices: plainServices.filter((service) => service.available),
      messages: toPlain(messages),
    });
  } catch (error) {
    next(error);
  }
};

export default { renderHome, renderServices, renderAvailability };
