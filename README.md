# Task Manager API 🚀

API REST robusta, escalable y blindada para la gestión de flujos de trabajo y tareas personales. Desarrollada bajo una arquitectura limpia por capas en Node.js, implementando tipado estricto, persistencia de datos relacional y automatización en la nube.

## 🛠️ Tecnologías y Herramientas

- **Entorno de Ejecución:** Node.js con TypeScript, `tsx watch` (desarrollo) y Node nativo (producción).
- **Framework Web:** Express.js
- **Base de Datos:** SQLite (Persistencia relacional local y en la nube).
- **ORM de Nueva Generación:** Prisma v7 (con adaptadores nativos de alto rendimiento).
- **Bundler de Producción:** Vite SSR (Server-Side Rendering) para empaquetado asíncrono avanzado, unificando la lógica de negocio en un único archivo compacto de 26 KB.
- **Seguridad y Ciberseguridad:** Bcrypt (hashing de contraseñas) y JSON Web Tokens (JWT).
- **Calidad de Código y Linters:** Biome (organización de imports y buenas prácticas modernas).
- **Servicio de Mensajería:** Nodemailer (Despacho de correos electrónicos SMTP asíncronos en desarrollo y producción).
- **Criptografía:** `node:crypto` nativo para la generación de hashes hexadecimales aleatorios de un uso.
- **Automatización:** `node-cron` para la orquestación de tareas programadas en segundo plano.

## 🏗️ Arquitectura del Proyecto

El proyecto implementa un patrón de diseño desacoplado y modular organizado por capas de responsabilidad:

- `src/db/`: Inicialización del cliente y adaptadores de base de datos.
- `src/middlewares/`: Guardianes perimetrales de seguridad y validación de tokens.
- `src/controllers/`: Capa lógica de negocio (procesamiento y flujos de error).
- `src/routes/`: Enrutamiento modular para endpoints REST (`GET`, `POST`, `PUT`, `DELETE`).
- `src/services/`: Capas de servicios externos independientes (mensajería y tareas cron).
- `src/types/`: Extensiones globales nativas para el tipado de Express.

## 🛡️ Características Principales

1. **Autenticación y Registro Defensivo:** Registro de usuarios mediante identidades digitales exclusivas (alias String @unique) combinando hashing criptográfico con Bcrypt (10 salt rounds).
2. **Perímetro de Verificación de Identidad (Email Validation):** Generación automática de tokens criptográficos aleatorios de un solo uso vinculados a la base de datos de manera única. El sistema bloquea el ingreso de cuentas nuevas emitiendo un estado 403 Forbidden en el Login hasta que el usuario confirme su correo electrónico haciendo clic en el enlace asíncrono seguro.
3. **Control de Sesiones Inalterable:** Implementación de flujos de login protegidos que emiten tokens de acceso JWT con expiración temporal de 24 horas.
4. **Persistencia Relacional:** Conexión estricta Uno a Muchos (Un usuario -> Múltiples tareas) protegida mediante integridad referencial y eliminación en cascada en la base de datos.
5. **Orquestación en Segundo Plano (Cron Jobs):** Inclusión de un servicio automatizado con `node-cron` que se ejecuta de forma síncrona cada 24 horas para realizar una limpieza defensiva en la base de datos, purgando cuentas huérfanas que no completaron su proceso de verificación de correo en los plazos estipulados.
6. **Escudo de Protección Perimetral (Anti-Vandalismo):** Con el fin de garantizar el acceso público al portafolio, la cuenta de demostración (`demo@taskmanager.com`) cuenta con compuertas de seguridad (*Defensa en Profundidad*) en los controladores de `forgotPassword` y `resetPassword`, bloqueando cualquier intento de alteración criptográfica de sus credenciales por parte de terceros.
7. **Gestión Rigurosa de Errores:** Control semántico de respuestas basado en la especificación formal de códigos de estado HTTP (200, 201, 400, 401, 404, 500).

