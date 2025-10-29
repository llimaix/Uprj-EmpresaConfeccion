import { query, exec } from "../db.js";
import { ok, bad } from "../util.js";
import oracledb from 'oracledb';

// ✅ Listar empleados con filtros
export const listar = async (event) => {
  try {
    const params = event?.queryStringParameters || {};
    const {
      search = '',
      instalacion = '',
      departamento = '',
      sortBy = 'nombre',
      sortOrder = 'ASC'
    } = params;

    let sql = `
      SELECT 
        e.id_persona,
        p.nombre,
        p.tipo,
        e.tipo_empleado,
        e.id_instalacion,
        e.id_departamento,
        i.nombre AS instalacion_nombre,
        d.nombre AS departamento_nombre
      FROM empleado e
      JOIN persona p ON e.id_persona = p.id_persona
      LEFT JOIN instalacion i ON e.id_instalacion = i.id_instalacion
      LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
    `;

    let binds = {};
    let whereConditions = [];

    if (search && search.trim()) {
      whereConditions.push(`UPPER(p.nombre) LIKE UPPER(:search)`);
      binds.search = `%${search.trim()}%`;
    }

    if (instalacion && instalacion.trim()) {
      whereConditions.push(`e.id_instalacion = :instalacion`);
      binds.instalacion = parseInt(instalacion);
    }

    if (departamento && departamento.trim()) {
      whereConditions.push(`e.id_departamento = :departamento`);
      binds.departamento = parseInt(departamento);
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Validar campo de ordenamiento
    const validSortFields = ['nombre', 'tipo_empleado'];
    const sortField = validSortFields.includes(sortBy) ? 
      (sortBy === 'nombre' ? 'p.nombre' : `e.${sortBy}`) : 'p.nombre';
    
    sql += ` ORDER BY ${sortField} ${sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;

    const { rows } = await query(sql, binds);
    
    // Calcular estadísticas
    const estadisticas = {
      total: rows.length,
      porTipo: rows.reduce((acc, emp) => {
        const tipo = emp.TIPO_EMPLEADO || 'SIN_TIPO';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {}),
      porInstalacion: rows.reduce((acc, emp) => {
        const inst = emp.INSTALACION_NOMBRE || 'SIN_INSTALACION';
        acc[inst] = (acc[inst] || 0) + 1;
        return acc;
      }, {})
    };

    return ok({
      empleados: rows,
      estadisticas,
      filtros: { search, instalacion, departamento }
    });

  } catch (e) {
    console.error('Error al listar empleados:', e);
    return bad(`Error al cargar empleados: ${e.message}`);
  }
};

// ✅ Obtener empleado por ID
export const obtenerPorId = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    
    if (!id || isNaN(id)) {
      return bad('ID de empleado inválido', 400);
    }

    const sql = `
      SELECT 
        e.id_persona,
        p.nombre,
        p.tipo,
        e.tipo_empleado,
        e.id_instalacion,
        e.id_departamento,
        i.nombre AS instalacion_nombre,
        d.nombre AS departamento_nombre
      FROM empleado e
      JOIN persona p ON e.id_persona = p.id_persona
      LEFT JOIN instalacion i ON e.id_instalacion = i.id_instalacion
      LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
      WHERE e.id_persona = :id
    `;

    const { rows } = await query(sql, { id });

    if (rows.length === 0) {
      return bad('Empleado no encontrado', 404);
    }

    return ok({ empleado: rows[0] });
  } catch (e) {
    console.error('Error obtener empleado:', e);
    return bad(`Error al obtener empleado: ${e.message}`);
  }
};

// ✅ Crear empleado
export const crear = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { 
      nombre, 
      tipo_empleado, 
      id_instalacion, 
      id_departamento 
    } = body;
    
    if (!nombre || !nombre.trim()) {
      return bad('El nombre es obligatorio', 400);
    }

    if (!tipo_empleado || !tipo_empleado.trim()) {
      return bad('El tipo de empleado es obligatorio', 400);
    }

    // Verificar que la instalación existe si se proporciona
    if (id_instalacion) {
      const instalacionExists = await query(
        `SELECT COUNT(*) as count FROM instalacion WHERE id_instalacion = :id`,
        { id: id_instalacion }
      );

      if (instalacionExists.rows[0]?.COUNT === 0) {
        return bad('La instalación especificada no existe', 400);
      }
    }

    // Verificar que el departamento existe si se proporciona
    if (id_departamento) {
      const departamentoExists = await query(
        `SELECT COUNT(*) as count FROM departamento WHERE id_departamento = :id`,
        { id: id_departamento }
      );

      if (departamentoExists.rows[0]?.COUNT === 0) {
        return bad('El departamento especificado no existe', 400);
      }
    }

    // Primero crear la persona
    const personaSql = `
      INSERT INTO persona (id_persona, nombre, tipo)
      VALUES (seq_persona.NEXTVAL, :nombre, 'EMPLEADO')
      RETURNING id_persona INTO :id_persona
    `;
    
    const personaBinds = {
      nombre: nombre.trim(),
      id_persona: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    const personaResult = await exec(personaSql, personaBinds);
    const idPersona = personaResult.outBinds.id_persona[0];

    // Luego crear el empleado
    const empleadoSql = `
      INSERT INTO empleado (id_persona, tipo_empleado, id_instalacion, id_departamento)
      VALUES (:id_persona, :tipo_empleado, :id_instalacion, :id_departamento)
    `;

    await exec(empleadoSql, {
      id_persona: idPersona,
      tipo_empleado: tipo_empleado.trim(),
      id_instalacion: id_instalacion || null,
      id_departamento: id_departamento || null
    });

    return ok({
      id_persona: idPersona,
      nombre: nombre.trim(),
      tipo_empleado: tipo_empleado.trim(),
      message: 'Empleado creado exitosamente'
    });
  } catch (e) {
    console.error('Error crear empleado:', e);
    return bad(`Error al crear empleado: ${e.message}`);
  }
};

// ✅ Actualizar empleado
export const actualizar = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    const body = JSON.parse(event.body || '{}');
    const { 
      nombre, 
      tipo_empleado, 
      id_instalacion, 
      id_departamento 
    } = body;

    if (!id || isNaN(id)) {
      return bad('ID de empleado inválido', 400);
    }

    // Verificar que el empleado existe
    const empleadoActual = await query(
      `SELECT e.*, p.nombre FROM empleado e JOIN persona p ON e.id_persona = p.id_persona WHERE e.id_persona = :id`,
      { id }
    );

    if (empleadoActual.rows.length === 0) {
      return bad('Empleado no encontrado', 404);
    }

    // Actualizar persona si se proporciona nombre
    if (nombre && nombre.trim()) {
      await exec(
        `UPDATE persona SET nombre = :nombre WHERE id_persona = :id`,
        { nombre: nombre.trim(), id }
      );
    }

    // Actualizar empleado
    const updateFields = [];
    const binds = { id };

    if (tipo_empleado && tipo_empleado.trim()) {
      updateFields.push('tipo_empleado = :tipo_empleado');
      binds.tipo_empleado = tipo_empleado.trim();
    }

    if (id_instalacion !== undefined) {
      updateFields.push('id_instalacion = :id_instalacion');
      binds.id_instalacion = id_instalacion || null;
    }

    if (id_departamento !== undefined) {
      updateFields.push('id_departamento = :id_departamento');
      binds.id_departamento = id_departamento || null;
    }

    if (updateFields.length > 0) {
      const result = await exec(
        `UPDATE empleado SET ${updateFields.join(', ')} WHERE id_persona = :id`,
        binds
      );

      if (result.rowsAffected === 0) {
        return bad('No se pudo actualizar el empleado', 500);
      }
    }

    return ok({
      id_persona: id,
      message: 'Empleado actualizado exitosamente'
    });

  } catch (e) {
    console.error('Error actualizar empleado:', e);
    return bad(`Error al actualizar empleado: ${e.message}`);
  }
};

// ✅ Eliminar empleado
export const eliminar = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    
    if (!id || isNaN(id)) {
      return bad('ID de empleado inválido', 400);
    }

    // Verificar que el empleado existe
    const empleadoActual = await query(
      `SELECT p.nombre FROM empleado e JOIN persona p ON e.id_persona = p.id_persona WHERE e.id_persona = :id`,
      { id }
    );

    if (empleadoActual.rows.length === 0) {
      return bad('Empleado no encontrado', 404);
    }

    const nombreEmpleado = empleadoActual.rows[0].NOMBRE;

    // Verificar dependencias (auditorías, aprobaciones, etc.)
    const dependencias = await query(
      `SELECT COUNT(*) as count FROM auditoria WHERE id_auditor = :id`,
      { id }
    );

    if (dependencias.rows[0]?.COUNT > 0) {
      return bad('No se puede eliminar: el empleado tiene auditorías asociadas', 409);
    }

    // Eliminar empleado (esto también eliminará la persona debido a la FK)
    const result = await exec(`DELETE FROM empleado WHERE id_persona = :id`, { id });

    if (result.rowsAffected === 0) {
      return bad('No se pudo eliminar el empleado', 500);
    }

    // Eliminar persona
    await exec(`DELETE FROM persona WHERE id_persona = :id`, { id });

    return ok({
      id_persona: id,
      nombre: nombreEmpleado,
      message: 'Empleado eliminado exitosamente'
    });

  } catch (e) {
    console.error('Error eliminar empleado:', e);
    return bad(`Error al eliminar empleado: ${e.message}`);
  }
};

// ✅ Obtener estadísticas de empleados
export const obtenerEstadisticas = async () => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_empleados,
        COUNT(DISTINCT e.tipo_empleado) as tipos_empleado,
        COUNT(DISTINCT e.id_instalacion) as instalaciones_con_empleados,
        COUNT(DISTINCT e.id_departamento) as departamentos_con_empleados
      FROM empleado e
    `;

    const { rows } = await query(sql);
    const estadisticas = rows[0];

    // Obtener distribución por tipo
    const tiposSql = `
      SELECT 
        tipo_empleado,
        COUNT(*) as cantidad
      FROM empleado
      WHERE tipo_empleado IS NOT NULL
      GROUP BY tipo_empleado
      ORDER BY cantidad DESC
    `;

    const tiposResult = await query(tiposSql);

    return ok({
      estadisticas: {
        totalEmpleados: estadisticas.TOTAL_EMPLEADOS || 0,
        tiposEmpleado: estadisticas.TIPOS_EMPLEADO || 0,
        instalacionesConEmpleados: estadisticas.INSTALACIONES_CON_EMPLEADOS || 0,
        departamentosConEmpleados: estadisticas.DEPARTAMENTOS_CON_EMPLEADOS || 0
      },
      distribucionPorTipo: tiposResult.rows
    });
  } catch (e) {
    console.error('Error obtener estadísticas empleados:', e);
    return bad(`Error al obtener estadísticas: ${e.message}`);
  }
};