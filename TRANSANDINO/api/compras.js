const { Client } = require('pg');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    if (req.method === 'GET') {
      const { id } = req.query;
      if (id) {
        const result = await client.query('SELECT * FROM compras WHERE id = $1', [id]);
        return res.status(200).json(result.rows[0] || {});
      }
      const result = await client.query('SELECT * FROM compras ORDER BY id DESC');
      return res.status(200).json(result.rows);
    }

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
      const hViaje = hora_viaje || hora || '08:00 AM';
      const nAsiento = parseInt(num_asiento || asiento || 1);
      const codSeguimiento = codigo_seguimiento || `TA-${Math.floor(100000 + Math.random() * 900000)}`;

      const query = `
        INSERT INTO compras (id_usuario, origen, destino, fecha_viaje, hora_viaje, num_asiento, precio, estado, codigo_seguimiento)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;
      const values = [
        parseInt(id_usuario) || 1,
        origen,
        destino,
        fViaje,
        hViaje,
        nAsiento,
        parseFloat(precio) || 0,
        estado || 'registrado',
        codSeguimiento
      ];

      const result = await client.query(query, values);
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { estado, origen, destino, fecha_viaje, precio } = req.body;

      if (!id) {
        return res.status(400).json({ message: 'Falta el ID del registro.' });
      }

      if (estado && !origen) {
        const query = 'UPDATE compras SET estado = $1 WHERE id = $2 RETURNING *;';
        const result = await client.query(query, [estado, id]);
        return res.status(200).json(result.rows[0]);
      } else {
        const query = `
          UPDATE compras 
          SET origen = COALESCE($1, origen),
              destino = COALESCE($2, destino),
              fecha_viaje = COALESCE($3, fecha_viaje),
              precio = COALESCE($4, precio),
              estado = COALESCE($5, estado)
          WHERE id = $6 RETURNING *;
        `;
        const result = await client.query(query, [origen, destino, fecha_viaje, precio, estado, id]);
        return res.status(200).json(result.rows[0]);
      }
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ message: 'Falta el ID a eliminar.' });
      }
      await client.query('DELETE FROM compras WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Registro eliminado correctamente.' });
    }

    return res.status(405).json({ message: 'Método no permitido' });
  } catch (error) {
    console.error('Error en API compras:', error);
    return res.status(500).json({ message: 'Error interno de base de datos', error: error.message });
  } finally {
    await client.end();
  }
}
