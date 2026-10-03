document.addEventListener('DOMContentLoaded', () => {
  cargarTodosLosPasajes();
  cargarTablaAsientos();
});

async function cargarTodosLosPasajes() {
  const tbody = document.getElementById('panel-tbody') || document.querySelector('#tabla-pasajes-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:#94a3b8; padding:1.5rem;">Cargando registros desde Neon SQL...</td></tr>';

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
      
      const fechaViaje = item.fecha ? (typeof item.fecha === 'string' ? item.fecha.split('T')[0] : item.fecha) : (item.fecha_viaje || '-');
      const horaViaje = item.hora || item.hora_viaje || '09:00 AM';
      const asientoNum = item.asiento || item.num_asiento || '1';

      tr.innerHTML = `
        <td>#${item.id}</td>
        <td><strong>ID: ${item.id_usuario || '1'}</strong></td>
        <td>${item.origen}</td>
        <td>${item.destino}</td>
        <td>${fechaViaje}</td>
        <td>${horaViaje}</td>
        <td style="color:#f97316; font-weight:bold;">${asientoNum}</td>
        <td style="color:#22c55e; font-weight:bold;">S/ ${parseFloat(item.precio || 0).toFixed(2)}</td>
        <td>
          <select onchange="cambiarEstado(${item.id}, this.value)" style="background:#070f1e; color:white; border:1px solid #1e293b; padding:0.3rem; border-radius:4px;">
            <option value="disponible" ${item.estado === 'disponible' ? 'selected' : ''}>disponible</option>
            <option value="registrado" ${item.estado === 'registrado' ? 'selected' : ''}>registrado</option>
            <option value="atendido" ${item.estado === 'atendido' ? 'selected' : ''}>atendido</option>
            <option value="cancelado" ${item.estado === 'cancelado' ? 'selected' : ''}>cancelado</option>
          </select>
        </td>
        <td>
          <button class="btn-action btn-update" style="background:#ea580c; color:white; margin-right:4px; padding:4px 8px; border-radius:4px; border:none; cursor:pointer;" onclick="editarAsientoDirecto(${item.id}, '${asientoNum}')">Editar Asiento</button>
          <button class="btn-action btn-update" style="background:#0284c7; color:white; margin-right:4px; padding:4px 8px; border-radius:4px; border:none; cursor:pointer;" onclick="actualizarRegistroCompleto(${item.id}, '${item.origen}', '${item.destino}', '${fechaViaje}', '${horaViaje}', '${asientoNum}', ${item.precio || 0})">Editar Precio</button>
          <button class="btn-action btn-delete" style="background:#ef4444; color:white; padding:4px 8px; border-radius:4px; border:none; cursor:pointer;" onclick="eliminarRegistro(${item.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error al cargar pasajes:', error);
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#ef4444; padding:1.5rem;">Error al cargar registros desde la base de datos.</td></tr>`;
  }
}

// =========================================================
// 2. PESTAÑA: ASIENTOS DE BUS (VISTA COMPLETA 1 AL 40)
// =========================================================
async function cargarTablaAsientos() {
  const tbodyAsientos = document.getElementById('asientos-tbody') || document.querySelector('#tabla-asientos-body');
  if (!tbodyAsientos) return;

  tbodyAsientos.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:1.5rem;">Cargando lista de asientos (1-40)...</td></tr>';

  try {
    const res = await fetch('/api/compras');
    if (!res.ok) return;

    const pasajes = await res.json();
    tbodyAsientos.innerHTML = '';

    // Mapear registros de la base de datos por número de asiento
    const mapaAsientosBD = {};
    if (Array.isArray(pasajes)) {
      pasajes.forEach(item => {
        const val = String(item.asiento || item.num_asiento || '');
        // Manejar asientos múltiples guardados como "33, 34, 35, 36"
        const numeros = val.split(',').map(s => s.trim());
        numeros.forEach(numStr => {
          if (numStr) mapaAsientosBD[numStr] = item;
        });
      });
    }

    // Dibujar los 40 asientos obligatorios del bus
    for (let i = 1; i <= 40; i++) {
      const itemBD = mapaAsientosBD[String(i)];
      const tr = document.createElement('tr');

      const estado = itemBD ? itemBD.estado : 'disponible';
      const origenDestino = itemBD ? `${itemBD.origen} -> ${itemBD.destino}` : 'Lima -> Huancayo (Ruta General)';
      const idRegistro = itemBD ? itemBD.id : null;
      const pasajeroTexto = itemBD ? `Usuario ID: ${itemBD.id_usuario || '1'}` : 'Libre';

      // Colores de estado
      let colorEstado = '#22c55e'; // Verde (disponible)
      if (estado === 'registrado') colorEstado = '#f97316'; // Naranja (pendiente)
      if (estado === 'atendido') colorEstado = '#ef4444'; // Rojo (ocupado)
      if (estado === 'cancelado') colorEstado = '#94a3b8'; // Gris

      tr.innerHTML = `
        <td style="color:#ffffff; font-weight:bold;">Asiento N° ${i}</td>
        <td style="color:#cbd5e1;">${pasajeroTexto}</td>
        <td style="color:#cbd5e1;">${origenDestino}</td>
        <td style="color:${colorEstado}; font-weight:bold; text-transform:uppercase;">${estado}</td>
        <td>
          <button class="btn-action btn-update" style="background:#0284c7; color:white; border:none; padding:0.4rem 0.8rem; border-radius:4px; cursor:pointer;" 
                  onclick="gestionarEstadoAsientoIndividual(${i}, ${idRegistro}, '${estado}')">
            Cambiar Estado
          </button>
        </td>
      `;
      tbodyAsientos.appendChild(tr);
    }
  } catch (error) {
    console.error('Error al cargar la tabla de asientos:', error);
  }
}

