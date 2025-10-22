
-- ============================================
-- SCRIPT DE CREACIÓN DEL ESQUEMA EN ORACLE SQL
-- Basado en el diagrama final del proyecto
-- ============================================

-- SECUENCIAS
CREATE SEQUENCE seq_persona START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_proveedor START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_departamento START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_pais START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_instalacion START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_empleado START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_planilla START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_producto START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_inventario START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_orden_compra START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_aprobacion START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_orden_produccion START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_entrega START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_transporte START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_cuenta START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_transaccion START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_auditoria START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_usuario START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_detalle_orden START WITH 1 INCREMENT BY 1;

-- TABLAS

CREATE TABLE Persona (
    id_persona INT PRIMARY KEY,
    nombre VARCHAR2(100),
    tipo VARCHAR2(50)
);

CREATE TABLE Proveedor (
    id_proveedor INT PRIMARY KEY,
    FOREIGN KEY (id_proveedor) REFERENCES Persona(id_persona)
);

CREATE TABLE Departamento (
    id_departamento INT PRIMARY KEY,
    nombre VARCHAR2(100)
);

CREATE TABLE Pais (
    id_pais INT PRIMARY KEY,
    nombre VARCHAR2(100)
);

CREATE TABLE Instalacion (
    id_instalacion INT PRIMARY KEY,
    nombre VARCHAR2(100),
    ubicacion VARCHAR2(255),
    id_pais INT,
    FOREIGN KEY (id_pais) REFERENCES Pais(id_pais)
);

CREATE TABLE Empleado (
    id_persona INT PRIMARY KEY,
    tipo_empleado VARCHAR2(50),
    id_instalacion INT,
    id_departamento INT,
    FOREIGN KEY (id_persona) REFERENCES Persona(id_persona),
    FOREIGN KEY (id_instalacion) REFERENCES Instalacion(id_instalacion),
    FOREIGN KEY (id_departamento) REFERENCES Departamento(id_departamento)
);

CREATE TABLE Planilla (
    id_planilla INT PRIMARY KEY,
    id_empleado INT,
    FOREIGN KEY (id_empleado) REFERENCES Empleado(id_persona)
);

CREATE TABLE Producto (
    id_producto INT PRIMARY KEY,
    nombre VARCHAR2(100),
    tipo VARCHAR2(50)
);

CREATE TABLE Inventario (
    id_inventario INT PRIMARY KEY,
    id_instalacion INT,
    id_producto INT,
    cantidad FLOAT,
    FOREIGN KEY (id_instalacion) REFERENCES Instalacion(id_instalacion),
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
);

CREATE TABLE Orden_Compra (
    id_orden INT PRIMARY KEY,
    id_cliente INT,
    estado VARCHAR2(50),
    FOREIGN KEY (id_cliente) REFERENCES Persona(id_persona)
);

CREATE TABLE Detalle_Orden_Compra (
    id_detalle INT PRIMARY KEY,
    id_orden INT,
    id_producto INT,
    cantidad FLOAT,
    FOREIGN KEY (id_orden) REFERENCES Orden_Compra(id_orden),
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
);

CREATE TABLE Aprobacion (
    id_aprobacion INT PRIMARY KEY,
    id_orden INT,
    id_gerente INT,
    FOREIGN KEY (id_orden) REFERENCES Orden_Compra(id_orden),
    FOREIGN KEY (id_gerente) REFERENCES Empleado(id_persona)
);

CREATE TABLE Orden_Produccion (
    id_orden INT PRIMARY KEY,
    id_instalacion INT,
    id_producto INT,
    cantidad FLOAT,
    FOREIGN KEY (id_instalacion) REFERENCES Instalacion(id_instalacion),
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
);

CREATE TABLE Transporte (
    id_transporte INT PRIMARY KEY,
    tiempo_estimado_produccion FLOAT,
    tiempo_estimado_transporte FLOAT
);

CREATE TABLE Entrega (
    id_entrega INT PRIMARY KEY,
    id_orden INT,
    id_transporte INT,
    FOREIGN KEY (id_orden) REFERENCES Orden_Produccion(id_orden),
    FOREIGN KEY (id_transporte) REFERENCES Transporte(id_transporte)
);

CREATE TABLE Cuenta_Contable (
    id_cuenta INT PRIMARY KEY,
    descripcion VARCHAR2(255)
);

CREATE TABLE Transaccion_Financiera (
    id_transaccion INT PRIMARY KEY,
    id_cuenta INT,
    monto FLOAT,
    descripcion VARCHAR2(255),
    FOREIGN KEY (id_cuenta) REFERENCES Cuenta_Contable(id_cuenta)
);

CREATE TABLE Auditoria (
    id_auditoria INT PRIMARY KEY,
    id_transaccion INT,
    id_auditor INT,
    FOREIGN KEY (id_transaccion) REFERENCES Transaccion_Financiera(id_transaccion),
    FOREIGN KEY (id_auditor) REFERENCES Empleado(id_persona)
);

CREATE TABLE Usuario (
    id_usuario INT PRIMARY KEY,
    id_persona INT,
    nombre_usuario VARCHAR2(50),
    clave_acceso VARCHAR2(255),
    rol VARCHAR2(30),
    FOREIGN KEY (id_persona) REFERENCES Persona(id_persona)
);
