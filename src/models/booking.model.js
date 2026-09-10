import mongoose from 'mongoose';

const bookingCollection = 'bookings';

/**
 * Sub-documento de servicios reservados.
 * Se guarda SOLO la referencia (ObjectId) al servicio y la cantidad,
 * nunca el objeto completo. Los datos completos se obtienen con populate().
 */
const bookingServiceSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'services',
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'La cantidad debe ser mayor a 0'],
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: [true, 'El nombre del cliente es obligatorio'],
      trim: true,
    },
    clientEmail: {
      type: String,
      required: [true, 'El email del cliente es obligatorio'],
      trim: true,
      lowercase: true,
    },
    date: {
      type: String,
      required: [true, 'La fecha de la reserva es obligatoria'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'],
      index: true,
    },
    time: {
      type: String,
      required: [true, 'El horario de la reserva es obligatorio'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'El horario debe tener formato HH:mm'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'completed'],
        message: 'Estado invalido: {VALUE}',
      },
      default: 'pending',
    },
    services: {
      type: [bookingServiceSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Populate automatico de los servicios en cualquier find
bookingSchema.pre(/^find/, function populateServices(next) {
  this.populate('services.service');
  next();
});

export const BookingModel = mongoose.model(bookingCollection, bookingSchema);

export default BookingModel;
