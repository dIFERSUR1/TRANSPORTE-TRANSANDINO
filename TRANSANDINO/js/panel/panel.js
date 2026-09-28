document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));

  // Verificar que el usuario tenga rol de administrador o empleado
  if (!user || (user.rol !== 'administrador' && user.rol !== 'empleado')) {
    alert('Acceso restringido únicamente para Administrador o Empleado.');
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('user-info').innerText = `👤 ${user.nombre} (${user.rol})`;

  cargarPasajes();

  // Guardar / Crear / Actualizar registro
  document.getElementById('crud-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('pasaje-id').value;
    const datos = {
      id_usuario: parseInt(document.getElementById('id-usuario').value),
      origen: document.getElementById('origen').value,
      destino: document.getElementById('destino').value,
      fecha: document.getElementById('fecha').value,
      precio: parseFloat(document.getElementById('precio').value),
      estado: document.getElementById('estado').value
    };

    if (id) {
      // Actualizar registro existente
      await fetch(`/api/compras_pasajes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
    } else {
      // Crear nuevo registro
      await fetch('/api/compras_pasajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
    }

    document.getElementById('crud-form').reset();
    document.getElementById('pasaje-id').value = '';
    document.getElementById('btn-save').innerText = 'Guardar Registro';
    cargarPasajes();
  });
});

// Consultar TODOS los registros sin filtro por usuario
async function cargarPasajes() {
  const res = await fetch('/api/compras_pasajes');
  const datos = await res.json();
  const tbody = document.getElementById('tabla-pasajes');
  tbody.innerHTML = '';

  datos.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.id}</td>
        <td>${p.id_usuario}</td>
        <td>${p.origen}</td>
        <td>${p.destino}</td>
        <td>${p.fecha}</td>
        <td>S/ ${p.precio}</td>
        <td><strong>${p.estado}</strong></td>
        <td>
          <button class="btn-edit" onclick="editarPasaje(${p.id}, ${p.id_usuario}, '${p.origen}', '${p.destino}', '${p.fecha}', ${p.precio}, '${p.estado}')">✏️ Editar</button>
          <button class="btn-delete" onclick="eliminarPasaje(${p.id})">🗑️ Eliminar</button>
        </td>
      </tr>
    `;
  });
}

function editarPasaje(id, id_usuario, origen, destino, fecha, precio, estado) {
  document.getElementById('pasaje-id').value = id;
  document.getElementById('id-usuario').value = id_usuario;
  document.getElementById('origen').value = origen;
  document.getElementById('destino').value = destino;
  document.getElementById('fecha').value = fecha;
  document.getElementById('precio').value = precio;
  document.getElementById('estado').value = estado;
  document.getElementById('btn-save').innerText = 'Actualizar Registro';
}

async function eliminarPasaje(id) {
  if (confirm('¿Desea eliminar este registro de compra de pasaje?')) {
    await fetch(`/api/compras_pasajes/${id}`, { method: 'DELETE' });
    cargarPasajes();
  }
}
