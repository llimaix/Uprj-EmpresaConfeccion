import { useEffect, useState } from "react";
import { api } from "../api.js";
import InventarioTable from "./InventarioTable";

export default function InventarioView() {
  const [inventario, setInventario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [instalaciones, setInstalaciones] = useState([]);
  const [idInstalacion, setIdInstalacion] = useState("");
  const [idProducto, setIdProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInstalacion, setFilterInstalacion] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  // 🔁 Carga los datos desde el backend
  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, prodRes] = await Promise.all([
        api.get("/inventario"),
        api.get("/productos")
      ]);

      const invData = invRes.data.rows || [];
      const prodData = prodRes.data.rows || [];
      
      setInventario(invData);
      setProductos(prodData);

      // Extraer instalaciones únicas
      const uniqueInstalaciones = [...new Set(invData.map(item => item.INSTALACION).filter(Boolean))];
      setInstalaciones(uniqueInstalaciones);

    } catch (err) {
      console.error("Error al cargar datos:", err);
      alert("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  // ➕ Registrar movimiento (entrada/salida)
  const registrar = async () => {
    if (!idInstalacion || !idProducto || !cantidad) {
      alert("Debe ingresar instalación, producto y cantidad");
      return;
    }

    if (isNaN(cantidad) || cantidad === "0") {
      alert("La cantidad debe ser un número válido diferente de cero");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/mov", {
        id_instalacion: idInstalacion,
        id_producto: idProducto,
        delta: Number(cantidad),
        motivo: motivo || `Movimiento ${Number(cantidad) > 0 ? 'entrada' : 'salida'}`,
      });

      // Limpiar campos
      setIdInstalacion("");
      setIdProducto("");
      setCantidad("");
      setMotivo("");

      // Recargar datos
      await loadData();
      
      // Mostrar confirmación
      const tipoMovimiento = Number(cantidad) > 0 ? 'Entrada' : 'Salida';
      alert(`✅ ${tipoMovimiento} registrada exitosamente`);

    } catch (err) {
      console.error("Error al registrar movimiento:", err);
      alert("Error al registrar movimiento. Verifique los datos e intente nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // 🔍 Filtrar inventario
  const filteredInventario = inventario.filter(item => {
    const matchesSearch = 
      item.PRODUCTO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.INSTALACION?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesInstalacion = !filterInstalacion || item.INSTALACION === filterInstalacion;
    
    const matchesLowStock = !showLowStock || (item.CANTIDAD || 0) < 50;
    
    return matchesSearch && matchesInstalacion && matchesLowStock;
  });

  // 📊 Estadísticas rápidas
  const stats = {
    totalItems: inventario.length,
    totalQuantity: inventario.reduce((sum, item) => sum + (item.CANTIDAD || 0), 0),
    lowStockItems: inventario.filter(item => (item.CANTIDAD || 0) < 50).length,
    uniqueProducts: new Set(inventario.map(item => item.PRODUCTO)).size
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header con estadísticas */}
      <div className="card">
        <h2>🏭 Gestión de Inventario</h2>
        <p className="subtitle">Control de stock y movimientos de productos</p>
        
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '1rem' }}>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <div className="kpi-icon">📦</div>
            <div className="kpi-content">
              <h3>{stats.totalItems}</h3>
              <p>Items en Inventario</p>
            </div>
          </div>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <div className="kpi-icon">📊</div>
            <div className="kpi-content">
              <h3>{stats.totalQuantity.toLocaleString()}</h3>
              <p>Unidades Totales</p>
            </div>
          </div>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <div className="kpi-icon">⚠️</div>
            <div className="kpi-content">
              <h3>{stats.lowStockItems}</h3>
              <p>Stock Bajo (&lt;50)</p>
            </div>
          </div>
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            <div className="kpi-icon">🧵</div>
            <div className="kpi-content">
              <h3>{stats.uniqueProducts}</h3>
              <p>Productos Únicos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de registro de movimientos */}
      <div className="card">
        <h3>➕ Registrar Movimiento</h3>
        
        <div className="d-flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              🏢 Instalación
            </label>
            <select
              value={idInstalacion}
              onChange={(e) => setIdInstalacion(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Seleccionar instalación...</option>
              {instalaciones.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              📦 Producto
            </label>
            <select
              value={idProducto}
              onChange={(e) => setIdProducto(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Seleccionar producto...</option>
              {productos.map(prod => (
                <option key={prod.ID_PRODUCTO} value={prod.ID_PRODUCTO}>
                  {prod.NOMBRE} ({prod.TIPO})
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              🔢 Cantidad (+/-)
            </label>
            <input
              type="number"
              placeholder="Ej: +100 o -50"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ flex: '2', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              📝 Motivo (opcional)
            </label>
            <input
              placeholder="Descripción del movimiento..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="d-flex gap-2">
          <button 
            onClick={registrar} 
            disabled={submitting || !idInstalacion || !idProducto || !cantidad}
            style={{ 
              background: submitting ? '#9ca3af' : '#10b981',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? '⏳ Procesando...' : '✅ Registrar Movimiento'}
          </button>
          
          <button 
            onClick={() => {
              setIdInstalacion("");
              setIdProducto("");
              setCantidad("");
              setMotivo("");
            }}
            style={{ background: '#6b7280' }}
          >
            🔄 Limpiar
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
              placeholder="Buscar por producto o instalación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              🏢 Filtrar por instalación
            </label>
            <select
              value={filterInstalacion}
              onChange={(e) => setFilterInstalacion(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Todas las instalaciones</option>
              {instalaciones.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="lowStock"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
            />
            <label htmlFor="lowStock" style={{ fontWeight: '500' }}>
              ⚠️ Solo stock bajo
            </label>
          </div>
          
          <button 
            onClick={() => {
              setSearchTerm("");
              setFilterInstalacion("");
              setShowLowStock(false);
            }}
            style={{ background: '#6b7280' }}
          >
            🗑️ Limpiar filtros
          </button>
        </div>
        
        <p className="text-muted">
          Mostrando {filteredInventario.length} de {inventario.length} elementos
        </p>
      </div>

      {/* Tabla de inventario */}
      <InventarioTable data={filteredInventario} onRefresh={loadData} />
    </div>
  );
}
