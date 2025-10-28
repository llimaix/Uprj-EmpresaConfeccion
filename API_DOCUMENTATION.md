# 🚀 API Backend - Sistema de Control de Confección

## 📋 Descripción
Backend serverless desarrollado en Node.js para AWS Lambda con base de datos Oracle, diseñado para soportar el sistema de gestión de empresa de confección.

## 🔗 Endpoints Disponibles

### 📊 **Reportes y Dashboard**
- `GET /reportes` - Dashboard completo con estadísticas
- `GET /instalaciones` - Lista de instalaciones únicas  
- `GET /tipos-productos` - Tipos de productos únicos

### 📦 **Productos**
- `GET /productos` - Listar productos con filtros, paginación y búsqueda
- `POST /productos` - Crear nuevo producto
- `PUT /productos/{id}` - Actualizar producto
- `DELETE /productos/{id}` - Eliminar producto
- `GET /productos/tipos` - Obtener tipos únicos

### 🏭 **Inventario**
- `GET /inventario` - Listar inventario con filtros y ordenamiento
- `POST /mov` - Registrar movimiento de inventario
- `GET /inventario/instalaciones` - Obtener instalaciones únicas
- `GET /inventario/resumen` - Resumen por instalación

### 📋 **Órdenes**
- `GET /ordenes` - Listar órdenes con filtros y paginación
- `POST /ordenes` - Crear nueva orden
- `PUT /ordenes/{id}` - Actualizar estado de orden
- `GET /ordenes/{id}` - Obtener detalles de orden específica
- `GET /ordenes/estados` - Obtener estados únicos

---

## 🔍 **Parámetros de Query Disponibles**

### **GET /productos**
```
?search=texto          # Buscar en nombre o tipo
&tipo=categoria         # Filtrar por tipo específico
&page=1                # Número de página
&limit=50              # Registros por página (máx 100)
&sortBy=nombre         # Campo de ordenamiento
&sortOrder=ASC         # Dirección (ASC/DESC)
```

### **GET /inventario**
```
?search=texto          # Buscar en producto, instalación o tipo
&instalacion=nombre    # Filtrar por instalación
&lowStock=true         # Solo items con stock bajo (<50)
&sortBy=cantidad       # Campo de ordenamiento
&sortOrder=DESC        # Dirección
&minQuantity=10        # Cantidad mínima
```

### **GET /ordenes**
```
?search=texto          # Buscar en cliente o ID de orden
&estado=PENDIENTE      # Filtrar por estado
&page=1                # Número de página
&limit=50              # Registros por página
&sortBy=id_orden       # Campo de ordenamiento
&sortOrder=DESC        # Dirección
```

---

## 📡 **Respuestas de la API**

### **Estructura de Respuesta Exitosa**
```json
{
  "statusCode": 200,
  "headers": { "Content-Type": "application/json" },
  "body": "{\"rows\": [...], \"pagination\": {...}, \"statistics\": {...}}"
}
```

### **Estructura de Respuesta de Error**
```json
{
  "statusCode": 400|404|409|500,
  "headers": { "Content-Type": "application/json" },
  "body": "{\"message\": \"Descripción del error\"}"
}
```

---

## 🏗️ **Esquema de Base de Datos**

### **Tablas Principales**
- `PRODUCTO` - Catálogo de productos
- `INSTALACION` - Ubicaciones/fábricas
- `INVENTARIO` - Stock por producto e instalación
- `ORDEN_COMPRA` - Órdenes de producción
- `DETALLE_ORDEN_COMPRA` - Items de cada orden
- `PERSONA` - Clientes

### **Secuencias**
- `SEQ_PRODUCTO`
- `SEQ_INVENTARIO` 
- `SEQ_ORDEN_COMPRA`
- `SEQ_DETALLE_ORDEN`

---

## 🔒 **Validaciones Implementadas**

### **Productos**
- Nombre y tipo requeridos (min 2 caracteres)
- Nombres únicos por producto
- Verificación de dependencias antes de eliminar

### **Inventario**
- Validación de stock antes de salidas
- Creación automática de instalaciones si no existen
- Validación de productos existentes
- No se permiten cantidades negativas en nuevos registros

### **Órdenes**
- Estados válidos: PENDIENTE, APROBADA, CANCELADA, EN_PROCESO, COMPLETADA
- Transiciones de estado controladas
- Validación de cliente existente
- Al menos un detalle por orden

---

## 🚀 **Funcionalidades Avanzadas**

### **Dashboard de Reportes**
- KPIs en tiempo real
- Gráficos de inventario por tipo y instalación
- Estadísticas de órdenes por estado
- Top productos más vendidos
- Alertas de stock bajo
- Tendencias de movimientos

### **Filtros y Búsqueda**
- Búsqueda de texto completo
- Filtros combinables
- Ordenamiento por múltiples campos
- Paginación optimizada

### **Manejo de Errores**
- Códigos de estado HTTP apropiados
- Mensajes de error descriptivos
- Logging detallado para debugging
- Validación de integridad referencial

---

## 🛠️ **Configuración de Entorno**

### **Variables de Entorno Requeridas**
```env
ORACLE_HOST=your-oracle-host
ORACLE_PORT=1521
ORACLE_SERVICE=your-service-name
ORACLE_USER=your-username
ORACLE_PASSWORD=your-password
ORACLE_POOL_MIN=1
ORACLE_POOL_MAX=4
```

### **Dependencias**
- `oracledb` - Driver de Oracle Database
- `node:18.x` - Runtime de Node.js

---

## 📈 **Performance**

### **Optimizaciones Implementadas**
- Connection pooling de Oracle
- Consultas con índices optimizados  
- Paginación en consultas grandes
- Consultas paralelas con Promise.all()
- Límites en resultados para prevenir timeouts

### **Límites**
- Máximo 100 registros por página
- Timeout de conexión: 15 segundos
- Pool de conexiones: 1-4 conexiones concurrentes

---

## 🔧 **Despliegue**

### **AWS Lambda**
- Runtime: Node.js 18.x
- Timeout: 30 segundos
- Memoria: 512 MB (configurable)
- Arquitectura: x86_64

### **API Gateway**
- CORS habilitado
- Rate limiting configurado
- Logs de CloudWatch activados

---

## 📝 **Códigos de Estado HTTP**

| Código | Descripción |
|--------|-------------|
| 200    | Operación exitosa |
| 400    | Datos inválidos o faltantes |
| 404    | Recurso no encontrado |
| 409    | Conflicto (duplicados, violación de reglas) |
| 500    | Error interno del servidor |

---

## 🧪 **Testing**

### **Ejemplos de Requests**

#### Crear Producto
```bash
curl -X POST https://api-url/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Camiseta Básica", "tipo": "Camisetas"}'
```

#### Registrar Movimiento de Inventario
```bash
curl -X POST https://api-url/mov \
  -H "Content-Type: application/json" \
  -d '{"id_instalacion": 1, "id_producto": 5, "delta": 100, "motivo": "Recepción de mercancía"}'
```

#### Cambiar Estado de Orden
```bash
curl -X PUT https://api-url/ordenes/123 \
  -H "Content-Type: application/json" \
  -d '{"estado": "APROBADA"}'
```

---

## 🔮 **Funcionalidades Futuras**
- Autenticación JWT
- Rate limiting por usuario
- Webhooks para notificaciones
- Exportación de reportes a PDF/Excel
- API de auditoría de cambios
- Integración con sistemas externos

---

**Desarrollado con ❤️ para el Sistema de Control de Empresa de Confección**