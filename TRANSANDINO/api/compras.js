import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const { id_usuario } = req.query;
      if (id_usuario) {
        const result = await sql`SELECT * FROM compras_pasajes WHERE id_usuario = ${id_usuario} ORDER BY id DESC;`;
        return res.status(200).json(result.rows);
      } else {
        const result = await sql`SELECT * FROM compras_pasajes ORDER BY id DESC;`;
        return res.status(200).json(result.rows);
      }
    }

    if (method === 'POST') {
      const { id_usuario, origen, destino, fecha, precio, estado } = req.body;
      const estadoFinal = estado || 'registrado';
      const result = await sql`
        INSERT INTO compras_pasajes (id_usuario, origen, destino, fecha, precio, estado)
        VALUES (${id_usuario}, ${origen}, ${destino}, ${fecha}, ${precio}, ${estadoFinal})
        RETURNING *;
      `;
      return res.status(201).json(result.rows[0]);
    }

    if (method === 'PUT') {
      const { id } = req.query;
      const { origen, destino, fecha, precio, estado } = req.body;

      if (estado) {
        await sql`
          UPDATE compras_pasajes 
          SET origen=${origen}, destino=${destino}, fecha=${fecha}, precio=${precio}, estado=${estado}
          WHERE id=${id};
        `;
      } else {
        await sql`
          UPDATE compras_pasajes 
          SET origen=${origen}, destino=${destino}, fecha=${fecha}
          WHERE id=${id} AND estado='registrado';
        `;
      }
      return res.status(200).json({ message: 'Registro actualizado' });
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM compras_pasajes WHERE id=${id};`;
      return res.status(200).json({ message: 'Registro eliminado' });
    }

    return res.status(405).json({ message: 'Método no permitido' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
