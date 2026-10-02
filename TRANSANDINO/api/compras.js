async function procesarReserva(datosCompra) {
  try {
    const res = await fetch('/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_usuario: datosCompra.id_usuario || 1,
        origen: datosCompra.origen,
        destino: datosCompra.destino,
        fecha_viaje: datosCompra.fecha_viaje,
        hora_viaje: datosCompra.hora_viaje || '08:00 AM',
        num_asiento: datosCompra.num_asiento,
        precio: datosCompra.precio,
        estado: 'registrado'
      })
    });

    if (res.ok) {
      alert('¡Reserva realizada con éxito en el sistema!');
      window.location.href = 'panel.html'; // o mis-compras.html
    } else {
      const err = await res.json();
      alert('Error al guardar la reserva: ' + (err.message || 'Intente nuevamente'));
    }
  } catch (error) {
    console.error('Error enviando la reserva:', error);
    alert('Error de conexión al procesar la reserva.');
  }
}
