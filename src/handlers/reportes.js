import { query } from '../db.js'
import { ok, bad } from '../util.js'

// GET /reportes
export const dashboard = async () => {
  try {
    const [inventarioPorTipo, ordenesPorEstado, stockPorInstalacion, topProductos] = await Promise.all([
      query(`
        SELECT p.tipo, SUM(NVL(i.cantidad,0)) AS total
          FROM producto p
          LEFT JOIN inventario i ON i.id_producto = p.id_producto
      GROUP BY p.tipo
      `),
      query(`SELECT estado, COUNT(*) AS total FROM orden_compra GROUP BY estado`),
      query(`
        SELECT ins.nombre AS instalacion, SUM(NVL(i.cantidad,0)) AS total
          FROM inventario i
          JOIN instalacion ins ON ins.id_instalacion = i.id_instalacion
      GROUP BY ins.nombre
      `),
      query(`
        SELECT p.nombre AS producto, NVL(SUM(d.cantidad),0) AS total
          FROM producto p
          LEFT JOIN detalle_orden_compra d ON d.id_producto = p.id_producto
      GROUP BY p.nombre
      ORDER BY total DESC
      FETCH FIRST 5 ROWS ONLY
      `),
    ])

    return ok({
      inventarioPorTipo: inventarioPorTipo.rows,
      ordenesPorEstado: ordenesPorEstado.rows,
      stockPorInstalacion: stockPorInstalacion.rows,
      topProductos: topProductos.rows
    })
  } catch (e) { return bad(e.message) }
}
