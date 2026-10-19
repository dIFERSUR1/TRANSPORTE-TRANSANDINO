// js/registro/tarifario.js
// Función PURA: recibe datos y devuelve un número. No toca el DOM ni la base de datos.

export function redondear(valor) {
  return Math.round(valor * 100) / 100;
}

export function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto);
}

// Utilidad: un checkbox marcado llega en FormData como 'on'; si no está marcado, NO llega
export const marcado = (valor) => valor === 'on';

/**
 * Regla de Negocio de TransAndino Perú:
 * - Base Semicama (2.º piso): S/ 60.00
 * - Base Cama (1.er piso): S/ 85.00
 * - Equipaje: 20 kg libres. Recargo de S/ 4.00 por cada kg de exceso.
 */
export function calcularMontoServicio(datos) {
  const tipoAsiento = String(datos.tipo_asiento || '').toLowerCase();
  const esCama = tipoAsiento.includes('cama') && !tipoAsiento.includes('semi');
  
  // Precio base según tipo de asiento
  const precioBase = esCama ? 85.00 : 60.00;
  
  // Cálculo de exceso de equipaje (mayor a 20 kg)
  const equipajeKg = Number(datos.equipaje_kg || datos.peso || datos.equipaje || 0);
  const kgExceso = Math.max(0, equipajeKg - 20);
  const montoExceso = kgExceso * 4.00;

  const total = precioBase + montoExceso;
  return redondear(total);
}
