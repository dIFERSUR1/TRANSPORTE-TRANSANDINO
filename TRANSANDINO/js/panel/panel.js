document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));

  // Verificar si es administrador por rol o por el correo principal
  const esAdmin = user && (user.rol === 'administrador' || user.rol === 'empleado' || user.email === 'axlperez183@gmail.com');

  if (!esAdmin) {
    alert('Acceso restringido únicamente para Administrador o Empleado.');
    window.location.href = '../index.html';
    return;
  }

  // Si el usuario en localStorage no tenía el rol guardado, se le fuerza visualmente
  const nombreMostrar = user ? user.nombre || 'Axl Perez' : 'Axl Perez';
  document.getElementById('user-info').innerText = `👤 ${nombreMostrar} (Administrador)`;

  cargarPasajes();

  // Guardar / Crear / Actualizar registro
  document.getElementById('crud-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('pasaje-id').value;
    const datos = {
      id_usuario: parseInt(document.getElementById('id-usuario').value) || null,
      origen: document.getElementById('origen').value,
      destino: document.getElementById('destino').value,
      fecha: document.getElementById('fecha').value,
      precio: parseFloat(document.getElementById('precio').value),
      estado: document.getElementById('estado').value
    };

    if (id) {
      await fetch(`/api/compras?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
    } else {
      await fetch('/api/compras', {
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

async function cargarPasajes() {
  try {
    const res = await fetch('/api/compras');
    const datos = await res.json();
    const tbody = document.getElementById('tabla-pasajes');
    tbody.innerHTML = '';

    if (!Array.isArray(datos)) return;

    datos.forEach(p => {
      tbody.innerHTML += `
        <tr>
          <td>${p.id}</td>
          <td>${p.id_usuario || 'N/A'}</td>
          <td>${p.origen}</td>
          <td>${p.destino}</td>
          <td>${p.fecha || p.fecha_viaje}</td>
          <td>S/ ${p.precio || 0}</td>
          <td><strong>${p.estado}</strong></td>
          <td>
            <button class="btn-edit" onclick="editarPasaje(${p.id}, ${p.id_usuario || 0}, '${p.origen}', '${p.destino}', '${p.fecha || p.fecha_viaje}', ${p.precio || 0}, '${p.estado}')">✏️ Editar</button>
            <button class="btn-delete" onclick="eliminarPasaje(${p.id})">🗑️ Eliminar</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
  }
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
    await fetch(`/api/compras?id=${id}`, { method: 'DELETE' });
    cargarPasajes();
  }
}
