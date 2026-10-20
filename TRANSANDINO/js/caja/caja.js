// js/caja/caja.js — Módulo de Cobranza con Detección Automática de Pasarela

const API_COMPRAS_URL = '/api/compras';

// Elementos del DOM
const elNombreCajero = document.getElementById('nombre-cajero');
const btnCerrarSesion = document.getElementById('cerrar-sesion');

// Sección 1: Cobro presencial
const formBuscar = document.getElementById('form-buscar');
const inputCriterio = document.getElementById('criterio');
const tablaPendientesBody = document.querySelector('#tabla-pendientes tbody');

// Sección 2: Pasarela en línea
const inputFechaCaja = document.getElementById('fecha-caja');
const chkSoloVerificar = document.getElementById('solo-por-verificar');
const tablaEnLineaBody = document.querySelector('#tabla-en-linea tbody');
const avisoNuevos = document.getElementById('aviso-nuevos');

// Sección 3: Resumen de caja
const tablaResumenBody = document.querySelector('#tabla-resumen tbody');
const lblTotalDia = document.getElementById('total-dia');

// Diálogo modal nativo <dialog>
const dialogoCobro = document.getElementById('dialogo-cobro');
const formCobro = document.getElementById('form-cobro');
const lblCobroCodigo = document.getElementById('cobro-codigo');
const lblCobroTotal = document.getElementById('cobro-total');
const selMetodoCaja = document.getElementById('metodo-caja');
const boxCampoRecibido = document.getElementById('campo-recibido');
const inputMontoRecibido = document.getElementById('monto-recibido');
const outputVuelto = document.getElementById('vuelto');
const boxCampoReferencia = document.getElementById('campo-referencia');
const inputReferencia = document.getElementById('referencia');
const btnCancelarCobro = document.getElementById('cancelar-cobro');

let solicitudEnCobro = null;
let listaCompras = [];

function obtenerFechaFormato(f) {
  if (!f) return '';
  if (typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f)) return f;
  const d = new Date(f);
  if (isNaN(d.getTime())) return String(f).split('T')[0];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const userObj = JSON.parse(localStorage.getItem('user')) || {};
  const emailObj = localStorage.getItem('userEmail');
  const nombreCajero = userObj.nombre || (emailObj ? emailObj.split('@')[0] : 'Cajero Agencia');
  if (elNombreCajero) elNombreCajero.textContent = nombreCajero;

  const hoyStr = obtenerFechaFormato(new Date());
  if (inputFechaCaja) {
    inputFechaCaja.value = hoyStr;
    inputFechaCaja.addEventListener('change', renderizarModuloCaja);
  }

  if (chkSoloVerificar) {
    chkSoloVerificar.addEventListener('change', renderizarModuloCaja);
  }

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = 'login.html';
    });
  }

  if (formBuscar) {
    formBuscar.addEventListener('submit', (e) => {
      e.preventDefault();
      renderizarPendientes(inputCriterio.value.trim());
    });
  }

  if (selMetodoCaja) {
    selMetodoCaja.addEventListener('change', alternarCamposPago);
  }

  if (inputMontoRecibido) {
    inputMontoRecibido.addEventListener('input', calcularVuelto);
  }

  if (btnCancelarCobro) {
    btnCancelarCobro.addEventListener('click', () => {
      if (dialogoCobro) dialogoCobro.close();
    });
  }

  if (formCobro) {
    formCobro.addEventListener('submit', procesarCobroPresencial);
  }

  await cargarDatos();
});

async function cargarDatos() {
  let dbCompras = [];
  let localCompras = [];

  try {
    const res = await fetch(API_COMPRAS_URL);
    if (res.ok) dbCompras = await res.json();
  } catch (err) {
    console.warn('Error fetching API, usando local data...');
  }

  try {
    localCompras = JSON.parse(localStorage.getItem('compras_pasajes')) || [];
  } catch (e) {}

  const mapa = new Map();
  [...dbCompras, ...localCompras].forEach(item => {
    const key = item.id ? `id_${item.id}` : `res_${item.codigo_reserva || item.codigo_seguimiento}_${item.asiento || item.num_asiento}`;
    const existente = mapa.get(key) || {};
    mapa.set(key, { ...existente, ...item });
  });

  listaCompras = Array.from(mapa.values());
  renderizarModuloCaja();
}

function renderizarModuloCaja() {
  renderizarPendientes(inputCriterio ? inputCriterio.value.trim() : '');
  renderizarEnLinea();
  renderizarResumenCierre();
}

