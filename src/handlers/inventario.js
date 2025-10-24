import { query, exec } from "../db.js";
import { ok, bad } from "../util.js";

// ✅ Listar inventario global
export const listar = async () => {
  try {
    const sql = `
      SELECT i.id_inventario,
             p.nombre AS producto,
             n.nombre AS instalacion,
             p.tipo,
             i.cantidad
        FROM inventario i
        JOIN producto p ON p.id_producto = i.id_producto
        JOIN instalacion n ON n.id_instalacion = i.id_instalacion
       ORDER BY n.nombre, p.nombre
    `;
    const { rows } = await query(sql);
    return ok({ rows });
  } catch (e) {
    console.error("Error listar inventario:", e);
    return bad(e.message);
  }
};

// ✅ Registrar movimiento (con autocreación y conversión segura)
export const movimiento = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    let { id_instalacion, id_producto, delta, motivo } = body;

    if (!id_instalacion || !id_producto || !delta) {
      return bad("Faltan campos requeridos", 400);
    }

    // Convertir a número seguro
    id_instalacion = Number(id_instalacion);
    id_producto = Number(id_producto);
    delta = Number(delta);

    // Validar valores
    if (isNaN(id_instalacion) || isNaN(id_producto) || isNaN(delta)) {
      return bad("IDs o cantidad inválidos", 400);
    }

    // Verificar instalación
    const inst = await query(
      `SELECT COUNT(*) AS C FROM INSTALACION WHERE ID_INSTALACION = :id_instalacion`,
      { id_instalacion }
    );
    if (inst.rows[0].C === 0) {
      await exec(
        `INSERT INTO INSTALACION (ID_INSTALACION, NOMBRE)
         VALUES (:id_instalacion, :nombre)`,
        { id_instalacion, nombre: `Instalación ${id_instalacion}` }
      );
    }

    // Verificar producto
    const prod = await query(
      `SELECT COUNT(*) AS C FROM PRODUCTO WHERE ID_PRODUCTO = :id_producto`,
      { id_producto }
    );
    if (prod.rows[0].C === 0) {
      await exec(
        `INSERT INTO PRODUCTO (ID_PRODUCTO, NOMBRE, TIPO)
         VALUES (:id_producto, :nombre, :tipo)`,
        {
          id_producto,
          nombre: `Producto ${id_producto}`,
          tipo: "Desconocido",
        }
      );
    }

    // Intentar actualizar
    const upd = await exec(
      `UPDATE INVENTARIO
          SET CANTIDAD = NVL(CANTIDAD, 0) + :delta
        WHERE ID_INSTALACION = :id_instalacion AND ID_PRODUCTO = :id_producto`,
      { delta, id_instalacion, id_producto }
    );

    if (upd.rowsAffected === 0) {
      await exec(
        `INSERT INTO INVENTARIO (ID_INVENTARIO, ID_INSTALACION, ID_PRODUCTO, CANTIDAD)
         VALUES (SEQ_INVENTARIO.NEXTVAL, :id_instalacion, :id_producto, :cantidad)`,
        { id_instalacion, id_producto, cantidad: delta }
      );
    }

    const { rows } = await query(
      `SELECT NVL(CANTIDAD, 0) AS CANTIDAD
         FROM INVENTARIO
        WHERE ID_INSTALACION = :id_instalacion AND ID_PRODUCTO = :id_producto`,
      { id_instalacion, id_producto }
    );

    return ok({
      id_instalacion,
      id_producto,
      cantidad: rows[0]?.CANTIDAD || 0,
      motivo,
    });
  } catch (e) {
    console.error("Error movimiento inventario:", e);
    return bad(e.message);
  }
};
