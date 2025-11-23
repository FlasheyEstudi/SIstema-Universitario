import { User, Role, Career, Course, Enrollment, AttendanceRecord, Campus, Scholarship, ScholarshipApp, Notification, ScholarshipStats, CourseResource } from "../types";
import { mockCampuses, mockUsers, mockCareers, mockCourses, mockEnrollments, mockScholarships, mockScholarshipApps, mockNotifications } from './mockData';

// CONFIGURACIÓN
const API_URL = 'http://localhost:3000/api';

// ESTADO OFFLINE (Mock DB)
let isOffline = false;
const db = {
    campuses: [...mockCampuses],
    users: [...mockUsers],
    careers: [...mockCareers],
    courses: [...mockCourses],
    enrollments: [...mockEnrollments],
    scholarships: [...mockScholarships],
    applications: [...mockScholarshipApps],
    notifications: [...mockNotifications],
    attendance: [] as any[], // Mock Attendance Store
    resources: [] as any[] // Mock Resources
};

// --- MOCK REQUEST HANDLER (Offline Mode) ---
const mockRequest = async (endpoint: string, options: any = {}) => {
    await new Promise(r => setTimeout(r, 400)); 
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};
    const params = new URLSearchParams(endpoint.split('?')[1]);
    const path = endpoint.split('?')[0];

    console.log(`[MOCK API] ${method} ${path}`, body);

    if (path === '/auth/login') {
        const user = db.users.find(u => u.email === body.email && u.campusId === body.campusId);
        if (!user) throw new Error("Usuario no encontrado");
        if ((user.password || '123456') !== body.password) throw new Error("Contraseña incorrecta");
        return { ...user, token: 'mock-token-' + user.id };
    }
    if (path === '/auth/change-password') {
        const u = db.users.find(user => user.id === body.userId);
        if(u) u.password = body.newPassword;
        return { success: true };
    }
    if (path === '/campuses') {
        if (method === 'POST') {
            const newC = { id: 'cam_' + Date.now(), name: body.name, location: body.location, code: body.code };
            db.campuses.push(newC);
            // Mock Create Admin
            db.users.push({
                id: 'u_' + Date.now(),
                name: body.adminName,
                email: body.adminEmail,
                password: body.adminPassword,
                role: Role.ADMIN,
                campusId: newC.id
            });
            return newC;
        }
        return db.campuses;
    }
    if (path.startsWith('/campuses/')) {
        const id = path.split('/')[2];
        if (method === 'DELETE') {
            const idx = db.campuses.findIndex(c => c.id === id);
            if (idx !== -1) db.campuses.splice(idx, 1);
            return { success: true };
        }
        // Mock Update (Logo, data)
        const idx = db.campuses.findIndex(c => c.id === id);
        if (idx !== -1) db.campuses[idx] = { ...db.campuses[idx], ...body };
        return { success: true };
    }

    if (path === '/users') {
        const newUser = { id: 'u_' + Date.now(), ...body, avatarUrl: body.avatarUrl || 'https://picsum.photos/200' };
        db.users.push(newUser);
        return { success: true, id: newUser.id };
    }
    if (path.startsWith('/users/')) {
        const id = path.split('/')[2];
        const idx = db.users.findIndex(u => u.id === id);
        if (idx !== -1) db.users[idx] = { ...db.users[idx], ...body };
        return { success: true };
    }
    if (path === '/admin/stats') {
        const cid = params.get('campusId');
        return {
            totalStudents: db.users.filter(u => u.role === Role.STUDENT && u.campusId === cid).length,
            totalProfessors: db.users.filter(u => u.role === Role.PROFESSOR && u.campusId === cid).length,
            activeCareers: db.careers.filter(c => c.campusId === cid).length
        };
    }
    if (path === '/admin/students') return db.users.filter(u => u.role === Role.STUDENT && u.campusId === params.get('campusId'));
    if (path === '/admin/professors') return db.users.filter(u => u.role === Role.PROFESSOR && u.campusId === params.get('campusId'));
    
    if (path === '/admin/courses') {
        const cid = params.get('campusId');
        return db.courses.filter(c => c.campusId === cid).map(c => ({
            ...c,
            careerName: db.careers.find(ca => ca.id === c.careerId)?.name
        }));
    }
    if (path === '/admin/enroll-bulk') {
        body.courseIds.forEach((cid: string) => {
             db.enrollments.push({
                 id: 'enr_' + Math.random(),
                 studentId: body.studentId,
                 courseId: cid,
                 term: body.term,
                 status: 'ACTIVE'
             });
        });
        return { success: true };
    }
    if (path === '/careers') {
        if (method === 'POST') { db.careers.push({ id: 'c_' + Date.now(), ...body }); return { success: true }; }
        return db.careers.filter(c => c.campusId === params.get('campusId'));
    }
    if (path === '/courses') {
        db.courses.push({ id: 'co_' + Date.now(), ...body });
        return { success: true };
    }
    if (path.startsWith('/courses/')) {
        const id = path.split('/')[2];
        if (path.includes('resources')) {
             if (method === 'POST') { db.resources.push({id: 'res_'+Date.now(), courseId: id, ...body, date: new Date().toISOString()}); return {success: true}; }
             return db.resources.filter(r => r.courseId === id);
        }
        const idx = db.courses.findIndex(c => c.id === id);
        if(idx !== -1) db.courses[idx] = { ...db.courses[idx], ...body };
        return { success: true };
    }

    if (path === '/scholarships') {
        if (method === 'POST') { db.scholarships.push({ id: 'sch_' + Date.now(), active: true, ...body }); return { success: true }; }
        return db.scholarships.filter(s => s.campusId === params.get('campusId'));
    }
    if (path === '/scholarships/applications') {
        const sid = params.get('studentId');
        if (sid) {
             return db.applications.filter(a => a.studentId === sid).map(a => ({
                 ...a,
                 scholarshipName: db.scholarships.find(s => s.id === a.scholarshipId)?.name
             }));
        }
        const cid = params.get('campusId');
        return db.applications
            .filter(a => {
                const sch = db.scholarships.find(s => s.id === a.scholarshipId);
                return sch && sch.campusId === cid;
            })
            .map(a => {
                const s = db.users.find(u => u.id === a.studentId);
                const sch = db.scholarships.find(sc => sc.id === a.scholarshipId);
                return { ...a, studentName: s?.name + ' ' + (s?.lastName||''), scholarshipName: sch?.name };
            });
    }
    if (path === '/scholarships/apply') {
        db.applications.push({ id: 'app_' + Date.now(), ...body, status: 'PENDING', date: new Date().toISOString() });
        return { success: true };
    }
    if (path.startsWith('/scholarships/applications/')) {
        const id = path.split('/')[3];
        const app = db.applications.find(a => a.id === id);
        if (app) app.status = body.status;
        return { success: true };
    }
    if (path === '/scholarships/analysis') {
         const activeApps = db.applications.filter(a => a.status === 'APPROVED');
         return {
             totalBudget: activeApps.length * 2000,
             activeScholarships: activeApps.length,
             eligibleStudentsCount: 5 
         };
    }
    if (path === '/notifications') {
        if (method === 'POST') {
             db.notifications.push({ id: 'n_' + Date.now(), date: new Date().toISOString(), read: false, ...body });
             return { success: true };
        }
        const uid = params.get('userId');
        return db.notifications.filter(n => n.recipientId === uid || n.recipientId === 'ALL');
    }
    if (path === '/admin/all-notifications') {
        return db.notifications.map(n => ({
            ...n,
            senderName: db.users.find(u => u.id === n.senderId)?.name || 'Sistema',
            recipientName: n.recipientId === 'ALL' ? 'Todos' : db.users.find(u => u.id === n.recipientId)?.name
        }));
    }

    if (path === '/student/data') {
        const sid = params.get('studentId');
        const myEnr = db.enrollments.filter(e => e.studentId === sid);
        return {
            myCourses: myEnr.map(e => ({
                enrollment: e,
                course: db.courses.find(c => c.id === e.courseId)
            }))
        };
    }
    if (path === '/student/stats') {
        return { average: 85, courses: 5 }; // Mock stats
    }
    if (path === '/student/history') {
         const sid = params.get('studentId');
         return db.enrollments.filter(e => e.studentId === sid).map(e => ({
             ...e,
             ...db.courses.find(c => c.id === e.courseId)
         }));
    }
    if (path === '/student/attendance') return db.attendance.filter(a => a.studentId === params.get('studentId'));
    if (path === '/student/available-courses') return db.courses.filter(c => c.campusId === params.get('campusId'));
    if (path === '/student/enroll') {
         body.courseIds.forEach((cid: string) => {
             db.enrollments.push({
                 id: 'enr_' + Math.random(),
                 studentId: body.studentId,
                 courseId: cid,
                 term: body.term,
                 status: 'ACTIVE'
             });
        });
        return { success: true };
    }

    if (path === '/professor/classes') return db.courses.filter(c => c.professorId === params.get('professorId'));
    if (path === '/professor/stats') return { classes: db.courses.filter(c => c.professorId === params.get('professorId')).length, students: 20 };
    if (path === '/professor/roster') {
        const cid = params.get('courseId');
        return db.enrollments.filter(e => e.courseId === cid).map(e => ({
            ...e,
            student: db.users.find(u => u.id === e.studentId)
        }));
    }
    if (path === '/professor/grade') {
        const enr = db.enrollments.find(e => e.id === body.enrollmentId);
        if (enr) {
            enr.gradeP1 = body.p1;
            enr.gradeP2 = body.p2;
            enr.gradeExam = body.exam;
            enr.finalGrade = body.final;
        }
        return { success: true };
    }
    if (path === '/professor/attendance') {
        if (method === 'POST') {
             // Mock Save
             body.records.forEach((r:any) => {
                 db.attendance = db.attendance.filter(a => !(a.courseId === body.courseId && a.date === body.date && a.studentId === r.studentId));
                 db.attendance.push({id: 'att_'+Math.random(), courseId: body.courseId, date: body.date, studentId: r.studentId, status: r.status});
             });
             return { success: true };
        }
        return db.attendance.filter(a => a.courseId === params.get('courseId') && a.date === params.get('date'));
    }
    
    if (path === '/admin/history') {
        const sid = params.get('studentId');
        return db.enrollments.filter(e => e.studentId === sid).map(e => ({
             enrollmentId: e.id,
             term: e.term,
             finalGrade: e.finalGrade,
             status: e.status,
             ...db.courses.find(c => c.id === e.courseId)
        }));
    }
    if (path === '/admin/grade') {
        const enr = db.enrollments.find(e => e.id === body.enrollmentId);
        if(enr) enr.finalGrade = body.grade;
        return { success: true };
    }

    return {};
};