function renderizarPendientes(criterio = '') {
  if (!tablaPendientesBody) return;
  tablaPendientesBody.innerHTML = '';

  const q = criterio.toLowerCase();

  const pendientes = listaCompras.filter(item => {
    const est = String(item.estado || 'PENDIENTE').toUpperCase();
    const esPendiente = (est === 'PENDIENTE' || est === 'REGISTRADO');
    if (!esPendiente) return false;

    if (!q) return true;

    const cod = String(item.codigo_seguimiento || item.codigo_reserva || item.id || '').toLowerCase();
    const cliente = String(item.registrado_por || item.id_usuario || item.pasajero || '').toLowerCase();
    const dni = String(item.dni || '').toLowerCase();

    return cod.includes(q) || cliente.includes(q) || dni.includes(q);
  });

  if (pendientes.length === 0) {
    tablaPendientesBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 1rem;">No hay solicitudes pendientes de pago.</td></tr>';
    return;
  }

  pendientes.forEach(item => {
    const tr = document.createElement('tr');
    const codigo = item.codigo_seguimiento || item.codigo_reserva || `SOL-${item.id}`;
    const cliente = item.registrado_por || item.id_usuario || item.pasajero || 'Cliente';
    const dni = item.dni || '-';
    
    let monto = parseFloat(item.monto_calculado || item.precio || 0);
    if (!monto || monto === 0) {
      const esCama = String(item.tipo_asiento || '').toLowerCase().includes('cama');
      const base = esCama ? 85 : 60;
      const kg = parseFloat(item.equipaje_kg || 0);
      monto = base + (Math.max(0, kg - 20) * 4);
    }

    tr.innerHTML = `
      <td><strong>${codigo}</strong></td>
      <td>${cliente}</td>
      <td>${dni}</td>
      <td style="color: #16a34a; font-weight: bold;">S/ ${monto.toFixed(2)}</td>
      <td><button type="button" class="btn-cobrar" style="background:#16a34a; color:#fff; border:none; padding:0.4rem 0.8rem; border-radius:6px; cursor:pointer;" data-id="${item.id}">💵 Cobrar</button></td>
    `;

    tr.querySelector('.btn-cobrar').addEventListener('click', () => abrirDialogoCobro(item, monto));
    tablaPendientesBody.appendChild(tr);
  });
}

function abrirDialogoCobro(item, monto) {
  solicitudEnCobro = { ...item, _montoCobro: monto };

  const codigo = item.codigo_seguimiento || item.codigo_reserva || `SOL-${item.id}`;
  lblCobroCodigo.textContent = codigo;
  lblCobroTotal.textContent = `S/ ${monto.toFixed(2)}`;

  selMetodoCaja.value = 'efectivo';
  inputMontoRecibido.value = '';
  outputVuelto.textContent = 'S/ 0.00';
  inputReferencia.value = '';

  alternarCamposPago();

  if (dialogoCobro) dialogoCobro.showModal();
}

function alternarCamposPago() {
  const metodo = selMetodoCaja.value;
  if (metodo === 'efectivo') {
    boxCampoRecibido.hidden = false;
    boxCampoReferencia.hidden = true;
  } else {
    boxCampoRecibido.hidden = true;
    boxCampoReferencia.hidden = false;
  }
}

function calcularVuelto() {
  if (!solicitudEnCobro) return;
  const recibido = parseFloat(inputMontoRecibido.value) || 0;
  const vuelto = Math.max(0, recibido - solicitudEnCobro._montoCobro);
  outputVuelto.textContent = `S/ ${vuelto.toFixed(2)}`;
}

