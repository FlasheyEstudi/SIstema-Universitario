const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
// Aumentar límite para subida de Logos en Base64
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// --- USERS & AUTH ---

app.post('/api/auth/login', (req, res) => {
    const { email, password, campusId } = req.body;
    if (!email || !password || !campusId) return res.status(400).json({ error: "Faltan datos" });

    const sql = `SELECT u.*, c.name as campusName FROM users u LEFT JOIN campuses c ON u.campusId = c.id WHERE u.email = ? AND u.campusId = ?`;
    
    db.get(sql, [email, campusId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: "Usuario no encontrado." });
        if (row.password !== password) return res.status(401).json({ error: "Contraseña incorrecta." });
        
        const { password: _, ...user } = row;
        res.json({ ...user, token: "real-token-" + row.id });
    });
});

app.post('/api/auth/change-password', (req, res) => {
    const { userId, newPassword } = req.body;
    db.run("UPDATE users SET password = ? WHERE id = ?", [newPassword, userId], (err) => {
        if(err) return res.status(500).json({error: err.message});
        res.json({success: true});
    });
});

app.post('/api/users', (req, res) => {
    const u = req.body;
    const id = 'u_' + Date.now();
    
    // Matrícula Inicial o Registro Profesor
    const sql = `INSERT INTO users (
        id, name, lastName, email, password, role, campusId, avatarUrl,
        cedula, address, phone, carnet, minedCode, careerId, profession
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        id, u.name, u.lastName, u.email, u.password, u.role, u.campusId, u.avatarUrl || 'https://picsum.photos/200',
        u.cedula, u.address, u.phone, u.carnet, u.minedCode, u.careerId, u.profession
    ];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id });
    });
});

app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { phone, address, email, password, avatarUrl, coverUrl, notes } = req.body;
    
    let sql = "UPDATE users SET ";
    const params = [];
    const updates = [];

    if (phone !== undefined) { updates.push("phone = ?"); params.push(phone); }
    if (address !== undefined) { updates.push("address = ?"); params.push(address); }
    if (email !== undefined) { updates.push("email = ?"); params.push(email); }
    if (password !== undefined) { updates.push("password = ?"); params.push(password); }
    if (avatarUrl !== undefined) { updates.push("avatarUrl = ?"); params.push(avatarUrl); }
    if (coverUrl !== undefined) { updates.push("coverUrl = ?"); params.push(coverUrl); }
    if (notes !== undefined) { updates.push("notes = ?"); params.push(notes); }

    if (updates.length === 0) return res.json({ success: true });

    sql += updates.join(", ") + " WHERE id = ?";
    params.push(id);

    db.run(sql, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- ADMIN MODULES ---

app.get('/api/campuses', (req, res) => {
    db.all("SELECT * FROM campuses", [], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

// CREAR RECINTO Y ADMINISTRADOR (Transacción)
app.post('/api/campuses', (req, res) => {
    const { name, location, code, adminName, adminEmail, adminPassword } = req.body;
    const campusId = 'cam_' + Date.now();
    const userId = 'u_admin_' + Date.now();

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 1. Crear Campus
        const stmtCampus = db.prepare("INSERT INTO campuses (id, name, location, code) VALUES (?, ?, ?, ?)");
        stmtCampus.run(campusId, name, location, code, (err) => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: "Error creando campus: " + err.message });
            }
        });
        stmtCampus.finalize();

        // 2. Crear Usuario Admin para ese campus
        const stmtUser = db.prepare(`INSERT INTO users (
            id, name, lastName, email, password, role, campusId, avatarUrl
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

        stmtUser.run(userId, adminName, 'Administrador', adminEmail, adminPassword, 'ADMIN', campusId, 'https://picsum.photos/200', (err) => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: "Error creando admin: " + err.message });
            }
            
            db.run("COMMIT", (err) => {
                if(err) return res.status(500).json({ error: "Error en commit" });
                res.json({ success: true, campusId, userId });
            });
        });
        stmtUser.finalize();
    });
});

