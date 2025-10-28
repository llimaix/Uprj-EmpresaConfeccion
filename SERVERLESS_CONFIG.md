# 🔧 Configuración Serverless - Nuevos Endpoints

## 📋 Endpoints que Necesitas Agregar a tu serverless.yml

Agrega estos endpoints a tu configuración de serverless para que funcionen todas las mejoras:

```yaml
functions:
  # === REPORTES ===
  reportesDashboard:
    handler: src/handlers/reportes.dashboard
    events:
      - http:
          path: reportes
          method: get
          cors: true

  reportesInstalaciones:
    handler: src/handlers/reportes.instalaciones
    events:
      - http:
          path: instalaciones
          method: get
          cors: true

  reportesTiposProductos:
    handler: src/handlers/reportes.tiposProductos
    events:
      - http:
          path: tipos-productos
          method: get
          cors: true

  # === PRODUCTOS (mejorados) ===
  productosListar:
    handler: src/handlers/productos.listar
    events:
      - http:
          path: productos
          method: get
          cors: true

  productosObtenerTipos:
    handler: src/handlers/productos.obtenerTipos
    events:
      - http:
          path: productos/tipos
          method: get
          cors: true

  productosCrear:
    handler: src/handlers/productos.crear
    events:
      - http:
          path: productos
          method: post
          cors: true

  productosActualizar:
    handler: src/handlers/productos.actualizar
    events:
      - http:
          path: productos/{id}
          method: put
          cors: true

  productosEliminar:
    handler: src/handlers/productos.eliminar
    events:
      - http:
          path: productos/{id}
          method: delete
          cors: true

  # === INVENTARIO (mejorados) ===
  inventarioListar:
    handler: src/handlers/inventario.listar
    events:
      - http:
          path: inventario
          method: get
          cors: true

  inventarioMovimiento:
    handler: src/handlers/inventario.movimiento
    events:
      - http:
          path: mov
          method: post
          cors: true

  inventarioInstalaciones:
    handler: src/handlers/inventario.obtenerInstalaciones
    events:
      - http:
          path: inventario/instalaciones
          method: get
          cors: true

  inventarioResumen:
    handler: src/handlers/inventario.resumenPorInstalacion
    events:
      - http:
          path: inventario/resumen
          method: get
          cors: true

  # === ÓRDENES (mejoradas) ===
  ordenesListar:
    handler: src/handlers/ordenes.listar
    events:
      - http:
          path: ordenes
          method: get
          cors: true

  ordenesCrear:
    handler: src/handlers/ordenes.crear
    events:
      - http:
          path: ordenes
          method: post
          cors: true

  ordenesActualizar:
    handler: src/handlers/ordenes.actualizar
    events:
      - http:
          path: ordenes/{id}
          method: put
          cors: true

  ordenesDetalle:
    handler: src/handlers/ordenes.obtenerDetalle
    events:
      - http:
          path: ordenes/{id}
          method: get
          cors: true

  ordenesEstados:
    handler: src/handlers/ordenes.obtenerEstados
    events:
      - http:
          path: ordenes/estados
          method: get
          cors: true
```

## ⚠️ Compatibilidad con Endpoints Existentes

Si ya tienes algunos endpoints configurados, asegúrate de que los handlers coincidan con las funciones exportadas en los archivos:

### **src/handlers/reportes.js**
```javascript
export const dashboard = async () => { /* código */ }
export const instalaciones = async () => { /* código */ }
export const tiposProductos = async () => { /* código */ }
```

### **src/handlers/productos.js**
```javascript
export const listar = async (event) => { /* código */ }
export const obtenerTipos = async () => { /* código */ }
export const crear = async (event) => { /* código */ }
export const actualizar = async (event) => { /* código */ }
export const eliminar = async (event) => { /* código */ }
```

### **src/handlers/inventario.js**
```javascript
export const listar = async (event) => { /* código */ }
export const movimiento = async (event) => { /* código */ }
export const obtenerInstalaciones = async () => { /* código */ }
export const resumenPorInstalacion = async () => { /* código */ }
```

### **src/handlers/ordenes.js**
```javascript
export const listar = async (event) => { /* código */ }
export const crear = async (event) => { /* código */ }
export const actualizar = async (event) => { /* código */ }
export const obtenerDetalle = async (event) => { /* código */ }
export const obtenerEstados = async () => { /* código */ }
```

## 🔄 Comandos de Despliegue

```bash
# Desplegar todo
serverless deploy

# Desplegar función específica
serverless deploy function -f productosListar

# Ver logs
serverless logs -f reportesDashboard -t

# Invocar función localmente
serverless invoke local -f reportesDashboard
```

## 🌐 URLs Resultantes

Después del despliegue, tendrás URLs como:
```
https://tu-api-id.execute-api.region.amazonaws.com/stage/reportes
https://tu-api-id.execute-api.region.amazonaws.com/stage/productos
https://tu-api-id.execute-api.region.amazonaws.com/stage/inventario
https://tu-api-id.execute-api.region.amazonaws.com/stage/ordenes
```

## 🔧 Variables de Entorno

Asegúrate de tener estas variables en tu serverless.yml:

```yaml
provider:
  environment:
    ORACLE_HOST: ${env:ORACLE_HOST}
    ORACLE_PORT: ${env:ORACLE_PORT, '1521'}
    ORACLE_SERVICE: ${env:ORACLE_SERVICE}
    ORACLE_USER: ${env:ORACLE_USER}
    ORACLE_PASSWORD: ${env:ORACLE_PASSWORD}
    ORACLE_POOL_MIN: ${env:ORACLE_POOL_MIN, '1'}
    ORACLE_POOL_MAX: ${env:ORACLE_POOL_MAX, '4'}
```

## ✅ Testing de los Nuevos Endpoints

Una vez desplegado, puedes probar:

```bash
# Dashboard de reportes
curl https://tu-api/reportes

# Productos con filtros
curl "https://tu-api/productos?search=camiseta&limit=10"

# Inventario con filtros
curl "https://tu-api/inventario?lowStock=true"

# Órdenes por estado
curl "https://tu-api/ordenes?estado=PENDIENTE"
```

¡Con esta configuración tu frontend mejorado tendrá toda la potencia del backend actualizado! 🚀