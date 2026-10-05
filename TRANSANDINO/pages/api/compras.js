import { Client } from 'pg';

export default async function handler(req, res) {
  // Configuración de Cabeceras CORS
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

    if (req.method === 'GET') {
      const { id } = req.query;

      if (id) {
        const result = await client.query('SELECT * FROM compras_pasajes WHERE id = $1', [parseInt(id)]);
        await client.end();
        return res.status(200).json(result.rows[0] || {});
      }

      const result = await client.query('SELECT * FROM compras_pasajes ORDER BY id ASC');
      await client.end();
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
      await client.end();
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const rawId = req.query.id || (req.body && req.body.id);

      if (!rawId) {
        await client.end();
        return res.status(400).json({ message: 'Falta el ID del registro a actualizar.' });
      }

      const targetId = parseInt(rawId);
      const { estado, precio, id_usuario, asiento, num_asiento } = req.body;
      
      // Capturar el nuevo número de asiento si viene como 'asiento' o 'num_asiento'
      const nuevoAsiento = asiento !== undefined ? asiento : num_asiento;

      // Construcción dinámica de la consulta para evitar sobrescribir campos con NULL
      let fields = [];
      let values = [];
      let index = 1;

      if (estado !== undefined && estado !== null) {
        fields.push(`estado = $${index++}`);
        values.push(String(estado));
      }
      if (precio !== undefined && precio !== null) {
        fields.push(`precio = $${index++}`);
        values.push(parseFloat(precio));
      }
      if (id_usuario !== undefined && id_usuario !== null) {
        fields.push(`id_usuario = $${index++}`);
        values.push(parseInt(id_usuario));
      }
      if (nuevoAsiento !== undefined && nuevoAsiento !== null) {
        fields.push(`asiento = $${index++}`);
        values.push(String(nuevoAsiento));
      }

      if (fields.length === 0) {
        await client.end();
        return res.status(400).json({ message: 'No se enviaron datos para actualizar.' });
      }

      values.push(targetId);
      const updateQuery = `
        UPDATE compras_pasajes 
        SET ${fields.join(', ')} 
        WHERE id = $${index} 
        RETURNING *;
      `;

      const result = await client.query(updateQuery, values);
      await client.end();

      if (result.rowCount === 0) {
        return res.status(404).json({ message: `No se encontró ningún pasaje con ID ${targetId}` });
      }

      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const rawId = req.query.id || (req.body && req.body.id);

      if (!rawId) {
        await client.end();
        return res.status(400).json({ message: 'Falta el ID a eliminar.' });
      }

      const result = await client.query('DELETE FROM compras_pasajes WHERE id = $1', [parseInt(rawId)]);
      await client.end();

      return res.status(200).json({ message: 'Registro eliminado correctamente de la base de datos.' });
    }

    await client.end();
    return res.status(405).json({ message: 'Método no permitido' });

  } catch (error) {
    console.error('Error detallado en API compras:', error);
    try { await client.end(); } catch (e) {}
    return res.status(500).json({ 
      message: 'Error interno en servidor o base de datos', 
      error: error.message 
    });
  }
}