// UPDATE CAMPUS (Logo y Datos Generales)
app.put('/api/campuses/:id', (req, res) => {
    const { logoUrl, name, location, code } = req.body;
    const updates = [];
    const params = [];

    if (logoUrl !== undefined) { updates.push("logoUrl = ?"); params.push(logoUrl); }
    if (name !== undefined) { updates.push("name = ?"); params.push(name); }
    if (location !== undefined) { updates.push("location = ?"); params.push(location); }
    if (code !== undefined) { updates.push("code = ?"); params.push(code); }

    if(updates.length === 0) return res.json({success: true});

    params.push(req.params.id);
    const sql = `UPDATE campuses SET ${updates.join(', ')} WHERE id = ?`;

    db.run(sql, params, (err) => {
         if (err) res.status(500).json({ error: err.message });
         else res.json({ success: true });
    });
});

// DELETE CAMPUS
app.delete('/api/campuses/:id', (req, res) => {
    const { id } = req.params;
    // Asumiendo que PRAGMA foreign_keys = ON, esto borrará usuarios, cursos, etc. en cascada si está configurado en DB
    db.run("DELETE FROM campuses WHERE id = ?", [id], (err) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ success: true });
    });
});

// Dashboard Stats
app.get('/api/admin/stats', (req, res) => {
    const { campusId } = req.query;
    db.serialize(() => {
        const stats = {};
        db.get("SELECT COUNT(*) c FROM users WHERE role='STUDENT' AND campusId=?", [campusId], (e,r) => stats.totalStudents = r.c);
        db.get("SELECT COUNT(*) c FROM users WHERE role='PROFESSOR' AND campusId=?", [campusId], (e,r) => stats.totalProfessors = r.c);
        db.get("SELECT COUNT(*) c FROM careers WHERE campusId=?", [campusId], (e,r) => {
            stats.activeCareers = r.c;
            res.json(stats);
        });
    });
});

// User Management Lists
app.get('/api/admin/students', (req, res) => {
    db.all("SELECT * FROM users WHERE role='STUDENT' AND campusId=?", [req.query.campusId], (err, rows) => res.json(rows));
});
app.get('/api/admin/professors', (req, res) => {
    db.all("SELECT * FROM users WHERE role='PROFESSOR' AND campusId=?", [req.query.campusId], (err, rows) => res.json(rows));
});

// Academic & Pensum
app.get('/api/admin/courses', (req, res) => {
    db.all("SELECT c.*, ca.name as careerName FROM courses c LEFT JOIN careers ca ON c.careerId = ca.id WHERE c.campusId=? ORDER BY c.careerId, c.semester", [req.query.campusId], (err, rows) => res.json(rows));
});
app.get('/api/careers', (req, res) => {
    db.all("SELECT * FROM careers WHERE campusId=?", [req.query.campusId], (err, rows) => res.json(rows));
});
app.post('/api/careers', (req, res) => {
    const { name, campusId, faculty } = req.body;
    const id = 'c_' + Date.now();
    db.run("INSERT INTO careers VALUES (?, ?, ?, ?)", [id, name, campusId, faculty], (err) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ success: true });
    });
});
app.post('/api/courses', (req, res) => {
    const { name, code, campusId, credits, semester, careerId, schedule, room } = req.body;
    const id = 'co_' + Date.now();
    db.run("INSERT INTO courses (id, name, code, campusId, credits, semester, careerId, schedule, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
        [id, name, code, campusId, credits, semester, careerId, schedule, room], 
        (err) => {
            if (err) res.status(500).json({ error: err.message });
            else res.json({ success: true });
        }
    );
});
app.put('/api/courses/:id', (req, res) => {
    const { professorId } = req.body;
    db.run("UPDATE courses SET professorId = ? WHERE id = ?", [professorId, req.params.id], (err) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ success: true });
    });
});

app.post('/api/admin/enroll-bulk', (req, res) => {
    const { studentId, courseIds, term } = req.body;
    const stmt = db.prepare("INSERT INTO enrollments (id, studentId, courseId, term, status) VALUES (?, ?, ?, ?, ?)");
    courseIds.forEach(cid => stmt.run('enr_' + Math.random().toString(36).substr(2), studentId, cid, term, 'ACTIVE'));
    stmt.finalize();
    res.json({ success: true });
});

