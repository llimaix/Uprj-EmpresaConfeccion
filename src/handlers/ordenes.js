import { query, exec } from "../db.js";
import { ok, bad } from "../util.js";

// ✅ Listar órdenes con filtros y ordenamiento
export const listar = async (event) => {
  try {
    // Extraer parámetros de query
    const params = event.queryStringParameters || {}
    const {
      search = '',
      estado = '',
      sortBy = 'id_orden',
      sortOrder = 'DESC',
      page = '1',
      limit = '50'
    } = params

    // Validar parámetros
    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
    const offset = (pageNum - 1) * limitNum
    
    // Validar campo de ordenamiento
    const validSortFields = ['id_orden', 'cliente', 'estado', 'items']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'id_orden'
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

    // Construir condiciones WHERE
    let whereConditions = []
    let binds = {}

    if (search.trim()) {
      whereConditions.push(`(UPPER(p.nombre) LIKE UPPER(:search) OR CAST(o.id_orden AS VARCHAR2(20)) LIKE :search)`)
      binds.search = `%${search.trim()}%`
    }

    if (estado.trim()) {
      whereConditions.push(`UPPER(o.estado) = UPPER(:estado)`)
      binds.estado = estado.trim()
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Consulta para contar total de registros
    const countSql = `
      SELECT COUNT(*) AS total 
      FROM orden_compra o
      JOIN persona p ON p.id_persona = o.id_cliente
      ${whereClause}
    `
    const countResult = await query(countSql, binds)
    const totalRecords = countResult.rows[0]?.TOTAL || 0

    // Consulta principal con paginación
    const sql = `
      SELECT * FROM (
        SELECT 
          o.id_orden,
          p.nombre AS cliente,
          o.estado,
          COUNT(d.id_detalle) AS items,
          o.fecha_orden,
          SUM(NVL(d.cantidad, 0)) AS total_cantidad,
          ROW_NUMBER() OVER (ORDER BY ${
            sortField === 'cliente' ? 'p.nombre' : 
            sortField === 'items' ? 'COUNT(d.id_detalle)' :
            'o.' + sortField
          } ${sortDirection}) as rn
        FROM orden_compra o
        JOIN persona p ON p.id_persona = o.id_cliente
        LEFT JOIN detalle_orden_compra d ON o.id_orden = d.id_orden
        ${whereClause}
        GROUP BY o.id_orden, p.nombre, o.estado, o.fecha_orden
      ) 
      WHERE rn BETWEEN :offset + 1 AND :offset + :limit
    `;

    const finalBinds = {
      ...binds,
      offset: offset,
      limit: limitNum
    }

    const { rows } = await query(sql, finalBinds);

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(totalRecords / limitNum)
    const hasNext = pageNum < totalPages
    const hasPrev = pageNum > 1

    // Obtener estadísticas adicionales
    const statsPromises = [
      // Estadísticas por estado
      query(`
        SELECT 
          estado,
          COUNT(*) as cantidad,
          SUM(total_items.items) as total_items
        FROM orden_compra o
        LEFT JOIN (
          SELECT id_orden, COUNT(*) as items 
          FROM detalle_orden_compra 
          GROUP BY id_orden
        ) total_items ON o.id_orden = total_items.id_orden
        ${whereClause.replace('p.nombre', 'pers.nombre')}
        ${whereClause ? 'AND' : 'WHERE'} EXISTS (
          SELECT 1 FROM persona pers WHERE pers.id_persona = o.id_cliente
          ${whereClause ? 'AND ' + whereConditions.join(' AND ').replace('p.nombre', 'pers.nombre') : ''}
        )
        GROUP BY estado
      `, binds),
      
      // Total de clientes únicos
      query(`
        SELECT COUNT(DISTINCT o.id_cliente) as clientes_unicos
        FROM orden_compra o
        JOIN persona p ON p.id_persona = o.id_cliente
        ${whereClause}
      `, binds)
    ]

    const [estadisticasEstado, clientesResult] = await Promise.all(statsPromises)

    const statistics = {
      totalOrdenes: totalRecords,
      clientesUnicos: clientesResult.rows[0]?.CLIENTES_UNICOS || 0,
      porEstado: estadisticasEstado.rows || [],
      recordsOnPage: rows.length
    }

    return ok({ 
      rows,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalRecords,
        recordsPerPage: limitNum,
        hasNext,
        hasPrev,
        recordsOnPage: rows.length
      },
      filters: {
        search,
        estado,
        sortBy: sortField,
        sortOrder: sortDirection
      },
      statistics
    });
  } catch (e) {
    console.error("Error listar órdenes:", e);
    return bad(`Error al listar órdenes: ${e.message}`);
  }
};

