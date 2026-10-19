// js/pago/validaciones.js — Validaciones del lado del cliente

/**
 * Valida los datos de una tarjeta de crédito/débito
 */
export function validarTarjeta(numero, exp, cvv) {
  const numLimpio = String(numero || '').replace(/\s+/g, '');
  const expLimpia = String(exp || '').trim();
  const cvvLimpio = String(cvv || '').trim();

  if (numLimpio.length !== 16 || isNaN(numLimpio)) {
    return { valido: false, mensaje: 'Ingrese un número de tarjeta válido de 16 dígitos.' };
  }

  // Formato MM/AA
  const regexExp = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!regexExp.test(expLimpia)) {
    return { valido: false, mensaje: 'Ingrese una fecha de expiración válida en formato MM/AA.' };
  }

  if (cvvLimpio.length < 3 || cvvLimpio.length > 4 || isNaN(cvvLimpio)) {
    return { valido: false, mensaje: 'Ingrese un código CVV válido (3 o 4 dígitos).' };
  }

  return { valido: true, mensaje: 'Tarjeta válida.' };
}

/**
 * Valida los datos de pago con billeteras electrónicas (Yape / Plin / AndiPay)
 */
export function validarBilletera(celular, token) {
  const celLimpio = String(celular || '').trim();
  const tokenLimpio = String(token || '').trim();

  if (celLimpio.length !== 9 || isNaN(celLimpio) || !celLimpio.startsWith('9')) {
    return { valido: false, mensaje: 'Ingrese un número de celular válido de 9 dígitos que empiece con 9.' };
  }

  if (!tokenLimpio) {
    return { valido: false, mensaje: 'Ingrese el código de operación o token de la transacción.' };
  }

  return { valido: true, mensaje: 'Billetera válida.' };
}

/**
 * Valida según la forma de pago seleccionada
 */
export function validarDatosPago(metodo, datos = {}) {
  const metodoUpper = String(metodo || '').toUpperCase();

  if (metodoUpper === 'TARJETA') {
    return validarTarjeta(datos.tarjeta_numero, datos.tarjeta_exp, datos.tarjeta_cvv);
  } else if (metodoUpper === 'BILLETERA' || metodoUpper === 'YAPE' || metodoUpper === 'PLIN') {
    return validarBilletera(datos.billetera_celular, datos.billetera_token);
  } else if (metodoUpper === 'EFECTIVO' || metodoUpper === 'AGENCIA') {
    return { valido: true, mensaje: 'Reserva pendiente para pago presencial en caja.' };
  }

  return { valido: false, mensaje: 'Seleccione un método de pago válido.' };
}
