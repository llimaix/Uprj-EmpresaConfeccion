import { query, exec } from "../db.js";
import { ok, bad } from "../util.js";
import oracledb from 'oracledb';

// ✅ Listar personas con filtros por tipo
export const listar = async (event) => {
  try {
    const params = event?.queryStringParameters || {};
    const {
      search = '',
      tipo = '',
      sortBy = 'nombre',
      sortOrder = 'ASC'
    } = params;

    let sql = `
      SELECT 
        p.id_persona,
        p.nombre,
        p.tipo
      FROM persona p
    `;

    let binds = {};
    let whereConditions = [];

    if (search && search.trim()) {
      whereConditions.push(`UPPER(p.nombre) LIKE UPPER(:search)`);
      binds.search = `%${search.trim()}%`;
    }

    if (tipo && tipo.trim()) {
      whereConditions.push(`UPPER(p.tipo) = UPPER(:tipo)`);
      binds.tipo = tipo.trim();
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Validar campo de ordenamiento
    const validSortFields = ['nombre', 'tipo', 'id_persona'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'nombre';
    
    sql += ` ORDER BY ${sortField} ${sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;

    const { rows } = await query(sql, binds);
    
    // Calcular estadísticas por tipo
    const estadisticasPorTipo = rows.reduce((acc, persona) => {
      const tipo = persona.TIPO || 'SIN_TIPO';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    return ok({
      personas: rows,
      total: rows.length,
      estadisticas: estadisticasPorTipo,
      filtros: { search, tipo }
    });

  } catch (e) {
    console.error('Error al listar personas:', e);
    return bad(`Error al cargar personas: ${e.message}`);
  }
};

// ✅ Obtener persona por ID
export const obtenerPorId = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    
    if (!id || isNaN(id)) {
      return bad('ID de persona inválido', 400);
    }

    const sql = `
      SELECT 
        p.id_persona,
        p.nombre,
        p.tipo
      FROM persona p
      WHERE p.id_persona = :id
    `;

    const { rows } = await query(sql, { id });

    if (rows.length === 0) {
      return bad('Persona no encontrada', 404);
    }

    const persona = rows[0];

    // Si es cliente, obtener sus órdenes
    if (persona.TIPO === 'CLIENTE') {
      try {
        const ordenes = await query(`
          SELECT 
            o.id_orden,
            o.estado
          FROM orden_compra o
          WHERE o.id_cliente = :id
          ORDER BY o.id_orden DESC
        `, { id });

        persona.ordenes = ordenes.rows || [];
      } catch (e) {
        console.log('No se pudieron cargar órdenes:', e.message);
        persona.ordenes = [];
      }
    }

    return ok({ persona });
  } catch (e) {
    console.error('Error obtener persona:', e);
    return bad(`Error al obtener persona: ${e.message}`);
  }
};

// ✅ Crear persona
export const crear = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { nombre, tipo = 'CLIENTE' } = body;
    
    if (!nombre || !nombre.trim()) {
      return bad('El nombre es obligatorio', 400);
    }

    // Validar tipo
    const tiposValidos = ['CLIENTE', 'PROVEEDOR', 'EMPLEADO'];
    if (!tiposValidos.includes(tipo.toUpperCase())) {
      return bad(`Tipo inválido. Tipos válidos: ${tiposValidos.join(', ')}`, 400);
    }

    const sql = `
      INSERT INTO persona (id_persona, nombre, tipo)
      VALUES (seq_persona.NEXTVAL, :nombre, :tipo)
      RETURNING id_persona INTO :id_persona
    `;
    
    const binds = {
      nombre: nombre.trim(),
      tipo: tipo.toUpperCase(),
      id_persona: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    const result = await exec(sql, binds);
    const idPersona = result.outBinds.id_persona[0];

    return ok({
      id_persona: idPersona,
      nombre: nombre.trim(),
      tipo: tipo.toUpperCase(),
      message: 'Persona creada exitosamente'
    });
  } catch (e) {
    console.error('Error crear persona:', e);
    return bad(`Error al crear persona: ${e.message}`);
  }
};

// ✅ Actualizar persona
export const actualizar = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    const body = JSON.parse(event.body || '{}');
    const { nombre, tipo } = body;

    if (!id || isNaN(id)) {
      return bad('ID de persona inválido', 400);
    }

    // Verificar que la persona existe
    const personaActual = await query(
      `SELECT nombre, tipo FROM persona WHERE id_persona = :id`,
      { id }
    );

    if (personaActual.rows.length === 0) {
      return bad('Persona no encontrada', 404);
    }

    // Construir la actualización dinámicamente
    const updateFields = [];
    const binds = { id };

    if (nombre && nombre.trim()) {
      updateFields.push('nombre = :nombre');
      binds.nombre = nombre.trim();
    }

    if (tipo && tipo.trim()) {
      const tiposValidos = ['CLIENTE', 'PROVEEDOR', 'EMPLEADO'];
      if (!tiposValidos.includes(tipo.toUpperCase())) {
        return bad(`Tipo inválido. Tipos válidos: ${tiposValidos.join(', ')}`, 400);
      }
      updateFields.push('tipo = :tipo');
      binds.tipo = tipo.toUpperCase();
    }

    if (updateFields.length === 0) {
      return bad('No hay campos para actualizar', 400);
    }

    const result = await exec(
      `UPDATE persona SET ${updateFields.join(', ')} WHERE id_persona = :id`,
      binds
    );

    if (result.rowsAffected === 0) {
      return bad('No se pudo actualizar la persona', 500);
    }

    return ok({
      id_persona: id,
      message: 'Persona actualizada exitosamente'
    });

  } catch (e) {
    console.error('Error actualizar persona:', e);
    return bad(`Error al actualizar persona: ${e.message}`);
  }
};

// ✅ Eliminar persona
export const eliminar = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    
    if (!id || isNaN(id)) {
      return bad('ID de persona inválido', 400);
    }

    // Verificar que la persona existe
    const personaActual = await query(
      `SELECT nombre, tipo FROM persona WHERE id_persona = :id`,
      { id }
    );

    if (personaActual.rows.length === 0) {
      return bad('Persona no encontrada', 404);
    }

    const { NOMBRE, TIPO } = personaActual.rows[0];

    // Verificar dependencias antes de eliminar
    if (TIPO === 'CLIENTE') {
      const tieneOrdenes = await query(
        `SELECT COUNT(*) as count FROM orden_compra WHERE id_cliente = :id`,
        { id }
      );

      if (tieneOrdenes.rows[0]?.COUNT > 0) {
        return bad('No se puede eliminar: el cliente tiene órdenes asociadas', 409);
      }
    }

    if (TIPO === 'EMPLEADO') {
      const esEmpleado = await query(
        `SELECT COUNT(*) as count FROM empleado WHERE id_persona = :id`,
        { id }
      );

      if (esEmpleado.rows[0]?.COUNT > 0) {
        return bad('No se puede eliminar: existe un registro de empleado asociado', 409);
      }
    }

    const result = await exec(`DELETE FROM persona WHERE id_persona = :id`, { id });

    if (result.rowsAffected === 0) {
      return bad('No se pudo eliminar la persona', 500);
    }

    return ok({
      id_persona: id,
      nombre: NOMBRE,
      message: 'Persona eliminada exitosamente'
    });

  } catch (e) {
    console.error('Error eliminar persona:', e);
    return bad(`Error al eliminar persona: ${e.message}`);
  }
};

// ✅ Obtener tipos de personas únicos
export const obtenerTipos = async () => {
  try {
    const sql = `
      SELECT 
        tipo,
        COUNT(*) as cantidad
      FROM persona
      WHERE tipo IS NOT NULL
      GROUP BY tipo
      ORDER BY tipo
    `;

    const { rows } = await query(sql);
    return ok({ tipos: rows });
  } catch (e) {
    console.error('Error obtener tipos de personas:', e);
    return bad(`Error al obtener tipos: ${e.message}`);
  }
};
