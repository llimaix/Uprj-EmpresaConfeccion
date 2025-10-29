import { useState, useEffect } from "react";
import { instalacionesApi } from "../api.js";

export default function InstalacionesView() {
  const [instalaciones, setInstalaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingInstalacion, setEditingInstalacion] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [selectedInstalacion, setSelectedInstalacion] = useState(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    search: "",
    sortBy: "nombre",
    sortOrder: "ASC"
  });

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    ubicacion: "",
    tipo: ""
  });

  useEffect(() => {
    cargarInstalaciones();
  }, [filtros]);

  const cargarInstalaciones = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await instalacionesApi.listar(filtros);
      
      if (response.data?.data?.rows) {
        setInstalaciones(response.data.data.rows);
        setStatistics(response.data.data.statistics);
      } else {
        setInstalaciones(response.data?.rows || []);
      }
    } catch (err) {
      console.error("Error al cargar instalaciones:", err);
      setError("Error al cargar instalaciones: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const verDetalles = async (instalacion) => {
    try {
      setLoading(true);
      const response = await instalacionesApi.obtenerPorId(instalacion.ID_INSTALACION);
      setSelectedInstalacion(response.data?.data?.instalacion || response.data?.instalacion);
    } catch (err) {
      console.error("Error al cargar detalles:", err);
      setError("Error al cargar detalles: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.ubicacion.trim()) {
      setError("Nombre y ubicación son requeridos");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (editingInstalacion) {
        await instalacionesApi.actualizar(editingInstalacion.ID_INSTALACION, formData);
      } else {
        await instalacionesApi.crear(formData);
      }

      await cargarInstalaciones();
      cerrarModal();
    } catch (err) {
      console.error("Error al guardar instalación:", err);
      setError("Error al guardar: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const eliminarInstalacion = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta instalación?")) return;

    try {
      setLoading(true);
      await instalacionesApi.eliminar(id);
      await cargarInstalaciones();
    } catch (err) {
      console.error("Error al eliminar instalación:", err);
      setError("Error al eliminar: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (instalacion = null) => {
    setEditingInstalacion(instalacion);
    if (instalacion) {
      setFormData({
        nombre: instalacion.NOMBRE || "",
        ubicacion: instalacion.UBICACION || "",
        tipo: instalacion.TIPO || ""
      });
    } else {
      setFormData({
        nombre: "",
        ubicacion: "",
        tipo: ""
      });
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingInstalacion(null);
    setError("");
  };

  const handleFiltroChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  if (loading && instalaciones.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando instalaciones...</p>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-title">
          <h2>🏢 Gestión de Instalaciones</h2>
          <p>Administra las instalaciones de la empresa</p>
        </div>
        <button onClick={() => abrirModal()} className="btn btn-primary">
          ➕ Nueva Instalación
        </button>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Estadísticas */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{statistics.totalInstalaciones}</div>
            <div className="stat-label">Total Instalaciones</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{statistics.totalEmpleados}</div>
            <div className="stat-label">Total Empleados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{statistics.totalInventarios}</div>
            <div className="stat-label">Items Inventario</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{statistics.tiposUnicos}</div>
            <div className="stat-label">Tipos Únicos</div>
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
              placeholder="Nombre, ubicación o tipo..."
            />
          </div>
          <div className="filter-group">
            <label>📊 Ordenar por:</label>
            <select
              value={filtros.sortBy}
              onChange={(e) => handleFiltroChange("sortBy", e.target.value)}
            >
              <option value="nombre">Nombre</option>
              <option value="ubicacion">Ubicación</option>
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

      {/* Lista de tarjetas */}
      <div className="cards-grid">
        {instalaciones.length === 0 ? (
          <div className="empty-message">
            {loading ? "Cargando..." : "No hay instalaciones para mostrar"}
          </div>
        ) : (
          instalaciones.map((instalacion) => (
            <div key={instalacion.ID_INSTALACION} className="instalacion-card">
              <div className="card-header">
                <h3>{instalacion.NOMBRE}</h3>
                {instalacion.TIPO && (
                  <span className="badge badge-primary">{instalacion.TIPO}</span>
                )}
              </div>
              
              <div className="card-content">
                <div className="card-field">
                  <span className="field-label">📍 Ubicación:</span>
                  <span className="field-value">{instalacion.UBICACION}</span>
                </div>
                
                <div className="card-stats">
                  <div className="stat-item">
                    <span className="stat-number">{instalacion.EMPLEADOS_COUNT || 0}</span>
                    <span className="stat-label">Empleados</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{instalacion.INVENTARIOS_COUNT || 0}</span>
                    <span className="stat-label">Inventarios</span>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button
                  onClick={() => verDetalles(instalacion)}
                  className="btn btn-sm btn-info"
                  title="Ver detalles"
                >
                  👁️ Detalles
                </button>
                <button
                  onClick={() => abrirModal(instalacion)}
                  className="btn btn-sm btn-secondary"
                  title="Editar"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => eliminarInstalacion(instalacion.ID_INSTALACION)}
                  className="btn btn-sm btn-danger"
                  title="Eliminar"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Formulario */}
      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingInstalacion ? "✏️ Editar Instalación" : "➕ Nueva Instalación"}</h3>
              <button onClick={cerrarModal} className="modal-close">✖️</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Nombre de la instalación"
                  required
                />
              </div>

              <div className="form-group">
                <label>Ubicación *</label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                  placeholder="Dirección o ubicación física"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <input
                  type="text"
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  placeholder="Ej: Oficina, Almacén, Taller"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={cerrarModal} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Guardando..." : editingInstalacion ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {selectedInstalacion && (
        <div className="modal-overlay" onClick={() => setSelectedInstalacion(null)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏢 Detalles de Instalación</h3>
              <button onClick={() => setSelectedInstalacion(null)} className="modal-close">✖️</button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>Información General</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Nombre:</span>
                    <span className="detail-value">{selectedInstalacion.NOMBRE}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ubicación:</span>
                    <span className="detail-value">{selectedInstalacion.UBICACION}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Tipo:</span>
                    <span className="detail-value">{selectedInstalacion.TIPO || "No especificado"}</span>
                  </div>
                </div>
              </div>

              {selectedInstalacion.empleados && selectedInstalacion.empleados.length > 0 && (
                <div className="detail-section">
                  <h4>👨‍💼 Empleados ({selectedInstalacion.empleados.length})</h4>
                  <div className="detail-list">
                    {selectedInstalacion.empleados.map((empleado, index) => (
                      <div key={index} className="list-item">
                        <span className="item-name">{empleado.NOMBRE}</span>
                        <span className="item-meta">{empleado.CARGO}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedInstalacion.inventarios && selectedInstalacion.inventarios.length > 0 && (
                <div className="detail-section">
                  <h4>📦 Inventarios ({selectedInstalacion.inventarios.length})</h4>
                  <div className="detail-list">
                    {selectedInstalacion.inventarios.map((inventario, index) => (
                      <div key={index} className="list-item">
                        <span className="item-name">{inventario.PRODUCTO}</span>
                        <span className="item-meta">Cantidad: {inventario.CANTIDAD}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={() => setSelectedInstalacion(null)} className="btn btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}