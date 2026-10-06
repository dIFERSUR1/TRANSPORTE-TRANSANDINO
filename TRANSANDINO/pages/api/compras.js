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

    // GET: Consultar pasajes
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

    // POST: Insertar nuevo pasaje
    if (req.method === 'POST') {
      const {
        id_usuario,
        usuario_id,
        empleado_atendio,
        turno,
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

      const userRef = String(id_usuario || usuario_id || '1');
      const empNombre = empleado_atendio || 'Empleado';
      const turnoAsignado = turno || 'Mañana';
      const fViaje = fecha_viaje || fecha || '2026-10-15';
      const hViaje = hora_viaje || hora || '08:00 AM';
      const nAsiento = String(num_asiento !== undefined ? num_asiento : (asiento || '1'));
      const codSeguimiento = codigo_seguimiento || `TA-${Math.floor(100000 + Math.random() * 900000)}`;

      const query = `
        INSERT INTO compras_pasajes 
        (id_usuario, empleado_atendio, turno, origen, destino, fecha, hora, asiento, precio, estado, codigo_seguimiento)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `;
      const values = [
        userRef,
        empNombre,
        turnoAsignado,
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

    // PUT: Actualizar pasaje (Asiento, Estado, Precio, Ruta, etc.)
    if (req.method === 'PUT') {
      const rawId = req.query.id || (req.body && req.body.id);

      if (!rawId || isNaN(parseInt(rawId))) {
        await client.end();
        return res.status(400).json({ message: 'Falta un ID válido del registro a actualizar.' });
      }

      const targetId = parseInt(rawId);
      const { 
        estado, 
        precio, 
        id_usuario, 
        usuario_id, 
        asiento, 
        num_asiento,
        origen,
        destino,
        fecha_viaje,
        fecha,
        hora_viaje,
        hora,
        empleado_atendio,
        turno
      } = req.body;
      
      const valorAsiento = asiento !== undefined ? asiento : num_asiento;
      const nuevaFecha = fecha_viaje !== undefined ? fecha_viaje : fecha;
      const nuevaHora = hora_viaje !== undefined ? hora_viaje : hora;
      const pasajeroRef = id_usuario !== undefined ? id_usuario : usuario_id;

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
      if (pasajeroRef !== undefined && pasajeroRef !== null) {
        fields.push(`id_usuario = $${index++}`);
        values.push(String(pasajeroRef));
      }
      if (valorAsiento !== undefined && valorAsiento !== null) {
        fields.push(`asiento = $${index++}`);
        values.push(String(valorAsiento));
      }
      if (origen !== undefined && origen !== null) {
        fields.push(`origen = $${index++}`);
        values.push(String(origen));
      }
      if (destino !== undefined && destino !== null) {
        fields.push(`destino = $${index++}`);
        values.push(String(destino));
      }
      if (nuevaFecha !== undefined && nuevaFecha !== null) {
        fields.push(`fecha = $${index++}`);
        values.push(String(nuevaFecha));
      }
      if (nuevaHora !== undefined && nuevaHora !== null) {
        fields.push(`hora = $${index++}`);
        values.push(String(nuevaHora));
      }
      if (empleado_atendio !== undefined && empleado_atendio !== null) {
        fields.push(`empleado_atendio = $${index++}`);
        values.push(String(empleado_atendio));
      }
      if (turno !== undefined && turno !== null) {
        fields.push(`turno = $${index++}`);
        values.push(String(turno));
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

    // DELETE: Eliminar pasaje
    if (req.method === 'DELETE') {
      const rawId = req.query.id || (req.body && req.body.id);

      if (!rawId || isNaN(parseInt(rawId))) {
        await client.end();
        return res.status(400).json({ message: 'Falta un ID válido a eliminar.' });
      }

      await client.query('DELETE FROM compras_pasajes WHERE id = $1', [parseInt(rawId)]);
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
