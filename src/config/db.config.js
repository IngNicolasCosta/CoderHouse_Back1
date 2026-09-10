import mongoose from 'mongoose';
import { config } from './env.config.js';

/**
 * Conexion unica a MongoDB Atlas.
 * Se invoca una sola vez desde server.js antes de levantar el servidor HTTP.
 */
export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[db] Conectado a MongoDB (${mongoose.connection.name})`);
    return mongoose.connection;
  } catch (error) {
    console.error('[db] Error al conectar con MongoDB:', error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('[db] Conexion cerrada');
};

export default connectDB;
