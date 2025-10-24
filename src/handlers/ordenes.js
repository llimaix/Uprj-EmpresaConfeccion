import oracledb from "oracledb";
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

// ✅ Crear orden nueva
export const crear = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { id_cliente, items } = body;

    if (!id_cliente || !Array.isArray(items) || items.length === 0)
      return bad("Faltan datos de cliente o items", 400);

    const insertOrden = `
      INSERT INTO orden_compra (id_orden, id_cliente, estado, fecha)
      VALUES (seq_orden_compra.NEXTVAL, :id_cliente, 'PENDIENTE', SYSDATE)
      RETURNING id_orden INTO :id_orden
    `;

    const result = await exec(insertOrden, {
      id_cliente,
      id_orden: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    });

    const id_orden = result.outBinds.id_orden[0];

    for (const item of items) {
      await exec(
        `INSERT INTO detalle_orden_compra (id_detalle, id_orden, id_producto, cantidad)
         VALUES (seq_detalle_orden_compra.NEXTVAL, :id_orden, :id_producto, :cantidad)`,
        {
          id_orden,
          id_producto: item.id_producto,
          cantidad: item.cantidad,
        }
      );
    }

    return ok({ id_orden });
  } catch (e) {
    console.error("Error crear orden:", e);
    return bad(e.message);
  }
};

// ✅ Actualizar estado
export const actualizar = async (event) => {
  try {
    const id = event.pathParameters?.id;
    const body = JSON.parse(event.body || "{}");
    const { estado } = body;

    if (!id || !estado) return bad("Faltan parámetros", 400);

    const update = await exec(
      `UPDATE orden_compra SET estado = :estado WHERE id_orden = :id`,
      { estado, id }
    );

    if (update.rowsAffected === 0)
      return bad(`Orden ${id} no encontrada`, 404);

    return ok({ id, estado });
  } catch (e) {
    console.error("Error actualizar orden:", e);
    return bad(e.message);
  }
};
