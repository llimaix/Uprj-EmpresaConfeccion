import { useEffect, useState } from "react";
import { api } from "../api.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportesView() {
  const [inventario, setInventario] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalInventario: 0,
    ordenesActivas: 0,
    valorInventario: 0
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, ordRes, prodRes] = await Promise.all([
        api.get("/inventario"),
        api.get("/ordenes"),
        api.get("/productos")
      ]);

      const invData = invRes.data.rows || [];
      const ordData = ordRes.data.rows || [];
      const prodData = prodRes.data.rows || [];

      setInventario(invData);
      setOrdenes(ordData);
      setProductos(prodData);

      // Calcular estadísticas
      const totalInventario = invData.reduce((sum, item) => sum + (item.CANTIDAD || 0), 0);
      const ordenesActivas = ordData.filter(o => 
        (o.ESTADO || o.estado) === 'PENDIENTE' || (o.ESTADO || o.estado) === 'APROBADA'
      ).length;

      setStats({
        totalProductos: prodData.length,
        totalInventario,
        ordenesActivas,
        valorInventario: totalInventario * 150 // Precio promedio estimado
      });

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Preparar datos para gráficos
  const inventarioPorInstalacion = inventario.reduce((acc, item) => {
    const instalacion = item.INSTALACION || 'Sin instalación';
    acc[instalacion] = (acc[instalacion] || 0) + (item.CANTIDAD || 0);
    return acc;
  }, {});

  const chartInventario = Object.entries(inventarioPorInstalacion).map(([name, value]) => ({
    name,
    cantidad: value
  }));

  const ordenesEstado = ordenes.reduce((acc, orden) => {
    const estado = orden.ESTADO || orden.estado || 'PENDIENTE';
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, {});

  const chartOrdenes = Object.entries(ordenesEstado).map(([name, value]) => ({
    name,
    value
  }));

  const productosTipo = productos.reduce((acc, producto) => {
    const tipo = producto.TIPO || 'Sin tipo';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  const chartProductos = Object.entries(productosTipo).map(([name, cantidad]) => ({
    name,
    cantidad
  }));

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>📊 Dashboard de Reportes</h2>
        <p className="subtitle">Vista general del sistema de confección</p>
      </div>

      {/* KPIs Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">📦</div>
          <div className="kpi-content">
            <h3>{stats.totalProductos}</h3>
            <p>Productos Registrados</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🏭</div>
          <div className="kpi-content">
            <h3>{stats.totalInventario.toLocaleString()}</h3>
            <p>Unidades en Inventario</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📋</div>
          <div className="kpi-content">
            <h3>{stats.ordenesActivas}</h3>
            <p>Órdenes Activas</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <h3>${stats.valorInventario.toLocaleString()}</h3>
            <p>Valor Estimado</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Inventario por Instalación */}
        <div className="card chart-card">
          <h3>🏢 Inventario por Instalación</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartInventario}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Estados de Órdenes */}
        <div className="card chart-card">
          <h3>📊 Estado de Órdenes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartOrdenes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartOrdenes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Productos por Tipo */}
        <div className="card chart-card">
          <h3>🧵 Productos por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartProductos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla de Resumen */}
        <div className="card chart-card">
          <h3>📈 Resumen por Instalación</h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Instalación</th>
                  <th>Cantidad</th>
                  <th>% del Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {chartInventario.map((item, index) => {
                  const percentage = stats.totalInventario > 0 ? ((item.cantidad / stats.totalInventario) * 100).toFixed(1) : '0';
                  return (
                    <tr key={index}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>{item.cantidad.toLocaleString()}</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="progress-text">{percentage}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status ${item.cantidad > 100 ? 'status-good' : item.cantidad > 50 ? 'status-warning' : 'status-danger'}`}>
                          {item.cantidad > 100 ? 'Óptimo' : item.cantidad > 50 ? 'Medio' : 'Bajo'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="card text-center">
        <button onClick={loadData} className="refresh-btn">
          🔄 Actualizar Datos
        </button>
        <p className="text-muted">Última actualización: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