// ✅ Obtener estados únicos de órdenes
export const obtenerEstados = async () => {
  try {
    const sql = `
      SELECT DISTINCT 
        estado,
        COUNT(*) as cantidad
      FROM orden_compra 
      WHERE estado IS NOT NULL
      GROUP BY estado 
      ORDER BY estado
    `
    const { rows } = await query(sql)
    return ok({ estados: rows })
  } catch (e) {
    console.error('Error obtener estados:', e)
    return bad(e.message)
  }
}

// ✅ Obtener detalles de una orden específica
export const obtenerDetalle = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id)
    
    if (!id || isNaN(id)) {
      return bad('ID de orden inválido', 400)
    }

    // Información básica de la orden
    const ordenSql = `
      SELECT 
        o.id_orden,
        o.estado,
        o.fecha_orden,
        p.nombre AS cliente,
        p.id_persona AS id_cliente
      FROM orden_compra o
      JOIN persona p ON p.id_persona = o.id_cliente
      WHERE o.id_orden = :id
    `

    // Detalles de la orden
    const detallesSql = `
      SELECT 
        d.id_detalle,
        d.cantidad,
        prod.nombre AS producto,
        prod.tipo AS tipo_producto,
        prod.id_producto
      FROM detalle_orden_compra d
      JOIN producto prod ON d.id_producto = prod.id_producto
      WHERE d.id_orden = :id
      ORDER BY d.id_detalle
    `

    const [ordenResult, detallesResult] = await Promise.all([
      query(ordenSql, { id }),
      query(detallesSql, { id })
    ])

    if (ordenResult.rows.length === 0) {
      return bad('Orden no encontrada', 404)
    }

    const orden = ordenResult.rows[0]
    const detalles = detallesResult.rows || []

    const resumen = {
      totalItems: detalles.length,
      totalCantidad: detalles.reduce((sum, item) => sum + (item.CANTIDAD || 0), 0),
      productosUnicos: new Set(detalles.map(item => item.ID_PRODUCTO)).size
    }

    return ok({
      orden,
      detalles,
      resumen
    })
  } catch (e) {
    console.error('Error obtener detalle de orden:', e)
    return bad(e.message)
  }
}

