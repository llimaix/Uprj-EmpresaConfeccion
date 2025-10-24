import { query, exec } from '../db.js'
import { ok, bad } from '../util.js'

export const movimiento = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { id_instalacion, id_producto, delta, motivo } = body

    if (!id_instalacion || !id_producto || !Number(delta)) {
      return bad('Faltan campos requeridos (id_instalacion, id_producto, delta)', 400)
    }

    // 1️⃣ Verificar existencia de instalación
    const { rows: inst } = await query(
      `SELECT COUNT(*) AS EXISTE FROM INSTALACION WHERE ID_INSTALACION = :id_instalacion`,
      { id_instalacion }
    )
    if (inst[0].EXISTE === 0) {
      await exec(
        `INSERT INTO INSTALACION (ID_INSTALACION, NOMBRE)
         VALUES (:id_instalacion, :nombre)`,
        { id_instalacion, nombre: 'Sucursal automática' }
      )
    }

    // 2️⃣ Verificar existencia de producto
    const { rows: prod } = await query(
      `SELECT COUNT(*) AS EXISTE FROM PRODUCTO WHERE ID_PRODUCTO = :id_producto`,
      { id_producto }
    )
    if (prod[0].EXISTE === 0) {
      await exec(
        `INSERT INTO PRODUCTO (ID_PRODUCTO, NOMBRE, TIPO)
         VALUES (:id_producto, :nombre, :tipo)`,
        { id_producto, nombre: 'Producto automático', tipo: 'Sin clasificar' }
      )
    }

    // 3️⃣ Intentar actualizar stock
    const upd = await exec(
      `UPDATE INVENTARIO
          SET CANTIDAD = NVL(CANTIDAD, 0) + :delta
        WHERE ID_INSTALACION = :id_instalacion
          AND ID_PRODUCTO = :id_producto`,
      { delta, id_instalacion, id_producto }
    )

    // 4️⃣ Si no existía, crear registro
    if (upd.rowsAffected === 0) {
      await exec(
        `INSERT INTO INVENTARIO (ID_INVENTARIO, ID_INSTALACION, ID_PRODUCTO, CANTIDAD)
         VALUES (SEQ_INVENTARIO.NEXTVAL, :id_instalacion, :id_producto, :cantidad)`,
        { id_instalacion, id_producto, cantidad: Number(delta) }
      )
    }

    // 5️⃣ Consultar nuevo stock
    const { rows } = await query(
      `SELECT NVL(CANTIDAD, 0) AS CANTIDAD
         FROM INVENTARIO
        WHERE ID_INSTALACION = :id_instalacion AND ID_PRODUCTO = :id_producto`,
      { id_instalacion, id_producto }
    )

    return ok({
      id_instalacion,
      id_producto,
      nueva_cantidad: rows?.[0]?.CANTIDAD ?? 0,
      motivo: motivo || null
    })
  } catch (e) {
    console.error('Error movimiento inventario:', e)
    return bad(e.message)
  }
}
