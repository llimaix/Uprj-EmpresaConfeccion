# 🚀 API Endpoints Completos - Sistema de Confección

## Base URL
```
http://localhost:3001
```

## 📊 Endpoints Disponibles

### 🏥 Salud del Sistema
- `GET /health` - Verificar estado del API

### 📦 Productos
- `GET /productos` - Listar productos con filtros
- `POST /productos` - Crear nuevo producto
- `PUT /productos/{id}` - Actualizar producto
- `DELETE /productos/{id}` - Eliminar producto

### 📋 Inventario
- `GET /inventario` - Listar inventario con filtros
- `POST /mov` - Registrar movimiento de inventario

### 📝 Órdenes de Compra
- `GET /ordenes` - Listar órdenes con filtros
- `POST /ordenes` - Crear nueva orden
- `PUT /ordenes/{id}` - Actualizar estado de orden
- `GET /ordenes/{id}` - Obtener detalles de orden específica

### 📈 Reportes y Dashboard
- `GET /reportes` - Dashboard con estadísticas generales
- `GET /reportes/instalaciones` - Reporte por instalaciones
- `GET /reportes/tipos-productos` - Reporte por tipos de productos

### 👥 Personas (Clientes/Proveedores)
- `GET /personas` - Listar personas con filtros
- `POST /personas` - Crear nueva persona
- `PUT /personas/{id}` - Actualizar persona
- `DELETE /personas/{id}` - Eliminar persona
- `GET /personas/{id}` - Obtener persona específica
- `GET /personas/tipos` - Obtener tipos de personas únicos

### 👨‍💼 Empleados
- `GET /empleados` - Listar empleados con filtros
- `POST /empleados` - Crear nuevo empleado
- `PUT /empleados/{id}` - Actualizar empleado
- `DELETE /empleados/{id}` - Eliminar empleado
- `GET /empleados/{id}` - Obtener empleado específico
- `GET /empleados/estadisticas` - Estadísticas de empleados

### 🏢 Instalaciones
- `GET /instalaciones` - Listar instalaciones
- `POST /instalaciones` - Crear nueva instalación
- `PUT /instalaciones/{id}` - Actualizar instalación
- `DELETE /instalaciones/{id}` - Eliminar instalación
- `GET /instalaciones/{id}` - Obtener instalación específica
- `GET /instalaciones/tipos` - Tipos de instalaciones
- `GET /instalaciones/estadisticas` - Estadísticas de instalaciones

### 💰 Finanzas (Transacciones)
- `GET /finanzas` - Listar transacciones financieras
- `POST /finanzas` - Crear nueva transacción
- `PUT /finanzas/{id}` - Actualizar transacción
- `DELETE /finanzas/{id}` - Eliminar transacción
- `GET /finanzas/{id}` - Obtener transacción específica
- `GET /finanzas/resumen` - Resumen financiero por período
- `GET /finanzas/tipos` - Tipos de transacciones

## 🔧 Parámetros de Query Comunes

### Filtros Generales
- `search=texto` - Búsqueda por texto
- `sortBy=campo` - Campo para ordenar
- `sortOrder=ASC|DESC` - Dirección del ordenamiento

### Filtros Específicos por Endpoint

#### Personas
- `tipo=CLIENTE|PROVEEDOR|EMPLEADO` - Filtrar por tipo

#### Empleados
- `instalacion=id` - Filtrar por instalación

#### Finanzas
- `tipo=INGRESO|GASTO` - Filtrar por tipo de transacción
- `fechaDesde=YYYY-MM-DD` - Fecha desde
- `fechaHasta=YYYY-MM-DD` - Fecha hasta
- `periodo=mes|trimestre|año` - Para resumen financiero

#### Órdenes
- `estado=PENDIENTE|APROBADA|CANCELADA|EN_PROCESO|COMPLETADA` - Filtrar por estado

## 📋 Ejemplos de Uso

### Crear un Cliente
```bash
curl -X POST http://localhost:3001/personas \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "telefono": "123456789",
    "email": "juan@email.com",
    "tipo": "CLIENTE"
  }'
```

### Crear un Empleado
```bash
curl -X POST http://localhost:3001/empleados \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María García",
    "telefono": "987654321",
    "email": "maria@empresa.com",
    "cargo": "Operario",
    "salario": 2500000,
    "id_instalacion": 1
  }'
```

### Crear una Transacción Financiera
```bash
curl -X POST http://localhost:3001/finanzas \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "INGRESO",
    "monto": 500000,
    "descripcion": "Venta de productos",
    "id_persona": 1
  }'
```

### Obtener Dashboard de Reportes
```bash
curl http://localhost:3001/reportes
```

### Listar Empleados con Filtros
```bash
curl "http://localhost:3001/empleados?search=maria&sortBy=salario&sortOrder=DESC"
```

## 📊 Estructura de Respuestas

### Respuesta Exitosa
```json
{
  "data": { /* datos solicitados */ },
  "success": true
}
```

### Respuesta con Error
```json
{
  "error": "Mensaje de error",
  "success": false
}
```

### Respuesta de Lista con Estadísticas
```json
{
  "data": {
    "rows": [/* array de elementos */],
    "statistics": {/* estadísticas calculadas */},
    "filters": {/* filtros aplicados */}
  },
  "success": true
}
```

## 🔐 Tablas Oracle Utilizadas
- `persona` - Información de personas (clientes, proveedores, empleados)
- `empleado` - Información específica de empleados
- `producto` - Catálogo de productos
- `inventario` - Stock de productos por instalación
- `orden_compra` - Órdenes de compra
- `detalle_orden_compra` - Detalles de órdenes
- `instalacion` - Instalaciones de la empresa
- `transaccion_financiera` - Transacciones financieras
- `auditoria` - Registro de auditoría (próximamente)

## 🎯 Estado del Proyecto
✅ **Endpoints Implementados:**
- Productos (CRUD completo)
- Inventario (listado y movimientos)
- Órdenes (CRUD completo con estados)
- Reportes (dashboard con estadísticas)
- Personas (CRUD completo con tipos)
- Empleados (CRUD completo con estadísticas)
- Instalaciones (CRUD completo con estadísticas)
- Finanzas (CRUD completo con resumen)

🔄 **Pendientes:**
- Handler de auditoría
- Integración frontend actualizada
- Autenticación y autorización