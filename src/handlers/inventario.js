import { query, exec } from '../db.js'
import { ok, bad } from '../util.js'

// GET /inventario  → stock por instalación y producto
export const listar = async () => {
  try {
    const sql = `
      SELECT i.id_inventario, i.id_instalacion, ins.nombre AS instalacion,
             i.id_producto, p.nombre AS producto, p.tipo,
             NVL(i.cantidad,0) AS cantidad
      FROM inventario i
      JOIN producto p    ON p.id_producto = i.id_producto
      JOIN instalacion ins ON ins.id_instalacion = i.id_instalacion
      ORDER BY ins.nombre, p.nombre
    `
    const { rows } = await query(sql)
    return ok({ rows })
  } catch (e) { return bad(e.message) }
}

// POST /inventario/mov  → {id_instalacion, id_producto, delta, motivo?}
export const movimiento = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { id_instalacion, id_producto, delta, motivo } = body
    if (!id_instalacion || !id_producto || !Number(delta)) {
      return bad('id_instalacion, id_producto y delta son obligatorios', 400)
    }

    // upsert simple: si existe inventario, actualiza; si no, crea
    const upd = await exec(
      `UPDATE inventario
         SET cantidad = NVL(cantidad,0) + :delta
       WHERE id_instalacion = :id_instalacion AND id_producto = :id_producto`,
      { delta, id_instalacion, id_producto }
    )

    if (upd.rowsAffected === 0) {
      await exec(
        `INSERT INTO inventario (id_inventario, id_instalacion, id_producto, cantidad)
         VALUES (seq_inventario.NEXTVAL, :id_instalacion, :id_producto, :cantidad)`,
        { id_instalacion, id_producto, cantidad: Number(delta) }
      )
    }

    // devolver el stock actualizado
    const { rows } = await query(
      `SELECT NVL(cantidad,0) AS cantidad
         FROM inventario
        WHERE id_instalacion = :id_instalacion AND id_producto = :id_producto`,
      { id_instalacion, id_producto }
    )

    return ok({
      id_instalacion, id_producto,
      nueva_cantidad: rows?.[0]?.CANTIDAD ?? 0,
      motivo: motivo || null
    })
  } catch (e) { return bad(e.message) }
}
