import dotenv from 'dotenv';

dotenv.config();

/**
 * Variables de entorno obligatorias para que la aplicacion pueda iniciar.
 * Si falta alguna, el proceso termina con un mensaje claro.
 */
const REQUIRED_VARS = ['PORT', 'NODE_ENV', 'MONGO_URI'];

const missing = REQUIRED_VARS.filter((key) => {
  const value = process.env[key];
  return value === undefined || String(value).trim() === '';
});

if (missing.length > 0) {
  console.error('\n[env.config] No se pudo iniciar la aplicacion.');
  console.error(`[env.config] Faltan variables de entorno requeridas: ${missing.join(', ')}`);
  console.error('[env.config] Copia el archivo .env.example a .env y completa los valores.\n');
  process.exit(1);
}

const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port <= 0) {
  console.error('\n[env.config] La variable PORT debe ser un numero entero valido.\n');
  process.exit(1);
}

export const config = {
  port,
  nodeEnv: process.env.NODE_ENV,
  mongoUri: process.env.MONGO_URI,
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;
