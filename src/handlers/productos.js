import oracledb from 'oracledb'
import { query, exec } from '../db.js'
import { ok, bad } from '../util.js'

// === LISTAR ===
export const listar = async () => {
  try {
    const sql = `SELECT id_producto, nombre, tipo FROM producto ORDER BY id_producto`
    const { rows } = await query(sql)
    return ok({ rows })
  } catch (e) {
    console.error('Error listar productos:', e)
    return bad(e.message)
  }
}

// === CREAR ===
export const crear = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { nombre, tipo } = body
    if (!nombre || !tipo) return bad('Campos requeridos', 400)

    const sql = `
      INSERT INTO producto (id_producto, nombre, tipo)
      VALUES (seq_producto.NEXTVAL, :nombre, :tipo)
      RETURNING id_producto INTO :id_producto
    `
    const binds = {
      nombre,
      tipo,
      id_producto: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }

    const res = await exec(sql, binds)
    const id = res.outBinds.id_producto[0]
    return ok({ id_producto: id, nombre, tipo })
  } catch (e) {
    console.error('Error crear producto:', e)
    return bad(e.message)
  }
}

// === ACTUALIZAR ===
export const actualizar = async (event) => {
  try {
    const id = event.pathParameters?.id
    const body = JSON.parse(event.body || '{}')
    const { nombre, tipo } = body
    if (!id || !nombre || !tipo) return bad('Campos requeridos', 400)

    const sql = `
      UPDATE producto
      SET nombre = :nombre, tipo = :tipo
      WHERE id_producto = :id
    `
    await exec(sql, { id, nombre, tipo })
    return ok({ message: 'Producto actualizado', id })
  } catch (e) {
    console.error('Error actualizar producto:', e)
    return bad(e.message)
  }
}

// === ELIMINAR ===
export const eliminar = async (event) => {
  try {
    const id = event.pathParameters?.id
    if (!id) return bad('ID requerido', 400)

    const sql = `DELETE FROM producto WHERE id_producto = :id`
    await exec(sql, { id })
    return ok({ message: 'Producto eliminado', id })
  } catch (e) {
    console.error('Error eliminar producto:', e)
    return bad(e.message)
  }
}
