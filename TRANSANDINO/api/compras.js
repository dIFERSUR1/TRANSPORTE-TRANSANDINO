async function cargarAsientosOcupados(origen, destino, fecha) {
  try {
    const res = await fetch('/api/compras');
    if (!res.ok) return;

    const compras = await res.json();

    const ocupados = compras
      .filter(item => 
        item.origen === origen && 
        item.destino === destino && 
        (item.fecha_viaje === fecha || item.fecha === fecha) &&
        item.estado !== 'cancelado'
      )
      .map(item => parseInt(item.num_asiento || item.asiento));

    document.querySelectorAll('.asiento-btn').forEach(btn => {
      const numAsiento = parseInt(btn.dataset.asiento);
      if (ocupados.includes(numAsiento)) {
        btn.classList.add('ocupado');
        btn.disabled = true;
        btn.style.backgroundColor = '#ef4444'; // Rojo para ocupado
        btn.style.cursor = 'not-allowed';
      } else {
        btn.classList.remove('ocupado');
        btn.disabled = false;
      }
    });
  } catch (error) {
    console.error('Error al consultar asientos ocupados:', error);
  }
}

async function guardarReservaBD(datosReserva) {
  try {
    const res = await fetch('/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_usuario: datosReserva.id_usuario || 1,
        origen: datosReserva.origen,
        destino: datosReserva.destino,
        fecha_viaje: datosReserva.fecha_viaje,
        hora_viaje: datosReserva.hora_viaje,
        num_asiento: datosReserva.num_asiento,
        precio: datosReserva.precio,
        estado: 'registrado'
      })
    });

    if (res.ok) {
      alert('¡Reserva realizada con éxito!');
      window.location.href = 'panel.html';
    } else {
      alert('Hubo un problema al guardar la reserva.');
    }
  } catch (error) {
    console.error('Error al guardar la compra:', error);
  }
}
