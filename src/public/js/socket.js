/* global io */

/**
 * Cliente de Socket.io.
 *
 * Escucha los eventos que emite el servidor cuando ocurre una accion real del
 * sistema (crear/eliminar/actualizar un servicio, crear o cambiar una reserva,
 * enviar una consulta) y actualiza la vista sin recargar la pagina.
 * Tambien emite eventos hacia el servidor desde los formularios.
 */
const socket = io();

/* ----------------------------- Utilidades UI ----------------------------- */

const toast = document.getElementById('toast');
let toastTimer = null;

const showToast = (message, type = 'ok') => {
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 4000);
};

const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])
  );

const currency = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

socket.on('app:error', (message) => showToast(message, 'error'));
socket.on('app:success', (message) => showToast(message, 'ok'));

/* ------------------------------- Servicios ------------------------------- */

const servicesList = document.getElementById('services-list');
const servicesCount = document.getElementById('services-count');
const serviceForm = document.getElementById('service-form');
const serviceSelect = document.getElementById('service-select');

const renderServices = (services) => {
  if (servicesCount) servicesCount.textContent = services.length;

  if (servicesList) {
    servicesList.innerHTML = services.length
      ? services
          .map(
            (service) => `
        <tr data-id="${service.id}">
          <td>${escapeHtml(service.name)}</td>
          <td class="muted">${escapeHtml(service.description)}</td>
          <td><span class="chip">${escapeHtml(service.category)}</span></td>
          <td>${Number(service.duration)} min</td>
          <td>${currency(service.price)}</td>
          <td>${service.available ? '<span class="tag ok">Si</span>' : '<span class="tag off">No</span>'}</td>
          <td class="actions">
            <button class="btn small" data-action="toggle" data-id="${service.id}">Cambiar</button>
            <button class="btn small danger" data-action="delete" data-id="${service.id}">Eliminar</button>
          </td>
        </tr>`
          )
          .join('')
      : '<tr class="empty-row"><td colspan="7">Todavia no hay servicios cargados.</td></tr>';
  }

  // El select de la vista de disponibilidad tambien se mantiene al dia.
  if (serviceSelect) {
    const selected = serviceSelect.value;
    const options = services
      .filter((service) => service.available)
      .map(
        (service) =>
          `<option value="${service.id}">${escapeHtml(service.name)} - ${currency(service.price)}</option>`
      )
      .join('');
    serviceSelect.innerHTML = `<option value="">Sin servicios (se agregan despues)</option>${options}`;
    serviceSelect.value = selected;
  }
};

socket.on('services:updated', renderServices);

if (serviceForm) {
  serviceForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(serviceForm);

    socket.emit('service:create', {
      name: data.get('name').trim(),
      description: data.get('description').trim(),
      category: data.get('category').trim(),
      duration: Number(data.get('duration')),
      price: Number(data.get('price')),
      available: data.get('available') === 'on',
    });

    serviceForm.reset();
  });
}

if (servicesList) {
  servicesList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === 'delete') socket.emit('service:delete', id);
    if (action === 'toggle') socket.emit('service:toggle', id);
  });
}

/* -------------------------------- Reservas ------------------------------- */

const agenda = document.getElementById('agenda');
const bookingForm = document.getElementById('booking-form');

const renderAgenda = (bookings) => {
  if (!agenda) return;

  if (!bookings.length) {
    agenda.innerHTML = '<p class="muted">Todavia no hay reservas cargadas.</p>';
    return;
  }

  const byDate = bookings.reduce((acc, booking) => {
    (acc[booking.date] = acc[booking.date] ?? []).push(booking);
    return acc;
  }, {});

  agenda.innerHTML = Object.keys(byDate)
    .sort()
    .map((date) => {
      const items = byDate[date]
        .sort((a, b) => a.time.localeCompare(b.time))
        .map((booking) => {
          const services = booking.services.length
            ? booking.services
                .map(
                  (item) =>
                    `<li>${escapeHtml(item.service?.name ?? 'Servicio')} <span class="muted">x${item.quantity}</span>
                     <span class="muted">(${currency(item.service?.price)})</span></li>`
                )
                .join('')
            : '<li class="muted">Sin servicios asociados</li>';

          return `
            <li class="booking" data-id="${booking.id}">
              <div class="booking-head">
                <strong>${escapeHtml(booking.time)}</strong>
                <span>${escapeHtml(booking.clientName)}</span>
                <span class="muted">${escapeHtml(booking.clientEmail)}</span>
                <span class="tag status-${booking.status}">${STATUS_LABELS[booking.status] ?? booking.status}</span>
              </div>
              <ul class="booking-services">${services}</ul>
              <div class="booking-foot">
                <span class="muted">Total estimado: ${currency(booking.totalPrice)} - ${Number(
            booking.totalDuration
          )} min</span>
                <span class="actions">
                  <button class="btn small" data-booking-action="confirmed" data-id="${booking.id}">Confirmar</button>
                  <button class="btn small" data-booking-action="cancelled" data-id="${booking.id}">Cancelar</button>
                  <button class="btn small danger" data-booking-action="delete" data-id="${booking.id}">Eliminar</button>
                </span>
              </div>
            </li>`;
        })
        .join('');

      return `<div class="agenda-day"><h3 class="agenda-date">${escapeHtml(date)}</h3><ul class="list">${items}</ul></div>`;
    })
    .join('');
};

socket.on('bookings:updated', renderAgenda);

if (bookingForm) {
  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(bookingForm);
    const serviceId = data.get('service');

    socket.emit('booking:create', {
      clientName: data.get('clientName').trim(),
      clientEmail: data.get('clientEmail').trim(),
      date: data.get('date'),
      time: data.get('time'),
      services: serviceId ? [{ service: serviceId, quantity: 1 }] : [],
    });

    bookingForm.reset();
  });
}

if (agenda) {
  agenda.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-booking-action]');
    if (!button) return;

    const { bookingAction, id } = button.dataset;
    if (bookingAction === 'delete') socket.emit('booking:delete', id);
    else socket.emit('booking:status', { id, status: bookingAction });
  });
}

/* -------------------------------- Mensajes ------------------------------- */

const messagesList = document.getElementById('messages');
const messageForm = document.getElementById('message-form');

const renderMessages = (messages) => {
  if (!messagesList) return;
  messagesList.innerHTML = messages.length
    ? messages
        .map((message) => `<li><strong>${escapeHtml(message.user)}:</strong> ${escapeHtml(message.text)}</li>`)
        .join('')
    : '<li class="muted">Sin consultas todavia.</li>';
  messagesList.scrollTop = messagesList.scrollHeight;
};

socket.on('messages:history', renderMessages);

socket.on('message:new', (message) => {
  if (!messagesList) return;
  const placeholder = messagesList.querySelector('.muted');
  if (placeholder) placeholder.remove();

  const item = document.createElement('li');
  item.innerHTML = `<strong>${escapeHtml(message.user)}:</strong> ${escapeHtml(message.text)}`;
  messagesList.appendChild(item);
  messagesList.scrollTop = messagesList.scrollHeight;
});

if (messageForm) {
  messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(messageForm);

    socket.emit('message:send', {
      user: data.get('user').trim(),
      text: data.get('text').trim(),
    });

    messageForm.querySelector('input[name="text"]').value = '';
  });
}
