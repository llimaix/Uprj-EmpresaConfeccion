import { useState, useEffect } from "react";
import { personasApi } from "../api.js";

export default function PersonasView() {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPersona, setEditingPersona] = useState(null);
  const [statistics, setStatistics] = useState(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    search: "",
    tipo: "",
    sortBy: "nombre",
    sortOrder: "ASC"
  });

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    email: "",
    tipo: "CLIENTE"
  });

  const tiposPersona = ["CLIENTE", "PROVEEDOR", "EMPLEADO"];

  useEffect(() => {
    cargarPersonas();
  }, [filtros]);

  const cargarPersonas = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await personasApi.listar(filtros);
      
      if (response.data?.data?.rows) {
        setPersonas(response.data.data.rows);
        setStatistics(response.data.data.statistics);
      } else {
        setPersonas(response.data?.rows || []);
      }
    } catch (err) {
      console.error("Error al cargar personas:", err);
      setError("Error al cargar personas: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (editingPersona) {
        await personasApi.actualizar(editingPersona.ID_PERSONA, formData);
      } else {
        await personasApi.crear(formData);
      }

      await cargarPersonas();
      cerrarModal();
    } catch (err) {
      console.error("Error al guardar persona:", err);
      setError("Error al guardar: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const eliminarPersona = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta persona?")) return;

    try {
      setLoading(true);
      await personasApi.eliminar(id);
      await cargarPersonas();
    } catch (err) {
      console.error("Error al eliminar persona:", err);
      setError("Error al eliminar: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (persona = null) => {
    setEditingPersona(persona);
    if (persona) {
      setFormData({
        nombre: persona.NOMBRE || "",
        telefono: persona.TELEFONO || "",
        email: persona.EMAIL || "",
        tipo: persona.TIPO || "CLIENTE"
      });
    } else {
      setFormData({
        nombre: "",
        telefono: "",
        email: "",
        tipo: "CLIENTE"
      });
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingPersona(null);
    setError("");
  };

  const handleFiltroChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const formatearTelefono = (telefono) => {
    if (!telefono) return "—";
    return telefono.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
  };

  if (loading && personas.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando personas...</p>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-title">
          <h2>👥 Gestión de Personas</h2>
          <p>Administra clientes, proveedores y contactos</p>
        </div>
        <button onClick={() => abrirModal()} className="btn btn-primary">
          ➕ Nueva Persona
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
            <div className="stat-value">{statistics.total}</div>
            <div className="stat-label">Total Personas</div>
          </div>
          {Object.entries(statistics.porTipo || {}).map(([tipo, cantidad]) => (
            <div key={tipo} className="stat-card">
              <div className="stat-value">{cantidad}</div>
              <div className="stat-label">{tipo}</div>
            </div>
          ))}
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
              placeholder="Nombre o email..."
            />
          </div>
          <div className="filter-group">
            <label>👤 Tipo:</label>
            <select
              value={filtros.tipo}
              onChange={(e) => handleFiltroChange("tipo", e.target.value)}
            >
              <option value="">Todos</option>
              {tiposPersona.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>📊 Ordenar por:</label>
            <select
              value={filtros.sortBy}
              onChange={(e) => handleFiltroChange("sortBy", e.target.value)}
            >
              <option value="nombre">Nombre</option>
              <option value="tipo">Tipo</option>
              <option value="email">Email</option>
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
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {personas.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-message">
                  {loading ? "Cargando..." : "No hay personas para mostrar"}
                </td>
              </tr>
            ) : (
              personas.map((persona) => (
                <tr key={persona.ID_PERSONA}>
                  <td>{persona.ID_PERSONA}</td>
                  <td className="person-name">
                    <strong>{persona.NOMBRE}</strong>
                  </td>
                  <td>{formatearTelefono(persona.TELEFONO)}</td>
                  <td>{persona.EMAIL || "—"}</td>
                  <td>
                    <span className={`badge badge-${persona.TIPO?.toLowerCase()}`}>
                      {persona.TIPO}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => abrirModal(persona)}
                      className="btn btn-sm btn-secondary"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => eliminarPersona(persona.ID_PERSONA)}
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
              <h3>{editingPersona ? "✏️ Editar Persona" : "➕ Nueva Persona"}</h3>
              <button onClick={cerrarModal} className="modal-close">✖️</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    placeholder="123-456-7890"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  required
                >
                  {tiposPersona.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={cerrarModal} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Guardando..." : editingPersona ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}