# Task Manager API 🚀

API REST robusta y escalable para la gestión de flujos de trabajo y tareas personales. Desarrollada bajo una arquitectura limpia por capas en Node.js, implementando tipado estricto y persistencia de datos relacional.

## 🛠️ Tecnologías y Herramientas

- **Entorno de Ejecución:** Node.js con TypeScript y `tsx watch`
- **Framework Web:** Express.js
- **Base de Datos:** SQLite (Persistencia relacional local)
- **ORM de Nueva Generación:** Prisma v7 (con adaptadores nativos de alto rendimiento)
- **Seguridad y Ciberseguridad:** Bcrypt (hashing de contraseñas) y JSON Web Tokens (JWT)
- **Calidad de Código y Linters:** Biome (organización de imports y buenas prácticas modernas)

## 🏗️ Arquitectura del Proyecto

El proyecto implementa un patrón de diseño desacoplado y modular organizado por capas de responsabilidad:

- `src/db/`: Inicialización del cliente y adaptadores de base de datos.
- `src/middlewares/`: Guardianes perimetrales de seguridad y validación de tokens.
- `src/controllers/`: Capa lógica de negocio (procesamiento y flujos de error).
- `src/routes/`: Enrutamiento modular para endpoints REST (`GET`, `POST`, `PUT`, `DELETE`).
- `src/types/`: Extensiones globales nativas para el tipado de Express.

## 🛡️ Características Principales

1. **Autenticación Segura:** Registro de usuarios con encriptación de contraseñas mediante hashing criptográfico (Bcrypt con 10 salt rounds).
2. **Control de Sesiones Inalterable:** Implementación de flujos de login protegidos que emiten tokens de acceso JWT con expiración temporal de 24 horas.
3. **Persistencia Relacional:** Conexión estricta Uno a Muchos (Un usuario -> Múltiples tareas) protegida mediante integridad referencial y eliminación en cascada en la base de datos.
4. **Gestión Rigurosa de Errores:** Control semántico de respuestas basado en la especificación formal de códigos de estado HTTP (200, 201, 400, 401, 404, 500).

## 🧪 Suites de Pruebas Automatizadas (Testing)

El proyecto cuenta con una robusta suite de **pruebas de integración automatizadas** implementadas con **Vitest**, asegurando la integridad de los endpoints, middlewares de seguridad y la persistencia de datos relacionales sin necesidad de prender el servidor manualmente (utilizando `supertest`).

### 🛡️ Escenarios Cubiertos (100% Green Tests)

1. **Módulo de Salud (`health.test.ts`):** 
   - Verificación de disponibilidad del servidor (Status 200).
   - Control perimetral de rutas inexistentes/fantasmas (Status 404).

2. **Módulo de Autenticación (`user.test.ts`):**
   - **Camino feliz:** Registro exitoso de usuarios con hash Bcrypt (Status 201).
   - **Flujo de sesión:** Login correcto y emisión de tokens JSON Web Tokens (Status 200).
   - **Flujos de error controlados:** Manejo estricto de credenciales inválidas (Status 401) y campos obligatorios faltantes (Status 400).
   - **Resiliencia del sistema:** Simulación de catástrofes internas del servidor mediante inyección de fallos con espías (`vi.spyOn`) de Vitest (Status 500).

3. **Módulo de Tareas (`task.test.ts`):**
   - **Seguridad perimetral:** Bloqueo automático ante peticiones sin token JWT (Status 401).
   - **CRUD Relacional Dinámico:** Creación (201), lectura (200), actualización (200) y eliminación (200) de tareas enlazadas al ID del usuario autenticado, utilizando variables dinámicas en memoria para mitigar la fragilidad por secuencias de autoincremento en base de datos.

### ⚙️ Ejecución de las Pruebas

Para garantizar que los tests no alteren ni ensucien la información de producción o desarrollo (`dev.db`), la suite se ejecuta de forma aislada sobre un entorno controlado (`cross-env NODE_ENV=test`) apuntando automáticamente a una base de datos clonada de aislamiento (`test.db`).

Ejecuta el siguiente comando en la terminal para correr la suite completa:

```bash
pnpm test
```