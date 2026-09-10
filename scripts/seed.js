/**
 * Carga datos de ejemplo en MongoDB.
 *
 *   npm run seed            -> solo inserta si la coleccion de servicios esta vacia
 *   npm run seed -- --reset -> borra servicios y reservas antes de insertar
 */
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.config.js';
import { ServiceModel } from '../src/models/service.model.js';
import { BookingModel } from '../src/models/booking.model.js';

const RESET = process.argv.includes('--reset');

const SERVICES = [
  {
    name: 'Consulta clinica',
    description: 'Consulta general de 30 minutos con profesional matriculado.',
    duration: 30,
    price: 12000,
    category: 'salud',
    available: true,
  },
  {
    name: 'Sesion de kinesiologia',
    description: 'Sesion de rehabilitacion y terapia manual de 45 minutos.',
    duration: 45,
    price: 15000,
    category: 'salud',
    available: true,
  },
  {
    name: 'Corte de cabello',
    description: 'Corte de cabello con lavado y peinado incluido.',
    duration: 40,
    price: 9000,
    category: 'belleza',
    available: true,
  },
  {
    name: 'Manicuria completa',
    description: 'Manicuria con esmaltado semipermanente y tratamiento de cuticulas.',
    duration: 60,
    price: 11000,
    category: 'belleza',
    available: false,
  },
  {
    name: 'Clase de yoga',
    description: 'Clase grupal de yoga para todos los niveles, incluye materiales.',
    duration: 60,
    price: 7000,
    category: 'bienestar',
    available: true,
  },
  {
    name: 'Asesoria contable',
    description: 'Reunion de asesoria contable e impositiva para monotributistas.',
    duration: 50,
    price: 20000,
    category: 'profesional',
    available: true,
  },
];

const run = async () => {
  await connectDB();

  if (RESET) {
    await Promise.all([ServiceModel.deleteMany({}), BookingModel.deleteMany({})]);
    console.log('[seed] Colecciones services y bookings vaciadas');
  }

  const existing = await ServiceModel.countDocuments();
  if (existing > 0 && !RESET) {
    console.log(`[seed] Ya hay ${existing} servicios cargados. Usa "npm run seed -- --reset" para reemplazarlos.`);
    await disconnectDB();
    return;
  }

  const services = await ServiceModel.insertMany(SERVICES);
  console.log(`[seed] ${services.length} servicios insertados`);

  const booking = await BookingModel.create({
    clientName: 'Ana Perez',
    clientEmail: 'ana.perez@mail.com',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    time: '10:30',
    status: 'confirmed',
    services: [
      { service: services[0]._id, quantity: 1 },
      { service: services[2]._id, quantity: 2 },
    ],
  });

  console.log(`[seed] Reserva de ejemplo creada con id ${booking._id}`);

  await disconnectDB();
};

run().catch(async (error) => {
  console.error('[seed] Error:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