async function procesarCobroPresencial(e) {
  e.preventDefault();
  if (!solicitudEnCobro) return;

  const metodo = selMetodoCaja.value;
  const monto = solicitudEnCobro._montoCobro;

  if (metodo === 'efectivo') {
    const recibido = parseFloat(inputMontoRecibido.value) || 0;
    if (recibido < monto) {
      alert(`El monto recibido (S/ ${recibido.toFixed(2)}) es menor al total a pagar (S/ ${monto.toFixed(2)}).`);
      return;
    }
  } else {
    if (!inputReferencia.value.trim()) {
      alert('Por favor ingrese el N.° de voucher u operación.');
      return;
    }
  }

  const hoyISO = obtenerFechaFormato(new Date());
  const payloadUpdate = {
    id: solicitudEnCobro.id,
    estado: 'PAGADO',
    metodo_pago: 'EFECTIVO-CAJA',
    monto_calculado: monto,
    precio: monto,
    referencia_pago: inputReferencia.value.trim() || 'EFECTIVO-CAJA',
    fecha_pago: hoyISO
  };

  try {
    await fetch(`${API_COMPRAS_URL}?id=${solicitudEnCobro.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadUpdate)
    });
  } catch (err) {
    console.log('Actualizando datos en almacenamiento local...');
  }

  listaCompras = listaCompras.map(c => {
    if (String(c.id) === String(solicitudEnCobro.id)) {
      return { ...c, ...payloadUpdate };
    }
    return c;
  });
  localStorage.setItem('compras_pasajes', JSON.stringify(listaCompras));

  if (dialogoCobro) dialogoCobro.close();
  alert(`¡Cobro registrado con éxito para la solicitud ${lblCobroCodigo.textContent}!`);

  renderizarModuloCaja();
}

// Renderizado de Pagos por Pasarela (Detección flexible de PAGADO en línea)
function renderizarEnLinea() {
  if (!tablaEnLineaBody) return;
  tablaEnLineaBody.innerHTML = '';

  const fechaFiltro = inputFechaCaja ? inputFechaCaja.value : '';
  const soloVerificar = chkSoloVerificar ? chkSoloVerificar.checked : false;

  const enLinea = listaCompras.filter(item => {
    const est = String(item.estado || '').toUpperCase();
    const metodo = String(item.metodo_pago || item.metodo || '').toUpperCase();

    // Si está PAGADO y NO fue cobrado presencialmente en caja con EFECTIVO
    const esOnline = (est === 'PAGADO' || est === 'ATENDIDO') && metodo !== 'EFECTIVO-CAJA';

    if (!esOnline) return false;

    // Comparar con filtro de fecha si se especificó
    if (fechaFiltro) {
      const fPago = obtenerFechaFormato(item.fecha_pago || item.created_at || item.fecha_viaje || item.fecha);
      if (fPago && fPago !== fechaFiltro) return false;
    }

    if (soloVerificar && item.verificado) return false;

    return true;
  });

  if (avisoNuevos) {
    avisoNuevos.textContent = enLinea.length > 0 
      ? `Se encontraron ${enLinea.length} operaciones en línea.` 
      : 'No hay operaciones registradas en esta fecha.';
  }

  if (enLinea.length === 0) {
    tablaEnLineaBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 1rem;">Sin operaciones en línea para mostrar en esta fecha.</td></tr>';
    return;
  }

  enLinea.forEach((item, index) => {
    const tr = document.createElement('tr');
    const hora = item.fecha_pago ? new Date(item.fecha_pago).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '07:00 PM';
    const operacion = item.id_transaccion || item.codigo_autorizacion || `TXN-${100000 + index}`;
    const solicitud = item.codigo_seguimiento || item.codigo_reserva || `TA-${item.id || (1000 + index)}`;
    const cliente = item.registrado_por || item.pasajero || item.id_usuario || 'Cliente Web';
    const medio = item.metodo_pago || item.metodo || 'TARJETA';
    const monto = parseFloat(item.monto_calculado || item.precio || 85);

    const estadoVerificacion = item.verificado ? '✅ Verificado' : '⏳ Pendiente';

    tr.innerHTML = `
      <td>${hora}</td>
      <td><small style="font-family: monospace;">${operacion}</small></td>
      <td><strong>${solicitud}</strong></td>
      <td>${cliente}</td>
      <td>${medio}</td>
      <td style="color: #16a34a; font-weight: bold;">S/ ${monto.toFixed(2)}</td>
      <td><span style="background: #16a34a; color:#fff; padding:0.2rem 0.5rem; border-radius:10px; font-size:0.75rem;">${item.estado || 'PAGADO'}</span></td>
      <td>${estadoVerificacion}</td>
    `;

    tablaEnLineaBody.appendChild(tr);
  });
}

function renderizarResumenCierre() {
  if (!tablaResumenBody) return;
  tablaResumenBody.innerHTML = '';

  const pagados = listaCompras.filter(item => {
    const est = String(item.estado || '').toUpperCase();
    return (est === 'PAGADO' || est === 'ATENDIDO' || est === 'EMITIDO');
  });

  const resumenMap = {};

  pagados.forEach(item => {
    const metodo = String(item.metodo_pago || item.metodo || 'TARJETA').toUpperCase();
    let canal = 'Web / Pasarela';
    if (metodo === 'EFECTIVO-CAJA' || metodo === 'EFECTIVO') canal = 'Agencia';

    const clave = `${canal} - ${metodo}`;

    let monto = parseFloat(item.monto_calculado || item.precio || 0);
    if (isNaN(monto) || monto === 0) monto = 85;

    if (!resumenMap[clave]) {
      resumenMap[clave] = { canal, medio: metodo, ops: 0, total: 0 };
    }

    resumenMap[clave].ops += 1;
    resumenMap[clave].total += monto;
  });

  let totalGeneral = 0;
  const filas = Object.values(resumenMap);

  if (filas.length === 0) {
    tablaResumenBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 1rem;">No hay cobranzas registradas.</td></tr>';
  } else {
    filas.forEach(row => {
      totalGeneral += row.total;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.canal}</td>
        <td>${row.medio}</td>
        <td>${row.ops} operaciones</td>
        <td style="color: #16a34a; font-weight: bold;">S/ ${row.total.toFixed(2)}</td>
      `;
      tablaResumenBody.appendChild(tr);
    });
  }

  if (lblTotalDia) {
    lblTotalDia.textContent = `S/ ${totalGeneral.toFixed(2)}`;
  }
}
