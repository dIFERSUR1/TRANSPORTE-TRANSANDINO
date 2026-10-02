document.addEventListener('DOMContentLoaded', () => {
  cargarTodosLosPasajes();
  cargarTablaAsientos();
});

async function cargarTodosLosPasajes() {
  const tbody = document.getElementById('panel-tbody') || document.querySelector('table tbody');
  if (!tbody) return;

  if (document.querySelector('th:nth-child(1)')?.textContent.includes('N° Asiento')) return;

  tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:#94a3b8; padding:1.5rem;">Cargando registros desde la base de datos...</td></tr>';

  try {
    const res = await fetch('/api/compras');
    if (!res.ok) throw new Error('Error al conectar con la API.');

    const pasajes = await res.json();
    tbody.innerHTML = '';

    if (!Array.isArray(pasajes) || pasajes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#94a3b8; padding:1.5rem;">No hay pasajes registrados.</td></tr>`;
      return;
    }

    pasajes.forEach((item) => {
      const tr = document.createElement('tr');
      
      // Mapeo exacto con la tabla compras_pasajes de Neon
      const fechaViaje = item.fecha ? (typeof item.fecha === 'string' ? item.fecha.split('T')[0] : item.fecha) : (item.fecha_viaje || '-');
      const horaViaje = item.hora || item.hora_viaje || '09:00 AM';
      const asiento = item.asiento || item.num_asiento || '1';

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
          <select onchange="cambiarEstado(${item.id}, this.value)" style="background:#070f1e; color:white; border:1px solid #1e293b; padding:0.3rem; border-radius:4px;">
            <option value="registrado" ${item.estado === 'registrado' ? 'selected' : ''}>registrado</option>
            <option value="atendido" ${item.estado === 'atendido' ? 'selected' : ''}>atendido</option>
            <option value="cancelado" ${item.estado === 'cancelado' ? 'selected' : ''}>cancelado</option>
          </select>
        </td>
        <td>
          <button class="btn-action btn-update" onclick="actualizarRegistro(${item.id}, '${item.origen}', '${item.destino}', '${fechaViaje}', '${horaViaje}', ${asiento}, ${item.precio || 0})">Actualizar</button>
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

async function cargarTablaAsientos() {
  const tbodyAsientos = document.getElementById('asientos-tbody');
  if (!tbodyAsientos) return;

  tbodyAsientos.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:1.5rem;">Cargando asientos...</td></tr>';

  try {
    const res = await fetch('/api/compras');
    if (!res.ok) return;

    const pasajes = await res.json();
    tbodyAsientos.innerHTML = '';

    if (!Array.isArray(pasajes) || pasajes.length === 0) {
      tbodyAsientos.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:1.5rem;">No hay asientos asignados actualmente.</td></tr>`;
      return;
    }

    pasajes.forEach((item) => {
      const tr = document.createElement('tr');
      const esCancelado = item.estado === 'cancelado';
      const asiento = item.asiento || item.num_asiento || '-';

      tr.innerHTML = `
        <td style="color:#ea580c; font-weight:bold;">Asiento ${asiento}</td>
        <td>Usuario #${item.id_usuario || '1'}</td>
        <td>${item.origen} ➔ ${item.destino}</td>
        <td><span style="color:${esCancelado ? '#ef4444' : '#22c55e'}; font-weight:bold;">${esCancelado ? 'Disponible (Cancelado)' : 'Ocupado'}</span></td>
        <td>
          <button class="btn-action btn-delete" onclick="eliminarRegistro(${item.id})">Liberar Asiento</button>
        </td>
      `;
      tbodyAsientos.appendChild(tr);
    });
  } catch (error) {
    console.error('Error al cargar tabla de asientos:', error);
  }
}

async function crearNuevoPasaje() {
  const origen = prompt('Origen:', 'Lima');
  if (!origen) return;

  const destino = prompt('Destino:', 'Huancayo');
  if (!destino) return;

  const fecha = prompt('Fecha (AAAA-MM-DD):', '2026-10-15');
  if (!fecha) return;

  const hora = prompt('Hora de viaje:', '09:00 AM');
  const asiento = prompt('Número de asiento:', '1');
  const precio = prompt('Precio (S/):', '60');
  const idUsuario = prompt('ID de Usuario:', '1');

  try {
    const res = await fetch('/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_usuario: parseInt(idUsuario) || 1,
        origen: origen,
        destino: destino,
        fecha: fecha,
        hora: hora || '09:00 AM',
        asiento: parseInt(asiento) || 1,
        precio: parseFloat(precio) || 0,
        estado: 'registrado'
      })
    });

    if (res.ok) {
      alert('¡Pasaje registrado en la base de datos Neon exitosamente!');
      cargarTodosLosPasajes();
      cargarTablaAsientos();
    } else {
      const err = await res.json();
      alert('Error al guardar: ' + (err.message || 'Error en los datos.'));
    }
  } catch (error) {
    console.error('Error al crear el pasaje:', error);
    alert('Error de conexión al servidor.');
  }
}

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
    console.error('Error al actualizar estado:', error);
  }
}

async function actualizarRegistro(id, origenActual, destinoActual, fechaActual, horaActual, asientoActual, precioActual) {
  const nuevoOrigen = prompt('Editar Origen:', origenActual);
  const nuevoDestino = prompt('Editar Destino:', destinoActual);
  const nuevaFecha = prompt('Editar Fecha (AAAA-MM-DD):', fechaActual);
  const nuevaHora = prompt('Editar Hora:', horaActual || '09:00 AM');
  const nuevoAsiento = prompt('Editar Asiento:', asientoActual);
  const nuevoPrecio = prompt('Editar Precio (S/):', precioActual);

  if (nuevoOrigen && nuevoDestino && nuevaFecha) {
    try {
      const res = await fetch(`/api/compras?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origen: nuevoOrigen,
          destino: nuevoDestino,
          fecha: nuevaFecha,
          hora: nuevaHora,
          asiento: parseInt(nuevoAsiento) || 1,
          precio: parseFloat(nuevoPrecio) || 0
        })
      });

      if (res.ok) {
        alert('Pasaje actualizado con éxito.');
        cargarTodosLosPasajes();
        cargarTablaAsientos();
      }
    } catch (error) {
      console.error('Error al editar registro:', error);
    }
  }
}

async function eliminarRegistro(id) {
  if (confirm(`¿Seguro que deseas eliminar/liberar el registro #${id}?`)) {
    try {
      const res = await fetch(`/api/compras?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        cargarTodosLosPasajes();
        cargarTablaAsientos();
      }
    } catch (error) {
      console.error('Error al eliminar registro:', error);
    }
  }
}
