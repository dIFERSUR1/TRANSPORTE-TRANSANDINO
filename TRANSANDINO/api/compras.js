import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    try {
      const compras = await sql`SELECT * FROM ticket_purchases ORDER BY id DESC;`;
      return res.status(200).json(compras);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { usuario_id, origen, destino, asiento, precio, estado, fecha_viaje, hora_viaje } = req.body;
      const nuevaCompra = await sql`
        INSERT INTO ticket_purchases (usuario_id, origen, destino, asiento, precio, estado, fecha, hora)
        VALUES (${usuario_id || '1'}, ${origen}, ${destino}, ${asiento}, ${precio || 50}, ${estado || 'registrado'}, ${fecha_viaje || '2026-10-15'}, ${hora_viaje || '09:00 AM'})
        RETURNING *;
      `;
      return res.status(201).json(nuevaCompra[0]);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
