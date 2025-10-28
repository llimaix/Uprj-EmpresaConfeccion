import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function ProductosCRUD() {
  const [productos, setProductos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/productos");
      setProductos(data.rows || []);
    } catch (e) {
      console.error(e);
      alert("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const guardar = async () => {
    if (!nombre.trim() || !tipo.trim()) {
      alert("Todos los campos son requeridos");
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        // actualizar
        await api.put(`/productos/${editId}`, { nombre: nombre.trim(), tipo: tipo.trim() });
        alert("✅ Producto actualizado exitosamente");
      } else {
        // crear
        await api.post("/productos", { nombre: nombre.trim(), tipo: tipo.trim() });
        alert("✅ Producto creado exitosamente");
      }
      setNombre("");
      setTipo("");
      setEditId(null);
      await cargar();
    } catch (e) {
      console.error(e);
      alert("Error al guardar producto. Verifique que no exista un producto con el mismo nombre.");
    } finally {
      setSubmitting(false);
    }
  };

  const eliminar = async (id, nombreProducto) => {
    if (showDeleteConfirm !== id) {
      setShowDeleteConfirm(id);
      return;
    }

    try {
      await api.delete(`/productos/${id}`);
      alert(`✅ Producto "${nombreProducto}" eliminado exitosamente`);
      setShowDeleteConfirm(null);
      await cargar();
    } catch (e) {
      console.error(e);
      alert("Error al eliminar producto. Puede que esté siendo utilizado en inventario u órdenes.");
    }
  };

  const editar = (p) => {
    setEditId(p.ID_PRODUCTO);
    setNombre(p.NOMBRE);
    setTipo(p.TIPO);
    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setNombre("");
    setTipo("");
  };

  // Filtrar productos
  const filteredProductos = productos.filter(producto => {
    const matchesSearch = 
      producto.NOMBRE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.TIPO?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = !filterTipo || producto.TIPO === filterTipo;
    
    return matchesSearch && matchesTipo;
  });

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProductos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);

  // Tipos únicos para el filtro
  const tiposUnicos = [...new Set(productos.map(p => p.TIPO).filter(Boolean))];

  // Estadísticas
  const stats = {
    total: productos.length,
    tipos: tiposUnicos.length,
  };

  useEffect(() => {
    cargar();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header con estadísticas */}
      <div className="card">
        <h2>📦 Gestión de Productos</h2>
        <p className="subtitle">Administración completa del catálogo de productos</p>
        
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '1rem' }}>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <div className="kpi-icon">📦</div>
            <div className="kpi-content">
              <h3>{stats.total}</h3>
              <p>Productos Totales</p>
            </div>
          </div>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            <div className="kpi-icon">🏷️</div>
            <div className="kpi-content">
              <h3>{stats.tipos}</h3>
              <p>Tipos Diferentes</p>
            </div>
          </div>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <div className="kpi-icon">✅</div>
            <div className="kpi-content">
              <h3>{filteredProductos.length}</h3>
              <p>Resultados Filtrados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="card">
        <h3>{editId ? "✏️ Editar Producto" : "➕ Nuevo Producto"}</h3>
        
        <div className="d-flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: '2', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              🏷️ Nombre del Producto
            </label>
            <input
              placeholder="Ej: Camiseta básica"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{ width: '100%' }}
              maxLength={100}
            />
          </div>
          
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              📂 Tipo/Categoría
            </label>
            <input
              placeholder="Ej: Camisetas, Pantalones"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={{ width: '100%' }}
              maxLength={50}
            />
          </div>
        </div>

        <div className="d-flex gap-2">
          <button 
            onClick={guardar}
            disabled={submitting || !nombre.trim() || !tipo.trim()}
            style={{
              background: submitting ? '#9ca3af' : editId ? '#f59e0b' : '#10b981',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? '⏳ Guardando...' : editId ? "✅ Actualizar" : "➕ Agregar"}
          </button>
          
          {editId && (
            <button onClick={cancelarEdicion} style={{ background: '#6b7280' }}>
              ❌ Cancelar
            </button>
          )}
          
          <button 
            onClick={() => {
              setNombre("");
              setTipo("");
            }}
            style={{ background: '#6b7280' }}
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card">
        <h3>🔍 Filtros y Búsqueda</h3>
        
        <div className="d-flex gap-4 mb-4" style={{ flexWrap: 'wrap', alignItems: 'end' }}>
          <div style={{ flex: '2', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              🔍 Buscar
            </label>
            <input
              placeholder="Buscar por nombre o tipo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              📂 Filtrar por tipo
            </label>
            <select
              value={filterTipo}
              onChange={(e) => {
                setFilterTipo(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%' }}
            >
              <option value="">Todos los tipos</option>
              {tiposUnicos.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => {
              setSearchTerm("");
              setFilterTipo("");
              setCurrentPage(1);
            }}
            style={{ background: '#6b7280' }}
          >
            🗑️ Limpiar filtros
          </button>
        </div>
        
        <p className="text-muted">
          Mostrando {currentItems.length} de {filteredProductos.length} productos
        </p>
      </div>

      {/* Tabla */}
      <div className="card">
        <h3>📋 Lista de Productos</h3>
        
        {!currentItems.length ? (
          <div className="text-center" style={{ padding: '2rem' }}>
            <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>📦</p>
            <p>No se encontraron productos</p>
            {(searchTerm || filterTipo) && (
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setFilterTipo("");
                  setCurrentPage(1);
                }}
                style={{ marginTop: '1rem' }}
              >
                🗑️ Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((p) => (
                    <tr key={p.ID_PRODUCTO}>
                      <td>
                        <strong>#{p.ID_PRODUCTO}</strong>
                      </td>
                      <td>
                        <div>
                          <strong>{p.NOMBRE}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="status status-good">
                          {p.TIPO}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button 
                            onClick={() => editar(p)}
                            style={{ 
                              background: '#f59e0b',
                              padding: '0.5rem 1rem',
                              fontSize: '0.875rem'
                            }}
                            title="Editar producto"
                          >
                            ✏️ Editar
                          </button>
                          
                          <button 
                            onClick={() => eliminar(p.ID_PRODUCTO, p.NOMBRE)}
                            style={{ 
                              background: showDeleteConfirm === p.ID_PRODUCTO ? '#ef4444' : '#6b7280',
                              padding: '0.5rem 1rem',
                              fontSize: '0.875rem'
                            }}
                            title={showDeleteConfirm === p.ID_PRODUCTO ? "Confirmar eliminación" : "Eliminar producto"}
                          >
                            {showDeleteConfirm === p.ID_PRODUCTO ? "⚠️ Confirmar" : "🗑️ Eliminar"}
                          </button>
                          
                          {showDeleteConfirm === p.ID_PRODUCTO && (
                            <button 
                              onClick={() => setShowDeleteConfirm(null)}
                              style={{ 
                                background: '#6b7280',
                                padding: '0.5rem 1rem',
                                fontSize: '0.875rem'
                              }}
                            >
                              ❌ Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '0.5rem', 
                marginTop: '1rem',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ 
                    background: currentPage === 1 ? '#9ca3af' : '#6b7280',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ⬅️ Anterior
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      background: currentPage === page ? '#3b82f6' : '#e5e7eb',
                      color: currentPage === page ? 'white' : '#374151'
                    }}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ 
                    background: currentPage === totalPages ? '#9ca3af' : '#6b7280',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Siguiente ➡️
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
