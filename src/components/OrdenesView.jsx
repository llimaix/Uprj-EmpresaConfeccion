import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function OrdenesView() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [sortField, setSortField] = useState("ID_ORDEN");
  const [sortDirection, setSortDirection] = useState("desc");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/ordenes");
      setOrdenes(data.rows || []);
    } catch (error) {
      console.error("Error al cargar órdenes:", error);
      alert("Error al cargar órdenes");
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (id, nuevoEstado, cliente) => {
    try {
      await api.put(`/ordenes/${id}`, { estado: nuevoEstado });
      alert(`✅ Orden ${id} de ${cliente} cambiada a: ${nuevoEstado}`);
      await load();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert("Error al cambiar estado de la orden");
    }
  };

  // Filtrar órdenes
  const filteredOrdenes = ordenes.filter(orden => {
    const cliente = orden.CLIENTE || orden.cliente || '';
    const items = orden.ITEMS || orden.items || '';
    const estado = orden.ESTADO || orden.estado || '';
    
    const matchesSearch = 
      cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      items.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(orden.ID_ORDEN || orden.id_orden).includes(searchTerm);
    
    const matchesEstado = !filterEstado || estado === filterEstado;
    
    return matchesSearch && matchesEstado;
  });

  // Ordenar órdenes
  const sortedOrdenes = [...filteredOrdenes].sort((a, b) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '⬆️' : '⬇️';
  };

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'APROBADA':
        return { class: 'status-good', color: '#10b981' };
      case 'PENDIENTE':
        return { class: 'status-warning', color: '#f59e0b' };
      case 'CANCELADA':
        return { class: 'status-danger', color: '#ef4444' };
      default:
        return { class: 'status', color: '#6b7280' };
    }
  };

  // Estadísticas
  const stats = {
    total: ordenes.length,
    pendientes: ordenes.filter(o => (o.ESTADO || o.estado) === 'PENDIENTE').length,
    aprobadas: ordenes.filter(o => (o.ESTADO || o.estado) === 'APROBADA').length,
    canceladas: ordenes.filter(o => (o.ESTADO || o.estado) === 'CANCELADA').length,
  };

  // Estados únicos para el filtro
  const estadosUnicos = [...new Set(ordenes.map(o => o.ESTADO || o.estado).filter(Boolean))];

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header con estadísticas */}
      <div className="card">
        <h2>📋 Gestión de Órdenes</h2>
        <p className="subtitle">Control y seguimiento de órdenes de producción</p>
        
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '1rem' }}>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <div className="kpi-icon">📋</div>
            <div className="kpi-content">
              <h3>{stats.total}</h3>
              <p>Órdenes Totales</p>
            </div>
          </div>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <div className="kpi-icon">⏳</div>
            <div className="kpi-content">
              <h3>{stats.pendientes}</h3>
              <p>Pendientes</p>
            </div>
          </div>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <div className="kpi-icon">✅</div>
            <div className="kpi-content">
              <h3>{stats.aprobadas}</h3>
              <p>Aprobadas</p>
            </div>
          </div>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <div className="kpi-icon">❌</div>
            <div className="kpi-content">
              <h3>{stats.canceladas}</h3>
              <p>Canceladas</p>
            </div>
          </div>
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
              placeholder="Buscar por cliente, items o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              📊 Filtrar por estado
            </label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Todos los estados</option>
              {estadosUnicos.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => {
              setSearchTerm("");
              setFilterEstado("");
            }}
            style={{ background: '#6b7280' }}
          >
            🗑️ Limpiar filtros
          </button>
          
          <button onClick={load} style={{ background: '#10b981' }}>
            🔄 Actualizar
          </button>
        </div>
        
        <p className="text-muted">
          Mostrando {sortedOrdenes.length} de {ordenes.length} órdenes
        </p>
      </div>

      {/* Tabla de órdenes */}
      <div className="card">
        <h3>📊 Lista de Órdenes</h3>
        
        {!sortedOrdenes.length ? (
          <div className="text-center" style={{ padding: '2rem' }}>
            <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>📋</p>
            <p>No se encontraron órdenes</p>
            {(searchTerm || filterEstado) && (
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setFilterEstado("");
                }}
                style={{ marginTop: '1rem' }}
              >
                🗑️ Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th 
                    onClick={() => handleSort('ID_ORDEN')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    ID {getSortIcon('ID_ORDEN')}
                  </th>
                  <th 
                    onClick={() => handleSort('CLIENTE')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Cliente {getSortIcon('CLIENTE')}
                  </th>
                  <th 
                    onClick={() => handleSort('ESTADO')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Estado {getSortIcon('ESTADO')}
                  </th>
                  <th>Items</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrdenes.map((o) => {
                  const id = o.ID_ORDEN || o.id_orden;
                  const cliente = o.CLIENTE || o.cliente;
                  const estado = o.ESTADO || o.estado;
                  const items = o.ITEMS || o.items;
                  const estadoStyle = getEstadoStyle(estado);
                  
                  return (
                    <tr key={id}>
                      <td>
                        <strong>#{id}</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          👤 <strong>{cliente}</strong>
                        </div>
                      </td>
                      <td>
                        <span className={`status ${estadoStyle.class}`} style={{ color: estadoStyle.color }}>
                          {estado}
                        </span>
                      </td>
                      <td>
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {items}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-2" style={{ flexWrap: 'wrap' }}>
                          {estado !== 'APROBADA' && (
                            <button
                              onClick={() => cambiarEstado(id, 'APROBADA', cliente)}
                              style={{
                                background: '#10b981',
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.75rem'
                              }}
                              title="Aprobar orden"
                            >
                              ✅ Aprobar
                            </button>
                          )}
                          
                          {estado !== 'PENDIENTE' && (
                            <button
                              onClick={() => cambiarEstado(id, 'PENDIENTE', cliente)}
                              style={{
                                background: '#f59e0b',
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.75rem'
                              }}
                              title="Marcar como pendiente"
                            >
                              ⏳ Pendiente
                            </button>
                          )}
                          
                          {estado !== 'CANCELADA' && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Está seguro de cancelar la orden ${id} de ${cliente}?`)) {
                                  cambiarEstado(id, 'CANCELADA', cliente);
                                }
                              }}
                              style={{
                                background: '#ef4444',
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.75rem'
                              }}
                              title="Cancelar orden"
                            >
                              ❌ Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Resumen */}
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: 'var(--gray-50)', 
              borderRadius: 'var(--border-radius)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              textAlign: 'center'
            }}>
              <div>
                <strong style={{ color: '#3b82f6' }}>Total: {stats.total}</strong>
              </div>
              <div>
                <strong style={{ color: '#f59e0b' }}>Pendientes: {stats.pendientes}</strong>
              </div>
              <div>
                <strong style={{ color: '#10b981' }}>Aprobadas: {stats.aprobadas}</strong>
              </div>
              <div>
                <strong style={{ color: '#ef4444' }}>Canceladas: {stats.canceladas}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
