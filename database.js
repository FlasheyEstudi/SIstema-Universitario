require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unisystem';
const client = new MongoClient(MONGODB_URI);

let db;

// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        db = client.db('unisystem');
        console.log('✅ Conectado a MongoDB Atlas');

        // Crear índices
        await createIndexes();

        // Inicializar datos si es necesario
        await initializeData();

    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    }
}

// Crear índices para mejor rendimiento
async function createIndexes() {
    try {
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ campusId: 1 });
        await db.collection('campuses').createIndex({ code: 1 }, { unique: true });
        await db.collection('courses').createIndex({ campusId: 1 });
        await db.collection('enrollments').createIndex({ studentId: 1, courseId: 1 });
        console.log('✅ Índices creados');
    } catch (error) {
        console.log('ℹ️  Índices ya existen');
    }
}

// Inicializar datos de ejemplo
async function initializeData() {
    const campusCount = await db.collection('campuses').countDocuments();

    if (campusCount === 0) {
        console.log('📦 Creando datos iniciales...');

        // Campus
        const campusId = uuidv4();
        await db.collection('campuses').insertOne({
            _id: campusId,
            id: campusId,
            name: 'Campus Central',
            location: 'Managua',
            code: 'CC001',
            logoUrl: null
        });

        // Carreras
        const careerId = uuidv4();
        await db.collection('careers').insertOne({
            _id: careerId,
            id: careerId,
            name: 'Ingeniería en Sistemas',
            campusId: campusId,
            faculty: 'Ingeniería'
        });

        // Usuario Admin
        const adminId = uuidv4();
        await db.collection('users').insertOne({
            _id: adminId,
            id: adminId,
            name: 'Admin',
            lastName: 'Sistema',
            email: 'admin@unisystem.edu',
            password: 'admin123',
            role: 'ADMIN',
            campusId: campusId,
            avatarUrl: null,
            coverUrl: null,
            notes: null,
            cedula: '001-010101-0001A',
            address: null,
            phone: null,
            carnet: null,
            minedCode: null,
            careerId: null,
            profession: 'Administrador'
        });

        // Usuario Profesor
        const professorId = uuidv4();
        await db.collection('users').insertOne({
            _id: professorId,
            id: professorId,
            name: 'Carlos',
            lastName: 'Martínez',
            email: 'profesor@unisystem.edu',
            password: 'profesor123',
            role: 'PROFESSOR',
            campusId: campusId,
            avatarUrl: null,
            coverUrl: null,
            notes: null,
            cedula: '001-020202-0002B',
            address: null,
            phone: null,
            carnet: null,
            minedCode: 'PROF001',
            careerId: null,
            profession: 'Ingeniero en Sistemas'
        });

        // Usuario Estudiante
        const studentId = uuidv4();
        await db.collection('users').insertOne({
            _id: studentId,
            id: studentId,
            name: 'María',
            lastName: 'González',
            email: 'estudiante@unisystem.edu',
            password: 'estudiante123',
            role: 'STUDENT',
            campusId: campusId,
            avatarUrl: null,
            coverUrl: null,
            notes: null,
            cedula: '001-030303-0003C',
            address: null,
            phone: null,
            carnet: '2024-0001',
            minedCode: null,
            careerId: careerId,
            profession: null
        });

        // Curso de ejemplo
        const courseId = uuidv4();
        await db.collection('courses').insertOne({
            _id: courseId,
            id: courseId,
            name: 'Programación I',
            code: 'PROG101',
            campusId: campusId,
            credits: 4,
            semester: 1,
            careerId: careerId,
            professorId: professorId,
            schedule: 'Lunes y Miércoles 8:00-10:00',
            room: 'Lab 1'
        });

        console.log('✅ Datos iniciales creados');
        console.log('📧 Usuarios de prueba:');
        console.log('   Admin: admin@unisystem.edu / admin123');
        console.log('   Profesor: profesor@unisystem.edu / profesor123');
        console.log('   Estudiante: estudiante@unisystem.edu / estudiante123');
    }
}

// ==================== API ENDPOINTS ====================

// --- AUTH ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.collection('users').findOne({ email, password });

    if (user) {
        res.json(user);
    } else {
        res.status(401).json({ error: 'Credenciales inválidas' });
    }
});

