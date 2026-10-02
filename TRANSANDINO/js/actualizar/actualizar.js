async function cargarMisPasajes(idUsuario) {
  if (!idUsuario) {
    const userObj = JSON.parse(localStorage.getItem('usuario')) || JSON.parse(localStorage.getItem('user'));
    idUsuario = userObj ? userObj.id : null;
  }

  if (!idUsuario) {
    console.warn('No se encontró un usuario autenticado en la sesión.');
    return;
  }

  try {
    const res = await fetch(`/api/compras?id_usuario=${idUsuario}`);
    if (!res.ok) throw new Error('Error al conectar con la base de datos.');

    const pasajes = await res.json();
    const contenedor = document.getElementById('mis-pasajes-list');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (!Array.isArray(pasajes) || pasajes.length === 0) {
      contenedor.innerHTML = '<p style="color:#94a3b8; text-align:center;">No tienes pasajes registrados.</p>';
      return;
    }

    pasajes.forEach(p => {
      const puedeEditar = p.estado === 'registrado';
      const codigo = p.codigo_seguimiento || `#${p.id}`;

      const colorEstado = p.estado === 'registrado' ? '#0284c7' : p.estado === 'atendido' ? '#16a34a' : '#dc2626';

      contenedor.innerHTML += `
        <div style="background:#15233b; padding:1.2rem; border-radius:8px; margin-bottom:1rem; border:1px solid #1e293b;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <span style="color:#38bdf8; font-weight:bold;">Código: ${codigo}</span>
            <span style="padding:0.2rem 0.6rem; border-radius:4px; font-size:0.8rem; font-weight:bold; background:${colorEstado}; color:white;">
              ${p.estado}
            </span>
          </div>
          <p style="margin-bottom:0.3rem;"><strong>Origen:</strong> ${p.origen} ➔ <strong>Destino:</strong> ${p.destino}</p>
          <p style="margin-bottom:0.8rem; color:#cbd5e1;"><strong>Fecha:</strong> ${p.fecha} | <strong>Precio:</strong> S/ ${p.precio || 0}</p>
          
          <div>
            ${puedeEditar 
              ? `<button onclick="editarMiPasaje(${p.id}, '${p.origen}', '${p.destino}', '${p.fecha}')" style="background:#ea580c; color:white; border:none; padding:0.4rem 0.8rem; border-radius:4px; cursor:pointer; font-weight:bold;">✏️ Actualizar Registro</button>`
              : `<small style="color:#64748b;">🔒 No editable (Estado no es 'registrado')</small>`
            }
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error('Error al cargar pasajes:', error);
  }
}

function editarMiPasaje(id, origenActual, destinoActual, fechaActual) {
  const nuevoOrigen = prompt("Nuevo Origen:", origenActual);
  const nuevoDestino = prompt("Nuevo Destino:", destinoActual);
  const nuevaFecha = prompt("Nueva Fecha (AAAA-MM-DD):", fechaActual);

  if (nuevoOrigen && nuevoDestino && nuevaFecha) {
    actualizarPasajePropio(id, {
      origen: nuevoOrigen,
      destino: nuevoDestino,
      fecha: nuevaFecha
    });
  }
}

async function actualizarPasajePropio(id, nuevosDatos) {
  try {
    const res = await fetch(`/api/compras?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevosDatos)
    });
    
    const data = await res.json();

    if (res.ok) {
      alert(data.message || 'Registro de viaje actualizado con éxito.');
      
      const user = JSON.parse(localStorage.getItem('usuario')) || JSON.parse(localStorage.getItem('user'));
      cargarMisPasajes(user ? user.id : null);
    } else {
      alert(data.message || 'Error al actualizar el registro.');
    }
  } catch (error) {
    console.error('Error en la solicitud PUT:', error);
    alert('Ocurrió un error de conexión con el servidor.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarMisPasajes();
});
