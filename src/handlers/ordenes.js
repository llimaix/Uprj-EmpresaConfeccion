import { exec } from '../db.js'
import { ok, bad } from '../util.js'

/**
 * Crea una orden de compra y sus detalles mínimos
 * body:
 * {
 *   id_cliente: number (id en Persona),
 *   estado: string,
 *   items: [{ id_producto: number, cantidad: number }]
 * }
 */
export const crear = async (event) => {
  const body = JSON.parse(event.body || '{}')
  const { id_cliente, estado='PENDIENTE', items=[] } = body

  if(!id_cliente || !Array.isArray(items) || items.length===0){
    return bad('id_cliente e items son obligatorios', 400)
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
