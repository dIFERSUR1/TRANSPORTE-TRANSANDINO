document.addEventListener('DOMContentLoaded', cargarTodosLosPasajes);

async function cargarTodosLosPasajes() {
  const tbody = document.getElementById('panel-tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#94a3b8; padding:1.5rem;">Cargando registros...</td></tr>';

  try {
    const res = await fetch('/api/compras');
    if (!res.ok) throw new Error('Error al conectar con la base de datos.');

    const pasajes = await res.json();
    tbody.innerHTML = '';

    if (!Array.isArray(pasajes) || pasajes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#94a3b8; padding:1.5rem;">No hay pasajes registrados en el sistema.</td></tr>`;
      return;
    }

    pasajes.forEach((item) => {
      const tr = document.createElement('tr');
      const fechaViaje = item.fecha || item.fecha_viaje || '-';

      tr.innerHTML = `
        <td>#${item.id}</td>
        <td style="color:#38bdf8; font-weight:bold;">${item.codigo_seguimiento || '-'}</td>
        <td><strong>ID: ${item.id_usuario || 'N/A'}</strong></td>
        <td>${item.origen}</td>
        <td>${item.destino}</td>
        <td>${fechaViaje}</td>
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
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#ef4444; padding:1.5rem;">Error al cargar registros.</td></tr>`;
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
    } else {
      const err = await res.json();
      alert(err.message || 'Error al actualizar el estado.');
    }
  } catch (error) {
    console.error('Error en cambio de estado:', error);
  }
}

async function crearNuevoRegistro() {
  const orig = prompt('Origen:', 'Lima');
  const dest = prompt('Destino:', 'Huancayo');
  const idUser = prompt('ID Usuario Pasajero:', '1');
  const fecha = prompt('Fecha (AAAA-MM-DD):', '2026-09-30');
  const precio = prompt('Precio (S/):', '50');

  if (orig && dest && fecha) {
    try {
      const res = await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuario: parseInt(idUser) || 1,
          origen: orig,
          destino: dest,
          fecha: fecha,
          precio: parseFloat(precio) || 0,
          estado: 'registrado'
        })
      });

      if (res.ok) {
        alert('Nuevo pasaje registrado con éxito.');
        cargarTodosLosPasajes();
      } else {
        const err = await res.json();
        alert(err.message || 'Error al guardar el pasaje.');
      }
    } catch (error) {
      console.error('Error al crear registro:', error);
    }
  }
}

async function actualizarRegistro(id, origenActual, destinoActual, fechaActual, precioActual) {
  const nuevoOrigen = prompt('Editar Origen:', origenActual);
  const nuevoDestino = prompt('Editar Destino:', destinoActual);
  const nuevaFecha = prompt('Editar Fecha (AAAA-MM-DD):', fechaActual);
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
          precio: parseFloat(nuevoPrecio) || 0,
          estado: 'registrado'
        })
      });

      if (res.ok) {
        alert('Registro actualizado con éxito.');
        cargarTodosLosPasajes();
      } else {
        const err = await res.json();
        alert(err.message || 'Error al actualizar.');
      }
    } catch (error) {
      console.error('Error al actualizar registro:', error);
    }
  }
}

async function eliminarRegistro(id) {
  if (confirm(`¿Seguro de que deseas eliminar permanentemente el registro #${id}?`)) {
    try {
      const res = await fetch(`/api/compras?id=${id}`, { method: 'DELETE' });

      if (res.ok) {
        alert('Registro eliminado correctamente.');
        cargarTodosLosPasajes();
      } else {
        const err = await res.json();
        alert(err.message || 'Error al eliminar.');
      }
    } catch (error) {
      console.error('Error al eliminar registro:', error);
    }
  }
}
