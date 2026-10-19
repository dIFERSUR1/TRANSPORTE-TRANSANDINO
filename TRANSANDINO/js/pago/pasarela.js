// js/pago/pasarela.js — Autorización simulada y transacción

import { validarDatosPago } from './validaciones.js';

/**
 * Simula el procesamiento y la autorización de una transacción de pago.
 * @param {Object} datosPago - Datos enviados desde la interfaz (método, datos de tarjeta/billetera, monto, id_solicitud).
 * @returns {Promise<Object>} Resultado de la transacción.
 */
export async function procesarPagoPasarela(datosPago) {
  // 1. Ejecutar validaciones previas de formato
  const validacion = validarDatosPago(datosPago.metodo, datosPago);
  if (!validacion.valido) {
    return {
      exito: false,
      estado: 'RECHAZADO',
      mensaje: validacion.mensaje,
      idTransaccion: null,
      codigoAutorizacion: null
    };
  }

  // 2. Simular latencia de red de la pasarela (1.5 segundos)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 3. Reglas de prueba simuladas para rechazo
  const numTarjeta = String(datosPago.tarjeta_numero || '').replace(/\s+/g, '');
  const token = String(datosPago.billetera_token || '').trim();

  // Si la tarjeta o el token terminan en '0000', simula fondo insuficiente / rechazo
  if (numTarjeta.endsWith('0000') || token === '0000') {
    return {
      exito: false,
      estado: 'RECHAZADO',
      mensaje: 'Transacción rechazada por la entidad bancaria (Fondos insuficientes o tarjeta bloqueada).',
      idTransaccion: null,
      codigoAutorizacion: null
    };
  }

  // 4. Generación de identificadores únicos de transacción autorizada
  const idTransaccion = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
  const codigoAutorizacion = 'AUTH-' + Math.floor(100000 + Math.random() * 900000);

  return {
    exito: true,
    estado: 'APROBADO',
    mensaje: '¡Pago autorizado y procesado con éxito!',
    idTransaccion: idTransaccion,
    codigoAutorizacion: codigoAutorizacion,
    monto: parseFloat(datosPago.monto) || 0,
    metodo: datosPago.metodo,
    fecha: new Date().toISOString()
  };
}
