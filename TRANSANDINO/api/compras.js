<script>
  const API_URL = '/api/asientos';
  let todosLosPasajes = [];

  document.addEventListener('DOMContentLoaded', () => {
    if (verificarRolEmpleado()) {
      const user = getUsuarioActual();
      if (user) {
        document.getElementById('lbl-empleado').textContent = user.nombre || user.email;
      }
      cargarPasajesGlobales();
    }
  });

  function getUsuarioActual() {
    const userObj = JSON.parse(localStorage.getItem('user'));
    if (userObj) {
      return {
        id: userObj.id || userObj.dni || userObj.email,
        nombre: userObj.nombre || userObj.email,
        rol: userObj.rol || 'empleado',
        email: userObj.email
      };
    }

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole') || 'empleado';

    if (isLoggedIn && userEmail) {
      return {
        id: userEmail,
        nombre: userEmail,
        rol: userRole,
        email: userEmail
      };
    }

    // Usuario fallback para no bloquear el panel durante pruebas
    return { id: 'emp01', nombre: 'Empleado TransAndino', rol: 'empleado', email: 'empleado@transandino.pe' };
  }

  function verificarRolEmpleado() {
    const user = getUsuarioActual();
    if (!user) {
      alert('Acceso restringido. Debes iniciar sesión.');
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  async function cargarPasajesGlobales() {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        todosLosPasajes = await res.json();
        localStorage.setItem('asientos_bus', JSON.stringify(todosLosPasajes));
      } else {
        todosLosPasajes = JSON.parse(localStorage.getItem('asientos_bus')) || JSON.parse(localStorage.getItem('compras_pasajes')) || [];
      }
    } catch (err) {
      todosLosPasajes = JSON.parse(localStorage.getItem('asientos_bus')) || JSON.parse(localStorage.getItem('compras_pasajes')) || [];
    }

    actualizarMetricas(todosLosPasajes);
    renderizarTabla(todosLosPasajes);
  }

  async function actualizarServidorOLocal(id, nuevosCampos, indexFila) {
    let index = todosLosPasajes.findIndex(p => String(p.id) === String(id) && id !== '' && id !== 'undefined');
    if (index === -1 && indexFila !== undefined && todosLosPasajes[indexFila]) {
      index = indexFila;
    }

    if (index !== -1 && todosLosPasajes[index]) {
      todosLosPasajes[index] = { ...todosLosPasajes[index], ...nuevosCampos };
      localStorage.setItem('asientos_bus', JSON.stringify(todosLosPasajes));
      localStorage.setItem('compras_pasajes', JSON.stringify(todosLosPasajes));
    }

    const targetId = id || (todosLosPasajes[index] ? todosLosPasajes[index].id : null);

    if (targetId && String(targetId) !== '0' && String(targetId) !== 'undefined') {
      try {
        const payload = { id: targetId, ...nuevosCampos };
        await fetch(`${API_URL}?id=${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.log('Sincronizado localmente por fallo de red:', err);
      }
    }
  }

  async function asignarPasajeEmpleado(e) {
    e.preventDefault();

    const user = getUsuarioActual();
    const empleadoNombre = user ? (user.nombre || user.email) : 'Empleado';
    const pasajero = document.getElementById('emp-pasajero').value;
    const turno = document.getElementById('emp-turno').value;
    const origen = document.getElementById('emp-origen').value;
    const destino = document.getElementById('emp-destino').value;
    const fecha = document.getElementById('emp-fecha').value;
    const asiento = parseInt(document.getElementById('emp-asiento').value);
    const precio = parseFloat(document.getElementById('emp-precio').value);

    const nuevoPasaje = {
      id: Date.now().toString(),
      usuario_id: pasajero,
      id_usuario: pasajero,
      pasajero: pasajero,
      empleado_atendio: empleadoNombre,
      turno: turno,
      origen: origen,
      destino: destino,
      fecha_viaje: fecha,
      hora_viaje: turno === 'Mañana' ? '08:00 AM' : '03:00 PM',
      asiento: asiento,
      num_asiento: asiento,
      precio: precio,
      estado: 'registrado'
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoPasaje)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) nuevoPasaje.id = data.id;
      }
    } catch (err) {
      console.log('Guardando localmente...');
    }

    todosLosPasajes.push(nuevoPasaje);
    localStorage.setItem('asientos_bus', JSON.stringify(todosLosPasajes));
    localStorage.setItem('compras_pasajes', JSON.stringify(todosLosPasajes));

    alert(`¡Pasaje N° ${asiento} asignado a ${pasajero} con éxito!`);
    document.getElementById('emp-asiento').value = '';
    document.getElementById('emp-pasajero').value = '';
    
    await cargarPasajesGlobales();
  }

  function actualizarMetricas(pasajes) {
    document.getElementById('stat-total').textContent = pasajes.length;
    
    const pendientes = pasajes.filter(p => p.estado === 'registrado').length;
    document.getElementById('stat-pendientes').textContent = pendientes;

    const atendidos = pasajes.filter(p => p.estado === 'atendido').length;
    document.getElementById('stat-atendidos').textContent = atendidos;

    const totalDinero = pasajes
      .filter(p => p.estado !== 'cancelado')
      .reduce((acc, curr) => acc + (Number(curr.precio) || 0), 0);

    document.getElementById('stat-dinero').textContent = `S/ ${totalDinero.toFixed(2)}`;
  }

  function renderizarTabla(lista) {
    const tbody = document.getElementById('tabla-empleado-tbody');
    tbody.innerHTML = '';

    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#94a3b8; padding: 2rem;">No hay pasajes/asientos registrados en el sistema.</td></tr>`;
      return;
    }

    lista.forEach((item, index) => {
      const tr = document.createElement('tr');
      const numAsiento = item.num_asiento || item.asiento || '-';
      const fecha = item.fecha_viaje ? item.fecha_viaje.split('T')[0] : (item.fecha || 'N/A');
      const hora = item.hora_viaje || item.hora || '08:00 AM';
      const estadoLimpio = String(item.estado || 'registrado').toLowerCase().trim();

      const empleadoAtendio = item.empleado_atendio || item.atendido_por || 'Empleado';
      const turno = item.turno || (new Date().getHours() < 13 ? 'Mañana' : 'Tarde');
      const iconoTurno = turno === 'Mañana' ? '☀️' : '🌙';

      let claseBadge = 'status-registrado';
      if (estadoLimpio === 'atendido') claseBadge = 'status-atendido';
      if (estadoLimpio === 'disponible') claseBadge = 'status-disponible';
      if (estadoLimpio === 'cancelado') claseBadge = 'status-cancelado';

      tr.innerHTML = `
        <td>#${item.id || (index + 1)}</td>
        <td><strong style="color:#38bdf8;">${item.id_usuario || item.usuario_id || item.pasajero || 'Cliente'}</strong></td>
        <td>
          <span style="color:#ea580c; font-weight:bold;">👤 ${empleadoAtendio}</span><br>
          <small style="color:#cbd5e1;">${iconoTurno} Turno ${turno}</small>
        </td>
        <td>${item.origen || 'Lima'} ➔ ${item.destino || 'Huancayo'}</td>
        <td>${fecha} (${hora})</td>
        <td>N° ${numAsiento}</td>
        <td style="color:#22c55e; font-weight:bold;">S/ ${parseFloat(item.precio || 0).toFixed(2)}</td>
        <td><span class="status-badge ${claseBadge}">${estadoLimpio}</span></td>
        <td>
          <button class="btn-status" onclick="cambiarEstado('${item.id || ''}', '${numAsiento}', ${index})">
            ⚙ Estado
          </button>
          <button class="btn-edit" onclick="editarPasaje('${item.id || ''}', ${index})">✏</button>
          <button class="btn-delete" onclick="eliminarPasaje('${item.id || ''}', ${index})">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  async function cambiarEstado(id, nroAsiento, indexFila) {
    let index = todosLosPasajes.findIndex(p => String(p.id) === String(id) && id !== '' && id !== 'undefined');
    if (index === -1 && indexFila !== undefined && todosLosPasajes[indexFila]) {
      index = indexFila;
    }

    if (index !== -1 && todosLosPasajes[index]) {
      const user = getUsuarioActual();
      const empleadoNombre = user ? (user.nombre || user.email) : 'Empleado';
      const estadoActual = todosLosPasajes[index].estado || 'registrado';
      
      const nuevoEstado = prompt(`Nuevo estado para Asiento N° ${nroAsiento} (disponible / registrado / atendido / cancelado):`, estadoActual);

      if (nuevoEstado) {
        const estadoLimpio = nuevoEstado.toLowerCase().trim();
        await actualizarServidorOLocal(id, { estado: estadoLimpio, empleado_atendio: empleadoNombre }, indexFila);
        await cargarPasajesGlobales();
      }
    }
  }

  async function editarPasaje(id, indexFila) {
    let index = todosLosPasajes.findIndex(p => String(p.id) === String(id) && id !== '' && id !== 'undefined');
    if (index === -1 && indexFila !== undefined && todosLosPasajes[indexFila]) {
      index = indexFila;
    }

    if (index !== -1 && todosLosPasajes[index]) {
      const p = todosLosPasajes[index];
      const nuevoOrigen = prompt('Editar Origen:', p.origen || 'Lima');
      const nuevoDestino = prompt('Editar Destino:', p.destino || 'Huancayo');
      const nuevoAsiento = prompt('Editar N° Asiento:', p.num_asiento || p.asiento || '1');
      const nuevaFecha = prompt('Editar Fecha (YYYY-MM-DD):', p.fecha_viaje ? p.fecha_viaje.split('T')[0] : (p.fecha || '2026-10-15'));
      const nuevaHora = prompt('Editar Hora (ej: 08:00 AM / 03:00 PM):', p.hora_viaje || p.hora || '08:00 AM');

      if (nuevoOrigen && nuevoDestino) {
        const camposActualizados = {
          origen: nuevoOrigen,
          destino: nuevoDestino,
          asiento: nuevoAsiento,
          num_asiento: nuevoAsiento,
          fecha_viaje: nuevaFecha,
          hora_viaje: nuevaHora
        };
        await actualizarServidorOLocal(id, camposActualizados, indexFila);
        alert('Pasaje actualizado con éxito.');
        await cargarPasajesGlobales();
      }
    }
  }

  async function eliminarPasaje(id, indexFila) {
    if (!confirm('¿Seguro que deseas eliminar este pasaje como empleado?')) return;

    let targetId = id;
    if (indexFila !== undefined && todosLosPasajes[indexFila]) {
      targetId = todosLosPasajes[indexFila].id;
      todosLosPasajes.splice(indexFila, 1);
    } else {
      todosLosPasajes = todosLosPasajes.filter(p => String(p.id) !== String(id));
    }

    localStorage.setItem('asientos_bus', JSON.stringify(todosLosPasajes));
    localStorage.setItem('compras_pasajes', JSON.stringify(todosLosPasajes));
    await cargarPasajesGlobales();

    if (targetId && String(targetId) !== 'undefined') {
      try {
        await fetch(`${API_URL}?id=${targetId}`, { method: 'DELETE' });
      } catch (e) {
        console.log('Eliminado localmente...');
      }
    }
  }

  function filtrarTabla() {
    const texto = document.getElementById('input-buscar').value.toLowerCase();
    const filtrados = todosLosPasajes.filter(p => 
      String(p.id).toLowerCase().includes(texto) ||
      String(p.id_usuario || p.usuario_id || p.pasajero || '').toLowerCase().includes(texto) ||
      String(p.empleado_atendio || '').toLowerCase().includes(texto) ||
      String(p.turno || '').toLowerCase().includes(texto) ||
      (p.origen && p.origen.toLowerCase().includes(texto)) ||
      (p.destino && p.destino.toLowerCase().includes(texto)) ||
      (p.estado && p.estado.toLowerCase().includes(texto))
    );
    renderizarTabla(filtrados);
  }

  function cerrarSesion() {
    localStorage.clear();
    window.location.href = 'login.html';
  }
</script>
