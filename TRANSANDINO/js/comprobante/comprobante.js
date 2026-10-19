// js/comprobante/comprobante.js — Generación dinámica de la constancia de pago

const API_COMPRAS_URL = '/api/compras';

document.addEventListener('DOMContentLoaded', async () => {
  const btnImprimir = document.getElementById('imprimir');
  if (btnImprimir) {
    btnImprimir.addEventListener('click', () => {
      window.print();
    });
  }

  await cargarConstancia();
});

async function cargarConstancia() {
  const contenedor = document.getElementById('comprobante');
  if (!contenedor) return;

  // Obtener ID o Código desde los parámetros de la URL (?id=... o ?codigo=...)
  const params = new URLSearchParams(window.location.search);
  const idBusqueda = params.get('id');
  const codigoBusqueda = params.get('codigo') || params.get('codigo_reserva');

  if (!idBusqueda && !codigoBusqueda) {
    contenedor.innerHTML = `
      <div style="text-align: center; color: #ef4444;">
        <p>⚠️ No se especificó ningún número de comprobante o reserva.</p>
      </div>
    `;
    return;
  }

  let registro = null;

  try {
    const res = await fetch(API_COMPRAS_URL);
    if (res.ok) {
      const lista = await res.json();
      registro = buscarRegistroEnLista(lista, idBusqueda, codigoBusqueda);
    }
  } catch (err) {
    console.log('Buscando constancia en almacenamiento local...');
  }

  if (!registro) {
    const listaLocal = JSON.parse(localStorage.getItem('compras_pasajes')) || [];
    registro = buscarRegistroEnLista(listaLocal, idBusqueda, codigoBusqueda);
  }

  if (!registro) {
    contenedor.innerHTML = `
      <div style="text-align: center; color: #ef4444;">
        <p>❌ No se encontró la constancia solicitada.</p>
      </div>
    `;
    return;
  }

  renderizarConstancia(registro);
}

function buscarRegistroEnLista(lista, id, codigo) {
  if (!Array.isArray(lista)) return null;
  return lista.find(item => {
    const matchId = id && String(item.id) === String(id);
    const matchCod = codigo && (
      String(item.codigo_reserva || '').toLowerCase() === String(codigo).toLowerCase() ||
      String(item.codigo_seguimiento || '').toLowerCase() === String(codigo).toLowerCase()
    );
    return matchId || matchCod;
  });
}

function renderizarConstancia(data) {
  const contenedor = document.getElementById('comprobante');

  const codigo = data.codigo_reserva || data.codigo_seguimiento || `TA-${data.id || '0001'}`;
  const cliente = data.registrado_por || data.id_usuario || data.pasajero || 'Cliente TransAndino';
  const ruta = `${data.origen || 'Ica'} ➔ ${data.destino || 'Lima'}`;
  
  const fechaRaw = data.fecha_viaje || data.fecha || '';
  const fechaViaje = fechaRaw ? fechaRaw.split('T')[0] : 'N/A';
  const horaViaje = data.hora_viaje || data.hora || '09:00 AM';

  const asiento = data.num_asiento || data.asiento || '-';
  const tipoAsiento = data.tipo_asiento || 'Semicama';
  const equipajeKg = parseFloat(data.equipaje_kg || data.equipaje || data.peso || 0);

  const monto = parseFloat(data.monto_calculado || data.precio || 0);
  const estado = String(data.estado || 'PAGADO').toUpperCase();
  const metodoPago = String(data.metodo_pago || 'TARJETA').toUpperCase();
  
  const fechaPagoRaw = data.fecha_pago || data.created_at || new Date().toISOString();
  const fechaPago = new Date(fechaPagoRaw).toLocaleString('es-PE');
  
  const idTransaccion = data.id_transaccion || `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const codigoAutorizacion = data.codigo_autorizacion || `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;

  contenedor.innerHTML = `
    <div class="voucher-header">
      <h2>🚌 TransAndino Perú</h2>
      <p>COMPROBANTE ELECTRÓNICO DE PAGO</p>
      <p style="font-size: 0.75rem; font-family: monospace;">N.º OPERACIÓN: ${idTransaccion}</p>
    </div>

    <div class="voucher-grid">
      <div class="voucher-item">
        <label>Código Reserva:</label>
        <span style="color: var(--cyan-light);">${codigo}</span>
      </div>
      <div class="voucher-item">
        <label>Estado de Pago:</label>
        <span style="color: #16a34a;">${estado}</span>
      </div>
      <div class="voucher-item">
        <label>Pasajero:</label>
        <span>${cliente}</span>
      </div>
      <div class="voucher-item">
        <label>Medio de Pago:</label>
        <span>${metodoPago}</span>
      </div>
      <div class="voucher-item">
        <label>Ruta de Viaje:</label>
        <span>${ruta}</span>
      </div>
      <div class="voucher-item">
        <label>Fecha y Hora:</label>
        <span>${fechaViaje} (${horaViaje})</span>
      </div>
      <div class="voucher-item">
        <label>Asiento / Servicio:</label>
        <span>N.º ${asiento} (${tipoAsiento})</span>
      </div>
      <div class="voucher-item">
        <label>Equipaje Registrar:</label>
        <span>${equipajeKg} kg</span>
      </div>
      <div class="voucher-item">
        <label>Cód. Autorización:</label>
        <span style="font-family: monospace;">${codigoAutorizacion}</span>
      </div>
      <div class="voucher-item">
        <label>Fecha Emisión:</label>
        <span>${fechaPago}</span>
      </div>
    </div>

    <div class="voucher-total">
      <label>Monto Total Pagado:</label>
      <span>S/ ${monto.toFixed(2)}</span>
    </div>
  `;
}