// --- REQUEST WRAPPER ---
const request = async (endpoint: string, options?: RequestInit) => {
    if (isOffline) {
        return mockRequest(endpoint, options);
    }
    try {
        const url = `${API_URL}${endpoint}`;
        const res = await fetch(url, options);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Error ${res.status}`);
        }
        return res.json();
    } catch (error: any) {
        if (error.name === 'TypeError' && (error.message.includes('NetworkError') || error.message.includes('Failed to fetch'))) {
             if (!isOffline) {
                 console.warn("⚠️ NO SE DETECTÓ SERVIDOR (node server.js). ACTIVANDO MODO OFFLINE AUTOMÁTICO.");
                 isOffline = true;
             }
             return mockRequest(endpoint, options);
        }
        throw error;
    }
};

export const api = {
    campuses: {
        list: async () => request(`/campuses`),
        create: async (data: any) => request(`/campuses`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }),
        update: async (id: string, data: any) => request(`/campuses/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }),
        delete: async (id: string) => request(`/campuses/${id}`, { method: 'DELETE' })
    },
    auth: {
        login: async (email: string, password?: string, campusId?: string) => request(`/auth/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email, password, campusId }) }),
        updateProfile: async (userId: string, updates: Partial<User>) => request(`/users/${userId}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updates) }),
        changePassword: async (userId: string, newPassword: string) => request(`/auth/change-password`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ userId, newPassword }) })
    },
    admin: {
        getStats: async (campusId: string) => request(`/admin/stats?campusId=${campusId}`),
        getStudents: async (campusId: string) => request(`/admin/students?campusId=${campusId}`),
        getProfessors: async (campusId: string) => request(`/admin/professors?campusId=${campusId}`),
        getCourses: async (campusId: string) => request(`/admin/courses?campusId=${campusId}`),
        getCareers: async (campusId: string) => request(`/careers?campusId=${campusId}`),
        createCareer: async (data: any) => request(`/careers`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)}),
        createCourse: async (data: Partial<Course>) => request(`/courses`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)}),
        createUser: async (user: Partial<User>) => request(`/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) }),
        enrollStudentBulk: async (studentId: string, courseIds: string[], term: string) => request(`/admin/enroll-bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, courseIds, term }) }),
        getStudentHistory: async (studentId: string) => request(`/admin/history?studentId=${studentId}`),
        updateGrade: async (enrollmentId: string, grade: number) => request(`/admin/grade`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ enrollmentId, grade }) })
    },
    courses: {
        update: async (id: string, data: Partial<Course>) => request(`/courses/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }),
        getResources: async (courseId: string) => request(`/courses/${courseId}/resources`),
        addResource: async (courseId: string, data: Partial<CourseResource>) => request(`/courses/${courseId}/resources`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) })
    },
    scholarships: {
        list: async (campusId: string) => request(`/scholarships?campusId=${campusId}`),
        create: async (data: Partial<Scholarship>) => request(`/scholarships`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)}),
        getApplications: async (campusId: string) => request(`/scholarships/applications?campusId=${campusId}`),
        updateApplication: async (id: string, status: string) => request(`/scholarships/applications/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({status})}),
        getAnalysis: async (campusId: string) => request(`/scholarships/analysis?campusId=${campusId}`),
        apply: async (studentId: string, scholarshipId: string) => request(`/scholarships/apply`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({studentId, scholarshipId})}),
        getMyApplications: async (studentId: string) => request(`/scholarships/applications?studentId=${studentId}`)
    },
    notifications: {
        get: async (userId: string) => request(`/notifications?userId=${userId}`),
        getAllGlobal: async () => request(`/admin/all-notifications`),
        send: async (data: Partial<Notification>) => request(`/notifications`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)}),
        markRead: async (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' })
    },
    student: {
        getData: async (studentId: string) => request(`/student/data?studentId=${studentId}`),
        getStats: async (studentId: string) => request(`/student/stats?studentId=${studentId}`),
        getHistory: async (studentId: string) => request(`/student/history?studentId=${studentId}`),
        getAttendance: async (studentId: string) => request(`/student/attendance?studentId=${studentId}`),
        getAvailableCourses: async (campusId: string, careerId: string) => request(`/student/available-courses?campusId=${campusId}&careerId=${careerId}`),
        enroll: async (studentId: string, courseIds: string[]) => request(`/student/enroll`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({studentId, courseIds, term: '2024-2'})})
    },
    professor: {
        getClasses: async (professorId: string) => request(`/professor/classes?professorId=${professorId}`),
        getStats: async (professorId: string) => request(`/professor/stats?professorId=${professorId}`),
        getClassRoster: async (courseId: string) => request(`/professor/roster?courseId=${courseId}`),
        submitGrade: async (enrollmentId: string, grades: {p1?: number, p2?: number, exam?: number, final?: number}) => request(`/professor/grade`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enrollmentId, ...grades }) }),
        getAttendance: async (courseId: string, date: string) => request(`/professor/attendance?courseId=${courseId}&date=${date}`),
        saveAttendance: async (courseId: string, date: string, records: {studentId: string, status: string}[]) => request(`/professor/attendance`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ courseId, date, records }) }),
    }
};