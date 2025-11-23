# UniSystem React - Sistema de Gestión Universitaria

Este proyecto es un sistema de gestión universitaria completo desarrollado con React (Frontend) y Node.js/Express (Backend) con base de datos SQLite.

## Requisitos Previos

- Node.js (v16 o superior)
- NPM (incluido con Node.js)

## Instalación

1.  Clonar el repositorio o descomprimir el archivo del proyecto.
2.  Abrir una terminal en la carpeta raíz del proyecto.
3.  Instalar las dependencias:

```bash
npm install
```

## Ejecución

El proyecto utiliza `concurrently` para ejecutar tanto el backend como el frontend con un solo comando, pero también se pueden ejecutar por separado.

### Opción 1: Ejecutar todo (Recomendado)

```bash
npm start
```

Esto iniciará:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:3001 (o el siguiente puerto disponible)

### Opción 2: Ejecutar por separado

**Backend:**
```bash
npm run server
```

**Frontend:**
```bash
npm run dev
```

## Estructura del Proyecto

- **/server.js**: Servidor Backend Express. Maneja la API y la conexión a la base de datos.
- **/database.js**: Configuración de la base de datos SQLite e inicialización de datos semilla (Seed data).
- **/src** (o raíz para archivos React):
    - **/components**: Componentes reutilizables de React (Login, Layout, etc.).
    - **/pages**: Vistas principales (AdminDashboard, StudentDashboard, ProfessorDashboard).
    - **/services**: Lógica de comunicación con la API (`api.ts`).
    - **/types**: Definiciones de tipos TypeScript.
    - **/store.ts**: Gestión de estado global con Zustand.

## Características Principales

### Roles de Usuario
- **Administrador**: Gestión de campus, usuarios, carreras, cursos y becas.
- **Profesor**: Gestión de clases, calificaciones y asistencia.
- **Estudiante**: Visualización de cursos, notas, historial académico y aplicación a becas.

### Base de Datos
El sistema utiliza SQLite (`university.db`). Al iniciar por primera vez, si la base de datos no existe, se crea automáticamente y se puebla con datos de prueba (Campus, Carreras, Usuarios, Cursos).

### Modo Offline
El frontend incluye un modo "Offline" (simulado en `api.ts`) que permite que la interfaz funcione con datos simulados si el backend no está disponible.

## Solución de Problemas Comunes

- **Error de Base de Datos (Foreign Key)**: Si ocurre un error de "FOREIGN KEY constraint failed" al iniciar, elimine el archivo `university.db` y reinicie el servidor. El sistema volverá a crear la base de datos correctamente.
- **Puerto Ocupado**: Si el puerto 3000 o 3001 está ocupado, modifique `server.js` o `vite.config.ts` o libere los puertos.

## Credenciales de Demo

El sistema incluye un botón de "Demo" en el login para rellenar automáticamente credenciales válidas.

- **Admin**: admin.central@uni.edu.ni / 123456
- **Profesor**: prof.central@uni.edu.ni / 123456
- **Estudiante**: est.central@uni.edu.ni / 123456
