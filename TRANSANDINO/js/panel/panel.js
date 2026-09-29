document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));

  // Bloqueo estricto por correo electrónico único
  if (!user || user.email !== 'axlperez183@gmail.com') {
    alert('Acceso restringido únicamente para el correo autorizado (axlperez183@gmail.com).');
    window.location.href = '../index.html';
    return;
  }

  const userElem = document.getElementById('user-info');
  if (userElem) {
    userElem.innerText = `👤 ${user.nombre || 'Axl Perez'} (Administrador)`;
  }

  cargarPasajes();

  const form = document.getElementById('crud-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
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

      form.reset();
      document.getElementById('pasaje-id').value = '';
      const btnSave = document.getElementById('btn-save');
      if (btnSave) btnSave.innerText = 'Guardar Registro';
      cargarPasajes();
    });
  }
});

async function cargarPasajes() {
  try {
    const res = await fetch('/api/compras');
    const datos = await res.json();
    const tbody = document.getElementById('tabla-pasajes');
    if (!tbody) return;
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
  const btnSave = document.getElementById('btn-save');
  if (btnSave) btnSave.innerText = 'Actualizar Registro';
}

async function eliminarPasaje(id) {
  if (confirm('¿Desea eliminar este registro de compra de pasaje?')) {
    await fetch(`/api/compras?id=${id}`, { method: 'DELETE' });
    cargarPasajes();
  }
}
