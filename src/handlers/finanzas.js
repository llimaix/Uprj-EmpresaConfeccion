import { query, exec } from "../db.js";
import { ok, bad } from "../util.js";
import oracledb from 'oracledb';

// ✅ Listar transacciones financieras
export const listar = async (event) => {
  try {
    const params = event?.queryStringParameters || {};
    const {
      search = '',
      cuenta = '',
      sortBy = 'id_transaccion',
      sortOrder = 'DESC'
    } = params;

    let sql = `
      SELECT 
        t.id_transaccion,
        t.id_cuenta,
        t.monto,
        t.descripcion,
        c.descripcion AS cuenta_descripcion
      FROM transaccion_financiera t
      LEFT JOIN cuenta_contable c ON t.id_cuenta = c.id_cuenta
    `;

    let binds = {};
    let whereConditions = [];

    if (search && search.trim()) {
      whereConditions.push(`(UPPER(t.descripcion) LIKE UPPER(:search) OR UPPER(c.descripcion) LIKE UPPER(:search))`);
      binds.search = `%${search.trim()}%`;
    }

    if (cuenta && cuenta.trim()) {
      whereConditions.push(`t.id_cuenta = :cuenta`);
      binds.cuenta = parseInt(cuenta);
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Validar campo de ordenamiento
    const validSortFields = ['id_transaccion', 'monto', 'descripcion'];
    const sortField = validSortFields.includes(sortBy) ? `t.${sortBy}` : 't.id_transaccion';
    
    sql += ` ORDER BY ${sortField} ${sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;

    const { rows } = await query(sql, binds);
    
    // Calcular estadísticas
    const estadisticas = {
      total: rows.length,
      montoTotal: rows.reduce((sum, trans) => sum + (trans.MONTO || 0), 0),
      ingresos: rows.filter(t => t.MONTO > 0).reduce((sum, t) => sum + t.MONTO, 0),
      gastos: Math.abs(rows.filter(t => t.MONTO < 0).reduce((sum, t) => sum + t.MONTO, 0)),
      porCuenta: rows.reduce((acc, trans) => {
        const cuenta = trans.CUENTA_DESCRIPCION || 'SIN_CUENTA';
        acc[cuenta] = (acc[cuenta] || 0) + 1;
        return acc;
      }, {})
    };

    return ok({
      transacciones: rows,
      estadisticas,
      filtros: { search, cuenta }
    });

  } catch (e) {
    console.error('Error al listar transacciones:', e);
    return bad(`Error al cargar transacciones: ${e.message}`);
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
        t.id_cuenta,
        t.monto,
        t.descripcion,
        c.descripcion AS cuenta_descripcion
      FROM transaccion_financiera t
      LEFT JOIN cuenta_contable c ON t.id_cuenta = c.id_cuenta
      WHERE t.id_transaccion = :id
    `;

    const { rows } = await query(sql, { id });

    if (rows.length === 0) {
      return bad('Transacción no encontrada', 404);
    }

    return ok({ transaccion: rows[0] });
  } catch (e) {
    console.error('Error obtener transacción:', e);
    return bad(`Error al obtener transacción: ${e.message}`);
  }
};

// ✅ Crear transacción financiera
export const crear = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { id_cuenta, monto, descripcion } = body;
    
    if (!monto || isNaN(monto)) {
      return bad('El monto es obligatorio y debe ser un número', 400);
    }

    if (!descripcion || !descripcion.trim()) {
      return bad('La descripción es obligatoria', 400);
    }

    // Verificar que la cuenta existe si se proporciona
    if (id_cuenta) {
      const cuentaExists = await query(
        `SELECT COUNT(*) as count FROM cuenta_contable WHERE id_cuenta = :id`,
        { id: id_cuenta }
      );

      if (cuentaExists.rows[0]?.COUNT === 0) {
        return bad('La cuenta especificada no existe', 400);
      }
    }

    const sql = `
      INSERT INTO transaccion_financiera (id_transaccion, id_cuenta, monto, descripcion)
      VALUES (seq_transaccion.NEXTVAL, :id_cuenta, :monto, :descripcion)
      RETURNING id_transaccion INTO :id_transaccion
    `;
    
    const binds = {
      id_cuenta: id_cuenta || null,
      monto: parseFloat(monto),
      descripcion: descripcion.trim(),
      id_transaccion: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    const result = await exec(sql, binds);
    const idTransaccion = result.outBinds.id_transaccion[0];

    return ok({
      id_transaccion: idTransaccion,
      id_cuenta: id_cuenta || null,
      monto: parseFloat(monto),
      descripcion: descripcion.trim(),
      message: 'Transacción creada exitosamente'
    });
  } catch (e) {
    console.error('Error crear transacción:', e);
    return bad(`Error al crear transacción: ${e.message}`);
  }
};

