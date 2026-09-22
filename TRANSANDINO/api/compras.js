import { neon } from '@neondatabase/serverless';

function generarCodigoSeguimiento() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = 'TA-';
  for (let i = 0; i < 7; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { nombre_pasajero, origen, destino, fecha_viaje } = req.body;

  if (!nombre_pasajero || !origen || !destino || !fecha_viaje) {
    return res.status(400).json({ message: 'Faltan datos requeridos.' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const codigo_seguimiento = generarCodigoSeguimiento();

    await sql`
      INSERT INTO compras_pasajes (codigo_seguimiento, nombre_pasajero, origen, destino, fecha_viaje)
      VALUES (${codigo_seguimiento}, ${nombre_pasajero}, ${origen}, ${destino}, ${fecha_viaje})
    `;

    return res.status(200).json({
      success: true,
      codigo_seguimiento,
      message: 'Compra registrada con éxito.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno en la base de datos.' });
  }
}
