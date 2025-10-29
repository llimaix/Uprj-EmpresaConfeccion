import { query, exec } from "../db.js";
import { ok, bad } from "../util.js";

// ✅ Listar transacciones financieras
export const listar = async (event) => {
  try {
    const params = event?.queryStringParameters || {};
    const {
      search = '',
      tipo = '',
      fechaDesde = '',
      fechaHasta = '',
      sortBy = 'fecha',
      sortOrder = 'DESC'
    } = params;

    let sql = `
      SELECT 
        t.id_transaccion,
        t.tipo,
        t.monto,
        t.fecha,
        t.descripcion,
        p.nombre AS persona_nombre
      FROM transaccion_financiera t
      LEFT JOIN persona p ON t.id_persona = p.id_persona
    `;

    let binds = {};
    let whereConditions = [];

    if (search && search.trim()) {
      whereConditions.push(`(UPPER(t.descripcion) LIKE UPPER(:search) OR UPPER(p.nombre) LIKE UPPER(:search))`);
      binds.search = `%${search.trim()}%`;
    }

    if (tipo && tipo.trim()) {
      whereConditions.push(`UPPER(t.tipo) = UPPER(:tipo)`);
      binds.tipo = tipo.trim();
    }

    if (fechaDesde && fechaDesde.trim()) {
      whereConditions.push(`t.fecha >= TO_DATE(:fechaDesde, 'YYYY-MM-DD')`);
      binds.fechaDesde = fechaDesde.trim();
    }

    if (fechaHasta && fechaHasta.trim()) {
      whereConditions.push(`t.fecha <= TO_DATE(:fechaHasta, 'YYYY-MM-DD') + 1`);
      binds.fechaHasta = fechaHasta.trim();
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Validar campo de ordenamiento
    const validSortFields = ['fecha', 'monto', 'tipo'];
    const sortField = validSortFields.includes(sortBy) ? `t.${sortBy}` : 't.fecha';
    
    sql += ` ORDER BY ${sortField} ${sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;

    const { rows } = await query(sql, binds);
    
    // Calcular estadísticas
    const ingresos = rows.filter(t => t.TIPO === 'INGRESO').reduce((sum, t) => sum + (t.MONTO || 0), 0);
    const gastos = rows.filter(t => t.TIPO === 'GASTO').reduce((sum, t) => sum + (t.MONTO || 0), 0);

    return ok({ 
      rows,
      statistics: {
        total: rows.length,
        ingresos,
        gastos,
        balance: ingresos - gastos
      },
      filters: { search, tipo, fechaDesde, fechaHasta, sortBy, sortOrder }
    });
  } catch (e) {
    console.error("Error listar transacciones:", e);
    return bad(`Error al listar transacciones: ${e.message}`);
  }
};

// ✅ Obtener transacción por ID
export const obtenerPorId = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    
    if (!id || isNaN(id)) {
      return bad('ID de transacción inválido', 400);
    }

    const sql = `
      SELECT 
        t.id_transaccion,
        t.tipo,
        t.monto,
        t.fecha,
        t.descripcion,
        t.id_persona,
        p.nombre AS persona_nombre
      FROM transaccion_financiera t
      LEFT JOIN persona p ON t.id_persona = p.id_persona
      WHERE t.id_transaccion = :id
    `;

    const { rows } = await query(sql, { id });

    if (rows.length === 0) {
      return bad('Transacción no encontrada', 404);
    }

    return ok({ transaccion: rows[0] });
  } catch (e) {
    console.error('Error obtener transacción:', e);
    return bad(e.message);
  }
};

// ✅ Crear nueva transacción
export const crear = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { 
      tipo, 
      monto, 
      descripcion, 
      id_persona 
    } = body;

    // Validaciones
    if (!tipo || !tipo.trim()) {
      return bad('El tipo es requerido', 400);
    }

    const tiposValidos = ['INGRESO', 'GASTO'];
    if (!tiposValidos.includes(tipo.toUpperCase())) {
      return bad(`Tipo inválido. Tipos válidos: ${tiposValidos.join(', ')}`, 400);
    }

    if (!monto || monto <= 0) {
      return bad('El monto debe ser mayor a 0', 400);
    }

    if (!descripcion || !descripcion.trim()) {
      return bad('La descripción es requerida', 400);
    }

    // Verificar que la persona existe si se especifica
    if (id_persona) {
      const personaExists = await query(
        `SELECT COUNT(*) as count FROM persona WHERE id_persona = :id_persona`,
        { id_persona }
      );

      if (personaExists.rows[0]?.COUNT === 0) {
        return bad('Persona no encontrada', 404);
      }
    }

    // Crear transacción
    const sql = `
      INSERT INTO transaccion_financiera (id_transaccion, tipo, monto, fecha, descripcion, id_persona)
      VALUES (seq_transaccion_financiera.NEXTVAL, :tipo, :monto, SYSDATE, :descripcion, :id_persona)
    `;

    await exec(sql, {
      tipo: tipo.toUpperCase(),
      monto,
      descripcion: descripcion.trim(),
      id_persona: id_persona || null
    });

    // Obtener el ID de la transacción recién creada
    const transaccionId = await query(`SELECT seq_transaccion_financiera.CURRVAL as id FROM dual`);
    const idTransaccion = transaccionId.rows[0].ID;

    return ok({
      id_transaccion: idTransaccion,
      tipo: tipo.toUpperCase(),
      monto,
      descripcion,
      message: 'Transacción creada exitosamente'
    });

  } catch (e) {
    console.error('Error crear transacción:', e);
    return bad(`Error al crear transacción: ${e.message}`);
  }
};

// ✅ Actualizar transacción
export const actualizar = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    const body = JSON.parse(event.body || '{}');
    const { 
      tipo, 
      monto, 
      descripcion, 
      id_persona 
    } = body;

    if (!id || isNaN(id)) {
      return bad('ID de transacción inválido', 400);
    }

    // Verificar que la transacción existe
    const transaccionActual = await query(
      `SELECT tipo, monto FROM transaccion_financiera WHERE id_transaccion = :id`,
      { id }
    );

    if (transaccionActual.rows.length === 0) {
      return bad('Transacción no encontrada', 404);
    }

    // Construir la actualización dinámicamente
    const updateFields = [];
    const binds = { id };

    if (tipo && tipo.trim()) {
      const tiposValidos = ['INGRESO', 'GASTO'];
      if (!tiposValidos.includes(tipo.toUpperCase())) {
        return bad(`Tipo inválido. Tipos válidos: ${tiposValidos.join(', ')}`, 400);
      }
      updateFields.push('tipo = :tipo');
      binds.tipo = tipo.toUpperCase();
    }

    if (monto && monto > 0) {
      updateFields.push('monto = :monto');
      binds.monto = monto;
    }

    if (descripcion && descripcion.trim()) {
      updateFields.push('descripcion = :descripcion');
      binds.descripcion = descripcion.trim();
    }

    if (id_persona !== undefined) {
      // Verificar que la persona existe si no es null
      if (id_persona) {
        const personaExists = await query(
          `SELECT COUNT(*) as count FROM persona WHERE id_persona = :id_persona`,
          { id_persona }
        );

        if (personaExists.rows[0]?.COUNT === 0) {
          return bad('Persona no encontrada', 404);
        }
      }

      updateFields.push('id_persona = :id_persona');
      binds.id_persona = id_persona || null;
    }

    if (updateFields.length === 0) {
      return bad('No hay campos para actualizar', 400);
    }

    await exec(
      `UPDATE transaccion_financiera SET ${updateFields.join(', ')} WHERE id_transaccion = :id`,
      binds
    );

    return ok({
      id_transaccion: id,
      message: 'Transacción actualizada exitosamente'
    });

  } catch (e) {
    console.error('Error actualizar transacción:', e);
    return bad(`Error al actualizar transacción: ${e.message}`);
  }
};

// ✅ Eliminar transacción
export const eliminar = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    
    if (!id || isNaN(id)) {
      return bad('ID de transacción inválido', 400);
    }

    // Verificar que la transacción existe
    const transaccionActual = await query(
      `SELECT tipo, monto FROM transaccion_financiera WHERE id_transaccion = :id`,
      { id }
    );

    if (transaccionActual.rows.length === 0) {
      return bad('Transacción no encontrada', 404);
    }

    // Eliminar transacción
    await exec(`DELETE FROM transaccion_financiera WHERE id_transaccion = :id`, { id });

    return ok({
      id_transaccion: id,
      message: 'Transacción eliminada exitosamente'
    });

  } catch (e) {
    console.error('Error eliminar transacción:', e);
    return bad(`Error al eliminar transacción: ${e.message}`);
  }
};

// ✅ Obtener resumen financiero
export const resumen = async (event) => {
  try {
    const params = event?.queryStringParameters || {};
    const { periodo = 'mes' } = params; // mes, trimestre, año

    let filtroFecha = '';
    switch (periodo.toLowerCase()) {
      case 'trimestre':
        filtroFecha = `WHERE t.fecha >= TRUNC(SYSDATE, 'Q')`;
        break;
      case 'año':
        filtroFecha = `WHERE t.fecha >= TRUNC(SYSDATE, 'Y')`;
        break;
      default: // mes
        filtroFecha = `WHERE t.fecha >= TRUNC(SYSDATE, 'MM')`;
    }

    const [resumenGeneral, porTipo, porMes] = await Promise.all([
      // Resumen general del período
      query(`
        SELECT 
          COUNT(*) as total_transacciones,
          SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END) as total_ingresos,
          SUM(CASE WHEN tipo = 'GASTO' THEN monto ELSE 0 END) as total_gastos,
          SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE -monto END) as balance
        FROM transaccion_financiera t
        ${filtroFecha}
      `),

      // Resumen por tipo
      query(`
        SELECT 
          tipo,
          COUNT(*) as cantidad,
          SUM(monto) as total,
          AVG(monto) as promedio
        FROM transaccion_financiera t
        ${filtroFecha}
        GROUP BY tipo
        ORDER BY tipo
      `),

      // Evolución por mes (últimos 6 meses)
      query(`
        SELECT 
          TO_CHAR(fecha, 'YYYY-MM') as mes,
          tipo,
          SUM(monto) as total
        FROM transaccion_financiera
        WHERE fecha >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -6)
        GROUP BY TO_CHAR(fecha, 'YYYY-MM'), tipo
        ORDER BY mes, tipo
      `)
    ]);

    return ok({
      periodo,
      resumen: resumenGeneral.rows[0] || {},
      porTipo: porTipo.rows || [],
      evolucion: porMes.rows || []
    });

  } catch (e) {
    console.error('Error obtener resumen financiero:', e);
    return bad(e.message);
  }
};

// ✅ Obtener tipos de transacciones
export const obtenerTipos = async () => {
  try {
    const sql = `
      SELECT 
        tipo,
        COUNT(*) as cantidad,
        SUM(monto) as total
      FROM transaccion_financiera
      GROUP BY tipo
      ORDER BY tipo
    `;

    const { rows } = await query(sql);
    return ok({ tipos: rows });
  } catch (e) {
    console.error('Error obtener tipos de transacciones:', e);
    return bad(e.message);
  }
};