// ✅ Actualizar transacción financiera
export const actualizar = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    const body = JSON.parse(event.body || '{}');
    const { id_cuenta, monto, descripcion } = body;

    if (!id || isNaN(id)) {
      return bad('ID de transacción inválido', 400);
    }

    // Verificar que la transacción existe
    const transaccionActual = await query(
      `SELECT descripcion FROM transaccion_financiera WHERE id_transaccion = :id`,
      { id }
    );

    if (transaccionActual.rows.length === 0) {
      return bad('Transacción no encontrada', 404);
    }

    // Verificar que la cuenta existe si se proporciona
    if (id_cuenta) {
      const cuentaExists = await query(
        `SELECT COUNT(*) as count FROM cuenta_contable WHERE id_cuenta = :id`,
        { id: id_cuenta }
      );

      if (cuentaExists.rows[0]?.COUNT === 0) {
        return bad('La cuenta especificada no existe', 400);
      }
    }

    // Construir la actualización dinámicamente
    const updateFields = [];
    const binds = { id };

    if (id_cuenta !== undefined) {
      updateFields.push('id_cuenta = :id_cuenta');
      binds.id_cuenta = id_cuenta || null;
    }

    if (monto !== undefined && !isNaN(monto)) {
      updateFields.push('monto = :monto');
      binds.monto = parseFloat(monto);
    }

    if (descripcion && descripcion.trim()) {
      updateFields.push('descripcion = :descripcion');
      binds.descripcion = descripcion.trim();
    }

    if (updateFields.length === 0) {
      return bad('No hay campos para actualizar', 400);
    }

    const result = await exec(
      `UPDATE transaccion_financiera SET ${updateFields.join(', ')} WHERE id_transaccion = :id`,
      binds
    );

    if (result.rowsAffected === 0) {
      return bad('No se pudo actualizar la transacción', 500);
    }

    return ok({
      id_transaccion: id,
      message: 'Transacción actualizada exitosamente'
    });

  } catch (e) {
    console.error('Error actualizar transacción:', e);
    return bad(`Error al actualizar transacción: ${e.message}`);
  }
};

// ✅ Eliminar transacción financiera
export const eliminar = async (event) => {
  try {
    const id = parseInt(event.pathParameters?.id);
    
    if (!id || isNaN(id)) {
      return bad('ID de transacción inválido', 400);
    }

    // Verificar que la transacción existe
    const transaccionActual = await query(
      `SELECT descripcion FROM transaccion_financiera WHERE id_transaccion = :id`,
      { id }
    );

    if (transaccionActual.rows.length === 0) {
      return bad('Transacción no encontrada', 404);
    }

    const descripcionTransaccion = transaccionActual.rows[0].DESCRIPCION;

    // Verificar dependencias (auditorías)
    const tieneAuditorias = await query(
      `SELECT COUNT(*) as count FROM auditoria WHERE id_transaccion = :id`,
      { id }
    );

    if (tieneAuditorias.rows[0]?.COUNT > 0) {
      return bad('No se puede eliminar: la transacción tiene auditorías asociadas', 409);
    }

    const result = await exec(`DELETE FROM transaccion_financiera WHERE id_transaccion = :id`, { id });

    if (result.rowsAffected === 0) {
      return bad('No se pudo eliminar la transacción', 500);
    }

    return ok({
      id_transaccion: id,
      descripcion: descripcionTransaccion,
      message: 'Transacción eliminada exitosamente'
    });

  } catch (e) {
    console.error('Error eliminar transacción:', e);
    return bad(`Error al eliminar transacción: ${e.message}`);
  }
};

// ✅ Obtener resumen financiero
export const obtenerResumen = async () => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_transacciones,
        SUM(CASE WHEN monto > 0 THEN monto ELSE 0 END) as total_ingresos,
        SUM(CASE WHEN monto < 0 THEN ABS(monto) ELSE 0 END) as total_gastos,
        SUM(monto) as balance_neto,
        AVG(monto) as monto_promedio
      FROM transaccion_financiera
    `;

    const { rows } = await query(sql);
    const resumen = rows[0];

    // Obtener distribución por cuenta
    const cuentasSql = `
      SELECT 
        c.id_cuenta,
        c.descripcion,
        COUNT(t.id_transaccion) as transacciones_count,
        SUM(t.monto) as total_monto
      FROM cuenta_contable c
      LEFT JOIN transaccion_financiera t ON c.id_cuenta = t.id_cuenta
      GROUP BY c.id_cuenta, c.descripcion
      ORDER BY transacciones_count DESC
    `;

    const cuentasResult = await query(cuentasSql);

    return ok({
      resumen: {
        totalTransacciones: resumen.TOTAL_TRANSACCIONES || 0,
        totalIngresos: resumen.TOTAL_INGRESOS || 0,
        totalGastos: resumen.TOTAL_GASTOS || 0,
        balanceNeto: resumen.BALANCE_NETO || 0,
        montoPromedio: resumen.MONTO_PROMEDIO || 0
      },
      cuentas: cuentasResult.rows
    });
  } catch (e) {
    console.error('Error obtener resumen financiero:', e);
    return bad(`Error al obtener resumen: ${e.message}`);
  }
};

// ✅ Obtener tipos de cuentas
export const obtenerTipos = async () => {
  try {
    const sql = `
      SELECT 
        id_cuenta,
        descripcion
      FROM cuenta_contable
      ORDER BY descripcion
    `;

    const { rows } = await query(sql);
    return ok({ cuentas: rows });
  } catch (e) {
    console.error('Error obtener tipos de cuentas:', e);
    return bad(`Error al obtener cuentas: ${e.message}`);
  }
};