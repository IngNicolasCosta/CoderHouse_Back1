import mongoose from 'mongoose';

const serviceCollection = 'services';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del servicio es obligatorio'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La descripcion del servicio es obligatoria'],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'La duracion (en minutos) es obligatoria'],
      min: [1, 'La duracion debe ser mayor a 0'],
    },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    category: {
      type: String,
      required: [true, 'La categoria es obligatoria'],
      trim: true,
      lowercase: true,
      index: true,
    },
    available: {
      type: Boolean,
      required: [true, 'La disponibilidad es obligatoria'],
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indice compuesto para los filtros mas usados en GET /api/services
serviceSchema.index({ category: 1, available: 1 });

export const ServiceModel = mongoose.model(serviceCollection, serviceSchema);

export default ServiceModel;
