# 🧵 Sistema de Control de Empresa de Confección

## 📘 Descripción General

Este proyecto presenta una **solución integral basada en la nube** para una empresa internacional dedicada a la **confección de ropa de vestir al por mayor**, con el objetivo de centralizar y auditar las operaciones financieras, logísticas y de producción de todas sus filiales en distintos países.

La aplicación está diseñada como una **Web App responsive**, desarrollada con tecnologías modernas y escalables, que interactúa directamente con una **base de datos** mediante operaciones DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) a través de un **backend serverless** desplegado en AWS.

---

## 🎯 Objetivos del Sistema

- Centralizar la gestión y control de todas las empresas filiales.
- Permitir auditorías en tiempo real sobre el **flujo de efectivo**, **inventarios**, **activos fijos** y **movimientos de materia prima**.
- Coordinar la **logística de entrega** entre fábricas y clientes finales.
- Facilitar la **gestión de órdenes de producción** aprobadas o rechazadas por la gerencia.
- Proveer **estimaciones automáticas** de producción y transporte entre sedes.
- Garantizar **escalabilidad y disponibilidad global**, preparándose para una futura integración con un portal de clientes.

---

## 🏗️ Arquitectura General

La solución está construida sobre una arquitectura **Serverless de tres capas**, optimizada para reducir costos y aumentar la resiliencia:

### 1. **Frontend (Presentación)**
- **Tecnología:** React / Vue.js (SPA)
- **Alojamiento:** Amazon S3
- **Distribución:** Amazon CloudFront (CDN global)
- **Características:**
  - Diseño responsive (adaptable a móvil y escritorio)
  - Panel administrativo para visualizar inventarios, activos y flujo de efectivo
  - Formularios para gestión CRUD (Create, Read, Update, Delete)
  - Gráficos e indicadores en tiempo real

### 2. **Backend (Lógica de Negocio)**
- **Tecnología:** AWS Lambda con Node.js / Python
- **Orquestación:** AWS API Gateway
- **Infraestructura:** Serverless Framework + Terraform
- **Características:**
  - Endpoints REST seguros
  - Conexión directa a la base de datos mediante drivers nativos
  - Validación y sanitización de datos
  - Control de errores y logging con CloudWatch

### 3. **Base de Datos (Persistencia)**
- **Opciones:** Oracle Database en ECS / RDS o contenedor personalizado
- **Conectividad:** Red privada mediante VPC y subnets seguras
- **Operaciones DML:**
  - `SELECT` para consultas de activos, inventario y flujo de caja
  - `INSERT` y `UPDATE` para movimientos de inventario y órdenes
  - `DELETE` para depuración controlada de registros antiguos

---

## ☁️ Infraestructura Cloud

Implementada de manera reproducible con **Terraform** y **Serverless Framework**, asegurando consistencia entre entornos (Dev, Test, Prod).

### Servicios AWS Utilizados

| Servicio | Función |
|-----------|----------|
| **S3** | Almacenamiento del frontend estático y archivos asociados |
| **CloudFront** | Distribución global del frontend (CDN con HTTPS) |
| **Lambda** | Ejecución del backend sin servidores |
| **API Gateway** | Exposición de las APIs REST seguras |
| **ECS (Elastic Container Service)** | Contenedor con Oracle Database |
| **EBS / EFS** | Persistencia de datos del contenedor Oracle |
| **CloudWatch** | Monitoreo, logging y métricas del sistema |
| **IAM** | Control de accesos y permisos por rol |
| **VPC / Subnets** | Aislamiento de red y conexión segura entre servicios |

---

## 🔧 Automatización y Despliegue

- **Terraform**: 
  - Define recursos de red, roles IAM, S3, CloudFront, ECS y Lambda.
  - Permite recrear la infraestructura desde código (IaC).

- **Serverless Framework**: 
  - Gestiona funciones Lambda, API Gateway y sus despliegues.
  - Automatiza empaquetado, variables de entorno y versionado.

- **CI/CD (opcional)**:
  - Integración con **AWS CodePipeline** o **Azure DevOps Pipelines**.
  - Despliegue automático de frontend y backend en cada commit.

---

## 💡 Funcionalidades Clave

- 📦 Control de inventario en tiempo real.  
- 🏭 Gestión de fábricas y transferencias de materia prima.  
- 💰 Seguimiento del flujo de efectivo global.  
- 🧾 Auditoría completa de transacciones por filial.  
- 🧠 Proyecciones de tiempo de producción y entrega.  
- 🧍 Portal administrativo y dashboard de métricas.  

---

## 🧩 Escalabilidad y Futuro

El sistema está diseñado para ser **modular y extensible**, permitiendo futuras integraciones como:
- Portal de pedidos para clientes externos.
- Módulo de aprobación de órdenes por la gerencia.
- Integración con sistemas ERP o BI (Business Intelligence).
- Exportación de reportes financieros en tiempo real.

---

## 📹 Entrega y Demostración

- **Fecha de entrega:** Sábado 25 de octubre.  
- **Duración del video:** Máximo 5 minutos.  
- **Contenido:**  
  - Presentación del diseño del sistema.  
  - Ejecución de operaciones CRUD en la base de datos.  
  - Explicación del flujo entre frontend, backend y base de datos.  
  - Descripción breve del despliegue cloud y arquitectura.

---

## 🚀 Conclusión

El **Sistema de Control de Empresa de Confección** proporciona una base sólida, moderna y escalable para centralizar la gestión global de la organización, alineándose con su visión de expansión e incorporación en la bolsa de valores.

> **Infraestructura como Código, escalabilidad serverless y control total desde la nube.**
