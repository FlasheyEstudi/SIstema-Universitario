const sqlite3 = require('sqlite3').verbose();

// Crear conexión a archivo persistente
const db = new sqlite3.Database('./university.db', (err) => {
    if (err) {
        console.error('Error abriendo base de datos', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite university.db');
        db.run("PRAGMA foreign_keys = ON");
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // --- 1. ESTRUCTURA DE RECINTOS Y USUARIOS ---

        db.run(`CREATE TABLE IF NOT EXISTS campuses (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            location TEXT,
            code TEXT NOT NULL UNIQUE,
            logoUrl TEXT -- Base64 Logo
        )`);

        // Intentar añadir columna logoUrl si no existe (para migraciones)
        db.run("ALTER TABLE campuses ADD COLUMN logoUrl TEXT", (err) => { });

        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            lastName TEXT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL, 
            role TEXT NOT NULL, 
            campusId TEXT NOT NULL,
            avatarUrl TEXT,
            coverUrl TEXT,
            notes TEXT,
            cedula TEXT,
            address TEXT,
            phone TEXT,
            carnet TEXT, 
            minedCode TEXT,
            careerId TEXT,
            profession TEXT,
            FOREIGN KEY(campusId) REFERENCES campuses(id) ON DELETE CASCADE
        )`);

        db.run("CREATE INDEX IF NOT EXISTS idx_users_campus ON users(campusId)");

        // --- 2. ESTRUCTURA ACADÉMICA ---

        db.run(`CREATE TABLE IF NOT EXISTS careers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            campusId TEXT NOT NULL,
            faculty TEXT,
            FOREIGN KEY(campusId) REFERENCES campuses(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            campusId TEXT NOT NULL,
            credits INTEGER DEFAULT 3,
            semester INTEGER,
            careerId TEXT,
            professorId TEXT,
            schedule TEXT,
            room TEXT,
            FOREIGN KEY(campusId) REFERENCES campuses(id) ON DELETE CASCADE,
            FOREIGN KEY(careerId) REFERENCES careers(id) ON DELETE SET NULL,
            FOREIGN KEY(professorId) REFERENCES users(id) ON DELETE SET NULL
        )`);

        db.run("CREATE INDEX IF NOT EXISTS idx_courses_campus ON courses(campusId)");

        db.run(`CREATE TABLE IF NOT EXISTS course_resources (
            id TEXT PRIMARY KEY,
            courseId TEXT NOT NULL,
            title TEXT NOT NULL,
            type TEXT NOT NULL, -- 'LINK' or 'FILE'
            url TEXT NOT NULL,
            date TEXT,
            FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE
        )`);

        // --- 3. GESTIÓN DE CLASES Y NOTAS ---

        db.run(`CREATE TABLE IF NOT EXISTS enrollments (
            id TEXT PRIMARY KEY,
            studentId TEXT NOT NULL,
            courseId TEXT NOT NULL,
            term TEXT NOT NULL, 
            status TEXT DEFAULT 'ACTIVE', 
            finalGrade INTEGER,
            gradeP1 INTEGER,
            gradeP2 INTEGER,
            gradeExam INTEGER,
            FOREIGN KEY(studentId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE,
            UNIQUE(studentId, courseId, term)
        )`);

        // Migration for grade columns
        db.run("ALTER TABLE enrollments ADD COLUMN gradeP1 INTEGER", () => { });
        db.run("ALTER TABLE enrollments ADD COLUMN gradeP2 INTEGER", () => { });
        db.run("ALTER TABLE enrollments ADD COLUMN gradeExam INTEGER", () => { });

        db.run("CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(studentId)");

        db.run(`CREATE TABLE IF NOT EXISTS attendance (
            id TEXT PRIMARY KEY,
            courseId TEXT NOT NULL,
            studentId TEXT NOT NULL,
            date TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE,
            FOREIGN KEY(studentId) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(courseId, studentId, date)
        )`);

        // --- 4. MÓDULOS AVANZADOS ---

        db.run(`CREATE TABLE IF NOT EXISTS scholarships (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            requirements TEXT,
            amount INTEGER,
            active INTEGER DEFAULT 1,
            campusId TEXT NOT NULL,
            FOREIGN KEY(campusId) REFERENCES campuses(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS scholarship_apps (
            id TEXT PRIMARY KEY,
            studentId TEXT NOT NULL,
            scholarshipId TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            date TEXT,
            FOREIGN KEY(studentId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(scholarshipId) REFERENCES scholarships(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            senderId TEXT,
            recipientId TEXT NOT NULL, 
            title TEXT NOT NULL,
            message TEXT,
            date TEXT,
            read INTEGER DEFAULT 0, 
            type TEXT DEFAULT 'INFO'
        )`);

        // --- SEED DATA ---
        db.get("SELECT count(*) as count FROM campuses", (err, row) => {
            if (row && row.count === 0) {
                console.log("Sembrando datos iniciales...");

                db.serialize(() => {
                    // 1. Campus
                    db.run("INSERT INTO campuses (id, name, location, code) VALUES (?, ?, ?, ?)", ['cam_1', 'Recinto Central (Managua)', 'Managua', 'CEN']);
                    db.run("INSERT INTO campuses (id, name, location, code) VALUES (?, ?, ?, ?)", ['cam_2', 'Recinto Norte (Estelí)', 'Estelí', 'NOR']);

                    // 2. Carreras
                    db.run("INSERT INTO careers (id, name, campusId, faculty) VALUES (?, ?, ?, ?)", ['c1', 'Ingeniería de Sistemas', 'cam_1', 'Tecnología']);
                    db.run("INSERT INTO careers (id, name, campusId, faculty) VALUES (?, ?, ?, ?)", ['c2', 'Medicina', 'cam_2', 'Salud']);

                    // 3. Usuarios
                    // Admin y Profesores
                    db.run("INSERT INTO users (id, name, lastName, email, password, role, campusId, avatarUrl, carnet, careerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        ['u1', 'Admin', 'Central', 'admin.central@uni.edu.ni', '123456', 'ADMIN', 'cam_1', 'https://picsum.photos/200', null, null]);
                    db.run("INSERT INTO users (id, name, lastName, email, password, role, campusId, avatarUrl, carnet, careerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        ['u2', 'Profesor', 'Central', 'prof.central@uni.edu.ni', '123456', 'PROFESSOR', 'cam_1', 'https://picsum.photos/201', null, null]);

                    // Estudiante Central (Asignado a c1 para que pueda ver cursos)
                    db.run("INSERT INTO users (id, name, lastName, email, password, role, campusId, avatarUrl, carnet, careerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        ['u6', 'Estudiante', 'Central', 'est.central@uni.edu.ni', '123456', 'STUDENT', 'cam_1', 'https://picsum.photos/202', '2023-999C', 'c1']);

                    // 4. Cursos (Debe coincidir con Carrera c1 y Campus cam_1)
                    db.run("INSERT INTO courses (id, name, code, campusId, credits, semester, professorId, schedule, room, careerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        ['co1', 'Programación I', 'IS-101', 'cam_1', 4, 1, 'u2', 'Lun 08:00', 'Lab-A', 'c1']);
                    db.run("INSERT INTO courses (id, name, code, campusId, credits, semester, professorId, schedule, room, careerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        ['co2', 'Matemáticas I', 'MAT-101', 'cam_1', 5, 1, 'u2', 'Mar 10:00', 'B-102', 'c1']);

                    // 5. Becas (Para Campus cam_1)
                    db.run("INSERT INTO scholarships VALUES (?, ?, ?, ?, ?, ?, ?)",
                        ['sch_1', 'Beca a la Excelencia', 'Promedio > 90', 'Carta y Kardex', 2000, 1, 'cam_1']);

                    db.run("INSERT INTO scholarships VALUES (?, ?, ?, ?, ?, ?, ?)",
                        ['sch_2', 'Beca Transporte', 'Vivir lejos', 'Recibo de luz', 500, 1, 'cam_1']);
                });
            }
        });
    });
}

module.exports = db;