import { query } from '../db.js'
import { ok, bad } from '../util.js'

export const listar = async () => {
  try {
    const sql = `
      SELECT i.id_inventario, p.nombre AS producto, ins.nombre AS instalacion, i.cantidad
      FROM Inventario i
      JOIN Producto p ON i.id_producto = p.id_producto
      JOIN Instalacion ins ON i.id_instalacion = ins.id_instalacion
      ORDER BY i.id_inventario
    `
    const { rows } = await query(sql)
    return ok({ rows })
  } catch (e) {
    return bad(e.message)
  }
}
