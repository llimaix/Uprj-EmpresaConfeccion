import { query, exec } from "../db.js";
import { ok, bad } from "../util.js";

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
        p.telefono,
        p.email,
        p.tipo
      FROM persona p
    `;

    let binds = {};
    let whereConditions = [];

    if (search && search.trim()) {
      whereConditions.push(`(UPPER(p.nombre) LIKE UPPER(:search) OR UPPER(p.email) LIKE UPPER(:search))`);
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
    const validSortFields = ['nombre', 'email', 'tipo'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'nombre';
    
    sql += ` ORDER BY ${sortField} ${sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;

    const { rows } = await query(sql, binds);
    
    // Calcular estadísticas por tipo
    const estadisticasPorTipo = rows.reduce((acc, persona) => {
      const tipoPersona = persona.TIPO || 'SIN_TIPO';
      acc[tipoPersona] = (acc[tipoPersona] || 0) + 1;
      return acc;
    }, {});

    return ok({ 
      rows,
      statistics: {
        total: rows.length,
        porTipo: estadisticasPorTipo
      },
      filters: { search, tipo, sortBy, sortOrder }
    });
  } catch (e) {
    console.error("Error listar personas:", e);
    return bad(`Error al listar personas: ${e.message}`);
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
        p.telefono,
        p.email,
        p.tipo
      FROM persona p
      WHERE p.id_persona = :id
    `;

    const { rows } = await query(sql, { id });

    if (rows.length === 0) {
      return bad('Persona no encontrada', 404);
    }

    // Si es cliente, obtener sus órdenes
    const persona = rows[0];
    if (persona.TIPO === 'CLIENTE') {
      const ordenes = await query(`
        SELECT 
          o.id_orden,
          o.estado,
          o.fecha_orden
        FROM orden_compra o
        WHERE o.id_cliente = :id
        ORDER BY o.fecha_orden DESC
      `, { id });

      persona.ordenes = ordenes.rows || [];
    }

    return ok({ persona });
  } catch (e) {
    console.error('Error obtener persona:', e);
    return bad(e.message);
  }
};

export const crear = async (event) => {
  try{
    const body = JSON.parse(event.body || '{}')
    const { nombre, telefono, email, tipo = 'CLIENTE' } = body
    
    if(!nombre || !nombre.trim()) return bad('El nombre es obligatorio', 400)

    // Validar tipo
    const tiposValidos = ['CLIENTE', 'PROVEEDOR', 'EMPLEADO'];
    if (!tiposValidos.includes(tipo.toUpperCase())) {
      return bad(`Tipo inválido. Tipos válidos: ${tiposValidos.join(', ')}`, 400);
    }

    // Verificar email único si se proporciona
    if (email && email.trim()) {
      const emailExists = await query(
        `SELECT COUNT(*) as count FROM persona WHERE UPPER(email) = UPPER(:email)`,
        { email: email.trim() }
      );

      if (emailExists.rows[0]?.COUNT > 0) {
        return bad('Ya existe una persona con ese email', 409);
      }
    }

    // Usando la secuencia del esquema para el PK
    const sql = `
      INSERT INTO persona (id_persona, nombre, telefono, email, tipo)
      VALUES (seq_persona.NEXTVAL, :nombre, :telefono, :email, :tipo)
    `
    
    await exec(sql, { 
      nombre: nombre.trim(), 
      telefono: telefono || null, 
      email: email?.trim() || null,
      tipo: tipo.toUpperCase()
    });

    // Obtener el ID de la persona recién creada
    const personaId = await query(`SELECT seq_persona.CURRVAL as id FROM dual`);
    const idPersona = personaId.rows[0].ID;

    return ok({
      id_persona: idPersona,
      nombre,
      tipo: tipo.toUpperCase(),
      message: 'Persona creada exitosamente'
    });
  }catch(e){
    console.error(e)
    return bad(e.message)
  }
}

// ✅ Actualizar persona
export const actualizar = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    const body = JSON.parse(event.body || '{}');
    const { 
      nombre, 
      telefono, 
      email, 
      tipo 
    } = body;

    if (!id || isNaN(id)) {
      return bad('ID de persona inválido', 400);
    }

    // Verificar que la persona existe
    const personaActual = await query(
      `SELECT tipo FROM persona WHERE id_persona = :id`,
      { id }
    );

    if (personaActual.rows.length === 0) {
      return bad('Persona no encontrada', 404);
    }

    // Verificar email único si se está actualizando
    if (email && email.trim()) {
      const emailExists = await query(
        `SELECT COUNT(*) as count FROM persona WHERE UPPER(email) = UPPER(:email) AND id_persona != :id`,
        { email: email.trim(), id }
      );

      if (emailExists.rows[0]?.COUNT > 0) {
        return bad('Ya existe otra persona con ese email', 409);
      }
    }

    // Construir la actualización dinámicamente
    const updateFields = [];
    const binds = { id };

    if (nombre && nombre.trim()) {
      updateFields.push('nombre = :nombre');
      binds.nombre = nombre.trim();
    }

    if (telefono !== undefined) {
      updateFields.push('telefono = :telefono');
      binds.telefono = telefono || null;
    }

    if (email !== undefined) {
      updateFields.push('email = :email');
      binds.email = email?.trim() || null;
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

    await exec(
      `UPDATE persona SET ${updateFields.join(', ')} WHERE id_persona = :id`,
      binds
    );

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
      `SELECT tipo FROM persona WHERE id_persona = :id`,
      { id }
    );

    if (personaActual.rows.length === 0) {
      return bad('Persona no encontrada', 404);
    }

    // Verificar dependencias antes de eliminar
    const tipoPersona = personaActual.rows[0].TIPO;

    if (tipoPersona === 'CLIENTE') {
      const tieneOrdenes = await query(
        `SELECT COUNT(*) as count FROM orden_compra WHERE id_cliente = :id`,
        { id }
      );

      if (tieneOrdenes.rows[0]?.COUNT > 0) {
        return bad('No se puede eliminar: el cliente tiene órdenes asociadas', 409);
      }
    }

    if (tipoPersona === 'EMPLEADO') {
      const esEmpleado = await query(
        `SELECT COUNT(*) as count FROM empleado WHERE id_persona = :id`,
        { id }
      );

      if (esEmpleado.rows[0]?.COUNT > 0) {
        return bad('No se puede eliminar: existe un registro de empleado asociado', 409);
      }
    }

    // Eliminar persona
    await exec(`DELETE FROM persona WHERE id_persona = :id`, { id });

    return ok({
      id_persona: id,
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
    return bad(e.message);
  }
};
