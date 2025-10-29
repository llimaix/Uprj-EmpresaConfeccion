import { useState, useEffect } from "react";
import { finanzasApi, personasApi } from "../api.js";

export default function FinanzasView() {
  const [transacciones, setTransacciones] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTransaccion, setEditingTransaccion] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [resumenFinanciero, setResumenFinanciero] = useState(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    search: "",
    tipo: "",
    fechaDesde: "",
    fechaHasta: "",
    sortBy: "fecha",
    sortOrder: "DESC"
  });

  // Form state
  const [formData, setFormData] = useState({
    tipo: "INGRESO",
    monto: "",
    descripcion: "",
    id_persona: ""
  });

  useEffect(() => {
    cargarTransacciones();
    cargarPersonas();
    cargarResumenFinanciero();
  }, [filtros]);

  const cargarTransacciones = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await finanzasApi.listar(filtros);
      
      if (response.data?.data?.rows) {
        setTransacciones(response.data.data.rows);
        setStatistics(response.data.data.statistics);
      } else {
        setTransacciones(response.data?.rows || []);
      }
    } catch (err) {
      console.error("Error al cargar transacciones:", err);
      setError("Error al cargar transacciones: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const cargarPersonas = async () => {
    try {
      const response = await personasApi.listar();
      setPersonas(response.data?.data?.rows || response.data?.rows || []);
    } catch (err) {
      console.error("Error al cargar personas:", err);
    }
  };

  const cargarResumenFinanciero = async () => {
    try {
      const response = await finanzasApi.resumen({ periodo: 'mes' });
      setResumenFinanciero(response.data?.data || response.data);
    } catch (err) {
      console.error("Error al cargar resumen financiero:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.descripcion.trim() || !formData.monto || formData.monto <= 0) {
      setError("Descripción y monto válido son requeridos");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const dataToSend = {
        ...formData,
        monto: parseFloat(formData.monto),
        id_persona: formData.id_persona || null
      };

      if (editingTransaccion) {
        await finanzasApi.actualizar(editingTransaccion.ID_TRANSACCION, dataToSend);
      } else {
        await finanzasApi.crear(dataToSend);
      }

      await cargarTransacciones();
      await cargarResumenFinanciero();
      cerrarModal();
    } catch (err) {
      console.error("Error al guardar transacción:", err);
      setError("Error al guardar: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const eliminarTransaccion = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta transacción?")) return;

    try {
      setLoading(true);
      await finanzasApi.eliminar(id);
      await cargarTransacciones();
      await cargarResumenFinanciero();
    } catch (err) {
      console.error("Error al eliminar transacción:", err);
      setError("Error al eliminar: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (transaccion = null) => {
    setEditingTransaccion(transaccion);
    if (transaccion) {
      setFormData({
        tipo: transaccion.TIPO || "INGRESO",
        monto: transaccion.MONTO || "",
        descripcion: transaccion.DESCRIPCION || "",
        id_persona: transaccion.ID_PERSONA || ""
      });
    } else {
      setFormData({
        tipo: "INGRESO",
        monto: "",
        descripcion: "",
        id_persona: ""
      });
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingTransaccion(null);
    setError("");
  };

  const handleFiltroChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const formatearMoneda = (monto) => {
    if (!monto) return "—";
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && transacciones.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando transacciones...</p>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-title">
          <h2>💰 Gestión Financiera</h2>
          <p>Control de ingresos y gastos de la empresa</p>
        </div>
        <button onClick={() => abrirModal()} className="btn btn-primary">
          ➕ Nueva Transacción
        </button>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Resumen Financiero */}
      {resumenFinanciero && (
        <div className="financial-summary">
          <h3>📊 Resumen del Mes</h3>
          <div className="summary-grid">
            <div className="summary-card ingresos">
              <div className="summary-icon">💰</div>
              <div className="summary-content">
                <div className="summary-label">Ingresos</div>
                <div className="summary-value">{formatearMoneda(resumenFinanciero.resumen?.TOTAL_INGRESOS)}</div>
              </div>
            </div>
            <div className="summary-card gastos">
              <div className="summary-icon">💸</div>
              <div className="summary-content">
                <div className="summary-label">Gastos</div>
                <div className="summary-value">{formatearMoneda(resumenFinanciero.resumen?.TOTAL_GASTOS)}</div>
              </div>
            </div>
            <div className={`summary-card balance ${resumenFinanciero.resumen?.BALANCE >= 0 ? 'positive' : 'negative'}`}>
              <div className="summary-icon">{resumenFinanciero.resumen?.BALANCE >= 0 ? '📈' : '📉'}</div>
              <div className="summary-content">
                <div className="summary-label">Balance</div>
                <div className="summary-value">{formatearMoneda(resumenFinanciero.resumen?.BALANCE)}</div>
              </div>
            </div>
            <div className="summary-card transacciones">
              <div className="summary-icon">📋</div>
              <div className="summary-content">
                <div className="summary-label">Transacciones</div>
                <div className="summary-value">{resumenFinanciero.resumen?.TOTAL_TRANSACCIONES || 0}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{statistics.total}</div>
            <div className="stat-label">Total Transacciones</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatearMoneda(statistics.ingresos)}</div>
            <div className="stat-label">Ingresos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatearMoneda(statistics.gastos)}</div>
            <div className="stat-label">Gastos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatearMoneda(statistics.balance)}</div>
            <div className="stat-label">Balance</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>🔍 Buscar:</label>
            <input
              type="text"
              value={filtros.search}
              onChange={(e) => handleFiltroChange("search", e.target.value)}
              placeholder="Descripción o persona..."
            />
          </div>
          <div className="filter-group">
            <label>💰 Tipo:</label>
            <select
              value={filtros.tipo}
              onChange={(e) => handleFiltroChange("tipo", e.target.value)}
            >
              <option value="">Todos</option>
              <option value="INGRESO">Ingresos</option>
              <option value="GASTO">Gastos</option>
            </select>
          </div>
          <div className="filter-group">
            <label>📅 Desde:</label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => handleFiltroChange("fechaDesde", e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>📅 Hasta:</label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => handleFiltroChange("fechaHasta", e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>📊 Ordenar por:</label>
            <select
              value={filtros.sortBy}
              onChange={(e) => handleFiltroChange("sortBy", e.target.value)}
            >
              <option value="fecha">Fecha</option>
              <option value="monto">Monto</option>
              <option value="tipo">Tipo</option>
            </select>
          </div>
          <div className="filter-group">
            <label>🔄 Orden:</label>
            <select
              value={filtros.sortOrder}
              onChange={(e) => handleFiltroChange("sortOrder", e.target.value)}
            >
              <option value="ASC">Ascendente</option>
              <option value="DESC">Descendente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Descripción</th>
              <th>Persona</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transacciones.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-message">
                  {loading ? "Cargando..." : "No hay transacciones para mostrar"}
                </td>
              </tr>
            ) : (
              transacciones.map((transaccion) => (
                <tr key={transaccion.ID_TRANSACCION}>
                  <td>{transaccion.ID_TRANSACCION}</td>
                  <td>{formatearFecha(transaccion.FECHA)}</td>
                  <td>
                    <span className={`badge badge-${transaccion.TIPO === 'INGRESO' ? 'success' : 'danger'}`}>
                      {transaccion.TIPO === 'INGRESO' ? '💰' : '💸'} {transaccion.TIPO}
                    </span>
                  </td>
                  <td className={`amount-cell ${transaccion.TIPO === 'INGRESO' ? 'positive' : 'negative'}`}>
                    {formatearMoneda(transaccion.MONTO)}
                  </td>
                  <td className="description-cell">
                    {transaccion.DESCRIPCION}
                  </td>
                  <td>{transaccion.PERSONA_NOMBRE || "—"}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => abrirModal(transaccion)}
                      className="btn btn-sm btn-secondary"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => eliminarTransaccion(transaccion.ID_TRANSACCION)}
                      className="btn btn-sm btn-danger"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTransaccion ? "✏️ Editar Transacción" : "➕ Nueva Transacción"}</h3>
              <button onClick={cerrarModal} className="modal-close">✖️</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    required
                  >
                    <option value="INGRESO">💰 Ingreso</option>
                    <option value="GASTO">💸 Gasto</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Monto (COP) *</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.monto}
                    onChange={(e) => setFormData({...formData, monto: e.target.value})}
                    placeholder="100000"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción *</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción de la transacción..."
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label>Persona Asociada</label>
                <select
                  value={formData.id_persona}
                  onChange={(e) => setFormData({...formData, id_persona: e.target.value})}
                >
                  <option value="">Sin asociar</option>
                  {personas.map(persona => (
                    <option key={persona.ID_PERSONA} value={persona.ID_PERSONA}>
                      {persona.NOMBRE} ({persona.TIPO})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={cerrarModal} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Guardando..." : editingTransaccion ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}