import { Client } from 'pg';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Verificar si el correo ya está en uso
    const checkUser = await client.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: 'Este correo ya está registrado.' });
    }

    // Insertar el nuevo usuario en Neon
    await client.query(
      'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3)',
      [nombre, email, password]
    );

    return res.status(201).json({ success: true, message: '¡Cuenta creada con éxito!' });

  } catch (error) {
    console.error('Error al registrar:', error);
    return res.status(500).json({ message: 'Error en el servidor al registrar usuario.' });
  } finally {
    await client.end();
  }
}