// --- USERS ---
app.get('/api/users', async (req, res) => {
    const { campusId, role } = req.query;
    const query = {};
    if (campusId) query.campusId = campusId;
    if (role) query.role = role;

    const users = await db.collection('users').find(query).toArray();
    res.json(users);
});

app.post('/api/users', async (req, res) => {
    const user = { ...req.body, _id: req.body.id || uuidv4() };
    user.id = user._id;
    await db.collection('users').insertOne(user);
    res.json(user);
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;

    await db.collection('users').updateOne({ id }, { $set: updates });
    const user = await db.collection('users').findOne({ id });
    res.json(user);
});

app.delete('/api/users/:id', async (req, res) => {
    await db.collection('users').deleteOne({ id: req.params.id });
    res.json({ success: true });
});

// --- CAMPUSES ---
app.get('/api/campuses', async (req, res) => {
    const campuses = await db.collection('campuses').find().toArray();
    res.json(campuses);
});

app.post('/api/campuses', async (req, res) => {
    const campus = { ...req.body, _id: req.body.id || uuidv4() };
    campus.id = campus._id;
    await db.collection('campuses').insertOne(campus);
    res.json(campus);
});

app.put('/api/campuses/:id', async (req, res) => {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;

    await db.collection('campuses').updateOne({ id }, { $set: updates });
    const campus = await db.collection('campuses').findOne({ id });
    res.json(campus);
});

// --- CAREERS ---
app.get('/api/careers', async (req, res) => {
    const { campusId } = req.query;
    const query = campusId ? { campusId } : {};
    const careers = await db.collection('careers').find(query).toArray();
    res.json(careers);
});

app.post('/api/careers', async (req, res) => {
    const career = { ...req.body, _id: req.body.id || uuidv4() };
    career.id = career._id;
    await db.collection('careers').insertOne(career);
    res.json(career);
});

app.put('/api/careers/:id', async (req, res) => {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;

    await db.collection('careers').updateOne({ id }, { $set: updates });
    const career = await db.collection('careers').findOne({ id });
    res.json(career);
});

app.delete('/api/careers/:id', async (req, res) => {
    await db.collection('careers').deleteOne({ id: req.params.id });
    res.json({ success: true });
});

// --- COURSES ---
app.get('/api/courses', async (req, res) => {
    const { campusId, careerId, professorId } = req.query;
    const query = {};
    if (campusId) query.campusId = campusId;
    if (careerId) query.careerId = careerId;
    if (professorId) query.professorId = professorId;

    const courses = await db.collection('courses').find(query).toArray();
    res.json(courses);
});

app.post('/api/courses', async (req, res) => {
    const course = { ...req.body, _id: req.body.id || uuidv4() };
    course.id = course._id;
    await db.collection('courses').insertOne(course);
    res.json(course);
});

app.put('/api/courses/:id', async (req, res) => {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;

    await db.collection('courses').updateOne({ id }, { $set: updates });
    const course = await db.collection('courses').findOne({ id });
    res.json(course);
});

app.delete('/api/courses/:id', async (req, res) => {
    await db.collection('courses').deleteOne({ id: req.params.id });
    res.json({ success: true });
});

// --- ENROLLMENTS ---
app.get('/api/enrollments', async (req, res) => {
    const { studentId, courseId, term } = req.query;
    const query = {};
    if (studentId) query.studentId = studentId;
    if (courseId) query.courseId = courseId;
    if (term) query.term = term;

    const enrollments = await db.collection('enrollments').find(query).toArray();
    res.json(enrollments);
});

app.post('/api/enrollments', async (req, res) => {
    const enrollment = { ...req.body, _id: req.body.id || uuidv4() };
    enrollment.id = enrollment._id;
    await db.collection('enrollments').insertOne(enrollment);
    res.json(enrollment);
});

app.put('/api/enrollments/:id', async (req, res) => {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;

    await db.collection('enrollments').updateOne({ id }, { $set: updates });
    const enrollment = await db.collection('enrollments').findOne({ id });
    res.json(enrollment);
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', async (req, res) => {
    const { userId } = req.query;
    const query = userId ? { userId } : {};
    const notifications = await db.collection('notifications').find(query).sort({ date: -1 }).toArray();
    res.json(notifications);
});

app.post('/api/notifications', async (req, res) => {
    const notification = { ...req.body, _id: req.body.id || uuidv4() };
    notification.id = notification._id;
    notification.date = notification.date || new Date().toISOString();
    await db.collection('notifications').insertOne(notification);
    res.json(notification);
});

