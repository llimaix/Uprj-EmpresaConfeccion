import oracledb from 'oracledb'
import { query, exec } from '../db.js'
import { ok, bad } from '../util.js'

// === LISTAR CON FILTROS, PAGINACIÓN Y BÚSQUEDA ===
export const listar = async (event) => {
  try {
    // Extraer parámetros de query
    const params = event.queryStringParameters || {}
    const {
      search = '',
      tipo = '',
      page = '1',
      limit = '50',
      sortBy = 'id_producto',
      sortOrder = 'ASC'
    } = params

    // Validar parámetros
    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))) // Máximo 100 por página
    const offset = (pageNum - 1) * limitNum
    
    // Validar campo de ordenamiento
    const validSortFields = ['id_producto', 'nombre', 'tipo']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'id_producto'
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

    // Construir condiciones WHERE
    let whereConditions = []
    let binds = {}

    if (search.trim()) {
      whereConditions.push(`(UPPER(nombre) LIKE UPPER(:search) OR UPPER(tipo) LIKE UPPER(:search))`)
      binds.search = `%${search.trim()}%`
    }

    if (tipo.trim()) {
      whereConditions.push(`UPPER(tipo) = UPPER(:tipo)`)
      binds.tipo = tipo.trim()
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Consulta para contar total de registros
    const countSql = `SELECT COUNT(*) AS total FROM producto ${whereClause}`
    const countResult = await query(countSql, binds)
    const totalRecords = countResult.rows[0]?.TOTAL || 0

    // Consulta principal con paginación
    const sql = `
      SELECT * FROM (
        SELECT 
          id_producto, 
          nombre, 
          tipo,
          ROW_NUMBER() OVER (ORDER BY ${sortField} ${sortDirection}) as rn
        FROM producto 
        ${whereClause}
      ) 
      WHERE rn BETWEEN :offset + 1 AND :offset + :limit
    `

    const finalBinds = {
      ...binds,
      offset: offset,
      limit: limitNum
    }

    const { rows } = await query(sql, finalBinds)

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(totalRecords / limitNum)
    const hasNext = pageNum < totalPages
    const hasPrev = pageNum > 1

    // Obtener estadísticas adicionales
    const statsPromise = query(`
      SELECT 
        COUNT(DISTINCT tipo) as tipos_unicos,
        COUNT(*) as total_productos
      FROM producto
    `)

    const stats = await statsPromise
    const estadisticas = stats.rows[0] || {}

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
        tipo,
        sortBy: sortField,
        sortOrder: sortDirection
      },
      statistics: {
        tiposUnicos: estadisticas.TIPOS_UNICOS || 0,
        totalProductos: estadisticas.TOTAL_PRODUCTOS || 0
      }
    })
  } catch (e) {
    console.error('Error listar productos:', e)
    return bad(`Error al listar productos: ${e.message}`)
  }
}

// === OBTENER TIPOS ÚNICOS ===
export const obtenerTipos = async () => {
  try {
    const sql = `
      SELECT DISTINCT tipo, COUNT(*) as cantidad
      FROM producto 
      WHERE tipo IS NOT NULL
      GROUP BY tipo 
      ORDER BY tipo
    `
    const { rows } = await query(sql)
    return ok({ tipos: rows })
  } catch (e) {
    console.error('Error obtener tipos:', e)
    return bad(e.message)
  }
}

// === CREAR CON VALIDACIONES MEJORADAS ===
export const crear = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { nombre, tipo } = body
    
    // Validaciones más robustas
    if (!nombre || !tipo) {
      return bad('Los campos nombre y tipo son requeridos', 400)
    }

    if (nombre.trim().length < 2) {
      return bad('El nombre debe tener al menos 2 caracteres', 400)
    }

    if (tipo.trim().length < 2) {
      return bad('El tipo debe tener al menos 2 caracteres', 400)
    }

    // Verificar si ya existe un producto con el mismo nombre
    const existingProduct = await query(
      `SELECT COUNT(*) as count FROM producto WHERE UPPER(nombre) = UPPER(:nombre)`,
      { nombre: nombre.trim() }
    )

    if (existingProduct.rows[0]?.COUNT > 0) {
      return bad('Ya existe un producto con ese nombre', 409)
    }

    const sql = `
      INSERT INTO producto (id_producto, nombre, tipo)
      VALUES (seq_producto.NEXTVAL, :nombre, :tipo)
      RETURNING id_producto INTO :id_producto
    `
    const binds = {
      nombre: nombre.trim(),
      tipo: tipo.trim(),
      id_producto: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }

    const res = await exec(sql, binds)
    const id = res.outBinds.id_producto[0]
    
    return ok({ 
      id_producto: id, 
      nombre: nombre.trim(), 
      tipo: tipo.trim(),
      message: 'Producto creado exitosamente'
    })
  } catch (e) {
    console.error('Error crear producto:', e)
    return bad(`Error al crear producto: ${e.message}`)
  }
}

