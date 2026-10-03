import { Client } from 'pg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const checkUser = await client.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: 'Este correo ya está registrado.' });
    }

    const rolUsuario = rol || 'CLIENTE';

    const result = await client.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol',
      [nombre, email, password, rolUsuario]
    );

    return res.status(201).json({
      success: true,
      message: '¡Cuenta creada con éxito!',
      usuario: result.rows[0]
    });

  } catch (error) {
    console.error('Error al registrar:', error);
    return res.status(500).json({ message: 'Error en el servidor al registrar usuario.', error: error.message });
  } finally {
    await client.end();
  }
}
