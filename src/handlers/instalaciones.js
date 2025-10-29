import { query, exec } from "../db.js";
import { ok, bad } from "../util.js";

// ✅ Listar instalaciones
export const listar = async (event) => {
  try {
    const params = event?.queryStringParameters || {};
    const {
      search = '',
      sortBy = 'nombre',
      sortOrder = 'ASC'
    } = params;

    let sql = `
      SELECT 
        i.id_instalacion,
        i.nombre,
        i.ubicacion,
        i.tipo,
        COUNT(e.id_empleado) as empleados_count,
        COUNT(inv.id_inventario) as inventarios_count
      FROM instalacion i
      LEFT JOIN empleado e ON i.id_instalacion = e.id_instalacion
      LEFT JOIN inventario inv ON i.id_instalacion = inv.id_instalacion
    `;

    let binds = {};
    let whereConditions = [];

    if (search && search.trim()) {
      whereConditions.push(`(UPPER(i.nombre) LIKE UPPER(:search) OR UPPER(i.ubicacion) LIKE UPPER(:search) OR UPPER(i.tipo) LIKE UPPER(:search))`);
      binds.search = `%${search.trim()}%`;
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    sql += ` GROUP BY i.id_instalacion, i.nombre, i.ubicacion, i.tipo`;

    // Validar campo de ordenamiento
    const validSortFields = ['nombre', 'ubicacion', 'tipo'];
    const sortField = validSortFields.includes(sortBy) ? `i.${sortBy}` : 'i.nombre';
    
    sql += ` ORDER BY ${sortField} ${sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;

    const { rows } = await query(sql, binds);
    
    // Calcular estadísticas
    const stats = {
      totalInstalaciones: rows.length,
      totalEmpleados: rows.reduce((sum, inst) => sum + (inst.EMPLEADOS_COUNT || 0), 0),
      totalInventarios: rows.reduce((sum, inst) => sum + (inst.INVENTARIOS_COUNT || 0), 0),
      tiposUnicos: new Set(rows.map(inst => inst.TIPO).filter(Boolean)).size
    };

    return ok({ 
      rows,
      statistics: stats,
      filters: { search, sortBy, sortOrder }
    });
  } catch (e) {
    console.error("Error listar instalaciones:", e);
    return bad(`Error al listar instalaciones: ${e.message}`);
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
        i.tipo
      FROM instalacion i
      WHERE i.id_instalacion = :id
    `;

    const { rows } = await query(sql, { id });

    if (rows.length === 0) {
      return bad('Instalación no encontrada', 404);
    }

    const instalacion = rows[0];

    // Obtener empleados de la instalación
    const empleados = await query(`
      SELECT 
        e.id_empleado,
        p.nombre,
        e.cargo,
        e.salario
      FROM empleado e
      JOIN persona p ON e.id_persona = p.id_persona
      WHERE e.id_instalacion = :id
      ORDER BY p.nombre
    `, { id });

    // Obtener inventarios de la instalación
    const inventarios = await query(`
      SELECT 
        inv.id_inventario,
        prod.nombre as producto,
        inv.cantidad,
        prod.tipo as tipo_producto
      FROM inventario inv
      JOIN producto prod ON inv.id_producto = prod.id_producto
      WHERE inv.id_instalacion = :id
      ORDER BY prod.nombre
    `, { id });

    instalacion.empleados = empleados.rows || [];
    instalacion.inventarios = inventarios.rows || [];

    return ok({ instalacion });
  } catch (e) {
    console.error('Error obtener instalación:', e);
    return bad(e.message);
  }
};

// ✅ Crear nueva instalación
export const crear = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { 
      nombre, 
      ubicacion, 
      tipo 
    } = body;

    // Validaciones
    if (!nombre || !nombre.trim()) {
      return bad('El nombre es requerido', 400);
    }

    if (!ubicacion || !ubicacion.trim()) {
      return bad('La ubicación es requerida', 400);
    }

    // Verificar que no existe otra instalación con el mismo nombre
    const nombreExists = await query(
      `SELECT COUNT(*) as count FROM instalacion WHERE UPPER(nombre) = UPPER(:nombre)`,
      { nombre: nombre.trim() }
    );

    if (nombreExists.rows[0]?.COUNT > 0) {
      return bad('Ya existe una instalación con ese nombre', 409);
    }

    // Crear instalación
    const sql = `
      INSERT INTO instalacion (id_instalacion, nombre, ubicacion, tipo)
      VALUES (seq_instalacion.NEXTVAL, :nombre, :ubicacion, :tipo)
    `;

    await exec(sql, {
      nombre: nombre.trim(),
      ubicacion: ubicacion.trim(),
      tipo: tipo?.trim() || null
    });

    // Obtener el ID de la instalación recién creada
    const instalacionId = await query(`SELECT seq_instalacion.CURRVAL as id FROM dual`);
    const idInstalacion = instalacionId.rows[0].ID;

    return ok({
      id_instalacion: idInstalacion,
      nombre,
      ubicacion,
      tipo,
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
    const { 
      nombre, 
      ubicacion, 
      tipo 
    } = body;

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

    // Verificar nombre único si se está actualizando
    if (nombre && nombre.trim()) {
      const nombreExists = await query(
        `SELECT COUNT(*) as count FROM instalacion WHERE UPPER(nombre) = UPPER(:nombre) AND id_instalacion != :id`,
        { nombre: nombre.trim(), id }
      );

      if (nombreExists.rows[0]?.COUNT > 0) {
        return bad('Ya existe otra instalación con ese nombre', 409);
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

    if (tipo !== undefined) {
      updateFields.push('tipo = :tipo');
      binds.tipo = tipo?.trim() || null;
    }

    if (updateFields.length === 0) {
      return bad('No hay campos para actualizar', 400);
    }

    await exec(
      `UPDATE instalacion SET ${updateFields.join(', ')} WHERE id_instalacion = :id`,
      binds
    );

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

    // Verificar dependencias antes de eliminar
    const [empleados, inventarios] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM empleado WHERE id_instalacion = :id`, { id }),
      query(`SELECT COUNT(*) as count FROM inventario WHERE id_instalacion = :id`, { id })
    ]);

    if (empleados.rows[0]?.COUNT > 0) {
      return bad('No se puede eliminar: la instalación tiene empleados asignados', 409);
    }

    if (inventarios.rows[0]?.COUNT > 0) {
      return bad('No se puede eliminar: la instalación tiene inventarios asociados', 409);
    }

    // Eliminar instalación
    await exec(`DELETE FROM instalacion WHERE id_instalacion = :id`, { id });

    return ok({
      id_instalacion: id,
      message: 'Instalación eliminada exitosamente'
    });

  } catch (e) {
    console.error('Error eliminar instalación:', e);
    return bad(`Error al eliminar instalación: ${e.message}`);
  }
};

// ✅ Obtener tipos de instalaciones únicos
export const obtenerTipos = async () => {
  try {
    const sql = `
      SELECT 
        tipo,
        COUNT(*) as cantidad
      FROM instalacion
      WHERE tipo IS NOT NULL
      GROUP BY tipo
      ORDER BY tipo
    `;

    const { rows } = await query(sql);
    return ok({ tipos: rows });
  } catch (e) {
    console.error('Error obtener tipos de instalaciones:', e);
    return bad(e.message);
  }
};

// ✅ Obtener estadísticas de instalaciones
export const estadisticas = async () => {
  try {
    const [resumenGeneral, porTipo, masActivas] = await Promise.all([
      // Resumen general
      query(`
        SELECT 
          COUNT(*) as total_instalaciones,
          COUNT(DISTINCT tipo) as tipos_unicos,
          SUM(empleados.cantidad) as total_empleados,
          SUM(inventarios.cantidad) as total_inventarios
        FROM instalacion i
        LEFT JOIN (
          SELECT id_instalacion, COUNT(*) as cantidad 
          FROM empleado 
          GROUP BY id_instalacion
        ) empleados ON i.id_instalacion = empleados.id_instalacion
        LEFT JOIN (
          SELECT id_instalacion, COUNT(*) as cantidad 
          FROM inventario 
          GROUP BY id_instalacion
        ) inventarios ON i.id_instalacion = inventarios.id_instalacion
      `),

      // Por tipo
      query(`
        SELECT 
          i.tipo,
          COUNT(*) as cantidad_instalaciones,
          COUNT(e.id_empleado) as total_empleados
        FROM instalacion i
        LEFT JOIN empleado e ON i.id_instalacion = e.id_instalacion
        WHERE i.tipo IS NOT NULL
        GROUP BY i.tipo
        ORDER BY cantidad_instalaciones DESC
      `),

      // Más activas (con más empleados e inventarios)
      query(`
        SELECT 
          i.nombre,
          i.tipo,
          COUNT(DISTINCT e.id_empleado) as empleados,
          COUNT(DISTINCT inv.id_inventario) as inventarios,
          (COUNT(DISTINCT e.id_empleado) + COUNT(DISTINCT inv.id_inventario)) as actividad
        FROM instalacion i
        LEFT JOIN empleado e ON i.id_instalacion = e.id_instalacion
        LEFT JOIN inventario inv ON i.id_instalacion = inv.id_instalacion
        GROUP BY i.id_instalacion, i.nombre, i.tipo
        ORDER BY actividad DESC
        FETCH FIRST 10 ROWS ONLY
      `)
    ]);

    return ok({
      resumen: resumenGeneral.rows[0] || {},
      porTipo: porTipo.rows || [],
      masActivas: masActivas.rows || []
    });

  } catch (e) {
    console.error('Error obtener estadísticas de instalaciones:', e);
    return bad(e.message);
  }
};