// === ACTUALIZAR CON VALIDACIONES MEJORADAS ===
export const actualizar = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id)
    const body = JSON.parse(event.body || '{}')
    const { nombre, tipo } = body
    
    // Validaciones
    if (!id || isNaN(id)) {
      return bad('ID de producto inválido', 400)
    }
    
    if (!nombre || !tipo) {
      return bad('Los campos nombre y tipo son requeridos', 400)
    }

    if (nombre.trim().length < 2) {
      return bad('El nombre debe tener al menos 2 caracteres', 400)
    }

    if (tipo.trim().length < 2) {
      return bad('El tipo debe tener al menos 2 caracteres', 400)
    }

    // Verificar que el producto existe
    const productExists = await query(
      `SELECT COUNT(*) as count FROM producto WHERE id_producto = :id`,
      { id }
    )

    if (productExists.rows[0]?.COUNT === 0) {
      return bad('Producto no encontrado', 404)
    }

    // Verificar si ya existe otro producto con el mismo nombre
    const existingProduct = await query(
      `SELECT COUNT(*) as count FROM producto WHERE UPPER(nombre) = UPPER(:nombre) AND id_producto != :id`,
      { nombre: nombre.trim(), id }
    )

    if (existingProduct.rows[0]?.COUNT > 0) {
      return bad('Ya existe otro producto con ese nombre', 409)
    }

    const sql = `
      UPDATE producto
      SET nombre = :nombre, tipo = :tipo
      WHERE id_producto = :id
    `
    const result = await exec(sql, { id, nombre: nombre.trim(), tipo: tipo.trim() })

    if (result.rowsAffected === 0) {
      return bad('No se pudo actualizar el producto', 500)
    }

    return ok({ 
      id_producto: id,
      nombre: nombre.trim(),
      tipo: tipo.trim(),
      message: 'Producto actualizado exitosamente' 
    })
  } catch (e) {
    console.error('Error actualizar producto:', e)
    return bad(`Error al actualizar producto: ${e.message}`)
  }
}

// === ELIMINAR CON VALIDACIONES ===
export const eliminar = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id)
    
    if (!id || isNaN(id)) {
      return bad('ID de producto inválido', 400)
    }

    // Verificar que el producto existe
    const productExists = await query(
      `SELECT nombre FROM producto WHERE id_producto = :id`,
      { id }
    )

    if (productExists.rows.length === 0) {
      return bad('Producto no encontrado', 404)
    }

    const nombreProducto = productExists.rows[0].NOMBRE

    // Verificar si el producto está siendo usado en inventario
    const inventoryCheck = await query(
      `SELECT COUNT(*) as count FROM inventario WHERE id_producto = :id`,
      { id }
    )

    if (inventoryCheck.rows[0]?.COUNT > 0) {
      return bad('No se puede eliminar el producto porque tiene registros en inventario', 409)
    }

    // Verificar si el producto está en órdenes
    const orderCheck = await query(
      `SELECT COUNT(*) as count FROM detalle_orden_compra WHERE id_producto = :id`,
      { id }
    )

    if (orderCheck.rows[0]?.COUNT > 0) {
      return bad('No se puede eliminar el producto porque está en órdenes de compra', 409)
    }

    const sql = `DELETE FROM producto WHERE id_producto = :id`
    const result = await exec(sql, { id })

    if (result.rowsAffected === 0) {
      return bad('No se pudo eliminar el producto', 500)
    }

    return ok({ 
      id_producto: id,
      nombre: nombreProducto,
      message: 'Producto eliminado exitosamente' 
    })
  } catch (e) {
    console.error('Error eliminar producto:', e)
    return bad(`Error al eliminar producto: ${e.message}`)
  }
}
