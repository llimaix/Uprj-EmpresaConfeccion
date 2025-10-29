import axios from "axios";

// Usar backend local para desarrollo
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// ✅ PRODUCTOS
export const productosApi = {
  listar: (params = {}) => api.get("/productos", { params }),
  crear: (data) => api.post("/productos", data),
  actualizar: (id, data) => api.put(`/productos/${id}`, data),
  eliminar: (id) => api.delete(`/productos/${id}`),
};

// ✅ INVENTARIO
export const inventarioApi = {
  listar: (params = {}) => api.get("/inventario", { params }),
  movimiento: (data) => api.post("/mov", data),
};

// ✅ ÓRDENES
export const ordenesApi = {
  listar: (params = {}) => api.get("/ordenes", { params }),
  crear: (data) => api.post("/ordenes", data),
  actualizar: (id, data) => api.put(`/ordenes/${id}`, data),
  obtenerDetalle: (id) => api.get(`/ordenes/${id}`),
};

// ✅ REPORTES
export const reportesApi = {
  dashboard: () => api.get("/reportes"),
  instalaciones: () => api.get("/reportes/instalaciones"),
  tiposProductos: () => api.get("/reportes/tipos-productos"),
};

// ✅ PERSONAS (Clientes/Proveedores)
export const personasApi = {
  listar: (params = {}) => api.get("/personas", { params }),
  crear: (data) => api.post("/personas", data),
  actualizar: (id, data) => api.put(`/personas/${id}`, data),
  eliminar: (id) => api.delete(`/personas/${id}`),
  obtenerPorId: (id) => api.get(`/personas/${id}`),
  obtenerTipos: () => api.get("/personas/tipos"),
};

// ✅ EMPLEADOS
export const empleadosApi = {
  listar: (params = {}) => api.get("/empleados", { params }),
  crear: (data) => api.post("/empleados", data),
  actualizar: (id, data) => api.put(`/empleados/${id}`, data),
  eliminar: (id) => api.delete(`/empleados/${id}`),
  obtenerPorId: (id) => api.get(`/empleados/${id}`),
  estadisticas: () => api.get("/empleados/estadisticas"),
};

// ✅ INSTALACIONES
export const instalacionesApi = {
  listar: (params = {}) => api.get("/instalaciones", { params }),
  crear: (data) => api.post("/instalaciones", data),
  actualizar: (id, data) => api.put(`/instalaciones/${id}`, data),
  eliminar: (id) => api.delete(`/instalaciones/${id}`),
  obtenerPorId: (id) => api.get(`/instalaciones/${id}`),
  obtenerTipos: () => api.get("/instalaciones/tipos"),
  estadisticas: () => api.get("/instalaciones/estadisticas"),
};

// ✅ FINANZAS
export const finanzasApi = {
  listar: (params = {}) => api.get("/finanzas", { params }),
  crear: (data) => api.post("/finanzas", data),
  actualizar: (id, data) => api.put(`/finanzas/${id}`, data),
  eliminar: (id) => api.delete(`/finanzas/${id}`),
  obtenerPorId: (id) => api.get(`/finanzas/${id}`),
  resumen: (params = {}) => api.get("/finanzas/resumen", { params }),
  obtenerTipos: () => api.get("/finanzas/tipos"),
};

// ✅ SALUD
export const healthApi = {
  check: () => api.get("/health"),
};


