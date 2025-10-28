import { query, exec } from "../db.js";
import { ok, bad } from "../util.js";

// ✅ Listar inventario global con filtros y ordenamiento
export const listar = async (event) => {
  try {
    // Extraer parámetros de query
    const params = event.queryStringParameters || {}
    const {
      search = '',
      instalacion = '',
      lowStock = 'false',
      sortBy = 'instalacion',
      sortOrder = 'ASC',
      minQuantity = '0'
    } = params

    // Validar parámetros
    const isLowStock = lowStock.toLowerCase() === 'true'
    const minQty = Math.max(0, parseInt(minQuantity) || 0)
    
    // Validar campo de ordenamiento
    const validSortFields = ['id_inventario', 'producto', 'instalacion', 'cantidad', 'tipo']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'instalacion'
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

    // Construir condiciones WHERE
    let whereConditions = []
    let binds = {}

    if (search.trim()) {
      whereConditions.push(`(UPPER(p.nombre) LIKE UPPER(:search) OR UPPER(n.nombre) LIKE UPPER(:search) OR UPPER(p.tipo) LIKE UPPER(:search))`)
      binds.search = `%${search.trim()}%`
    }

    if (instalacion.trim()) {
      whereConditions.push(`UPPER(n.nombre) = UPPER(:instalacion)`)
      binds.instalacion = instalacion.trim()
    }

    if (isLowStock) {
      whereConditions.push(`i.cantidad < 50`)
    }

    if (minQty > 0) {
      whereConditions.push(`i.cantidad >= :minQuantity`)
      binds.minQuantity = minQty
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Consulta principal
    const sql = `
      SELECT i.id_inventario,
             p.nombre AS producto,
             n.nombre AS instalacion,
             p.tipo,
             i.cantidad,
             i.id_producto,
             i.id_instalacion
        FROM inventario i
        JOIN producto p ON p.id_producto = i.id_producto
        JOIN instalacion n ON n.id_instalacion = i.id_instalacion
        ${whereClause}
       ORDER BY ${sortField === 'producto' ? 'p.nombre' : 
                  sortField === 'instalacion' ? 'n.nombre' : 
                  sortField === 'tipo' ? 'p.tipo' : 
                  'i.' + sortField} ${sortDirection}
    `;

    const { rows } = await query(sql, binds);

    // Obtener estadísticas adicionales
    const statsPromises = [
      // Total de items
      query(`SELECT COUNT(*) as total FROM inventario i 
             JOIN producto p ON p.id_producto = i.id_producto
             JOIN instalacion n ON n.id_instalacion = i.id_instalacion 
             ${whereClause}`, binds),
      
      // Suma total de cantidad
      query(`SELECT SUM(i.cantidad) as total_cantidad FROM inventario i 
             JOIN producto p ON p.id_producto = i.id_producto
             JOIN instalacion n ON n.id_instalacion = i.id_instalacion 
             ${whereClause}`, binds),
      
      // Items con stock bajo
      query(`SELECT COUNT(*) as stock_bajo FROM inventario i 
             JOIN producto p ON p.id_producto = i.id_producto
             JOIN instalacion n ON n.id_instalacion = i.id_instalacion 
             WHERE i.cantidad < 50 ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}`, binds),
      
      // Instalaciones únicas en resultados
      query(`SELECT COUNT(DISTINCT n.nombre) as instalaciones FROM inventario i 
             JOIN producto p ON p.id_producto = i.id_producto
             JOIN instalacion n ON n.id_instalacion = i.id_instalacion 
             ${whereClause}`, binds)
    ]

    const [totalResult, cantidadResult, stockBajoResult, instalacionesResult] = await Promise.all(statsPromises)

    const statistics = {
      totalItems: totalResult.rows[0]?.TOTAL || 0,
      totalCantidad: cantidadResult.rows[0]?.TOTAL_CANTIDAD || 0,
      itemsStockBajo: stockBajoResult.rows[0]?.STOCK_BAJO || 0,
      instalacionesUnicas: instalacionesResult.rows[0]?.INSTALACIONES || 0,
      valorEstimado: (cantidadResult.rows[0]?.TOTAL_CANTIDAD || 0) * 150 // Precio promedio
    }

    return ok({ 
      rows,
      filters: {
        search,
        instalacion,
        lowStock: isLowStock,
        minQuantity: minQty,
        sortBy: sortField,
        sortOrder: sortDirection
      },
      statistics
    });
  } catch (e) {
    console.error("Error listar inventario:", e);
    return bad(`Error al listar inventario: ${e.message}`);
  }
};

// ✅ Obtener instalaciones únicas
export const obtenerInstalaciones = async () => {
  try {
    const sql = `
      SELECT DISTINCT 
        ins.id_instalacion,
        ins.nombre,
        COUNT(i.id_inventario) AS items_inventario,
        SUM(NVL(i.cantidad,0)) AS total_cantidad
        FROM instalacion ins
        LEFT JOIN inventario i ON ins.id_instalacion = i.id_instalacion
       GROUP BY ins.id_instalacion, ins.nombre
       ORDER BY ins.nombre
    `
    const { rows } = await query(sql)
    return ok({ instalaciones: rows })
  } catch (e) {
    console.error('Error obtener instalaciones:', e)
    return bad(e.message)
  }
}

// ✅ Registrar movimiento (con autocreación y conversión segura) - MEJORADO
export const movimiento = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    let { id_instalacion, id_producto, delta, motivo } = body;

    // Validaciones mejoradas
    if (!id_instalacion || !id_producto || delta === undefined || delta === null) {
      return bad("Los campos id_instalacion, id_producto y delta son requeridos", 400);
    }

    // Convertir a número seguro
    id_instalacion = Number(id_instalacion);
    id_producto = Number(id_producto);
    delta = Number(delta);

    // Validar valores numéricos
    if (isNaN(id_instalacion) || isNaN(id_producto) || isNaN(delta)) {
      return bad("IDs o cantidad deben ser números válidos", 400);
    }

    if (delta === 0) {
      return bad("La cantidad no puede ser cero", 400);
    }

    // Verificar que el producto existe
    const prodCheck = await query(
      `SELECT nombre, tipo FROM PRODUCTO WHERE ID_PRODUCTO = :id_producto`,
      { id_producto }
    );
    
    if (prodCheck.rows.length === 0) {
      return bad(`El producto con ID ${id_producto} no existe`, 404);
    }

    const producto = prodCheck.rows[0];

    // Verificar instalación
    const inst = await query(
      `SELECT nombre FROM INSTALACION WHERE ID_INSTALACION = :id_instalacion`,
      { id_instalacion }
    );
    
    let instalacionNombre;
    if (inst.rows.length === 0) {
      // Crear instalación automáticamente
      instalacionNombre = `Instalación ${id_instalacion}`;
      await exec(
        `INSERT INTO INSTALACION (ID_INSTALACION, NOMBRE)
         VALUES (:id_instalacion, :nombre)`,
        { id_instalacion, nombre: instalacionNombre }
      );
    } else {
      instalacionNombre = inst.rows[0].NOMBRE;
    }

    // Verificar stock actual si es una salida (delta negativo)
    if (delta < 0) {
      const stockActual = await query(
        `SELECT NVL(CANTIDAD, 0) AS cantidad 
         FROM INVENTARIO
         WHERE ID_INSTALACION = :id_instalacion AND ID_PRODUCTO = :id_producto`,
        { id_instalacion, id_producto }
      );

      const cantidadActual = stockActual.rows[0]?.CANTIDAD || 0;
      if (cantidadActual + delta < 0) {
        return bad(`Stock insuficiente. Stock actual: ${cantidadActual}, intentando retirar: ${Math.abs(delta)}`, 409);
      }
    }

    // Intentar actualizar registro existente
    const upd = await exec(
      `UPDATE INVENTARIO
          SET CANTIDAD = NVL(CANTIDAD, 0) + :delta
        WHERE ID_INSTALACION = :id_instalacion AND ID_PRODUCTO = :id_producto`,
      { delta, id_instalacion, id_producto }
    );

    // Si no existía el registro, crear uno nuevo
    if (upd.rowsAffected === 0) {
      if (delta < 0) {
        return bad("No se puede crear un registro de inventario con cantidad negativa", 400);
      }
      
      await exec(
        `INSERT INTO INVENTARIO (ID_INVENTARIO, ID_INSTALACION, ID_PRODUCTO, CANTIDAD)
         VALUES (SEQ_INVENTARIO.NEXTVAL, :id_instalacion, :id_producto, :cantidad)`,
        { id_instalacion, id_producto, cantidad: delta }
      );
    }

    // Obtener cantidad final
    const { rows } = await query(
      `SELECT NVL(CANTIDAD, 0) AS cantidad
         FROM INVENTARIO
        WHERE ID_INSTALACION = :id_instalacion AND ID_PRODUCTO = :id_producto`,
      { id_instalacion, id_producto }
    );

    const cantidadFinal = rows[0]?.CANTIDAD || 0;
    const tipoMovimiento = delta > 0 ? 'Entrada' : 'Salida';

    return ok({
      id_instalacion,
      id_producto,
      delta,
      cantidad_final: cantidadFinal,
      motivo: motivo || `${tipoMovimiento} de ${Math.abs(delta)} unidades`,
      producto: producto.NOMBRE,
      instalacion: instalacionNombre,
      tipo_movimiento: tipoMovimiento,
      message: `${tipoMovimiento} registrada exitosamente`
    });
  } catch (e) {
    console.error("Error movimiento inventario:", e);
    return bad(`Error al registrar movimiento: ${e.message}`);
  }
};

// ✅ Obtener resumen de inventario por instalación
export const resumenPorInstalacion = async () => {
  try {
    const sql = `
      SELECT 
        ins.nombre AS instalacion,
        ins.id_instalacion,
        COUNT(i.id_inventario) AS total_items,
        SUM(NVL(i.cantidad,0)) AS total_cantidad,
        COUNT(DISTINCT p.tipo) AS tipos_productos,
        SUM(CASE WHEN i.cantidad < 50 THEN 1 ELSE 0 END) AS items_stock_bajo
        FROM instalacion ins
        LEFT JOIN inventario i ON ins.id_instalacion = i.id_instalacion
        LEFT JOIN producto p ON i.id_producto = p.id_producto
       GROUP BY ins.nombre, ins.id_instalacion
       ORDER BY total_cantidad DESC
    `
    const { rows } = await query(sql)
    return ok({ resumen: rows })
  } catch (e) {
    console.error('Error resumen por instalación:', e)
    return bad(e.message)
  }
}
