import { query } from '../db.js'
import { ok, bad } from '../util.js'

export const crear = async (event) => {
  const body = JSON.parse(event.body || '{}')
  const { nombre, tipo } = body
  if (!nombre || !tipo) return bad('Campos requeridos', 400)

  try {
    const sql = `
      INSERT INTO Producto (id_producto, nombre, tipo)
      VALUES (seq_producto.NEXTVAL, :nombre, :tipo)
      RETURNING id_producto INTO :id_producto
    `
    const binds = { nombre, tipo, id_producto: { dir: 3003, type: 2002 } }
    const res = await exec(sql, binds)
    return ok({ id_producto: res.outBinds.id_producto[0], nombre, tipo })
  } catch (e) { return bad(e.message) }
}
