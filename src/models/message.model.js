import mongoose from 'mongoose';

const messageCollection = 'messages';

/**
 * Mensajes de consulta enviados desde las vistas mediante Socket.io.
 * Se persisten en MongoDB para que el historial sobreviva a un refresh.
 */
const messageSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: [true, 'El usuario del mensaje es obligatorio'],
      trim: true,
    },
    text: {
      type: String,
      required: [true, 'El texto del mensaje es obligatorio'],
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const MessageModel = mongoose.model(messageCollection, messageSchema);

export default MessageModel;
