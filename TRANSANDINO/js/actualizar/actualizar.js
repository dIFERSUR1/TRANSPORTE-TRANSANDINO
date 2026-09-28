// RF-22.5: Consulta de registros propios del pasajero
async function cargarMisPasajes(idUsuario) {
  try {
    const res = await fetch(`/api/compras?id_usuario=${idUsuario}`);
    const pasajes = await res.json();
    
    const contenedor = document.getElementById('mis-pasajes-list');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (pasajes.length === 0) {
      contenedor.innerHTML = '<p style="color:#94a3b8;">No tienes pasajes registrados.</p>';
      return;
    }

    pasajes.forEach(p => {
      // RF-22.6: Solo se permite editar si estado == 'registrado'
      const puedeEditar = p.estado === 'registrado';
      
      contenedor.innerHTML += `
        <div style="background:#15233b; padding:1rem; border-radius:8px; margin-bottom:1rem; border:1px solid #1e293b;">
          <p><strong>Origen:</strong> ${p.origen} ➔ <strong>Destino:</strong> ${p.destino}</p>
          <p><strong>Fecha:</strong> ${p.fecha} | <strong>Precio:</strong> S/ ${p.precio}</p>
          <p><strong>Estado:</strong> <span style="color:#38bdf8; font-weight:bold;">${p.estado}</span></p>
          ${puedeEditar 
            ? `<button onclick="editarMiPasaje(${p.id}, '${p.origen}', '${p.destino}', '${p.fecha}')" style="background:#ea580c; color:white; border:none; padding:0.4rem 0.8rem; border-radius:4px; margin-top:0.5rem; cursor:pointer;">✏️ Actualizar Registro</button>`
            : `<small style="color:#64748b;">No editable (Estado no es 'registrado')</small>`
          }
        </div>
      `;
    });
  } catch (error) {
    console.error('Error al cargar pasajes:', error);
  }
}

// RF-22.6: Actualizar datos de un registro propio
async function actualizarPasajePropio(id, nuevosDatos) {
  const res = await fetch(`/api/compras?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevosDatos)
  });
  
  if (res.ok) {
    alert('Registro de viaje actualizado con éxito.');
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) cargarMisPasajes(user.id);
  } else {
    alert('Error al actualizar el registro.');
  }
}
