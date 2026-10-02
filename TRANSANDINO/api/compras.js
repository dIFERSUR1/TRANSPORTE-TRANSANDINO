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
  const sql = neon(process.env.DATABASE_URL);
  const { method } = req;

  try {
    if (method === 'GET') {
      const { id_usuario } = req.query;
      if (id_usuario) {
        const pasajes = await sql`
          SELECT * FROM compras_pasajes 
          WHERE id_usuario = ${parseInt(id_usuario)} 
          ORDER BY id DESC;
        `;
        return res.status(200).json(pasajes);
      } else {
        const pasajes = await sql`SELECT * FROM compras_pasajes ORDER BY id DESC;`;
        return res.status(200).json(pasajes);
      }
    }

    if (method === 'POST') {
      const { id_usuario, nombre_pasajero, origen, destino, fecha, precio, estado } = req.body;
      const codigo_seguimiento = generarCodigoSeguimiento();
      const estadoFinal = estado || 'registrado';
      const fechaFinal = fecha || new Date().toISOString().split('T')[0];

      const nuevo = await sql`
        INSERT INTO compras_pasajes (
          id_usuario, codigo_seguimiento, nombre_pasajero, origen, destino, fecha, fecha_viaje, precio, estado
        )
        VALUES (
          ${id_usuario ? parseInt(id_usuario) : null}, 
          ${codigo_seguimiento}, 
          ${nombre_pasajero || ''}, 
          ${origen}, 
          ${destino}, 
          ${fechaFinal}, 
          ${fechaFinal}, 
          ${precio || 0}, 
          ${estadoFinal}
        )
        RETURNING *;
      `;
      return res.status(201).json({
        success: true,
        codigo_seguimiento,
        data: nuevo[0]
      });
    }

    if (method === 'PUT') {
      const { id } = req.query;
      const { origen, destino, fecha, precio, estado } = req.body;

      if (!id) return res.status(400).json({ message: 'El ID es requerido.' });

      if (estado) {
        const resultado = await sql`
          UPDATE compras_pasajes 
          SET origen = COALESCE(${origen || null}, origen),
              destino = COALESCE(${destino || null}, destino),
              fecha = COALESCE(${fecha || null}, fecha),
              fecha_viaje = COALESCE(${fecha || null}, fecha_viaje),
              precio = COALESCE(${precio || null}, precio),
              estado = ${estado}
          WHERE id = ${parseInt(id)}
          RETURNING *;
        `;
        if (resultado.length === 0) {
          return res.status(404).json({ message: 'Registro no encontrado.' });
        }
      } else {
        const resultado = await sql`
          UPDATE compras_pasajes 
          SET origen = COALESCE(${origen || null}, origen),
              destino = COALESCE(${destino || null}, destino),
              fecha = COALESCE(${fecha || null}, fecha),
              fecha_viaje = COALESCE(${fecha || null}, fecha_viaje)
          WHERE id = ${parseInt(id)} AND estado = 'registrado'
          RETURNING *;
        `;

        if (resultado.length === 0) {
          return res.status(400).json({ 
            message: "No se pudo actualizar. El pasaje no existe o su estado ya no es 'registrado'." 
          });
        }
      }
      return res.status(200).json({ message: 'Registro actualizado con éxito.' });
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: 'El ID es requerido.' });
      await sql`DELETE FROM compras_pasajes WHERE id = ${parseInt(id)};`;
      return res.status(200).json({ message: 'Registro eliminado con éxito.' });
    }

    return res.status(405).json({ message: 'Método no permitido.' });
  } catch (error) {
    console.error('Error DB:', error);
    return res.status(500).json({ message: error.message || 'Error interno en la base de datos.' });
  }
}
