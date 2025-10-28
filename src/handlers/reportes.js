import { query } from '../db.js'
import { ok, bad } from '../util.js'

// GET /reportes - Dashboard completo con todas las estadísticas
export const dashboard = async () => {
  try {
    // Ejecutar todas las consultas en paralelo para mejor performance
    const [
      inventarioPorTipo, 
      ordenesPorEstado, 
      stockPorInstalacion, 
      topProductos,
      estadisticasGenerales,
      inventarioPorInstalacion,
      alertasStockBajo,
      tendenciasMovimientos
    ] = await Promise.all([
      // Inventario por tipo de producto
      query(`
        SELECT p.tipo AS TIPO, SUM(NVL(i.cantidad,0)) AS TOTAL
          FROM producto p
          LEFT JOIN inventario i ON i.id_producto = p.id_producto
         GROUP BY p.tipo
         ORDER BY TOTAL DESC
      `),
      
      // Órdenes por estado
      query(`
        SELECT estado AS ESTADO, COUNT(*) AS TOTAL 
          FROM orden_compra 
         GROUP BY estado 
         ORDER BY TOTAL DESC
      `),
      
      // Stock por instalación (para compatibilidad con frontend anterior)
      query(`
        SELECT ins.nombre AS INSTALACION, SUM(NVL(i.cantidad,0)) AS TOTAL
          FROM inventario i
          JOIN instalacion ins ON ins.id_instalacion = i.id_instalacion
         GROUP BY ins.nombre
         ORDER BY TOTAL DESC
      `),
      
      // Top productos más vendidos
      query(`
        SELECT p.nombre AS PRODUCTO, NVL(SUM(d.cantidad),0) AS TOTAL
          FROM producto p
          LEFT JOIN detalle_orden_compra d ON d.id_producto = p.id_producto
         GROUP BY p.nombre
         ORDER BY TOTAL DESC
         FETCH FIRST 10 ROWS ONLY
      `),
      
      // Estadísticas generales para KPIs
      query(`
        SELECT 
          (SELECT COUNT(*) FROM producto) AS total_productos,
          (SELECT SUM(NVL(cantidad,0)) FROM inventario) AS total_inventario,
          (SELECT COUNT(*) FROM orden_compra WHERE estado IN ('PENDIENTE', 'APROBADA')) AS ordenes_activas,
          (SELECT COUNT(DISTINCT id_instalacion) FROM inventario) AS instalaciones_activas,
          (SELECT COUNT(DISTINCT tipo) FROM producto) AS tipos_productos
        FROM dual
      `),
      
      // Inventario detallado por instalación (para gráficos)
      query(`
        SELECT 
          ins.nombre AS instalacion,
          ins.id_instalacion,
          SUM(NVL(i.cantidad,0)) AS cantidad,
          COUNT(DISTINCT i.id_producto) AS productos_diferentes
          FROM instalacion ins
          LEFT JOIN inventario i ON ins.id_instalacion = i.id_instalacion
         GROUP BY ins.nombre, ins.id_instalacion
         ORDER BY cantidad DESC
      `),
      
      // Alertas de stock bajo
      query(`
        SELECT 
          p.nombre AS producto,
          ins.nombre AS instalacion,
          i.cantidad,
          p.tipo
          FROM inventario i
          JOIN producto p ON i.id_producto = p.id_producto
          JOIN instalacion ins ON i.id_instalacion = ins.id_instalacion
         WHERE i.cantidad < 50
         ORDER BY i.cantidad ASC
         FETCH FIRST 20 ROWS ONLY
      `),
      
      // Tendencias de movimientos (últimos movimientos simulados)
      query(`
        SELECT 
          TO_CHAR(SYSDATE - LEVEL, 'YYYY-MM-DD') AS fecha,
          ROUND(DBMS_RANDOM.VALUE(100, 500)) AS movimientos
          FROM dual
        CONNECT BY LEVEL <= 7
        ORDER BY fecha
      `)
    ])

    // Procesar estadísticas generales
    const stats = estadisticasGenerales.rows[0] || {};
    const valorInventarioEstimado = (stats.TOTAL_INVENTARIO || 0) * 150; // Precio promedio

    // Preparar respuesta completa
    const dashboardData = {
      // Datos originales para compatibilidad
      inventarioPorTipo: inventarioPorTipo.rows,
      ordenesPorEstado: ordenesPorEstado.rows,
      stockPorInstalacion: stockPorInstalacion.rows,
      topProductos: topProductos.rows,
      
      // Nuevas estadísticas para el dashboard mejorado
      kpis: {
        totalProductos: stats.TOTAL_PRODUCTOS || 0,
        totalInventario: stats.TOTAL_INVENTARIO || 0,
        ordenesActivas: stats.ORDENES_ACTIVAS || 0,
        instalacionesActivas: stats.INSTALACIONES_ACTIVAS || 0,
        tiposProductos: stats.TIPOS_PRODUCTOS || 0,
        valorInventarioEstimado: valorInventarioEstimado
      },
      
      // Datos adicionales para gráficos avanzados
      inventarioPorInstalacion: inventarioPorInstalacion.rows,
      alertasStockBajo: alertasStockBajo.rows,
      tendenciasMovimientos: tendenciasMovimientos.rows,
      
      // Metadatos
      fechaActualizacion: new Date().toISOString(),
      totalRegistros: {
        inventario: inventarioPorInstalacion.rows.length,
        productos: inventarioPorTipo.rows.length,
        ordenes: ordenesPorEstado.rows.reduce((sum, item) => sum + (item.TOTAL || 0), 0),
        alertas: alertasStockBajo.rows.length
      }
    }

    return ok(dashboardData)
    
  } catch (e) { 
    console.error('Error en dashboard de reportes:', e)
    return bad(`Error al generar reportes: ${e.message}`) 
  }
}

// GET /instalaciones - Obtener lista de instalaciones únicas
export const instalaciones = async () => {
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
    console.error('Error al obtener instalaciones:', e)
    return bad(e.message)
  }
}

// GET /tipos-productos - Obtener tipos de productos únicos
export const tiposProductos = async () => {
  try {
    const sql = `
      SELECT DISTINCT 
        p.tipo,
        COUNT(*) AS cantidad_productos,
        SUM(NVL(i.cantidad,0)) AS total_inventario
        FROM producto p
        LEFT JOIN inventario i ON p.id_producto = i.id_producto
       WHERE p.tipo IS NOT NULL
       GROUP BY p.tipo
       ORDER BY p.tipo
    `
    const { rows } = await query(sql)
    return ok({ tipos: rows })
  } catch (e) {
    console.error('Error al obtener tipos de productos:', e)
    return bad(e.message)
  }
}
