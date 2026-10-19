// js/registro/registro.js — Cotizador en vivo + INSERT con monto
import { sql } from '../config/neon-config.js';
import { exigirRol } from '../auth/auth.js';
import { calcularMontoServicio, formatearSoles } from './tarifario.js';

// Restringir acceso solo a clientes
const usuario = exigirRol('cliente');
if (!usuario) throw new Error('Acceso denegado');

const form = document.querySelector('#form-registro');
const salidaMonto = document.querySelector('#monto-estimado');

const leerFormulario = () => Object.fromEntries(new FormData(form));

function actualizarCotizacion() {
  if (salidaMonto) {
    salidaMonto.textContent = formatearSoles(calcularMontoServicio(leerFormulario()));
  }
}

// Escuchar cambios en los inputs/selects para actualizar la cotización en vivo
if (form) {
  form.addEventListener('input', actualizarCotizacion);
  form.addEventListener('change', actualizarCotizacion);
  actualizarCotizacion();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const datos = leerFormulario();
    const monto = calcularMontoServicio(datos);
    const estadoPago = monto === 0 ? 'exonerado' : 'pendiente';
    const codigo = 'SOL-' + Date.now().toString().slice(-8);
    const boton = form.querySelector('button[type="submit"]');
    if (boton) boton.disabled = true;

    try {
      // Inserción en la tabla compras_pasajes con las columnas del proyecto
      const filas = await sql`
        INSERT INTO compras_pasajes (
          codigo_seguimiento,
          origen,
          destino,
          tipo_asiento,
          equipaje_kg,
          id_usuario,
          monto_calculado,
          estado_pago,
          estado
        )
        VALUES (
          ${codigo},
          ${datos.origen || 'Ica'},
          ${datos.destino || 'Lima'},
          ${datos.tipo_asiento || 'semicama'},
          ${parseFloat(datos.equipaje_kg) || 0},
          ${usuario.id || '1'},
          ${monto},
          ${estadoPago},
          'registrado'
        )
        RETURNING id;
      `;

      if (estadoPago === 'pendiente') {
        window.location.href = `pago.html?id=${filas[0].id}`;
      } else {
        alert(`Solicitud ${codigo} registrada. Tu trámite está exonerado de pago.`);
        window.location.href = 'consulta.html';
      }
    } catch (error) {
      console.error('Error al registrar en la base de datos:', error);
      alert('Ocurrió un error al procesar el registro.');
      if (boton) boton.disabled = false;
    }
  });
}
