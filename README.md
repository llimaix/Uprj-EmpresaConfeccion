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

## 🔧 Automatización y Despliegue

- **Terraform**: 
  - Define recursos de red, roles IAM, S3, CloudFront, ECS y Lambda.
  - Permite recrear la infraestructura desde código (IaC).

- **Serverless Framework**: 
  - Gestiona funciones Lambda, API Gateway y sus despliegues.
  - Automatiza empaquetado, variables de entorno y versionado.

- **CI/CD**:
  - Integración con **Github Actions**.
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

## 🚀 Conclusión

El **Sistema de Control de Empresa de Confección** proporciona una base sólida, moderna y escalable para centralizar la gestión global de la organización, alineándose con su visión de expansión e incorporación en la bolsa de valores.

> **Infraestructura como Código, escalabilidad serverless y control total desde la nube.**