app.put('/api/notifications/:id/read', async (req, res) => {
    await db.collection('notifications').updateOne(
        { id: req.params.id },
        { $set: { read: true } }
    );
    res.json({ success: true });
});

// --- SCHOLARSHIPS ---
app.get('/api/scholarships', async (req, res) => {
    const { campusId } = req.query;
    const query = campusId ? { campusId } : {};
    const scholarships = await db.collection('scholarships').find(query).toArray();
    res.json(scholarships);
});

app.post('/api/scholarships', async (req, res) => {
    const scholarship = { ...req.body, _id: req.body.id || uuidv4() };
    scholarship.id = scholarship._id;
    await db.collection('scholarships').insertOne(scholarship);
    res.json(scholarship);
});

app.put('/api/scholarships/:id', async (req, res) => {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;

    await db.collection('scholarships').updateOne({ id }, { $set: updates });
    const scholarship = await db.collection('scholarships').findOne({ id });
    res.json(scholarship);
});

// --- SCHOLARSHIP APPLICATIONS ---
app.get('/api/scholarship-applications', async (req, res) => {
    const { studentId, scholarshipId, campusId } = req.query;
    const query = {};
    if (studentId) query.studentId = studentId;
    if (scholarshipId) query.scholarshipId = scholarshipId;
    if (campusId) query.campusId = campusId;

    const applications = await db.collection('scholarship_applications').find(query).toArray();
    res.json(applications);
});

app.post('/api/scholarship-applications', async (req, res) => {
    const application = { ...req.body, _id: req.body.id || uuidv4() };
    application.id = application._id;
    await db.collection('scholarship_applications').insertOne(application);
    res.json(application);
});

app.put('/api/scholarship-applications/:id', async (req, res) => {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;

    await db.collection('scholarship_applications').updateOne({ id }, { $set: updates });
    const application = await db.collection('scholarship_applications').findOne({ id });
    res.json(application);
});

// --- RESOURCES ---
app.get('/api/resources', async (req, res) => {
    const { courseId } = req.query;
    const query = courseId ? { courseId } : {};
    const resources = await db.collection('course_resources').find(query).toArray();
    res.json(resources);
});

app.post('/api/resources', async (req, res) => {
    const resource = { ...req.body, _id: req.body.id || uuidv4() };
    resource.id = resource._id;
    await db.collection('course_resources').insertOne(resource);
    res.json(resource);
});

app.delete('/api/resources/:id', async (req, res) => {
    await db.collection('course_resources').deleteOne({ id: req.params.id });
    res.json({ success: true });
});

// --- ATTENDANCE ---
app.get('/api/attendance', async (req, res) => {
    const { courseId, date, studentId } = req.query;
    const query = {};
    if (courseId) query.courseId = courseId;
    if (date) query.date = date;
    if (studentId) query.studentId = studentId;

    const attendance = await db.collection('attendance').find(query).toArray();
    res.json(attendance);
});

app.post('/api/attendance', async (req, res) => {
    const { courseId, date, records } = req.body;

    // Eliminar registros existentes para esa fecha y curso
    await db.collection('attendance').deleteMany({ courseId, date });

    // Insertar nuevos registros
    const attendanceRecords = records.map(r => ({
        _id: uuidv4(),
        id: uuidv4(),
        courseId,
        date,
        studentId: r.studentId,
        status: r.status
    }));

    if (attendanceRecords.length > 0) {
        await db.collection('attendance').insertMany(attendanceRecords);
    }

    res.json({ success: true });
});

// --- STATS ---
app.get('/api/stats/overview', async (req, res) => {
    const { campusId } = req.query;
    const query = campusId ? { campusId } : {};

    const totalStudents = await db.collection('users').countDocuments({ ...query, role: 'STUDENT' });
    const totalProfessors = await db.collection('users').countDocuments({ ...query, role: 'PROFESSOR' });
    const totalCourses = await db.collection('courses').countDocuments(query);
    const totalCareers = await db.collection('careers').countDocuments(query);

    res.json({
        totalStudents,
        totalProfessors,
        totalCourses,
        totalCareers
    });
});

// Start server
const PORT = process.env.PORT || 3001;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await client.close();
    console.log('👋 Conexión a MongoDB cerrada');
    process.exit(0);
});