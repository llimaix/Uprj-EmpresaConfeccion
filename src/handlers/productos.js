import { query } from '../db.js'
import { ok, bad } from '../util.js'

export const listar = async () => {
  try{
    const sql = `SELECT id_producto, nombre, tipo FROM Producto ORDER BY id_producto`
    const { rows } = await query(sql)
    return ok({ rows })
  }catch(e){
    console.error(e)
    return bad(e.message)
  }
}
