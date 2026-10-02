document.addEventListener('DOMContentLoaded', () => {
  const selectFecha = document.getElementById('fecha') || document.querySelector('input[type="date"]');
  const selectOrigen = document.getElementById('origen');
  const selectDestino = document.getElementById('destino');

  if (selectFecha) selectFecha.addEventListener('change', actualizarBloqueoAsientos);
  if (selectOrigen) selectOrigen.addEventListener('change', actualizarBloqueoAsientos);
  if (selectDestino) selectDestino.addEventListener('change', actualizarBloqueoAsientos);

  actualizarBloqueoAsientos();
});

async function actualizarBloqueoAsientos() {
  const origenSelect = document.getElementById('origen')?.value;
  const destinoSelect = document.getElementById('destino')?.value;
  const fechaInput = document.getElementById('fecha')?.value || document.querySelector('input[type="date"]')?.value;

  if (!origenSelect || !destinoSelect || !fechaInput) return;

  try {
    const res = await fetch('/api/compras');
    if (!res.ok) return;

    const compras = await res.json();

    const origenBuscado = origenSelect.trim().toLowerCase();
    const destinoBuscado = destinoSelect.trim().toLowerCase();

    const ocupados = compras
      .filter(item => {
        const origenDB = (item.origen || '').trim().toLowerCase();
        const destinoDB = (item.destino || '').trim().toLowerCase();
        const fechaDB = item.fecha_viaje ? item.fecha_viaje.split('T')[0] : (item.fecha || '');

        return (
          origenDB === origenBuscado &&
          destinoDB === destinoBuscado &&
          fechaDB === fechaInput &&
          item.estado !== 'cancelado'
        );
      })
      .map(item => parseInt(item.num_asiento || item.asiento));

    document.querySelectorAll('.asiento-btn, [data-asiento], .asientos-grid div, button').forEach(btn => {
      const numTexto = btn.dataset.asiento || btn.textContent.trim();
      const numAsiento = parseInt(numTexto);

      if (!isNaN(numAsiento) && numAsiento > 0) {
        if (ocupados.includes(numAsiento)) {
          btn.classList.add('ocupado');
          btn.disabled = true;
          btn.style.backgroundColor = '#ef4444';
          btn.style.color = '#ffffff';
          btn.style.cursor = 'not-allowed';
        } else {
          btn.classList.remove('ocupado');
          btn.disabled = false;
          btn.style.backgroundColor = '#22c55e';
          btn.style.color = '#ffffff';
          btn.style.cursor = 'pointer';
        }
      }
    });
  } catch (error) {
    console.error('Error al actualizar bloqueo de asientos:', error);
  }
}

async function enviarReservaABasedeDatos(datos) {
  try {
    const res = await fetch('/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_usuario: datos.id_usuario || 1,
        origen: datos.origen,
        destino: datos.destino,
        fecha_viaje: datos.fecha_viaje || datos.fecha,
        hora_viaje: datos.hora_viaje || datos.hora || '08:00 AM',
        num_asiento: parseInt(datos.num_asiento || datos.asiento) || 1,
        precio: parseFloat(datos.precio) || 50.00,
        estado: 'registrado'
      })
    });

    if (res.ok) {
      const datosRespuesta = await res.json();
      alert(`¡Reserva realizada con éxito! Tu código de seguimiento es: ${datosRespuesta.codigo_seguimiento}`);
      window.location.href = '../panel.html';
    } else {
      const err = await res.json();
      alert('Error en la reserva: ' + (err.message || 'Intente nuevamente'));
    }
  } catch (error) {
    console.error('Error enviando la reserva:', error);
    alert('Error de conexión con el servidor.');
  }
}
