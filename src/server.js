import http from 'node:http';
import { Server as SocketServer } from 'socket.io';

import app from './app.js';
import { config } from './config/env.config.js';
import { connectDB } from './config/db.config.js';
import { setIO } from './utils/realtime.js';
import { registerSocketHandlers } from './sockets/index.js';

const bootstrap = async () => {
  await connectDB();

  const httpServer = http.createServer(app);
  const io = new SocketServer(httpServer);

  // Se comparte la instancia de io para que la capa de negocio pueda
  // emitir eventos sin depender de Socket.io directamente.
  setIO(io);
  registerSocketHandlers(io);

  httpServer.listen(config.port, () => {
    console.log(`[server] Escuchando en http://localhost:${config.port} (${config.nodeEnv})`);
    console.log(`[server] API      -> http://localhost:${config.port}/api/services`);
    console.log(`[server] Vistas   -> http://localhost:${config.port}/views/services`);
  });

  const shutdown = () => {
    console.log('\n[server] Cerrando servidor...');
    httpServer.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

bootstrap();