// History & Kardex (Historial Académico)
app.get('/api/admin/history', (req, res) => {
    const { studentId } = req.query;
    const sql = `
        SELECT e.id as enrollmentId, c.code, c.name as courseName, c.credits, e.term, e.finalGrade, e.status
        FROM enrollments e
        JOIN courses c ON e.courseId = c.id
        WHERE e.studentId = ?
        ORDER BY e.term DESC
    `;
    db.all(sql, [studentId], (err, rows) => {
        if(err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.put('/api/admin/grade', (req, res) => {
    const { enrollmentId, grade } = req.body;
    // Admin override grade
    db.run("UPDATE enrollments SET finalGrade = ? WHERE id = ?", [grade, enrollmentId], (err) => {
        if(err) return res.status(500).json({error: err.message});
        res.json({success: true});
    });
});

// --- SCHOLARSHIPS ---

app.get('/api/scholarships', (req, res) => {
    const { campusId } = req.query;
    db.all("SELECT * FROM scholarships WHERE campusId = ?", [campusId], (err, rows) => res.json(rows));
});

app.post('/api/scholarships', (req, res) => {
    const s = req.body;
    const id = 'sch_' + Date.now();
    db.run("INSERT INTO scholarships VALUES (?, ?, ?, ?, ?, ?, ?)", 
        [id, s.name, s.description, s.requirements, s.amount, 1, s.campusId], 
        (err) => {
            if (err) res.status(500).json({error:err.message});
            else res.json({success:true, id});
    });
});

app.get('/api/scholarships/applications', (req, res) => {
    const { campusId, studentId } = req.query;
    let sql = `
        SELECT sa.*, s.name as scholarshipName, u.name as studentName, u.lastName as studentLastName
        FROM scholarship_apps sa
        JOIN scholarships s ON sa.scholarshipId = s.id
        JOIN users u ON sa.studentId = u.id
    `;
    const params = [];
    if (studentId) {
        sql += " WHERE sa.studentId = ?";
        params.push(studentId);
    } else {
        sql += " WHERE s.campusId = ?";
        params.push(campusId);
    }
    
    db.all(sql, params, (err, rows) => res.json(rows));
});

app.post('/api/scholarships/apply', (req, res) => {
    const { studentId, scholarshipId } = req.body;
    const id = 'app_' + Date.now();
    const date = new Date().toISOString();
    db.run("INSERT INTO scholarship_apps VALUES (?, ?, ?, ?, ?)", [id, studentId, scholarshipId, 'PENDING', date], (err) => {
        if (err) res.status(500).json({error:err.message});
        else res.json({success:true});
    });
});

app.put('/api/scholarships/applications/:id', (req, res) => {
    const { status } = req.body;
    db.run("UPDATE scholarship_apps SET status = ? WHERE id = ?", [status, req.params.id], (err) => {
        res.json({success:true});
    });
});

app.get('/api/scholarships/analysis', (req, res) => {
    const { campusId } = req.query;
    const analysis = { totalBudget: 0, activeScholarships: 0, eligibleStudentsCount: 0 };
    
    db.all(`SELECT s.amount FROM scholarship_apps sa 
            JOIN scholarships s ON sa.scholarshipId = s.id 
            WHERE sa.status = 'APPROVED' AND s.campusId = ?`, [campusId], (err, rows) => {
        if(rows) {
            analysis.activeScholarships = rows.length;
            analysis.totalBudget = rows.reduce((acc, r) => acc + r.amount, 0);
        }

        const sqlEligible = `
            SELECT COUNT(DISTINCT e.studentId) as count
            FROM enrollments e
            JOIN users u ON e.studentId = u.id
            WHERE u.campusId = ? 
            AND e.finalGrade >= 85
            AND u.id NOT IN (SELECT studentId FROM scholarship_apps)
        `;
        db.get(sqlEligible, [campusId], (err, row) => {
            if(row) analysis.eligibleStudentsCount = row.count;
            res.json(analysis);
        });
    });
});

// --- NOTIFICATIONS ---

app.get('/api/notifications', (req, res) => {
    const { userId } = req.query;
    const sql = "SELECT * FROM notifications WHERE recipientId = ? OR recipientId = 'ALL' ORDER BY date DESC";
    db.all(sql, [userId], (err, rows) => res.json(rows));
});

// Nuevo: Obtener todas las notificaciones para el Admin con detalles
app.get('/api/admin/all-notifications', (req, res) => {
    const sql = `
        SELECT n.*, 
               s.name as senderName, s.lastName as senderLastName,
               r.name as recipientName, r.lastName as recipientLastName
        FROM notifications n
        LEFT JOIN users s ON n.senderId = s.id
        LEFT JOIN users r ON n.recipientId = r.id
        ORDER BY n.date DESC
    `;
    db.all(sql, [], (err, rows) => {
        if(err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.post('/api/notifications', (req, res) => {
    const { senderId, recipientId, title, message, type } = req.body;
    const id = 'notif_' + Date.now();
    const date = new Date().toISOString();
    
    db.run("INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
        [id, senderId, recipientId, title, message, date, 0, type || 'INFO'], 
        (err) => {
            if (err) res.status(500).json({error:err.message});
            else res.json({success:true});
    });
});

app.put('/api/notifications/:id/read', (req, res) => {
    db.run("UPDATE notifications SET read = 1 WHERE id = ?", [req.params.id], () => res.json({success:true}));
});

// --- STUDENT SPECIFIC MODULES ---

app.get('/api/student/data', (req, res) => {
    const { studentId } = req.query;
    db.all(`SELECT e.*, c.name as courseName, c.code, c.credits, c.schedule, c.room, c.finalGrade 
            FROM enrollments e JOIN courses c ON e.courseId = c.id WHERE e.studentId = ?`, 
            [studentId], (err, rows) => {
        const myCourses = rows.map(r => ({
            enrollment: { id: r.id, finalGrade: r.finalGrade, gradeP1: r.gradeP1, gradeP2: r.gradeP2, gradeExam: r.gradeExam, status: r.status, term: r.term },
            course: { id: r.courseId, name: r.courseName, code: r.code, schedule: r.schedule, room: r.room }
        }));
        res.json({ myCourses });
    });
});

app.get('/api/student/stats', (req, res) => {
    const { studentId } = req.query;
    const sql = `SELECT AVG(finalGrade) as average, COUNT(*) as courses FROM enrollments WHERE studentId = ? AND finalGrade IS NOT NULL`;
    db.get(sql, [studentId], (err, row) => {
        res.json(row);
    });
});

app.get('/api/student/history', (req, res) => {
    const { studentId } = req.query;
    const sql = `
        SELECT e.term, c.code, c.name, c.credits, e.finalGrade, e.status, e.gradeP1, e.gradeP2, e.gradeExam
        FROM enrollments e JOIN courses c ON e.courseId = c.id
        WHERE e.studentId = ? ORDER BY e.term DESC
    `;
    db.all(sql, [studentId], (err, rows) => res.json(rows));
});

app.get('/api/student/attendance', (req, res) => {
    const { studentId } = req.query;
    db.all("SELECT * FROM attendance WHERE studentId = ?", [studentId], (err, rows) => res.json(rows));
});

app.get('/api/student/available-courses', (req, res) => {
    const { campusId, careerId } = req.query;
    // Si tiene carrera, filtrar por ella. Si no, mostrar todo el campus.
    let sql = "SELECT * FROM courses WHERE campusId = ?";
    const params = [campusId];
    if (careerId && careerId !== 'null' && careerId !== 'undefined') {
        sql += " AND careerId = ?";
        params.push(careerId);
    }
    db.all(sql, params, (err, rows) => res.json(rows));
});

app.post('/api/student/enroll', (req, res) => {
    const { studentId, courseIds, term } = req.body;
    const stmt = db.prepare("INSERT INTO enrollments (id, studentId, courseId, term, status) VALUES (?, ?, ?, ?, ?)");
    courseIds.forEach(cid => stmt.run('enr_' + Math.random().toString(36).substr(2), studentId, cid, term, 'ACTIVE'));
    stmt.finalize();
    res.json({ success: true });
});

// --- PROFESSOR PORTAL DATA ---

app.get('/api/professor/classes', (req, res) => {
    db.all("SELECT * FROM courses WHERE professorId = ?", [req.query.professorId], (err, rows) => res.json(rows));
});

app.get('/api/professor/stats', (req, res) => {
    const { professorId } = req.query;
    const stats = {};
    db.serialize(() => {
        db.get("SELECT COUNT(*) c FROM courses WHERE professorId = ?", [professorId], (err, row) => stats.classes = row?.c || 0);
        // Approximate students count (sum of enrollments in their classes)
        db.get(`SELECT COUNT(*) c FROM enrollments e 
                JOIN courses c ON e.courseId = c.id 
                WHERE c.professorId = ?`, [professorId], (err, row) => {
            stats.students = row?.c || 0;
            res.json(stats);
        });
    });
});

app.get('/api/professor/roster', (req, res) => {
    db.all(`SELECT e.*, u.name as studentName, u.lastName, u.carnet, u.avatarUrl 
            FROM enrollments e JOIN users u ON e.studentId = u.id WHERE e.courseId = ?`, 
            [req.query.courseId], (err, rows) => {
        const roster = rows.map(r => ({
            ...r,
            student: { id: r.studentId, name: r.studentName + ' ' + (r.lastName||''), carnet: r.carnet, avatarUrl: r.avatarUrl }
        }));
        res.json(roster);
    });
});

app.post('/api/professor/grade', (req, res) => {
    const { enrollmentId, p1, p2, exam, final } = req.body;
    db.run("UPDATE enrollments SET gradeP1 = ?, gradeP2 = ?, gradeExam = ?, finalGrade = ? WHERE id = ?", 
        [p1, p2, exam, final, enrollmentId], 
        (err) => {
            if(err) return res.status(500).json({error: err.message});
            res.json({success:true});
    });
});

// Attendance Management
app.get('/api/professor/attendance', (req, res) => {
    const { courseId, date } = req.query;
    db.all("SELECT * FROM attendance WHERE courseId = ? AND date = ?", [courseId, date], (err, rows) => {
        if (err) res.status(500).json({error: err.message});
        else res.json(rows);
    });
});

app.post('/api/professor/attendance', (req, res) => {
    const { courseId, date, records } = req.body; // records: [{studentId, status}]
    
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const stmtDel = db.prepare("DELETE FROM attendance WHERE courseId = ? AND date = ? AND studentId = ?");
        const stmtIns = db.prepare("INSERT INTO attendance (id, courseId, studentId, date, status) VALUES (?, ?, ?, ?, ?)");
        
        records.forEach(r => {
            stmtDel.run(courseId, date, r.studentId);
            const id = 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            stmtIns.run(id, courseId, r.studentId, date, r.status);
        });
        
        stmtDel.finalize();
        stmtIns.finalize(() => {
            db.run("COMMIT", (err) => {
                if(err) res.status(500).json({error: err.message});
                else res.json({success: true});
            });
        });
    });
});

// --- RESOURCES (AULA VIRTUAL) ---
app.get('/api/courses/:id/resources', (req, res) => {
    db.all("SELECT * FROM course_resources WHERE courseId = ?", [req.params.id], (err, rows) => res.json(rows));
});

app.post('/api/courses/:id/resources', (req, res) => {
    const { title, type, url } = req.body;
    const id = 'res_' + Date.now();
    const date = new Date().toISOString();
    db.run("INSERT INTO course_resources VALUES (?, ?, ?, ?, ?, ?)", [id, req.params.id, title, type, url, date], (err) => {
        if(err) return res.status(500).json({error: err.message});
        res.json({success: true});
    });
});

// 404 Handler (Keep at the end)
app.use((req, res) => {
    res.status(404).json({ error: "Endpoint no encontrado (404)" });
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));