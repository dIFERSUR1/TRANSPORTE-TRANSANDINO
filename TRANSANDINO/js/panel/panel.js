document.addEventListener('DOMContentLoaded', cargarTodosLosPasajes);

async function cargarTodosLosPasajes() {
  const tbody = document.getElementById('panel-tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:#94a3b8; padding:1.5rem;">Cargando registros...</td></tr>';

  try {
    const res = await fetch('/api/compras');
    if (!res.ok) throw new Error('Error al conectar con la base de datos.');

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

async function cambiarEstado(id, nuevoEstado) {
  try {
    const res = await fetch(`/api/compras?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (res.ok) cargarTodosLosPasajes();
  } catch (error) {
    console.error('Error al cambiar estado:', error);
  }
}

async function eliminarRegistro(id) {
  if (confirm(`¿Seguro de que deseas eliminar permanentemente el registro #${id}?`)) {
    try {
      const res = await fetch(`/api/compras?id=${id}`, { method: 'DELETE' });
      if (res.ok) cargarTodosLosPasajes();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  }
}
