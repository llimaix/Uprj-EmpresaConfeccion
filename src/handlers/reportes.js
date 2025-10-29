import { query } from '../db.js'
import { ok, bad } from '../util.js'

// GET /reportes - Dashboard simplificado y compatible
export const dashboard = async () => {
  try {
    // Consultas simplificadas para evitar errores
    const [inventarioPorTipo, ordenesPorEstado, stockPorInstalacion, topProductos] = await Promise.all([
      // Inventario por tipo de producto - SIMPLIFICADO
      query(`
        SELECT p.tipo AS TIPO, SUM(NVL(i.cantidad,0)) AS TOTAL
        FROM producto p
        LEFT JOIN inventario i ON i.id_producto = p.id_producto
        GROUP BY p.tipo
        ORDER BY p.tipo
      `),
      
      // Órdenes por estado - SIMPLIFICADO
      query(`
        SELECT estado AS ESTADO, COUNT(*) AS TOTAL 
        FROM orden_compra 
        GROUP BY estado
        ORDER BY estado
      `),
      
      // Stock por instalación - SIMPLIFICADO
      query(`
        SELECT ins.nombre AS INSTALACION, SUM(NVL(i.cantidad,0)) AS TOTAL
        FROM instalacion ins
        LEFT JOIN inventario i ON ins.id_instalacion = i.id_instalacion
        GROUP BY ins.nombre
        ORDER BY ins.nombre
      `),
      
      // Top productos - SIMPLIFICADO
      query(`
        SELECT p.nombre AS PRODUCTO, COUNT(*) AS TOTAL
        FROM producto p
        ORDER BY p.nombre
      `)
    ]);

    // Calcular estadísticas básicas
    const totalProductos = inventarioPorTipo.rows?.reduce((sum, item) => sum + (item.TOTAL || 0), 0) || 0;
    const totalOrdenes = ordenesPorEstado.rows?.reduce((sum, item) => sum + (item.TOTAL || 0), 0) || 0;
    const totalInventario = stockPorInstalacion.rows?.reduce((sum, item) => sum + (item.TOTAL || 0), 0) || 0;

    const dashboardData = {
      // Datos originales para compatibilidad
      inventarioPorTipo: inventarioPorTipo.rows || [],
      ordenesPorEstado: ordenesPorEstado.rows || [],
      stockPorInstalacion: stockPorInstalacion.rows || [],
      topProductos: topProductos.rows || [],
      
      // KPIs básicos
      kpis: {
        totalProductos: topProductos.rows?.length || 0,
        totalInventario: totalInventario,
        ordenesActivas: totalOrdenes,
        valorInventarioEstimado: totalInventario * 150
      },
      
      // Metadatos
      fechaActualizacion: new Date().toISOString(),
      status: 'success'
    }

    return ok(dashboardData)
    
  } catch (e) { 
    console.error('Error en dashboard de reportes:', e)
    
    // Devolver datos de fallback en caso de error
    return ok({
      inventarioPorTipo: [],
      ordenesPorEstado: [],
      stockPorInstalacion: [],
      topProductos: [],
      kpis: {
        totalProductos: 0,
        totalInventario: 0,
        ordenesActivas: 0,
        valorInventarioEstimado: 0
      },
      fechaActualizacion: new Date().toISOString(),
      status: 'error',
      message: 'Datos no disponibles'
    })
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

// Handler principal para rutas de reportes
export const handler = async (event) => {
  const path = event.path || event.rawPath || '/dashboard'
  const method = event.httpMethod || event.requestContext?.http?.method || 'GET'
  
  console.log(`Reportes Handler - ${method} ${path}`)
  
  try {
    if (method === 'GET') {
      switch (path) {
        case '/reportes':
        case '/reportes/dashboard':
          return await dashboard()
        case '/reportes/instalaciones':
          return await instalaciones()
        case '/reportes/tipos-productos':
          return await tiposProductos()
        default:
          return await dashboard() // Por defecto, dashboard
      }
    }
    
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método no permitido' })
    }
    
  } catch (error) {
    console.error('Error en handler de reportes:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        message: error.message 
      })
    }
  }
}
