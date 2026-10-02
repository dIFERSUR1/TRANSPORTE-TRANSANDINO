document.addEventListener('DOMContentLoaded', () => {
  cargarTodosLosPasajes();
  cargarTablaAsientos();
});

// 1. Cargar la tabla principal de Pasajes / Precios
async function cargarTodosLosPasajes() {
  const tbody = document.getElementById('panel-tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:#94a3b8; padding:1.5rem;">Cargando registros...</td></tr>';

  try {
    const res = await fetch('/api/compras');
    if (!res.ok) throw new Error('Error al conectar con la BD.');

    const pasajes = await res.json();
    tbody.innerHTML = '';

    if (!Array.isArray(pasajes) || pasajes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#94a3b8; padding:1.5rem;">No hay pasajes registrados.</td></tr>`;
      return;
    }

    pasajes.forEach((item) => {
      const tr = document.createElement('tr');
      const fechaViaje = item.fecha_viaje || item.fecha || '-';
      const horaViaje = item.hora_viaje || item.hora || '08:00 AM';
      const asiento = item.num_asiento || item.asiento || '-';

      tr.innerHTML = `
        <td>#${item.id}</td>
        <td><strong>ID: ${item.id_usuario || '1'}</strong></td>
        <td>${item.origen}</td>
        <td>${item.destino}</td>
        <td>${fechaViaje}</td>
        <td>${horaViaje}</td>
        <td>Asiento ${asiento}</td>
        <td style="color:#22c55e; font-weight:bold;">S/ ${item.precio || 0}.00</td>
        <td>
          <select onchange="cambiarEstado(${item.id}, this.value)" style="background:#070f1e; color:white; border:1px solid #1e293b; padding:0.2rem; border-radius:4px;">
            <option value="registrado" ${item.estado === 'registrado' ? 'selected' : ''}>registrado</option>
            <option value="atendido" ${item.estado === 'atendido' ? 'selected' : ''}>atendido</option>
            <option value="cancelado" ${item.estado === 'cancelado' ? 'selected' : ''}>cancelado</option>
          </select>
        </td>
        <td>
          <button class="btn-action btn-update" onclick="actualizarRegistro(${item.id}, '${item.origen}', '${item.destino}', '${fechaViaje}', ${item.precio || 0})">Actualizar</button>
          <button class="btn-action btn-delete" onclick="eliminarRegistro(${item.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error al cargar pasajes:', error);
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#ef4444; padding:1.5rem;">Error al cargar registros desde la base de datos.</td></tr>`;
  }
}

// 2. Cargar la vista de la pestaña "Asientos de Bus"
async function cargarTablaAsientos() {
  const tbodyAsientos = document.getElementById('asientos-tbody') || document.querySelector('.table-container table tbody');
  if (!tbodyAsientos) return;

  try {
    const res = await fetch('/api/compras');
    if (!res.ok) return;

    const pasajes = await res.json();
    
    // Si no estamos en la pestaña de asientos, retornar
    if (!document.querySelector('th:nth-child(1)')?.textContent.includes('N° Asiento')) {
      return;
    }

    tbodyAsientos.innerHTML = '';

    if (!Array.isArray(pasajes) || pasajes.length === 0) {
      tbodyAsientos.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:1.5rem;">No hay asientos asignados actualmente.</td></tr>`;
      return;
    }

    pasajes.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color:#ea580c; font-weight:bold;">Asiento ${item.num_asiento || item.asiento || '-'}</td>
        <td>Usuario #${item.id_usuario || '1'}</td>
        <td>${item.origen} ➔ ${item.destino}</td>
        <td><span style="color:${item.estado === 'cancelado' ? '#ef4444' : '#22c55e'}; font-weight:bold;">${item.estado || 'Ocupado'}</span></td>
        <td>
          <button class="btn-action btn-delete" onclick="eliminarRegistro(${item.id})">Liberar Asiento</button>
        </td>
      `;
      tbodyAsientos.appendChild(tr);
    });
  } catch (error) {
    console.error('Error al cargar asientos:', error);
  }
}

// 3. Cambiar estado de un pasaje
async function cambiarEstado(id, nuevoEstado) {
  try {
    const res = await fetch(`/api/compras?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (res.ok) {
      cargarTodosLosPasajes();
      cargarTablaAsientos();
    }
  } catch (error) {
    console.error('Error al cambiar estado:', error);
  }
}
async function eliminarRegistro(id) {
  if (confirm(`¿Seguro que deseas eliminar/liberar la reserva #${id}?`)) {
    try {
      const res = await fetch(`/api/compras?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        cargarTodosLosPasajes();
        cargarTablaAsientos();
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  }
}
