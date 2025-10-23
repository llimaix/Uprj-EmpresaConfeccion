import { query } from '../db.js'
import { ok, bad } from '../util.js'

// listar todas las órdenes con su cliente y total de items
export const listar = async () => {
  try {
    const sql = `
      SELECT 
        o.id_orden,
        p.nombre AS cliente,
        o.estado,
        COUNT(d.id_detalle) AS total_items
      FROM Orden_Compra o
      JOIN Persona p ON o.id_cliente = p.id_persona
      LEFT JOIN Detalle_Orden_Compra d ON d.id_orden = o.id_orden
      GROUP BY o.id_orden, p.nombre, o.estado
      ORDER BY o.id_orden DESC
    `
    const { rows } = await query(sql)
    return ok({ rows })
  } catch (e) {
    console.error(e)
    return bad(e.message)
  }
}


/**
 * Crea una orden de compra y sus detalles
 * @param {Object} data - Datos de la orden
 * @param {number} data.id_cliente - ID del cliente (id en Persona)
 * @param {string} data.estado - Estado de la orden
 * @param {Array} data.items - Array de items [{ id_producto: number, cantidad: number }]
 */
export const crear = async (data) => {
  const { id_cliente, estado, items } = data

  // Validaciones básicas
  if (!id_cliente || !estado || !items || !Array.isArray(items) || items.length === 0) {
    return bad('Faltan datos requeridos: id_cliente, estado e items')
  }


  // transacción simple con autoCommit por sentencia
  const sqlOrden = `
    INSERT INTO Orden_Compra (id_orden, id_cliente, estado)
    VALUES (seq_orden_compra.NEXTVAL, :id_cliente, :estado)
    RETURNING id_orden INTO :id_orden
  `
  const bindsOrden = {
    id_cliente, estado,
    id_orden: { dir: 3003, type: 2002 } // BIND_OUT NUMBER
  }

  try{
    const resOrden = await exec(sqlOrden, bindsOrden)
    const id_orden = resOrden.outBinds.id_orden[0]

    for(const it of items){
      const sqlDet = `
        INSERT INTO Detalle_Orden_Compra (id_detalle, id_orden, id_producto, cantidad)
        VALUES (seq_detalle_orden.NEXTVAL, :id_orden, :id_producto, :cantidad)
      `
      await exec(sqlDet, { id_orden, id_producto: it.id_producto, cantidad: it.cantidad })
    }

    return ok({ id_orden, estado, itemsCount: items.length })
  }catch(e){
    console.error(e)
    return bad(e.message)
  }
}
