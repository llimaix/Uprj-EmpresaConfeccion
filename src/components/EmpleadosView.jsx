import { useState, useEffect } from "react";
import { empleadosApi, instalacionesApi } from "../api.js";

export default function EmpleadosView() {
  const [empleados, setEmpleados] = useState([]);
  const [instalaciones, setInstalaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [statistics, setStatistics] = useState(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    search: "",
    instalacion: "",
    sortBy: "nombre",
    sortOrder: "ASC"
  });

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    email: "",
    cargo: "",
    salario: "",
    id_instalacion: ""
  });

  useEffect(() => {
    cargarEmpleados();
    cargarInstalaciones();
  }, [filtros]);

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await empleadosApi.listar(filtros);
      
      if (response.data?.data?.rows) {
        setEmpleados(response.data.data.rows);
        setStatistics(response.data.data.statistics);
      } else {
        setEmpleados(response.data?.rows || []);
      }
    } catch (err) {
      console.error("Error al cargar empleados:", err);
      setError("Error al cargar empleados: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const cargarInstalaciones = async () => {
    try {
      const response = await instalacionesApi.listar();
      setInstalaciones(response.data?.data?.rows || response.data?.rows || []);
    } catch (err) {
      console.error("Error al cargar instalaciones:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.cargo.trim() || !formData.salario) {
      setError("Nombre, cargo y salario son requeridos");
      return;
    }

    if (formData.salario <= 0) {
      setError("El salario debe ser mayor a 0");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const dataToSend = {
        ...formData,
        salario: parseFloat(formData.salario),
        id_instalacion: formData.id_instalacion || null
      };

      if (editingEmpleado) {
        await empleadosApi.actualizar(editingEmpleado.ID_EMPLEADO, dataToSend);
      } else {
        await empleadosApi.crear(dataToSend);
      }

      await cargarEmpleados();
      cerrarModal();
    } catch (err) {
      console.error("Error al guardar empleado:", err);
      setError("Error al guardar: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const eliminarEmpleado = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este empleado? Esto también eliminará su registro de persona.")) return;

    try {
      setLoading(true);
      await empleadosApi.eliminar(id);
      await cargarEmpleados();
    } catch (err) {
      console.error("Error al eliminar empleado:", err);
      setError("Error al eliminar: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (empleado = null) => {
    setEditingEmpleado(empleado);
    if (empleado) {
      setFormData({
        nombre: empleado.NOMBRE || "",
        telefono: empleado.TELEFONO || "",
        email: empleado.EMAIL || "",
        cargo: empleado.CARGO || "",
        salario: empleado.SALARIO || "",
        id_instalacion: empleado.ID_INSTALACION || ""
      });
    } else {
      setFormData({
        nombre: "",
        telefono: "",
        email: "",
        cargo: "",
        salario: "",
        id_instalacion: ""
      });
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingEmpleado(null);
    setError("");
  };

  const handleFiltroChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const formatearSalario = (salario) => {
    if (!salario) return "—";
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(salario);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString('es-CO');
  };

  if (loading && empleados.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando empleados...</p>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-title">
          <h2>👨‍💼 Gestión de Empleados</h2>
          <p>Administra el personal de la empresa</p>
        </div>
        <button onClick={() => abrirModal()} className="btn btn-primary">
          ➕ Nuevo Empleado
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
            <div className="stat-value">{statistics.totalEmpleados}</div>
            <div className="stat-label">Total Empleados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatearSalario(statistics.salarioPromedio)}</div>
            <div className="stat-label">Salario Promedio</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{statistics.instalacionesRepresentadas}</div>
            <div className="stat-label">Instalaciones</div>
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
              placeholder="Nombre o cargo..."
            />
          </div>
          <div className="filter-group">
            <label>🏢 Instalación:</label>
            <select
              value={filtros.instalacion}
              onChange={(e) => handleFiltroChange("instalacion", e.target.value)}
            >
              <option value="">Todas</option>
              {instalaciones.map(inst => (
                <option key={inst.ID_INSTALACION} value={inst.ID_INSTALACION}>
                  {inst.NOMBRE}
                </option>
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
              <option value="cargo">Cargo</option>
              <option value="salario">Salario</option>
              <option value="fecha_contratacion">Fecha Contratación</option>
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
              <th>Cargo</th>
              <th>Salario</th>
              <th>Instalación</th>
              <th>Fecha Contratación</th>
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-message">
                  {loading ? "Cargando..." : "No hay empleados para mostrar"}
                </td>
              </tr>
            ) : (
              empleados.map((empleado) => (
                <tr key={empleado.ID_EMPLEADO}>
                  <td>{empleado.ID_EMPLEADO}</td>
                  <td className="employee-name">
                    <strong>{empleado.NOMBRE}</strong>
                  </td>
                  <td>
                    <span className="badge badge-secondary">
                      {empleado.CARGO}
                    </span>
                  </td>
                  <td className="salary-cell">
                    {formatearSalario(empleado.SALARIO)}
                  </td>
                  <td>{empleado.INSTALACION || "—"}</td>
                  <td>{formatearFecha(empleado.FECHA_CONTRATACION)}</td>
                  <td className="contact-cell">
                    <div>{empleado.TELEFONO || "—"}</div>
                    <small>{empleado.EMAIL || "—"}</small>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => abrirModal(empleado)}
                      className="btn btn-sm btn-secondary"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => eliminarEmpleado(empleado.ID_EMPLEADO)}
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
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEmpleado ? "✏️ Editar Empleado" : "➕ Nuevo Empleado"}</h3>
              <button onClick={cerrarModal} className="modal-close">✖️</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Nombre completo del empleado"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Cargo *</label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                    placeholder="Cargo o posición"
                    required
                  />
                </div>
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
                    placeholder="empleado@empresa.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Salario (COP) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.salario}
                    onChange={(e) => setFormData({...formData, salario: e.target.value})}
                    placeholder="2500000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Instalación</label>
                  <select
                    value={formData.id_instalacion}
                    onChange={(e) => setFormData({...formData, id_instalacion: e.target.value})}
                  >
                    <option value="">Sin asignar</option>
                    {instalaciones.map(inst => (
                      <option key={inst.ID_INSTALACION} value={inst.ID_INSTALACION}>
                        {inst.NOMBRE}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={cerrarModal} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Guardando..." : editingEmpleado ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}