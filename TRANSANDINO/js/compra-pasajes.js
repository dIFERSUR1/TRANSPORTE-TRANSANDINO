const PRECIO_PASAJE = 50.00;
let seleccionados = [];

document.addEventListener('DOMContentLoaded', () => {
  const formBusqueda = document.getElementById('form-busqueda');
  if (formBusqueda) {
    formBusqueda.addEventListener('submit', function (e) {
      e.preventDefault();
      
      const grid = document.getElementById('seats-grid');
      const seccion = document.getElementById('seccion-asientos');
      
      if (!grid || !seccion) return;

      grid.innerHTML = '';
      seleccionados = [];
      actualizarResumen();

      for (let i = 1; i <= 40; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerText = i;
        btn.className = 'seat-btn disponible';
        
        btn.onclick = () => toggleAsiento(i, btn);
        grid.appendChild(btn);
      }

      seccion.style.display = 'block';
    });
  }
});

function toggleAsiento(numero, boton) {
  const index = seleccionados.indexOf(numero);
  
  if (index > -1) {
    seleccionados.splice(index, 1);
    boton.classList.remove('seleccionado');
    boton.classList.add('disponible');
  } else {
    seleccionados.push(numero);
    boton.classList.remove('disponible');
    boton.classList.add('seleccionado');
  }
  
  actualizarResumen();
}

// Actualizar contadores y total a pagar
function actualizarResumen() {
  const lblAsientos = document.getElementById('lbl-asientos');
  const lblTotal = document.getElementById('lbl-total');
  const btnReservar = document.getElementById('btn-reservar');

  if (!lblAsientos || !lblTotal || !btnReservar) return;

  if (seleccionados.length === 0) {
    lblAsientos.innerText = 'Ninguno';
    lblTotal.innerText = '0.00';
    btnReservar.disabled = true;
  } else {
    seleccionados.sort((a, b) => a - b);
    lblAsientos.innerText = seleccionados.join(', ');
    lblTotal.innerText = (seleccionados.length * PRECIO_PASAJE).toFixed(2);
    btnReservar.disabled = false;
  }
}

async function confirmarReserva() {
  const origen = document.getElementById('origen')?.value || 'Ica';
  const destino = document.getElementById('destino')?.value || 'Lima';
  const fecha = document.getElementById('fecha')?.value || '2026-10-02';
  const btnReservar = document.getElementById('btn-reservar');

  if (seleccionados.length === 0) return;

  if (btnReservar) {
    btnReservar.disabled = true;
    btnReservar.innerText = 'Guardando reserva...';
  }

  try {
    for (const asientoNum of seleccionados) {
      await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuario: 1,
          origen: origen,
          destino: destino,
          fecha: fecha,
          hora: '09:00 AM',
          asiento: String(asientoNum),
          precio: PRECIO_PASAJE,
          estado: 'registrado',
          registrado_por: 'Cliente Web'
        })
      });
    }

    alert(`¡Reserva realizada con éxito!\nRuta: ${origen} -> ${destino}\nAsientos: ${seleccionados.join(', ')}\nTotal: S/ ${(seleccionados.length * PRECIO_PASAJE).toFixed(2)}`);
    
    seleccionados = [];
    actualizarResumen();
    const seccion = document.getElementById('seccion-asientos');
    if (seccion) seccion.style.display = 'none';

  } catch (error) {
    console.error('Error al guardar la reserva:', error);
    alert('Ocurrió un error al guardar la reserva en el servidor.');
  } finally {
    if (btnReservar) {
      btnReservar.disabled = false;
      btnReservar.innerText = 'Confirmar Reserva';
    }
  }
}

function cerrarSesion() {
  window.location.href = "../index.html";
}