## ⚙️ Configuración del Entorno Local

Para levantar el servidor localmente, es obligatorio configurar las variables de entorno para la base de datos, ciberseguridad y el servicio de mensajería asíncrona:

1. Clona el archivo de plantilla de entorno en la raíz del proyecto (utiliza `.env.example` para guiarte en las llaves necesarias):
   ```bash
   cp .env.example .env
   ```
2. Abre el nuevo archivo `.env` y completa las credenciales del servidor SMTP (se recomienda usar **Mailtrap** para el entorno de desarrollo Sandbox).
3. Sincroniza y estructura las tablas locales de tu esquema de Prisma:
   ```bash
   pnpm prisma db push
   ```
4. Corre el proyecto en entorno de desarrollo:
   ```bash
   pnpm dev
   ```

## 🚀 Despliegue Continuo (CD)
La infraestructura está diseñada para compilarse y desplegarse de manera automatizada en **Render** ante cada push a la rama `main`. El script de construcción orquesta la auto-generación de tipos de Prisma y delega en **Vite** el empaquetado optimizado del bundle de producción nativo.

## 🧪 Suites de Pruebas Automatizadas (Testing)

El proyecto cuenta con una robusta suite de **pruebas de integración automatizadas** implementadas con **Vitest**, asegurando la integridad de los endpoints, middlewares de seguridad y la persistencia de datos relacionales sin necesidad de prender el servidor manualmente (utilizando `supertest`).

### 🛡️ Escenarios Cubiertos (100% Green Tests)

1. **Módulo de Salud (`health.test.ts`):** 
   - Verificación de disponibilidad del servidor (Status 200).
   - Control perimetral de rutas inexistentes/fantasmas (Status 404).

2. **Módulo de Autenticación (`user.test.ts`):**
   - **Camino feliz:** Registro exitoso de usuarios con hash Bcrypt (Status 201).
   - **Activación perimetral:** Validación rigurosa del endpoint `verifyEmail`, cubriendo tokens obligatorios faltantes (Status 400), tokens inválidos o expirados (Status 400) y activación exitosa con mutación de estado en base de datos (Status 200).
   - **Flujo de sesión:** Login correcto, emisión de tokens JSON Web Tokens (Status 200) y bloqueo defensivo para cuentas de re-despacho automático y flujos pendientes de verificación (Status 200/403).
   - **Flujos de error controlados:** Manejo estricto de credenciales inválidas (Status 401) y campos obligatorios faltantes (Status 400).
   - **Resiliencia del sistema:** Simulación de catástrofes internas del servidor mediante inyección de fallos con espías (`vi.spyOn`) de Vitest (Status 500) con restauración limpia mediante bloques de control.

3. **Módulo de Tareas (`task.test.ts`):**
   - **Seguridad perimetral:** Bloqueo automático ante peticiones sin token JWT o con formatos malformados sin el prefijo Bearer (Status 401).
   - **CRUD Relacional Dinámico:** Creación (201), lectura (200), actualización (200) y eliminación (200) de tareas enlazadas al ID del usuario autenticado, utilizando variables dinámicas en memoria para mitigar la fragilidad por secuencias de autoincremento en base de datos.
   - **Flujos alternos de infraestructura:** Cobertura total para escenarios de recursos no encontrados (Status 404) y tolerancia a fallas internas en métodos de Prisma inyectando excepciones controladas (Status 500) restauradas de forma automática mediante ganchos `afterEach`.

### ⚙️ Ejecución de las Pruebas

Para garantizar que los tests no alteren ni ensucien la información de producción o desarrollo (`dev.db`), la suite se ejecuta de forma aislada sobre un entorno controlado (`cross-env NODE_ENV=test`) apuntando automáticamente a una base de datos clonada de aislamiento (`test.db`).

Ejecuta el siguiente comando en la terminal para correr la suite completa:

```bash
pnpm test
```
