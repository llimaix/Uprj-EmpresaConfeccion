import { query, exec } from "../db.js";
import { ok, bad } from "../util.js";

// ✅ Listar órdenes
export const listar = async () => {
  try {
    const sql = `
      SELECT o.id_orden,
             p.nombre AS cliente,
             o.estado,
             COUNT(d.id_detalle) AS items
        FROM orden_compra o
        JOIN persona p ON p.id_persona = o.id_cliente
        LEFT JOIN detalle_orden_compra d ON o.id_orden = d.id_orden
    GROUP BY o.id_orden, p.nombre, o.estado
    ORDER BY o.id_orden DESC
    `;
    const { rows } = await query(sql);
    return ok({ rows });
  } catch (e) {
    console.error("Error listar órdenes:", e);
    return bad(e.message);
  }
};

// ✅ Cambiar estado de orden (tipo seguro)
export const actualizar = async (event) => {
  try {
    const id = Number(event.pathParameters?.id);
    const body = JSON.parse(event.body || "{}");
    const { estado } = body;

    if (!id || !estado) return bad("Faltan parámetros", 400);

    const res = await exec(
      `UPDATE orden_compra SET estado = :estado WHERE id_orden = :id`,
      { estado, id }
    );

    if (res.rowsAffected === 0)
      return bad(`No existe la orden ${id}`, 404);

    return ok({ id, estado });
  } catch (e) {
    console.error("Error actualizar orden:", e);
    return bad(e.message);
  }
};
