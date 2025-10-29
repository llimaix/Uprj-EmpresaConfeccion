import { query, exec } from "../db.js";
import { ok, bad } from "../util.js";

// ✅ Listar empleados con filtros
export const listar = async (event) => {
  try {
    const params = event?.queryStringParameters || {};
    const {
      search = '',
      instalacion = '',
      sortBy = 'nombre',
      sortOrder = 'ASC'
    } = params;

    let sql = `
      SELECT 
        e.id_empleado,
        p.nombre,
        p.telefono,
        p.email,
        e.cargo,
        e.salario,
        e.fecha_contratacion,
        i.nombre AS instalacion
      FROM empleado e
      JOIN persona p ON e.id_persona = p.id_persona
      LEFT JOIN instalacion i ON e.id_instalacion = i.id_instalacion
    `;

    let binds = {};
    let whereConditions = [];

    if (search && search.trim()) {
      whereConditions.push(`(UPPER(p.nombre) LIKE UPPER(:search) OR UPPER(e.cargo) LIKE UPPER(:search))`);
      binds.search = `%${search.trim()}%`;
    }

    if (instalacion && instalacion.trim()) {
      whereConditions.push(`e.id_instalacion = :instalacion`);
      binds.instalacion = instalacion.trim();
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Validar campo de ordenamiento
    const validSortFields = ['nombre', 'cargo', 'salario', 'fecha_contratacion'];
    const sortField = validSortFields.includes(sortBy) ? 
      (sortBy === 'nombre' ? 'p.nombre' : `e.${sortBy}`) : 'p.nombre';
    
    sql += ` ORDER BY ${sortField} ${sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;

    const { rows } = await query(sql, binds);
    
    // Calcular estadísticas
    const stats = {
      totalEmpleados: rows.length,
      salarioPromedio: rows.reduce((sum, emp) => sum + (emp.SALARIO || 0), 0) / rows.length || 0,
      instalacionesRepresentadas: new Set(rows.map(emp => emp.INSTALACION).filter(Boolean)).size
    };

    return ok({ 
      rows,
      statistics: stats,
      filters: { search, instalacion, sortBy, sortOrder }
    });
  } catch (e) {
    console.error("Error listar empleados:", e);
    return bad(`Error al listar empleados: ${e.message}`);
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
        e.id_empleado,
        e.id_persona,
        p.nombre,
        p.telefono,
        p.email,
        e.cargo,
        e.salario,
        e.fecha_contratacion,
        e.id_instalacion,
        i.nombre AS instalacion
      FROM empleado e
      JOIN persona p ON e.id_persona = p.id_persona
      LEFT JOIN instalacion i ON e.id_instalacion = i.id_instalacion
      WHERE e.id_empleado = :id
    `;

    const { rows } = await query(sql, { id });

    if (rows.length === 0) {
      return bad('Empleado no encontrado', 404);
    }

    return ok({ empleado: rows[0] });
  } catch (e) {
    console.error('Error obtener empleado:', e);
    return bad(e.message);
  }
};

// ✅ Crear nuevo empleado
export const crear = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { 
      nombre, 
      telefono, 
      email, 
      cargo, 
      salario, 
      id_instalacion 
    } = body;

    // Validaciones
    if (!nombre || !nombre.trim()) {
      return bad('El nombre es requerido', 400);
    }

    if (!cargo || !cargo.trim()) {
      return bad('El cargo es requerido', 400);
    }

    if (!salario || salario <= 0) {
      return bad('El salario debe ser mayor a 0', 400);
    }

    // Verificar que la instalación existe si se especifica
    if (id_instalacion) {
      const instalacionExists = await query(
        `SELECT COUNT(*) as count FROM instalacion WHERE id_instalacion = :id_instalacion`,
        { id_instalacion }
      );

      if (instalacionExists.rows[0]?.COUNT === 0) {
        return bad('Instalación no encontrada', 404);
      }
    }

    // Crear persona primero
    const personaSql = `
      INSERT INTO persona (id_persona, nombre, telefono, email, tipo)
      VALUES (seq_persona.NEXTVAL, :nombre, :telefono, :email, 'EMPLEADO')
    `;

    await exec(personaSql, { 
      nombre: nombre.trim(), 
      telefono: telefono || null, 
      email: email || null 
    });

    // Obtener el ID de la persona recién creada
    const personaId = await query(`SELECT seq_persona.CURRVAL as id FROM dual`);
    const idPersona = personaId.rows[0].ID;

    // Crear empleado
    const empleadoSql = `
      INSERT INTO empleado (id_empleado, id_persona, cargo, salario, fecha_contratacion, id_instalacion)
      VALUES (seq_empleado.NEXTVAL, :id_persona, :cargo, :salario, SYSDATE, :id_instalacion)
    `;

    await exec(empleadoSql, {
      id_persona: idPersona,
      cargo: cargo.trim(),
      salario,
      id_instalacion: id_instalacion || null
    });

    // Obtener el ID del empleado recién creado
    const empleadoId = await query(`SELECT seq_empleado.CURRVAL as id FROM dual`);
    const idEmpleado = empleadoId.rows[0].ID;

    return ok({
      id_empleado: idEmpleado,
      id_persona: idPersona,
      nombre,
      cargo,
      salario,
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
      telefono, 
      email, 
      cargo, 
      salario, 
      id_instalacion 
    } = body;

    if (!id || isNaN(id)) {
      return bad('ID de empleado inválido', 400);
    }

    // Verificar que el empleado existe y obtener su id_persona
    const empleadoActual = await query(
      `SELECT e.id_persona, e.cargo, e.salario 
       FROM empleado e 
       WHERE e.id_empleado = :id`,
      { id }
    );

    if (empleadoActual.rows.length === 0) {
      return bad('Empleado no encontrado', 404);
    }

    const idPersona = empleadoActual.rows[0].ID_PERSONA;

    // Actualizar datos de persona si se proporcionan
    if (nombre || telefono !== undefined || email !== undefined) {
      const updatePersona = [];
      const personaBinds = { id_persona: idPersona };

      if (nombre && nombre.trim()) {
        updatePersona.push('nombre = :nombre');
        personaBinds.nombre = nombre.trim();
      }

      if (telefono !== undefined) {
        updatePersona.push('telefono = :telefono');
        personaBinds.telefono = telefono || null;
      }

      if (email !== undefined) {
        updatePersona.push('email = :email');
        personaBinds.email = email || null;
      }

      if (updatePersona.length > 0) {
        await exec(
          `UPDATE persona SET ${updatePersona.join(', ')} WHERE id_persona = :id_persona`,
          personaBinds
        );
      }
    }

    // Actualizar datos de empleado si se proporcionan
    const updateEmpleado = [];
    const empleadoBinds = { id: id };

    if (cargo && cargo.trim()) {
      updateEmpleado.push('cargo = :cargo');
      empleadoBinds.cargo = cargo.trim();
    }

    if (salario && salario > 0) {
      updateEmpleado.push('salario = :salario');
      empleadoBinds.salario = salario;
    }

    if (id_instalacion !== undefined) {
      // Verificar que la instalación existe si no es null
      if (id_instalacion) {
        const instalacionExists = await query(
          `SELECT COUNT(*) as count FROM instalacion WHERE id_instalacion = :id_instalacion`,
          { id_instalacion }
        );

        if (instalacionExists.rows[0]?.COUNT === 0) {
          return bad('Instalación no encontrada', 404);
        }
      }

      updateEmpleado.push('id_instalacion = :id_instalacion');
      empleadoBinds.id_instalacion = id_instalacion || null;
    }

    if (updateEmpleado.length > 0) {
      await exec(
        `UPDATE empleado SET ${updateEmpleado.join(', ')} WHERE id_empleado = :id`,
        empleadoBinds
      );
    }

    return ok({
      id_empleado: id,
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

    // Verificar que el empleado existe y obtener su id_persona
    const empleadoActual = await query(
      `SELECT id_persona FROM empleado WHERE id_empleado = :id`,
      { id }
    );

    if (empleadoActual.rows.length === 0) {
      return bad('Empleado no encontrado', 404);
    }

    const idPersona = empleadoActual.rows[0].ID_PERSONA;

    // Eliminar empleado primero (por la foreign key)
    await exec(`DELETE FROM empleado WHERE id_empleado = :id`, { id });

    // Eliminar persona
    await exec(`DELETE FROM persona WHERE id_persona = :id_persona`, { id_persona: idPersona });

    return ok({
      id_empleado: id,
      message: 'Empleado eliminado exitosamente'
    });

  } catch (e) {
    console.error('Error eliminar empleado:', e);
    return bad(`Error al eliminar empleado: ${e.message}`);
  }
};

// ✅ Obtener estadísticas de empleados
export const estadisticas = async () => {
  try {
    const [resumenGeneral, porInstalacion, porCargo] = await Promise.all([
      // Resumen general
      query(`
        SELECT 
          COUNT(*) as total_empleados,
          AVG(salario) as salario_promedio,
          MIN(salario) as salario_minimo,
          MAX(salario) as salario_maximo,
          COUNT(DISTINCT id_instalacion) as instalaciones_con_empleados
        FROM empleado
        WHERE salario IS NOT NULL
      `),

      // Por instalación
      query(`
        SELECT 
          i.nombre as instalacion,
          COUNT(e.id_empleado) as cantidad_empleados,
          AVG(e.salario) as salario_promedio
        FROM instalacion i
        LEFT JOIN empleado e ON i.id_instalacion = e.id_instalacion
        GROUP BY i.id_instalacion, i.nombre
        ORDER BY cantidad_empleados DESC
      `),

      // Por cargo
      query(`
        SELECT 
          cargo,
          COUNT(*) as cantidad,
          AVG(salario) as salario_promedio
        FROM empleado
        GROUP BY cargo
        ORDER BY cantidad DESC
      `)
    ]);

    return ok({
      resumen: resumenGeneral.rows[0] || {},
      porInstalacion: porInstalacion.rows || [],
      porCargo: porCargo.rows || []
    });

  } catch (e) {
    console.error('Error obtener estadísticas de empleados:', e);
    return bad(e.message);
  }
};