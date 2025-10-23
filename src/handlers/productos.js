import oracledb from 'oracledb'
import { query, exec } from '../db.js'
import { ok, bad } from '../util.js'

// === Listar Productos ===
export const listar = async () => {
  try {
    const sql = `SELECT id_producto, nombre, tipo FROM Producto ORDER BY id_producto`
    const { rows } = await query(sql)
    return ok({ rows })
  } catch (e) {
    console.error('Error listar productos:', e)
    return bad(e.message)
  }
}

// === Crear Producto ===
export const crear = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { nombre, tipo } = body
    if (!nombre || !tipo) return bad('Campos requeridos', 400)

    const sql = `
      INSERT INTO Producto (id_producto, nombre, tipo)
      VALUES (seq_producto.NEXTVAL, :nombre, :tipo)
      RETURNING id_producto INTO :id_producto
    `
    const binds = {
      nombre,
      tipo,
      id_producto: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }

    const res = await exec(sql, binds)
    const id = res.outBinds?.id_producto?.[0]
    return ok({ id_producto: id, nombre, tipo })
  } catch (e) {
    console.error('Error crear producto:', e)
    return bad(e.message)
  }
}
