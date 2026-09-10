# Sistema Backend de Turnos y Reservas

API REST construida con **Node.js + Express (ESM)**, persistencia en **MongoDB Atlas con Mongoose**,
**arquitectura en capas**, validaciones con **Zod**, vistas con **Handlebars** y actualizaciones en
tiempo real con **Socket.io**.

El sistema administra dos recursos principales:

- **`services`**: los servicios que se pueden reservar (nombre, descripcion, duracion, precio, categoria, disponibilidad).
- **`bookings`**: las reservas de los clientes, que referencian servicios mediante `ObjectId` y una `quantity`.

Ademas persiste **`messages`**, las consultas enviadas en vivo desde las vistas.

---

## Tabla de contenidos

1. [Instalacion](#instalacion)
2. [Variables de entorno](#variables-de-entorno)
3. [Ejecucion](#ejecucion)
4. [Arquitectura en capas](#arquitectura-en-capas)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Recurso `services`](#recurso-services)
7. [Recurso `bookings`](#recurso-bookings)
8. [Consultas avanzadas: filtros, paginacion y ordenamiento](#consultas-avanzadas-filtros-paginacion-y-ordenamiento)
9. [Validaciones con Zod](#validaciones-con-zod)
10. [Relaciones y populate](#relaciones-y-populate)
11. [Vistas con Handlebars](#vistas-con-handlebars)
12. [Tiempo real con Socket.io](#tiempo-real-con-socketio)
13. [Manejo de errores](#manejo-de-errores)

---

## Instalacion

Requisitos: **Node.js 18 o superior** y una base de **MongoDB Atlas** (o MongoDB local).

```bash
git clone <url-del-repositorio>
cd CoderHouse_Back1
npm install
```

Copiar el archivo de ejemplo de variables de entorno y completarlo:

```bash
cp .env.example .env
```

En Windows (PowerShell):

```bash
Copy-Item .env.example .env
```

---

## Variables de entorno

| Variable    | Obligatoria | Descripcion                                              | Ejemplo                                                              |
| ----------- | ----------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| `PORT`      | Si          | Puerto donde escucha el servidor Express                  | `8080`                                                                |
| `NODE_ENV`  | Si          | Entorno de ejecucion (`development`, `production`, `test`)| `development`                                                         |
| `MONGO_URI` | Si          | String de conexion a MongoDB Atlas                        | `mongodb+srv://user:pass@cluster.mongodb.net/turnos_reservas`         |

`src/config/env.config.js` valida al iniciar que las tres variables existan y no esten vacias.
Si falta alguna, la aplicacion **no arranca** y muestra un mensaje claro:

```
[env.config] No se pudo iniciar la aplicacion.
[env.config] Faltan variables de entorno requeridas: NODE_ENV, MONGO_URI
[env.config] Copia el archivo .env.example a .env y completa los valores.
```

> El archivo `.env` esta ignorado por git (`.gitignore`) y **nunca** se sube al repositorio.

---

## Ejecucion

```bash
npm start        # inicia el servidor
npm run dev      # inicia con recarga automatica (node --watch)
npm run seed     # carga datos de ejemplo (solo si la base esta vacia)
npm run seed -- --reset   # borra services y bookings y vuelve a cargar los datos de ejemplo
```

Una vez levantado:

| Recurso     | URL                                      |
| ----------- | ---------------------------------------- |
| API         | `http://localhost:8080/api/services`     |
| Vistas      | `http://localhost:8080/views`            |
| Healthcheck | `http://localhost:8080/api/health`       |

---

## Arquitectura en capas

Cada request atraviesa siempre el mismo camino, y cada capa tiene una unica responsabilidad:

```
HTTP  ->  router  ->  validation  ->  controller  ->  service  ->  repository  ->  DAO  ->  model (Mongoose)  ->  MongoDB
Socket.io  ------------------------->  service  ->  repository  ->  DAO  ->  model (Mongoose)  ->  MongoDB
```

| Capa           | Responsabilidad                                                                       | Que NO hace                              |
| -------------- | ------------------------------------------------------------------------------------- | ---------------------------------------- |
| **routes**     | Define los endpoints y los conecta con su controller y sus middlewares de validacion   | No tiene logica ni accede a datos        |
| **validations**| Esquemas de Zod que cortan el flujo con `400` antes de llegar a la base de datos        | No conoce `req`/`res` ni MongoDB         |
| **controllers**| Lee `req.params`, `req.query` y `req.body`; llama al service; responde con `res.status().json()` | No tiene reglas de negocio        |
| **services**   | Reglas de negocio (incrementar `quantity`, validar existencia, armar paginacion)        | No usa `req`/`res` ni toca Mongoose      |
| **repositories**| Metodos de acceso a datos; unica capa que conoce al DAO                                | No tiene reglas de negocio               |
| **dao**        | Unico punto que habla con los modelos de Mongoose                                       | No tiene reglas de negocio ni `req`/`res`|
| **models**     | Esquemas de Mongoose y sus validaciones de schema                                       | -                                        |
| **views**      | Plantillas Handlebars renderizadas desde el servidor                                    | No tiene datos hardcodeados              |

Cambiar la persistencia (por ejemplo, volver a archivos JSON) solo implica escribir un DAO nuevo
e inyectarlo en el repository: ninguna otra capa se entera.

---

## Estructura del proyecto

```
src/
  config/
    env.config.js            # valida y expone las variables de entorno
    db.config.js             # conexion a MongoDB Atlas
  models/
    service.model.js
    booking.model.js
    message.model.js
  dao/
    services.dao.js
    bookings.dao.js
    messages.dao.js
  repositories/
    services.repository.js
    bookings.repository.js
    messages.repository.js
  services/
    services.service.js
    bookings.service.js
    messages.service.js
  controllers/
    services.controller.js
    bookings.controller.js
    messages.controller.js
    views.controller.js
  routes/
    index.js                 # router raiz de /api
    services.router.js
    bookings.router.js
    messages.router.js
    views.router.js
  validations/
    common.validation.js     # ObjectId, booleanos, params
    service.validation.js
    booking.validation.js
  middlewares/
    validate.middleware.js   # validateBody / validateQuery / validateParams
    error.middleware.js      # 404 + manejador central de errores
  sockets/
    index.js                 # handlers de Socket.io
  utils/
    AppError.js              # error con codigo HTTP
    realtime.js              # puente entre la capa de negocio y Socket.io
  views/
    layouts/main.handlebars
    partials/navbar.handlebars
    home.handlebars
    services.handlebars
    availability.handlebars
    helpers.js
  public/
    css/styles.css
    js/socket.js             # cliente de Socket.io
  app.js                     # configuracion de Express, vistas y rutas
  server.js                  # conecta la DB, crea el servidor HTTP y Socket.io
scripts/
  seed.js                    # datos de ejemplo
.env.example
.gitignore
package.json
README.md
```

---

## Recurso `services`

Forma del documento:

```json
{
  "id": "6710a1f2c3d4e5f6a7b8c9d0",
  "name": "Consulta clinica",
  "description": "Consulta general de 30 minutos con profesional matriculado.",
  "duration": 30,
  "price": 12000,
  "category": "salud",
  "available": true,
  "createdAt": "2026-09-10T12:00:00.000Z",
  "updatedAt": "2026-09-10T12:00:00.000Z"
}
```

> El `id` lo genera MongoDB. **Nunca se envia desde el cliente**: si el body incluye `id` o `_id`,
> la request se rechaza con `400`.

### Endpoints

| Metodo   | Ruta                 | Descripcion                                   | Codigos                |
| -------- | -------------------- | --------------------------------------------- | ---------------------- |
| `GET`    | `/api/services`      | Lista con filtros, paginacion y ordenamiento  | `200`, `400`           |
| `GET`    | `/api/services/:sid` | Devuelve un servicio por id                    | `200`, `400`, `404`    |
| `POST`   | `/api/services`      | Crea un servicio                               | `201`, `400`           |
| `PUT`    | `/api/services/:sid` | Actualiza un servicio (no permite tocar el id) | `200`, `400`, `404`    |
| `DELETE` | `/api/services/:sid` | Elimina un servicio                            | `200`, `400`, `404`    |

### Ejemplos

**Crear un servicio**

```bash
curl -X POST http://localhost:8080/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sesion de kinesiologia",
    "description": "Sesion de rehabilitacion y terapia manual de 45 minutos.",
    "duration": 45,
    "price": 15000,
    "category": "salud",
    "available": true
  }'
```

```json
{
  "status": "success",
  "message": "Servicio creado correctamente",
  "payload": { "id": "6710a1f2c3d4e5f6a7b8c9d0", "name": "Sesion de kinesiologia", "...": "..." }
}
```

**Actualizar**

```bash
curl -X PUT http://localhost:8080/api/services/6710a1f2c3d4e5f6a7b8c9d0 \
  -H "Content-Type: application/json" \
  -d '{ "price": 17000, "available": false }'
```

**Eliminar**

```bash
curl -X DELETE http://localhost:8080/api/services/6710a1f2c3d4e5f6a7b8c9d0
```

---

## Recurso `bookings`

Forma del documento:

```json
{
  "id": "6710b2a3c4d5e6f7a8b9c0d1",
  "clientName": "Ana Perez",
  "clientEmail": "ana.perez@mail.com",
  "date": "2026-10-01",
  "time": "10:30",
  "status": "pending",
  "services": [{ "service": "6710a1f2c3d4e5f6a7b8c9d0", "quantity": 2 }]
}
```

- `date` en formato `YYYY-MM-DD`, `time` en formato `HH:mm`.
- `status`: `pending` (por defecto), `confirmed`, `cancelled` o `completed`.
- `services` guarda **solo la referencia** (`ObjectId`) y la cantidad, nunca el objeto completo.

### Endpoints

| Metodo   | Ruta                                | Descripcion                                                        | Codigos                     |
| -------- | ----------------------------------- | ------------------------------------------------------------------ | --------------------------- |
| `GET`    | `/api/bookings`                     | Lista de reservas (filtros: `status`, `date`, `clientEmail`)        | `200`, `400`                |
| `POST`   | `/api/bookings`                     | Crea una reserva (puede iniciar con `services` vacio)               | `201`, `400`, `404`         |
| `GET`    | `/api/bookings/:bid`                | Devuelve la reserva con los servicios completos (`populate`)        | `200`, `400`, `404`         |
| `PUT`    | `/api/bookings/:bid`                | Actualiza datos de la reserva (cliente, fecha, horario, estado)     | `200`, `400`, `404`         |
| `DELETE` | `/api/bookings/:bid`                | Elimina la reserva                                                  | `200`, `400`, `404`         |
| `POST`   | `/api/bookings/:bid/services/:sid`  | Agrega un servicio; si ya estaba, **incrementa `quantity`**         | `200`, `400`, `404`, `409`  |
| `PUT`    | `/api/bookings/:bid/services/:sid`  | Fija la cantidad de un servicio dentro de la reserva                | `200`, `400`, `404`         |
| `DELETE` | `/api/bookings/:bid/services/:sid`  | Elimina un servicio puntual de la reserva                           | `200`, `400`, `404`         |
| `DELETE` | `/api/bookings/:bid/services`       | Vacia la reserva (elimina todos sus servicios, conserva la reserva) | `200`, `400`, `404`         |

### Ejemplos

**Crear una reserva vacia**

```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Ana Perez",
    "clientEmail": "ana.perez@mail.com",
    "date": "2026-10-01",
    "time": "10:30"
  }'
```

**Agregar un servicio (dos veces seguidas incrementa `quantity` a 2)**

```bash
curl -X POST http://localhost:8080/api/bookings/6710b2a3.../services/6710a1f2...
curl -X POST http://localhost:8080/api/bookings/6710b2a3.../services/6710a1f2...
```

Tambien se puede agregar una cantidad de una sola vez:

```bash
curl -X POST http://localhost:8080/api/bookings/6710b2a3.../services/6710a1f2... \
  -H "Content-Type: application/json" \
  -d '{ "quantity": 3 }'
```

**Fijar la cantidad exacta**

```bash
curl -X PUT http://localhost:8080/api/bookings/6710b2a3.../services/6710a1f2... \
  -H "Content-Type: application/json" \
  -d '{ "quantity": 5 }'
```

**Quitar un servicio / vaciar la reserva / eliminar la reserva**

```bash
curl -X DELETE http://localhost:8080/api/bookings/6710b2a3.../services/6710a1f2...
curl -X DELETE http://localhost:8080/api/bookings/6710b2a3.../services
curl -X DELETE http://localhost:8080/api/bookings/6710b2a3...
```

> **Regla de negocio**: un servicio con `available: false` no puede agregarse a una reserva
> (respuesta `409`). Esta regla vive en `bookings.service.js`, no en el DAO ni en el modelo.

---

## Consultas avanzadas: filtros, paginacion y ordenamiento

`GET /api/services` acepta estos query params:

| Param       | Tipo                                                    | Default     | Descripcion                                 |
| ----------- | ------------------------------------------------------- | ----------- | ------------------------------------------- |
| `category`  | string                                                   | -           | Filtra por categoria exacta (case-insensitive) |
| `available` | `true` / `false`                                         | -           | Filtra por disponibilidad                   |
| `search`    | string                                                   | -           | Busqueda parcial por nombre                 |
| `page`      | entero > 0                                               | `1`         | Pagina solicitada                           |
| `limit`     | entero 1-100                                             | `10`        | Resultados por pagina                       |
| `sortBy`    | `name` \| `price` \| `duration` \| `category` \| `createdAt` | `createdAt` | Campo de ordenamiento                  |
| `order`     | `asc` \| `desc`                                          | `asc`       | Sentido del ordenamiento                    |

Cualquier query param desconocido o con un valor invalido devuelve `400`.

**Ejemplos**

```bash
# Servicios de salud disponibles, mas baratos primero, de a 5 por pagina
curl "http://localhost:8080/api/services?category=salud&available=true&sortBy=price&order=asc&page=1&limit=5"

# Segunda pagina de todos los servicios ordenados por nombre
curl "http://localhost:8080/api/services?sortBy=name&order=asc&page=2&limit=10"

# Buscar por nombre
curl "http://localhost:8080/api/services?search=consulta"
```

**Respuesta con metadatos de paginacion**

```json
{
  "status": "success",
  "payload": [ { "id": "...", "name": "Consulta clinica", "...": "..." } ],
  "totalDocs": 12,
  "limit": 5,
  "totalPages": 3,
  "page": 1,
  "hasPrevPage": false,
  "hasNextPage": true,
  "prevPage": null,
  "nextPage": 2,
  "prevLink": null,
  "nextLink": "/api/services?category=salud&available=true&limit=5&sortBy=price&order=asc&page=2"
}
```

---

## Validaciones con Zod

Los esquemas viven en `src/validations/` y se aplican como **middlewares** (`validateBody`,
`validateQuery`, `validateParams`) antes del controller. Cortan el flujo con `400`
**antes de llegar a MongoDB**; las validaciones de Mongoose quedan como segunda linea de defensa.

| Operacion                          | Esquema                        | Reglas principales                                                                  |
| ---------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| `POST /api/services`               | `createServiceSchema`          | Todos los campos obligatorios; `duration` entero > 0; `price` >= 0; rechaza `id`      |
| `PUT /api/services/:sid`           | `updateServiceSchema`          | Campos parciales, al menos uno; rechaza `id` y `_id`                                  |
| `GET /api/services`                | `servicesQuerySchema`          | Tipos y rangos de `page`, `limit`, `sortBy`, `order`, `available`                      |
| `POST /api/bookings`               | `createBookingSchema`          | `clientEmail` valido, `date` `YYYY-MM-DD`, `time` `HH:mm`, `status` enum, `services[]` |
| `PUT /api/bookings/:bid`           | `updateBookingSchema`          | Campos parciales; no permite modificar `services` por esta via                         |
| `POST /api/bookings/:bid/services/:sid` | `addServiceToBookingSchema` | `quantity` entero > 0 (default `1`)                                                    |
| `PUT /api/bookings/:bid/services/:sid`  | `updateServiceQuantitySchema` | `quantity` obligatorio, entero > 0                                                    |
| Todos los `:sid` / `:bid`          | `objectId`                     | Debe ser un ObjectId de MongoDB valido, si no `400`                                   |

**Ejemplo de respuesta con error de validacion**

```bash
curl -X POST http://localhost:8080/api/services \
  -H "Content-Type: application/json" \
  -d '{ "name": "ab", "price": -5 }'
```

```json
{
  "status": "error",
  "error": "Datos invalidos en el body",
  "details": [
    { "field": "name", "message": "name debe tener al menos 3 caracteres" },
    { "field": "description", "message": "description es obligatorio" },
    { "field": "duration", "message": "duration es obligatorio" },
    { "field": "price", "message": "price no puede ser negativo" },
    { "field": "category", "message": "category es obligatorio" },
    { "field": "available", "message": "El campo es obligatorio y debe ser true o false" }
  ]
}
```

Si se envia el `id` en el body:

```json
{
  "status": "error",
  "error": "Datos invalidos en el body",
  "details": [
    {
      "field": "id",
      "message": "Campo no permitido: id. El id se genera automaticamente y no puede enviarse."
    }
  ]
}
```

---

## Relaciones y populate

En `booking.model.js` los servicios se guardan como **referencias**:

```js
services: [
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'services', required: true },
    quantity: { type: Number, default: 1, min: 1 },
  },
];
```

El modelo aplica `populate` automaticamente en cualquier consulta:

```js
bookingSchema.pre(/^find/, function (next) {
  this.populate('services.service');
  next();
});
```

**Consultar una reserva con los servicios completos**

```bash
curl http://localhost:8080/api/bookings/6710b2a3c4d5e6f7a8b9c0d1
```

```json
{
  "status": "success",
  "payload": {
    "id": "6710b2a3c4d5e6f7a8b9c0d1",
    "clientName": "Ana Perez",
    "clientEmail": "ana.perez@mail.com",
    "date": "2026-10-01",
    "time": "10:30",
    "status": "confirmed",
    "services": [
      {
        "service": {
          "id": "6710a1f2c3d4e5f6a7b8c9d0",
          "name": "Consulta clinica",
          "description": "Consulta general de 30 minutos con profesional matriculado.",
          "duration": 30,
          "price": 12000,
          "category": "salud",
          "available": true
        },
        "quantity": 2
      }
    ],
    "totalPrice": 24000,
    "totalDuration": 60
  }
}
```

`totalPrice` y `totalDuration` los calcula la capa de negocio a partir de los datos populados;
en la base solo se persiste `{ service: ObjectId, quantity: Number }`.

---

## Vistas con Handlebars

| Ruta                  | Vista                    | Contenido                                                                        |
| --------------------- | ------------------------ | -------------------------------------------------------------------------------- |
| `/views`              | `home.handlebars`        | Panel con totales de servicios y reservas leidos de MongoDB                       |
| `/views/services`     | `services.handlebars`    | Listado de servicios (nombre, descripcion, duracion, precio, categoria, disponibilidad) y formulario de alta |
| `/views/availability` | `availability.handlebars`| Agenda de reservas agrupada por fecha con sus servicios populados, alta de reservas y consultas en vivo |

Las vistas **no tienen datos hardcodeados**: `views.controller.js` usa exactamente las mismas capas
que la API (`service -> repository -> DAO -> model`) y solo adapta los datos para la plantilla.

---

## Tiempo real con Socket.io

`public/js/socket.js` es el cliente; `src/sockets/index.js` son los handlers del servidor.
Los sockets **no tienen logica de negocio**: validan con los mismos esquemas de Zod y llaman a la
misma capa de services que la API REST.

**Eventos que emite el cliente**

| Evento            | Payload                        | Efecto                                              |
| ----------------- | ------------------------------ | --------------------------------------------------- |
| `service:create`  | datos del servicio             | Crea el servicio                                    |
| `service:toggle`  | `id`                           | Invierte la disponibilidad                          |
| `service:delete`  | `id`                           | Elimina el servicio                                 |
| `booking:create`  | datos de la reserva            | Crea la reserva                                     |
| `booking:status`  | `{ id, status }`               | Cambia el estado de la reserva                      |
| `booking:delete`  | `id`                           | Elimina la reserva                                  |
| `message:send`    | `{ user, text }`               | Guarda la consulta en MongoDB                       |

**Eventos que emite el servidor**

| Evento              | Cuando                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| `services:updated`  | Cada vez que se crea, actualiza o elimina un servicio                       |
| `bookings:updated`  | Cada vez que cambia una reserva o sus servicios                             |
| `message:new`       | Cada nueva consulta                                                         |
| `app:success` / `app:error` | Feedback puntual para el cliente que origino la accion              |

El broadcast se dispara desde la **capa de negocio** (`utils/realtime.js`), no desde el controller.
Por eso la vista se actualiza sin recargar la pagina tanto si el cambio se hizo desde el formulario
de la vista como si se hizo con un `POST /api/services` desde Postman o curl:

1. Abrir `http://localhost:8080/views/services` en el navegador.
2. Crear un servicio con `curl -X POST http://localhost:8080/api/services ...`.
3. La tabla del navegador incorpora la fila nueva al instante.

---

## Manejo de errores

Todos los errores pasan por `src/middlewares/error.middleware.js`, que devuelve siempre el mismo formato:

```json
{ "status": "error", "error": "No existe un servicio con id 6710a1f2c3d4e5f6a7b8c9d0" }
```

| Situacion                                    | Codigo |
| -------------------------------------------- | ------ |
| Body, query o params invalidos (Zod)          | `400`  |
| Id con formato invalido                       | `400`  |
| Recurso inexistente                           | `404`  |
| Ruta inexistente                              | `404`  |
| Servicio no disponible al agregarlo a una reserva | `409` |
| Error inesperado                              | `500`  |
