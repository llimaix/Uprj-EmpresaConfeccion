
-- ============================================
-- DATOS DE EJEMPLO PARA LA BASE DE DATOS
-- ============================================

-- Personas (clientes, empleados, proveedores)
INSERT INTO Persona VALUES (1, 'Carlos Pérez', 'Empleado');
INSERT INTO Persona VALUES (2, 'María López', 'Cliente');
INSERT INTO Persona VALUES (3, 'Textiles del Norte', 'Proveedor');
INSERT INTO Persona VALUES (4, 'Ana Martínez', 'Empleado');
INSERT INTO Persona VALUES (5, 'José Herrera', 'Empleado');

-- Proveedor
INSERT INTO Proveedor VALUES (3);

-- Países
INSERT INTO Pais VALUES (1, 'Guatemala');
INSERT INTO Pais VALUES (2, 'México');

-- Departamentos
INSERT INTO Departamento VALUES (1, 'Producción');
INSERT INTO Departamento VALUES (2, 'Finanzas');

-- Instalaciones
INSERT INTO Instalacion VALUES (1, 'Planta Central', 'Zona 12, Ciudad de Guatemala', 1);
INSERT INTO Instalacion VALUES (2, 'Sucursal Norte', 'Monterrey, México', 2);

-- Empleados
INSERT INTO Empleado VALUES (1, 'Gerente', 1, 2);
INSERT INTO Empleado VALUES (4, 'Operador', 1, 1);
INSERT INTO Empleado VALUES (5, 'Supervisor', 2, 1);

-- Planilla
INSERT INTO Planilla VALUES (1, 1);
INSERT INTO Planilla VALUES (2, 4);
INSERT INTO Planilla VALUES (3, 5);

-- Productos
INSERT INTO Producto VALUES (1, 'Tela Algodón', 'Materia Prima');
INSERT INTO Producto VALUES (2, 'Camisa Formal', 'Producto Terminado');

-- Inventario
INSERT INTO Inventario VALUES (1, 1, 1, 1000); -- Tela en Planta Central
INSERT INTO Inventario VALUES (2, 2, 2, 250);  -- Camisas en Sucursal Norte

-- Orden de compra
INSERT INTO Orden_Compra VALUES (1, 2, 'Pendiente');

-- Detalle de orden de compra
INSERT INTO Detalle_Orden_Compra VALUES (1, 1, 2, 150); -- Cliente pide 150 camisas

-- Aprobación
INSERT INTO Aprobacion VALUES (1, 1, 1); -- Gerente aprueba orden

-- Orden de producción
INSERT INTO Orden_Produccion VALUES (1, 1, 2, 200); -- Planta Central producirá 200 camisas

-- Transporte
INSERT INTO Transporte VALUES (1, 5.5, 2.0); -- Tiempos estimados en horas

-- Entrega
INSERT INTO Entrega VALUES (1, 1, 1); -- Entrega de la orden de producción

-- Cuentas contables
INSERT INTO Cuenta_Contable VALUES (1, 'Cuenta General');
INSERT INTO Cuenta_Contable VALUES (2, 'Cuenta Nómina');

-- Transacciones financieras
INSERT INTO Transaccion_Financiera VALUES (1, 1, 10000, 'Compra de materia prima');
INSERT INTO Transaccion_Financiera VALUES (2, 2, 2500, 'Pago de planilla');

-- Auditorías
INSERT INTO Auditoria VALUES (1, 1, 1); -- Carlos revisa compra
INSERT INTO Auditoria VALUES (2, 2, 1); -- Carlos revisa nómina

-- Usuarios del sistema
INSERT INTO Usuario VALUES (1, 1, 'cperez', 'clave123', 'Administrador');
INSERT INTO Usuario VALUES (2, 4, 'amartinez', 'clave123', 'Producción');
INSERT INTO Usuario VALUES (3, 5, 'jherrera', 'clave123', 'Supervisor');
