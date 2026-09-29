<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panel de Gestión - TransAndino Perú</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    html { scrollbar-gutter: stable; }
    body { background-color: #0b192c; color: #ffffff; min-height: 100vh; display: flex; flex-direction: column; }

    header { background-color: #070f1e; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; }
    .logo { font-size: 1.4rem; font-weight: bold; color: #ffffff; text-decoration: none; display: flex; align-items: center; gap: 8px; }
    .logo span { color: #ea580c; }

    nav a { color: #cbd5e1; text-decoration: none; font-size: 0.9rem; padding: 0.5rem 0.9rem; border-radius: 6px; font-weight: 500; }
    nav a:hover { background: #1e293b; }

    main { max-width: 1200px; margin: 2.5rem auto; padding: 0 1.5rem; flex: 1; width: 100%; }
    h1 { font-size: 2rem; color: #ea580c; margin-bottom: 1.5rem; text-align: center; }

    .controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .btn-create { background: #22c55e; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: bold; cursor: pointer; }

    .table-container { background: #15233b; border: 1px solid #1e293b; border-radius: 12px; overflow-x: auto; box-shadow: 0 8px 25px rgba(0,0,0,0.4); }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 0.85rem; border-bottom: 1px solid #1e293b; font-size: 0.85rem; }
    th { background: #070f1e; color: #ea580c; }

    .btn-action { padding: 0.35rem 0.6rem; border-radius: 4px; border: none; font-weight: bold; cursor: pointer; font-size: 0.75rem; margin-right: 4px; }
    .btn-update { background: #0284c7; color: white; }
    .btn-delete { background: #ef4444; color: white; }

    footer { background-color: #070f1e; text-align: center; padding: 1.5rem; font-size: 0.85rem; color: #64748b; border-top: 1px solid #1e293b; margin-top: auto; }
  </style>
</head>
<body>

  <header>
    <a href="index.html" class="logo"><span>⚙️</span> Panel de Operaciones (Admin / Empleado)</a>
    <nav>
      <a href="index.html">🏠 Volver al Sitio</a>
    </nav>
  </header>

  <main>
    <h1>Gestión Global de "Compra de Pasajes" (RF-22.7 / RF-22.8)</h1>

    <div class="controls">
      <span style="color: #94a3b8;">Mostrando todos los registros en la base de datos (Sin filtro de usuario)</span>
      <button class="btn-create" onclick="crearNuevoRegistro()">➕ Crear Nuevo Pasaje</button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario ID</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Asiento</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Acciones CRUD</th>
          </tr>
        </thead>
        <tbody id="panel-tbody">
          <!-- Carga dinámica -->
        </tbody>
      </table>
    </div>
  </main>

  <footer>
    <p>&copy; 2026 TransAndino Perú - Sistema de Gestión de Operaciones.</p>
  </footer>

  <script>
    document.addEventListener('DOMContentLoaded', cargarTodosLosPasajes);

    async function cargarTodosLosPasajes() {
      const tbody = document.getElementById('panel-tbody');
      tbody.innerHTML = '';

      let registros = JSON.parse(localStorage.getItem('compras_pasajes')) || [];

      if (registros.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#94a3b8;">No hay pasajes registrados en el sistema.</td></tr>`;
        return;
      }

      registros.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>#${item.id || index + 1}</td>
          <td><strong>ID: ${item.id_usuario || '1'}</strong></td>
          <td>${item.origen}</td>
          <td>${item.destino}</td>
          <td>${item.fecha_viaje}</td>
          <td>${item.hora_viaje}</td>
          <td>${item.num_asiento} (${item.tipo_asiento || 'Estándar'})</td>
          <td style="color:#22c55e; font-weight:bold;">S/ ${item.precio}.00</td>
          <td>
            <select onchange="cambiarEstado(${index}, this.value)" style="background:#070f1e; color:white; border:1px solid #1e293b; padding:0.2rem; border-radius:4px;">
              <option value="registrado" ${item.estado === 'registrado' ? 'selected' : ''}>registrado</option>
              <option value="atendido" ${item.estado === 'atendido' ? 'selected' : ''}>atendido</option>
              <option value="cancelado" ${item.estado === 'cancelado' ? 'selected' : ''}>cancelado</option>
            </select>
          </td>
          <td>
            <button class="btn-action btn-update" onclick="actualizarRegistro(${index})">Actualizar</button>
            <button class="btn-action btn-delete" onclick="eliminarRegistro(${index})">Eliminar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function cambiarEstado(index, nuevoEstado) {
      let registros = JSON.parse(localStorage.getItem('compras_pasajes')) || [];
      registros[index].estado = nuevoEstado;
      localStorage.setItem('compras_pasajes', JSON.stringify(registros));
    }

    function crearNuevoRegistro() {
      const orig = prompt('Origen:', 'Ica');
      const dest = prompt('Destino:', 'Lima');
      if (orig && dest) {
        let registros = JSON.parse(localStorage.getItem('compras_pasajes')) || [];
        registros.push({
          id: Date.now(),
          id_usuario: 1,
          origen: orig,
          destino: dest,
          fecha_viaje: '2026-09-30',
          hora_viaje: '08:30 AM',
          num_asiento: 5,
          tipo_asiento: 'Estándar',
          precio: 45,
          estado: 'registrado'
        });
        localStorage.setItem('compras_pasajes', JSON.stringify(registros));
        cargarTodosLosPasajes();
      }
    }

    function actualizarRegistro(index) {
      let registros = JSON.parse(localStorage.getItem('compras_pasajes')) || [];
      const nuevoOrigen = prompt('Editar Origen:', registros[index].origen);
      if (nuevoOrigen) {
        registros[index].origen = nuevoOrigen;
        localStorage.setItem('compras_pasajes', JSON.stringify(registros));
        cargarTodosLosPasajes();
      }
    }

    function eliminarRegistro(index) {
      if (confirm('¿Seguro de que deseas eliminar este registro de compra?')) {
        let registros = JSON.parse(localStorage.getItem('compras_pasajes')) || [];
        registros.splice(index, 1);
        localStorage.setItem('compras_pasajes', JSON.stringify(registros));
        cargarTodosLosPasajes();
      }
    }
  </script>

</body>
</html>
