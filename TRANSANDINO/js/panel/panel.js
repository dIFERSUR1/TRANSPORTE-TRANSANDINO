<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panel de Control - TransAndino Perú</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    body { background-color: #0b192c; color: #ffffff; min-height: 100vh; display: flex; flex-direction: column; }
    header { background-color: #070f1e; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; }
    .logo { font-size: 1.4rem; font-weight: bold; color: #ffffff; display: flex; align-items: center; gap: 8px; text-decoration: none; }
    .logo span { color: #38bdf8; }
    nav { display: flex; gap: 0.5rem; align-items: center; }
    nav a { color: #cbd5e1; text-decoration: none; font-size: 0.9rem; padding: 0.5rem 0.9rem; border-radius: 6px; }
    main { max-width: 1200px; margin: 2rem auto; padding: 0 1.5rem; flex: 1; width: 100%; }
    h1 { color: #38bdf8; margin-bottom: 1.5rem; text-align: center; }
    
    .panel-card { background: #15233b; border: 1px solid #1e293b; border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem; }
    .panel-card h3 { color: #ea580c; margin-bottom: 1rem; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group label { font-size: 0.85rem; color: #94a3b8; }
    .form-group input, .form-group select { padding: 0.6rem; background: #0b192c; border: 1px solid #1e293b; color: #fff; border-radius: 6px; }
    
    .btn-action { background: #ea580c; color: white; border: none; padding: 0.7rem 1.2rem; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 1rem; }
    .btn-action:hover { background: #c2410c; }

    .crud-table { width: 100%; border-collapse: collapse; margin-top: 1rem; background: #15233b; border-radius: 8px; overflow: hidden; }
    .crud-table th, .crud-table td { padding: 0.8rem; text-align: left; border-bottom: 1px solid #1e293b; font-size: 0.88rem; }
    .crud-table th { background: #070f1e; color: #38bdf8; }
    .btn-edit { background: #0284c7; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; }
    .btn-delete { background: #ef4444; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; margin-left: 4px; }
    footer { background-color: #070f1e; text-align: center; padding: 1.5rem; font-size: 0.85rem; color: #64748b; margin-top: auto; }
  </style>
</head>
<body>

  <header>
    <a href="index.html" class="logo">🚌 <span>TransAndino Perú</span></a>
    <nav>
      <a href="index.html">🏠 Inicio</a>
      <a href="panel.html" style="background:#ea580c; color:white; font-weight:bold;">⚙️ Panel Admin / Empleado</a>
      <span id="user-info" style="color:#38bdf8; font-weight:bold; margin-left:1rem;"></span>
    </nav>
  </header>

  <main>
    <h1>Gestionar Compras de Pasajes (CRUD)</h1>

    <!-- Formulario de Creación / Edición Admin -->
    <div class="panel-card">
      <h3 id="form-title">➕ Crear Nuevo Registro de Pasaje</h3>
      <form id="crud-form">
        <input type="hidden" id="pasaje-id">
        <div class="form-grid">
          <div class="form-group">
            <label>ID Pasajero</label>
            <input type="number" id="id-usuario" required placeholder="Ej: 1">
          </div>
          <div class="form-group">
            <label>Origen</label>
            <input type="text" id="origen" required placeholder="Origen">
          </div>
          <div class="form-group">
            <label>Destino</label>
            <input type="text" id="destino" required placeholder="Destino">
          </div>
          <div class="form-group">
            <label>Fecha Viaje</label>
            <input type="date" id="fecha" required>
          </div>
          <div class="form-group">
            <label>Precio (S/)</label>
            <input type="number" step="0.01" id="precio" required placeholder="00.00">
          </div>
          <div class="form-group">
            <label>Estado</label>
            <select id="estado">
              <option value="registrado">registrado</option>
              <option value="confirmado">confirmado</option>
              <option value="cancelado">cancelado</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn-action" id="btn-save">Guardar Registro</button>
      </form>
    </div>

    <!-- Tabla con todos los registros sin filtro (RF-22.7 y RF-22.8) -->
    <div class="panel-card">
      <h3>📋 Lista Global de Pasajes Registrados</h3>
      <table class="crud-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>ID Usuario</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>Fecha</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tabla-pasajes">
          <!-- Carga dinámica desde js/panel/panel.js -->
        </tbody>
      </table>
    </div>
  </main>

  <footer>
    <p>&copy; 2026 TransAndino Perú - Desarrollado por Julius Axl Nickolai Perez Huamani.</p>
  </footer>

  <script src="js/panel/panel.js"></script>
</body>
</html>
