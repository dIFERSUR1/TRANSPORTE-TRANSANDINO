const API_URL = '/api/compras';

document.addEventListener('DOMContentLoaded', () => {
  cargarMisPasajes();
});

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
    const res = await fetch(`${API_URL}?id_usuario=${idUsuario}`);
    if (!res.ok) throw new Error('Error al conectar con la base de datos.');

    const pasajes = await res.json();
    const contenedor = document.getElementById('mis-pasajes-list');
    if (!contenedor) return;

    if (!Array.isArray(pasajes) || pasajes.length === 0) {
      contenedor.innerHTML = '<p class="empty-msg">No tienes pasajes registrados.</p>';
      return;
    }

    const htmlCards = pasajes.map(p => {
      const puedeEditar = p.estado === 'registrado';
      const codigo = p.codigo_seguimiento || `#${p.id}`;
      const claseEstado = `badge-${p.estado || 'registrado'}`;

      return `
        <div class="pasaje-card">
          <div class="pasaje-header">
            <span class="pasaje-codigo">Código: ${codigo}</span>
            <span class="badge ${claseEstado}">${p.estado}</span>
          </div>
          <p class="pasaje-ruta"><strong>Origen:</strong> ${p.origen} ➔ <strong>Destino:</strong> ${p.destino}</p>
          <p class="pasaje-detalles">
            <strong>Fecha:</strong> ${p.fecha || p.fecha_viaje} | 
            <strong>Hora:</strong> ${p.hora || p.hora_viaje || '09:00 AM'} | 
            <strong>Asiento:</strong> ${p.asiento} | 
            <strong>Precio:</strong> S/ ${p.precio || 0}
          </p>
          
          <div class="pasaje-acciones">
            ${puedeEditar 
              ? `<a href="actualizar.html?id=${p.id}" class="btn-actualizar">✏ Actualizar Registro</a>`
              : `<small class="text-locked">🔒 No editable (Estado no es 'registrado')</small>`
            }
          </div>
        </div>
      `;
    }).join('');

    contenedor.innerHTML = htmlCards;

  } catch (error) {
    console.error('Error al cargar pasajes:', error);
  }
}
