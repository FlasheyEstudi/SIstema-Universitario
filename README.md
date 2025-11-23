# UniSystem React - Sistema de Gestión Universitaria Multi-Recinto

Plataforma integral para la gestión académica y administrativa de la Universidad Nacional Multidisciplinaria. Diseñada con arquitectura **Multi-Tenancy Lógica**, permite la gestión independiente de múltiples recintos (Central, Norte, Sur, etc.) desde una única instancia.

## 🚀 Características Principales

### 🏢 Arquitectura
- **Multi-Recinto:** Base de datos centralizada pero con datos estrictamente segregados por `campusId`.
- **Roles:** Administrador, Profesor y Estudiante.
- **Backend Real:** Node.js + Express + SQLite (Persistente).
- **Frontend Moderno:** React 18, TailwindCSS, Glassmorphism UI, Animaciones.

### 👤 Módulos por Rol

#### 1. Administrador
- **Gestión Global:** Creación de nuevos recintos y administradores.
- **Usuarios:** Matrícula de nuevos ingresos (genera Ficha PDF) y registro de docentes.
- **Académico:** Inscripción masiva de asignaturas.
- **Pensum:** Creación de Carreras, Asignaturas y estructuración de planes de estudio.
- **Historial:** Acceso al Kardex de cualquier estudiante y **corrección de notas** (con permisos de admin).
- **Becas:** Creación de programas de becas, revisión de solicitudes y análisis financiero.
- **Notificaciones:** Envío de mensajes masivos a recintos o usuarios específicos.
- **Reportes PDF:** Matrículas, Kardex, Cartas de Beca, Horarios (con Logo Personalizable).

#### 2. Estudiante
- **Dashboard:** Gráficas de rendimiento y promedio en tiempo real.
- **Bloc de Notas:** Persistente en base de datos.
- **Inscripción en Línea:** Selección de materias según oferta académica.
- **Perfil:** Edición de datos de contacto, foto de perfil y portada.
- **Trámites:** Solicitud de becas y descarga de documentos (Horario, Kardex, Inscripción).
- **Notificaciones:** Recepción de avisos con opción de "Guardar en Bloc".

#### 3. Profesor
- **Gestión de Clases:** Vista de grupos asignados.
- **Clase Actual:** Detección automática de la clase en curso según horario.
- **Asistencia:** Toma de asistencia rápida (Presente, Tarde, Ausente, Justificado).
- **Calificaciones:** Libro de notas digital editable.
- **Comunicación:** Envío de avisos a todo el grupo o estudiantes específicos.

---

## 🛠️ Instrucciones de Instalación y Ejecución

### Prerrequisitos
- Tener instalado **Node.js** (v16 o superior).
- Tener instalado **npm**.

### Paso 1: Instalación de Dependencias
Abre una terminal en la carpeta raíz del proyecto y ejecuta:

```bash
npm install
```

### Paso 2: Ejecución (Frontend + Backend)
El proyecto está configurado para correr ambos servicios con un solo comando:

```bash
npm start
```

*   **Backend:** Iniciará en `http://localhost:3000`.
*   **Frontend:** Iniciará en `http://localhost:5173` (o el puerto que asigne Vite).
*   **Base de Datos:** Se creará automáticamente el archivo `university.db` con datos de prueba si no existe.

---

## 🔑 Credenciales de Acceso (Datos Semilla)

El sistema genera datos automáticos la primera vez. La contraseña para **TODOS** los usuarios por defecto es: `123456`.

### Recinto Central (Managua)
- **Admin:** `admin.central@uni.edu.ni`
- **Profesor:** `prof.central@uni.edu.ni`
- **Estudiante:** `est.central@uni.edu.ni`

### Recinto Norte (Estelí)
- **Admin:** `admin.norte@uni.edu.ni`
- **Profesor:** `juan.perez@uni.edu.ni`
- **Estudiante:** `maria.e@uni.edu.ni`

---

## 📄 Exportación PDF y Logos
1. Entra como **Admin**.
2. Ve a la pestaña **Configuración**.
3. Sube una imagen en "Subir Logo".
4. Este logo aparecerá automáticamente en todos los reportes PDF generados por estudiantes y administradores de ese recinto.
# SIstema-Universitario