// =========================================================
// 3. ACCIONES Y EDICIONES DIRECTAS
// =========================================================

// Cambiar estado individual de un asiento del 1 al 40
async function gestionarEstadoAsientoIndividual(numeroAsiento, idRegistro, estadoActual) {
  const nuevoEstado = prompt(`Asiento N° ${numeroAsiento}\nIngrese nuevo estado (disponible, registrado, atendido, cancelado):`, estadoActual);
  if (!nuevoEstado) return;

  const estadoLwr = nuevoEstado.toLowerCase().trim();

  try {
    if (idRegistro) {
      // Si el registro ya existe en BD, actualizamos su estado
      await fetch(`/api/compras?id=${idRegistro}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: estadoLwr })
      });
    } else {
      // Si el asiento estaba disponible, creamos la fila en Neon
      await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuario: 1,
          origen: 'Lima',
          destino: 'Huancayo',
          fecha: '2026-10-15',
          hora: '09:00 AM',
          asiento: String(numeroAsiento),
          precio: 60,
          estado: estadoLwr,
          registrado_por: 'Empleado Panel'
        })
      });
    }

    cargarTablaAsientos();
    cargarTodosLosPasajes();
  } catch (error) {
    console.error('Error al cambiar el estado del asiento:', error);
  }
}

async function editarAsientoDirecto(id, asientoActual) {
  const nuevoAsiento = prompt('Ingrese el nuevo número o lista de asientos (ej. 12 o 33,34):', asientoActual);
  
  if (nuevoAsiento) {
    try {
      const res = await fetch(`/api/compras?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asiento: String(nuevoAsiento) })
      });

      if (res.ok) {
        alert(`Asiento actualizado a: ${nuevoAsiento}`);
        cargarTodosLosPasajes();
        cargarTablaAsientos();
      } else {
        alert('Error al actualizar el asiento.');
      }
    } catch (error) {
      console.error('Error al editar el asiento:', error);
    }
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

async function actualizarRegistroCompleto(id, origenActual, destinoActual, fechaActual, horaActual, asientoActual, precioActual) {
  const nuevoOrigen = prompt('Editar Origen:', origenActual);
  const nuevoDestino = prompt('Editar Destino:', destinoActual);
  const nuevaFecha = prompt('Editar Fecha (AAAA-MM-DD):', fechaActual);
  const nuevaHora = prompt('Editar Hora:', horaActual || '09:00 AM');
  const nuevoAsiento = prompt('Editar Asiento:', asientoActual);
  const nuevoPrecio = prompt('Editar Precio (S/):', precioActual);

  if (nuevoOrigen && nuevoDestino && nuevaFecha && nuevoAsiento) {
    try {
      const res = await fetch(`/api/compras?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origen: nuevoOrigen,
          destino: nuevoDestino,
          fecha: nuevaFecha,
          hora: nuevaHora,
          asiento: String(nuevoAsiento),
          precio: parseFloat(nuevoPrecio) || 0
        })
      });

      if (res.ok) {
        alert('Registro actualizado con éxito.');
        cargarTodosLosPasajes();
        cargarTablaAsientos();
      } else {
        alert('Error al actualizar el registro.');
      }
    } catch (error) {
      console.error('Error al editar registro:', error);
    }
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
  const asiento = prompt('Número de asiento (1-40 o lista):', '1');
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
        asiento: String(asiento || '1'),
        precio: parseFloat(precio) || 0,
        estado: 'registrado',
        registrado_por: 'Admin / Empleado'
      })
    });

    if (res.ok) {
      alert('¡Pasaje registrado exitosamente!');
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
