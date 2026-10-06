import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { nombre, email, password, rol } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Insertar en la tabla usuarios de Neon con la fecha actual
    const result = await sql`
      INSERT INTO usuarios (nombre, email, password, fecha_registro, rol)
      VALUES (${nombre}, ${email}, ${password}, NOW(), ${rol})
      RETURNING *;
    `;

    return res.status(200).json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error SQL:', error);
    return res.status(500).json({ message: error.message });
  }
}
