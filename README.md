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