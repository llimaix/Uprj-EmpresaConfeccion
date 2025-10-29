import { query, exec } from "../db.js";
import { ok, bad } from "../util.js";
import oracledb from 'oracledb';

// ✅ Listar instalaciones
export const listar = async (event) => {
  try {
    const params = event?.queryStringParameters || {};
    const {
      search = '',
      pais = '',
      sortBy = 'nombre',
      sortOrder = 'ASC'
    } = params;

    let sql = `
      SELECT 
        i.id_instalacion,
        i.nombre,
        i.ubicacion,
        i.id_pais,
        p.nombre AS pais_nombre,
        COUNT(e.id_persona) as empleados_count,
        COUNT(inv.id_inventario) as inventarios_count
      FROM instalacion i
      LEFT JOIN pais p ON i.id_pais = p.id_pais
      LEFT JOIN empleado e ON i.id_instalacion = e.id_instalacion
      LEFT JOIN inventario inv ON i.id_instalacion = inv.id_instalacion
    `;

    let binds = {};
    let whereConditions = [];

    if (search && search.trim()) {
      whereConditions.push(`(UPPER(i.nombre) LIKE UPPER(:search) OR UPPER(i.ubicacion) LIKE UPPER(:search))`);
      binds.search = `%${search.trim()}%`;
    }

    if (pais && pais.trim()) {
      whereConditions.push(`i.id_pais = :pais`);
      binds.pais = parseInt(pais);
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    sql += ` GROUP BY i.id_instalacion, i.nombre, i.ubicacion, i.id_pais, p.nombre`;

    // Validar campo de ordenamiento
    const validSortFields = ['nombre', 'ubicacion'];
    const sortField = validSortFields.includes(sortBy) ? `i.${sortBy}` : 'i.nombre';
    
    sql += ` ORDER BY ${sortField} ${sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;

    const { rows } = await query(sql, binds);
    
    // Calcular estadísticas
    const estadisticas = {
      total: rows.length,
      conEmpleados: rows.filter(inst => inst.EMPLEADOS_COUNT > 0).length,
      conInventario: rows.filter(inst => inst.INVENTARIOS_COUNT > 0).length,
      porPais: rows.reduce((acc, inst) => {
        const pais = inst.PAIS_NOMBRE || 'SIN_PAIS';
        acc[pais] = (acc[pais] || 0) + 1;
        return acc;
      }, {})
    };

    return ok({
      rows: rows,  // Frontend espera 'rows'
      statistics: {
        total: rows.length,
        conEmpleados: rows.filter(inst => inst.EMPLEADOS_COUNT > 0).length,
        conInventario: rows.filter(inst => inst.INVENTARIOS_COUNT > 0).length,
        porPais: rows.reduce((acc, inst) => {
          const pais = inst.PAIS_NOMBRE || 'SIN_PAIS';
          acc[pais] = (acc[pais] || 0) + 1;
          return acc;
        }, {})
      },
      filters: { search, pais }
    });

  } catch (e) {
    console.error('Error al listar instalaciones:', e);
    return bad(`Error al cargar instalaciones: ${e.message}`);
  }
};

// ✅ Obtener instalación por ID
export const obtenerPorId = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    
    if (!id || isNaN(id)) {
      return bad('ID de instalación inválido', 400);
    }

    const sql = `
      SELECT 
        i.id_instalacion,
        i.nombre,
        i.ubicacion,
        i.id_pais,
        p.nombre AS pais_nombre
      FROM instalacion i
      LEFT JOIN pais p ON i.id_pais = p.id_pais
      WHERE i.id_instalacion = :id
    `;

    const { rows } = await query(sql, { id });

    if (rows.length === 0) {
      return bad('Instalación no encontrada', 404);
    }

    const instalacion = rows[0];

    // Obtener empleados de esta instalación
    const empleadosSql = `
      SELECT 
        e.id_persona,
        p.nombre,
        e.tipo_empleado
      FROM empleado e
      JOIN persona p ON e.id_persona = p.id_persona
      WHERE e.id_instalacion = :id
      ORDER BY p.nombre
    `;

    const empleados = await query(empleadosSql, { id });
    instalacion.empleados = empleados.rows;

    // Obtener inventario de esta instalación
    const inventarioSql = `
      SELECT 
        inv.id_inventario,
        inv.cantidad,
        prod.nombre AS producto_nombre,
        prod.tipo AS producto_tipo
      FROM inventario inv
      JOIN producto prod ON inv.id_producto = prod.id_producto
      WHERE inv.id_instalacion = :id
      ORDER BY prod.nombre
    `;

    const inventario = await query(inventarioSql, { id });
    instalacion.inventario = inventario.rows;

    return ok({ instalacion });
  } catch (e) {
    console.error('Error obtener instalación:', e);
    return bad(`Error al obtener instalación: ${e.message}`);
  }
};

// ✅ Crear instalación
export const crear = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { nombre, ubicacion, id_pais } = body;
    
    if (!nombre || !nombre.trim()) {
      return bad('El nombre es obligatorio', 400);
    }

    if (!ubicacion || !ubicacion.trim()) {
      return bad('La ubicación es obligatoria', 400);
    }

    // Verificar que el país existe si se proporciona
    if (id_pais) {
      const paisExists = await query(
        `SELECT COUNT(*) as count FROM pais WHERE id_pais = :id`,
        { id: id_pais }
      );

      if (paisExists.rows[0]?.COUNT === 0) {
        return bad('El país especificado no existe', 400);
      }
    }

    const sql = `
      INSERT INTO instalacion (id_instalacion, nombre, ubicacion, id_pais)
      VALUES (seq_instalacion.NEXTVAL, :nombre, :ubicacion, :id_pais)
      RETURNING id_instalacion INTO :id_instalacion
    `;
    
    const binds = {
      nombre: nombre.trim(),
      ubicacion: ubicacion.trim(),
      id_pais: id_pais || null,
      id_instalacion: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    const result = await exec(sql, binds);
    const idInstalacion = result.outBinds.id_instalacion[0];

    return ok({
      id_instalacion: idInstalacion,
      nombre: nombre.trim(),
      ubicacion: ubicacion.trim(),
      id_pais: id_pais || null,
      message: 'Instalación creada exitosamente'
    });
  } catch (e) {
    console.error('Error crear instalación:', e);
    return bad(`Error al crear instalación: ${e.message}`);
  }
};

// ✅ Actualizar instalación
export const actualizar = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    const body = JSON.parse(event.body || '{}');
    const { nombre, ubicacion, id_pais } = body;

    if (!id || isNaN(id)) {
      return bad('ID de instalación inválido', 400);
    }

    // Verificar que la instalación existe
    const instalacionActual = await query(
      `SELECT nombre FROM instalacion WHERE id_instalacion = :id`,
      { id }
    );

    if (instalacionActual.rows.length === 0) {
      return bad('Instalación no encontrada', 404);
    }

    // Verificar que el país existe si se proporciona
    if (id_pais) {
      const paisExists = await query(
        `SELECT COUNT(*) as count FROM pais WHERE id_pais = :id`,
        { id: id_pais }
      );

      if (paisExists.rows[0]?.COUNT === 0) {
        return bad('El país especificado no existe', 400);
      }
    }

    // Construir la actualización dinámicamente
    const updateFields = [];
    const binds = { id };

    if (nombre && nombre.trim()) {
      updateFields.push('nombre = :nombre');
      binds.nombre = nombre.trim();
    }

    if (ubicacion && ubicacion.trim()) {
      updateFields.push('ubicacion = :ubicacion');
      binds.ubicacion = ubicacion.trim();
    }

    if (id_pais !== undefined) {
      updateFields.push('id_pais = :id_pais');
      binds.id_pais = id_pais || null;
    }

    if (updateFields.length === 0) {
      return bad('No hay campos para actualizar', 400);
    }

    const result = await exec(
      `UPDATE instalacion SET ${updateFields.join(', ')} WHERE id_instalacion = :id`,
      binds
    );

    if (result.rowsAffected === 0) {
      return bad('No se pudo actualizar la instalación', 500);
    }

    return ok({
      id_instalacion: id,
      message: 'Instalación actualizada exitosamente'
    });

  } catch (e) {
    console.error('Error actualizar instalación:', e);
    return bad(`Error al actualizar instalación: ${e.message}`);
  }
};

// ✅ Eliminar instalación
export const eliminar = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    
    if (!id || isNaN(id)) {
      return bad('ID de instalación inválido', 400);
    }

    // Verificar que la instalación existe
    const instalacionActual = await query(
      `SELECT nombre FROM instalacion WHERE id_instalacion = :id`,
      { id }
    );

    if (instalacionActual.rows.length === 0) {
      return bad('Instalación no encontrada', 404);
    }

    const nombreInstalacion = instalacionActual.rows[0].NOMBRE;

    // Verificar dependencias
    const tieneEmpleados = await query(
      `SELECT COUNT(*) as count FROM empleado WHERE id_instalacion = :id`,
      { id }
    );

    if (tieneEmpleados.rows[0]?.COUNT > 0) {
      return bad('No se puede eliminar: la instalación tiene empleados asociados', 409);
    }

    const tieneInventario = await query(
      `SELECT COUNT(*) as count FROM inventario WHERE id_instalacion = :id`,
      { id }
    );

    if (tieneInventario.rows[0]?.COUNT > 0) {
      return bad('No se puede eliminar: la instalación tiene inventario asociado', 409);
    }

    const result = await exec(`DELETE FROM instalacion WHERE id_instalacion = :id`, { id });

    if (result.rowsAffected === 0) {
      return bad('No se pudo eliminar la instalación', 500);
    }

    return ok({
      id_instalacion: id,
      nombre: nombreInstalacion,
      message: 'Instalación eliminada exitosamente'
    });

  } catch (e) {
    console.error('Error eliminar instalación:', e);
    return bad(`Error al eliminar instalación: ${e.message}`);
  }
};

// ✅ Obtener tipos de instalaciones (si los hubiera) - En este caso, solo países
export const obtenerTipos = async () => {
  try {
    const sql = `
      SELECT 
        p.id_pais,
        p.nombre,
        COUNT(i.id_instalacion) as instalaciones_count
      FROM pais p
      LEFT JOIN instalacion i ON p.id_pais = i.id_pais
      GROUP BY p.id_pais, p.nombre
      ORDER BY p.nombre
    `;

    const { rows } = await query(sql);
    return ok({ paises: rows });
  } catch (e) {
    console.error('Error obtener tipos de instalaciones:', e);
    return bad(`Error al obtener países: ${e.message}`);
  }
};

// ✅ Obtener estadísticas de instalaciones
export const obtenerEstadisticas = async () => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_instalaciones,
        COUNT(DISTINCT i.id_pais) as paises_con_instalaciones,
        AVG(empleados_count.empleados) as promedio_empleados_por_instalacion,
        AVG(inventario_count.items) as promedio_items_inventario
      FROM instalacion i
      LEFT JOIN (
        SELECT id_instalacion, COUNT(*) as empleados
        FROM empleado
        GROUP BY id_instalacion
      ) empleados_count ON i.id_instalacion = empleados_count.id_instalacion
      LEFT JOIN (
        SELECT id_instalacion, COUNT(*) as items
        FROM inventario
        GROUP BY id_instalacion
      ) inventario_count ON i.id_instalacion = inventario_count.id_instalacion
    `;

    const { rows } = await query(sql);
    const estadisticas = rows[0];

    return ok({
      estadisticas: {
        totalInstalaciones: estadisticas.TOTAL_INSTALACIONES || 0,
        paisesConInstalaciones: estadisticas.PAISES_CON_INSTALACIONES || 0,
        promedioEmpleadosPorInstalacion: Math.round(estadisticas.PROMEDIO_EMPLEADOS_POR_INSTALACION || 0),
        promedioItemsInventario: Math.round(estadisticas.PROMEDIO_ITEMS_INVENTARIO || 0)
      }
    });
  } catch (e) {
    console.error('Error obtener estadísticas instalaciones:', e);
    return bad(`Error al obtener estadísticas: ${e.message}`);
  }
};