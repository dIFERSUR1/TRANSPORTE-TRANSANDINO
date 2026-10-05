import { Client } from 'pg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('DATABASE_URL no está definida en las variables de entorno de Vercel.');
    return res.status(500).json({ 
      error: 'Error de configuración: Faltan las variables de entorno DATABASE_URL en Vercel.' 
    });
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. OBTENER PASAJES (GET)
    if (req.method === 'GET') {
      const { id } = req.query;

      if (id) {
        const result = await client.query('SELECT * FROM compras_pasajes WHERE id = $1', [id]);
        return res.status(200).json(result.rows[0] || {});
      }

      const result = await client.query('SELECT * FROM compras_pasajes ORDER BY id DESC');
      return res.status(200).json(result.rows);
    }

    // 2. CREAR NUEVO PASAJE (POST)
    if (req.method === 'POST') {
      const {
        id_usuario,
        origen,
        destino,
        fecha_viaje,
        fecha,
        hora_viaje,
        hora,
        num_asiento,
        asiento,
        precio,
        estado,
        codigo_seguimiento
      } = req.body;

      const fViaje = fecha_viaje || fecha || '2026-10-15';
      const hViaje = hora_viaje || hora || '09:00 AM';
      const nAsiento = String(num_asiento || asiento || '1');
      const codSeguimiento = codigo_seguimiento || `TA-${Math.floor(100000 + Math.random() * 900000)}`;

      const query = `
        INSERT INTO compras_pasajes (id_usuario, origen, destino, fecha, hora, asiento, precio, estado, codigo_seguimiento)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;
      const values = [
        parseInt(id_usuario) || 1,
        origen || 'Ica',
        destino || 'Lima',
        fViaje,
        hViaje,
        nAsiento,
        parseFloat(precio) || 50.00,
        estado || 'registrado',
        codSeguimiento
      ];

      const result = await client.query(query, values);
      return res.status(201).json(result.rows[0]);
    }

    // 3. ACTUALIZAR PASAJE (PUT - Incluye cambio de asiento, precio y estado)
    if (req.method === 'PUT') {
      const targetId = req.query.id || (req.body && req.body.id);

      if (!targetId) {
        return res.status(400).json({ message: 'Falta el ID del registro a actualizar.' });
      }

      const { estado, precio, id_usuario, asiento, num_asiento } = req.body;
      const nuevoAsiento = asiento || num_asiento;

      const result = await client.query(
        `UPDATE compras_pasajes 
         SET estado = COALESCE($1, estado), 
             precio = COALESCE($2, precio),
             id_usuario = COALESCE($3, id_usuario),
             asiento = COALESCE($4, asiento)
         WHERE id = $5 RETURNING *;`,
        [
          estado !== undefined ? estado : null,
          precio !== undefined ? precio : null,
          id_usuario !== undefined ? id_usuario : null,
          nuevoAsiento !== undefined ? String(nuevoAsiento) : null,
          targetId
        ]
      );

      return res.status(200).json(result.rows[0] || { message: 'Actualizado correctamente' });
    }

    // 4. ELIMINAR PASAJE (DELETE)
    if (req.method === 'DELETE') {
      const targetId = req.query.id || (req.body && req.body.id);

      if (!targetId) {
        return res.status(400).json({ message: 'Falta el ID a eliminar.' });
      }

      await client.query('DELETE FROM compras_pasajes WHERE id = $1', [targetId]);
      return res.status(200).json({ message: 'Registro eliminado correctamente de la base de datos.' });
    }

    return res.status(405).json({ message: 'Método no permitido' });
  } catch (error) {
    console.error('Error detallado en API compras:', error);
    return res.status(500).json({ 
      message: 'Error interno en servidor o base de datos', 
      error: error.message 
    });
  } finally {
    await client.end();
  }
}