// ✅ Cambiar estado de orden (con validaciones mejoradas)
export const actualizar = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    const body = JSON.parse(event.body || "{}");
    const { estado } = body;

    // Validaciones mejoradas
    if (!id || isNaN(id)) {
      return bad("ID de orden inválido", 400);
    }

    if (!estado || !estado.trim()) {
      return bad("El estado es requerido", 400);
    }

    const estadosValidos = ['PENDIENTE', 'APROBADA', 'CANCELADA', 'EN_PROCESO', 'COMPLETADA'];
    if (!estadosValidos.includes(estado.toUpperCase())) {
      return bad(`Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`, 400);
    }

    // Verificar que la orden existe y obtener información actual
    const ordenActual = await query(
      `SELECT o.estado, p.nombre AS cliente 
       FROM orden_compra o 
       JOIN persona p ON p.id_persona = o.id_cliente 
       WHERE o.id_orden = :id`,
      { id }
    );

    if (ordenActual.rows.length === 0) {
      return bad(`No existe la orden ${id}`, 404);
    }

    const estadoActual = ordenActual.rows[0].ESTADO;
    const cliente = ordenActual.rows[0].CLIENTE;

    // Validar transiciones de estado
    const transicionesValidas = {
      'PENDIENTE': ['APROBADA', 'CANCELADA'],
      'APROBADA': ['EN_PROCESO', 'CANCELADA'],
      'EN_PROCESO': ['COMPLETADA', 'CANCELADA'],
      'COMPLETADA': [], // No se puede cambiar desde completada
      'CANCELADA': ['PENDIENTE'] // Solo se puede reactivar a pendiente
    };

    if (estadoActual === estado.toUpperCase()) {
      return bad(`La orden ya se encuentra en estado ${estado}`, 409);
    }

    const transicionesPermitidas = transicionesValidas[estadoActual] || [];
    if (!transicionesPermitidas.includes(estado.toUpperCase())) {
      return bad(`No se puede cambiar de ${estadoActual} a ${estado.toUpperCase()}. Transiciones válidas: ${transicionesPermitidas.join(', ') || 'ninguna'}`, 409);
    }

    // Realizar la actualización
    const res = await exec(
      `UPDATE orden_compra SET estado = :estado WHERE id_orden = :id`,
      { estado: estado.toUpperCase(), id }
    );

    if (res.rowsAffected === 0) {
      return bad(`No se pudo actualizar la orden ${id}`, 500);
    }

    return ok({ 
      id_orden: id, 
      estado_anterior: estadoActual,
      estado_nuevo: estado.toUpperCase(),
      cliente,
      message: `Orden ${id} actualizada de ${estadoActual} a ${estado.toUpperCase()}`
    });
  } catch (e) {
    console.error("Error actualizar orden:", e);
    return bad(`Error al actualizar orden: ${e.message}`);
  }
};

// ✅ Crear nueva orden
export const crear = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { id_cliente, detalles = [] } = body

    // Validaciones
    if (!id_cliente) {
      return bad('El ID del cliente es requerido', 400)
    }

    if (!detalles.length) {
      return bad('La orden debe tener al menos un detalle', 400)
    }

    // Validar que el cliente existe
    const clienteExists = await query(
      `SELECT nombre FROM persona WHERE id_persona = :id_cliente`,
      { id_cliente }
    )

    if (clienteExists.rows.length === 0) {
      return bad('Cliente no encontrado', 404)
    }

    // Validar detalles
    for (const detalle of detalles) {
      if (!detalle.id_producto || !detalle.cantidad || detalle.cantidad <= 0) {
        return bad('Cada detalle debe tener id_producto y cantidad válida', 400)
      }
    }

    // Crear la orden
    const ordenSql = `
      INSERT INTO orden_compra (id_orden, id_cliente, estado, fecha_orden)
      VALUES (seq_orden_compra.NEXTVAL, :id_cliente, 'PENDIENTE', SYSDATE)
      RETURNING id_orden INTO :id_orden
    `

    const ordenBinds = {
      id_cliente,
      id_orden: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }
    }

    const ordenResult = await exec(ordenSql, ordenBinds)
    const idOrden = ordenResult.outBinds.id_orden[0]

    // Crear los detalles
    for (const detalle of detalles) {
      await exec(
        `INSERT INTO detalle_orden_compra (id_detalle, id_orden, id_producto, cantidad)
         VALUES (seq_detalle_orden.NEXTVAL, :id_orden, :id_producto, :cantidad)`,
        {
          id_orden: idOrden,
          id_producto: detalle.id_producto,
          cantidad: detalle.cantidad
        }
      )
    }

    return ok({
      id_orden: idOrden,
      id_cliente,
      estado: 'PENDIENTE',
      total_detalles: detalles.length,
      message: 'Orden creada exitosamente'
    })

  } catch (e) {
    console.error('Error crear orden:', e)
    return bad(`Error al crear orden: ${e.message}`)
  }
}
