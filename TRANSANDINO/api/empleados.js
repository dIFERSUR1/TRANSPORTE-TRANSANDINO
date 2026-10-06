import { Client } from 'pg';

// Utiliza la variable de entorno configurada en Vercel / .env
const getDbClient = () => {
  return new Client({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
};

export default async function handler(req, res) {
  // Manejo de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getDbClient();

  try {
    await client.connect();

    // 1. GET: Obtener todos los empleados
    if (req.method === 'GET') {
      const result = await client.query('SELECT * FROM empleados ORDER BY id ASC');
      await client.end();
      return res.status(200).json(result.rows);
    }

    // 2. POST: Crear un nuevo empleado
    if (req.method === 'POST') {
      const { nombre, correo, rol, turno } = req.body;
      const query = `
        INSERT INTO empleados (nombre, correo, rol, turno)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [nombre, correo, rol || 'Empleado', turno || 'Mañana (08:00 AM - 02:00 PM)'];
      const result = await client.query(query, values);
      await client.end();
      return res.status(201).json(result.rows[0]);
    }

    // 3. PUT: Actualizar turno o datos del empleado
    if (req.method === 'PUT') {
      const { id, nombre, correo, rol, turno } = req.body;
      const query = `
        UPDATE empleados 
        SET nombre = COALESCE($1, nombre),
            correo = COALESCE($2, correo),
            rol = COALESCE($3, rol),
            turno = COALESCE($4, turno)
        WHERE id = $5
        RETURNING *
      `;
      const values = [nombre, correo, rol, turno, id];
      const result = await client.query(query, values);
      await client.end();
      return res.status(200).json(result.rows[0]);
    }

    // 4. DELETE: Eliminar o desactivar un empleado
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await client.query('DELETE FROM empleados WHERE id = $1', [id]);
      await client.end();
      return res.status(200).json({ message: 'Empleado eliminado con éxito' });
    }

    await client.end();
    return res.status(45)
  } catch (error) {
    if (client) await client.end();
    console.error('Error en API Empleados:', error);
    return res.status(500).json({ error: error.message });
  }
}
