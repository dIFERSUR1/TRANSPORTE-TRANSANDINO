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

    // GET: Consultar pasajes (Individual, Filtro por Búsqueda ILIKE para Caja o Estado)
    if (req.method === 'GET') {
      const { id, q, estado } = req.query;

      // Consulta por ID
      if (id) {
        const result = await client.query('SELECT * FROM compras_pasajes WHERE id = $1', [parseInt(id)]);
        await client.end();
        return res.status(200).json(result.rows[0] || {});
      }

      // RF-22.12: Búsqueda flexible ILIKE para caja.html (Código Reserva, Usuario, DNI, Seguimiento)
      if (q) {
        const queryText = `
          SELECT * FROM compras_pasajes 
          WHERE (codigo_reserva ILIKE $1 OR id_usuario ILIKE $1 OR codigo_seguimiento ILIKE $1 OR origen ILIKE $1 OR destino ILIKE $1)
          ORDER BY id DESC;
        `;
        const result = await client.query(queryText, [`%${q}%`]);
        await client.end();
        return res.status(200).json(result.rows);
      }

      // RF-22.13: Filtro por estado para Embarque y Tableros (ej: ?estado=PAGADO)
      if (estado) {
        const result = await client.query('SELECT * FROM compras_pasajes WHERE UPPER(estado) = UPPER($1) ORDER BY id DESC', [estado]);
        await client.end();
        return res.status(200).json(result.rows);
      }

      // Consulta general por defecto
      const result = await client.query('SELECT * FROM compras_pasajes ORDER BY id ASC');
      await client.end();
      return res.status(200).json(result.rows);
    }

    // POST: Insertar nuevo pasaje con Cotización y Pagos (RF-22.09 a RF-22.12)
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
        codigo_seguimiento,
        // Nuevos campos requeridos
        codigo_reserva,
        tipo_asiento,
        equipaje_kg,
        monto_calculado,
        metodo_pago,
        id_cajero
      } = req.body;

      const userRef = String(id_usuario || usuario_id || '1');
      const empNombre = empleado_atendio || 'Empleado';
      const turnoAsignado = turno || 'Mañana';
      const fViaje = fecha_viaje || fecha || '2026-10-15';
      const hViaje = hora_viaje || hora || '08:00 AM';
      const nAsiento = String(num_asiento !== undefined ? num_asiento : (asiento || '1'));
      const codSeguimiento = codigo_seguimiento || `TA-${Math.floor(100000 + Math.random() * 900000)}`;

      // Procesamiento de nuevos campos
      const codReserva = codigo_reserva || `RES-${Math.floor(100000 + Math.random() * 900000)}`;
      const tAsiento = tipo_asiento || 'semicama';
      const eqKg = parseFloat(equipaje_kg) || 0.0;
      const mCalculado = parseFloat(monto_calculado !== undefined ? monto_calculado : (precio || 50.00));
      const mPago = metodo_pago || 'EFECTIVO';
      const cajeroId = id_cajero ? String(id_cajero) : null;

      const query = `
        INSERT INTO compras_pasajes 
        (id_usuario, empleado_atendio, turno, origen, destino, fecha, hora, asiento, precio, estado, codigo_seguimiento, codigo_reserva, tipo_asiento, equipaje_kg, monto_calculado, metodo_pago, id_cajero)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
        parseFloat(precio) || mCalculado,
        estado || 'registrado',
        codSeguimiento,
        codReserva,
        tAsiento,
        eqKg,
        mCalculado,
        mPago,
        cajeroId
      ];

      const result = await client.query(query, values);
      await client.end();
      return res.status(201).json(result.rows[0]);
    }

    // PUT: Actualizar pasaje (Asiento, Estado, Precio, Ruta, Pagos, Cajero)
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
        turno,
        // Nuevos campos
        codigo_reserva,
        tipo_asiento,
        equipaje_kg,
        monto_calculado,
        metodo_pago,
        id_cajero
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

        // Si cambia a estado PAGADO se registra automáticamente la fecha de pago
        if (String(estado).toUpperCase() === 'PAGADO') {
          fields.push(`fecha_pago = NOW()`);
        }
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
      if (codigo_reserva !== undefined && codigo_reserva !== null) {
        fields.push(`codigo_reserva = $${index++}`);
        values.push(String(codigo_reserva));
      }
      if (tipo_asiento !== undefined && tipo_asiento !== null) {
        fields.push(`tipo_asiento = $${index++}`);
        values.push(String(tipo_asiento));
      }
      if (equipaje_kg !== undefined && equipaje_kg !== null) {
        fields.push(`equipaje_kg = $${index++}`);
        values.push(parseFloat(equipaje_kg));
      }
      if (monto_calculado !== undefined && monto_calculado !== null) {
        fields.push(`monto_calculado = $${index++}`);
        values.push(parseFloat(monto_calculado));
      }
      if (metodo_pago !== undefined && metodo_pago !== null) {
        fields.push(`metodo_pago = $${index++}`);
        values.push(String(metodo_pago));
      }
      if (id_cajero !== undefined && id_cajero !== null) {
        fields.push(`id_cajero = $${index++}`);
        values.push(String(id_cajero));
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
