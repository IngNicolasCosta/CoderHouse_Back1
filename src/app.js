import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { engine } from 'express-handlebars';

import apiRouter from './routes/index.js';
import viewsRouter from './routes/views.router.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import { helpers } from './views/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ------------------------------ Middlewares ------------------------------ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* --------------------------- Motor de vistas ----------------------------- */
app.engine(
  'handlebars',
  engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers,
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
  })
);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

/* -------------------------------- Rutas ---------------------------------- */
app.use('/api', apiRouter);
app.use('/views', viewsRouter);

app.get('/', (req, res) => res.redirect('/views'));

/* --------------------- 404 y manejo central de errores ------------------- */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
