import { User, Role, Career, Course, Campus, Scholarship, ScholarshipApp, Notification, Enrollment } from "../types";

// Seed Campuses (Base de datos inicial)
export const mockCampuses: Campus[] = [
  { id: 'cam_1', name: 'Recinto Central (Managua)', location: 'Managua', code: 'CEN' },
  { id: 'cam_2', name: 'Recinto Norte (Estelí)', location: 'Estelí', code: 'NOR' },
  { id: 'cam_3', name: 'Recinto Sur (Rivas)', location: 'Rivas', code: 'SUR' }
];

// Seed Users
// NOTA: Todas las contraseñas unificadas a '123456' para coincidir con el autocompletado del Login.
export const mockUsers: User[] = [
  // --- RECINTO NORTE (cam_2) ---
  {
    id: 'u1',
    name: 'Admin Norte',
    email: 'admin.norte@uni.edu.ni',
    role: Role.ADMIN,
    campusId: 'cam_2',
    avatarUrl: 'https://picsum.photos/200',
    password: '123456'
  },
  {
    id: 'u2',
    name: 'Prof. Juan Perez',
    email: 'juan.perez@uni.edu.ni',
    role: Role.PROFESSOR,
    campusId: 'cam_2',
    phone: '8888-8888',
    avatarUrl: 'https://picsum.photos/201',
    password: '123456'
  },
  {
    id: 'u3',
    name: 'Maria Estudiante',
    email: 'maria.e@uni.edu.ni',
    role: Role.STUDENT,
    campusId: 'cam_2',
    carnet: '2023-0001N',
    careerId: 'c1',
    avatarUrl: 'https://picsum.photos/202',
    password: '123456'
  },
  
  // --- RECINTO CENTRAL (cam_1) ---
  {
    id: 'u4',
    name: 'Admin Central',
    email: 'admin.central@uni.edu.ni',
    role: Role.ADMIN,
    campusId: 'cam_1',
    avatarUrl: 'https://picsum.photos/203',
    password: '123456'
  },
  {
    id: 'u5',
    name: 'Prof. Central',
    email: 'prof.central@uni.edu.ni',
    role: Role.PROFESSOR,
    campusId: 'cam_1',
    phone: '2222-2222',
    avatarUrl: 'https://picsum.photos/204',
    password: '123456'
  },
  {
    id: 'u6',
    name: 'Estudiante Central',
    email: 'est.central@uni.edu.ni',
    role: Role.STUDENT,
    campusId: 'cam_1',
    carnet: '2023-999C',
    careerId: 'c3',
    avatarUrl: 'https://picsum.photos/205',
    password: '123456'
  }
];

// Seed Careers
export const mockCareers: Career[] = [
  { id: 'c1', name: 'Ingeniería de Sistemas', campusId: 'cam_2', faculty: 'FTC' },
  { id: 'c2', name: 'Medicina', campusId: 'cam_2', faculty: 'FCM' },
  { id: 'c3', name: 'Derecho', campusId: 'cam_1', faculty: 'FHJ' }
];

// Seed Courses
export const mockCourses: Course[] = [
  // Norte - Sistemas - Sem 1
  { id: 'co1', name: 'Introducción a la Programación', code: 'IS-101', campusId: 'cam_2', credits: 4, semester: 1, careerId: 'c1', professorId: 'u2', schedule: 'Lun 08:00 - 10:00', room: 'A-101' },
  { id: 'co2', name: 'Matemática I', code: 'MAT-101', campusId: 'cam_2', credits: 5, semester: 1, careerId: 'c1', professorId: 'u2', schedule: 'Mar 10:00 - 12:00', room: 'A-102' },
  { id: 'co3', name: 'Redacción Técnica', code: 'GEN-101', campusId: 'cam_2', credits: 3, semester: 1, careerId: 'c1', schedule: 'Mie 13:00 - 15:00', room: 'B-201' },
  
  // Norte - Sistemas - Sem 2
  { id: 'co4', name: 'Programación Orientada a Objetos', code: 'IS-102', campusId: 'cam_2', credits: 4, semester: 2, careerId: 'c1', professorId: 'u2', schedule: 'Jue 08:00 - 10:00', room: 'Lab-1' },

  // Central - Derecho
  { id: 'co5', name: 'Introducción al Derecho', code: 'DER-101', campusId: 'cam_1', credits: 4, semester: 1, careerId: 'c3', professorId: 'u5', schedule: 'Vie 08:00 - 12:00', room: 'C-100' }
];

export const mockEnrollments: Enrollment[] = [
  { id: 'e1', studentId: 'u3', courseId: 'co1', term: '2024-1', status: 'ACTIVE', finalGrade: 85 },
  { id: 'e2', studentId: 'u3', courseId: 'co2', term: '2024-1', status: 'ACTIVE' }, // No grade yet
  { id: 'e3', studentId: 'u6', courseId: 'co5', term: '2024-1', status: 'ACTIVE' }
];

export const mockAttendance = [
  { id: 'a1', courseId: 'co1', studentId: 'u3', date: '2024-03-01', status: 'PRESENT' },
  { id: 'a2', courseId: 'co1', studentId: 'u3', date: '2024-03-08', status: 'LATE' },
  { id: 'a3', courseId: 'co1', studentId: 'u3', date: '2024-03-15', status: 'ABSENT' },
];

export const mockScholarships: Scholarship[] = [
    { id: 'sch_1', name: 'Beca Excelencia Académica', description: 'Para promedios mayores a 90%', requirements: 'Carta de solicitud, Kárdex actualizado', amount: 3000, active: true, campusId: 'cam_1' },
    { id: 'sch_2', name: 'Ayuda Socioeconómica', description: 'Apoyo para transporte y alimentación', requirements: 'Estudio socioeconómico', amount: 1500, active: true, campusId: 'cam_2' }
];

export const mockScholarshipApps: ScholarshipApp[] = [];

export const mockNotifications: Notification[] = [
    { id: 'n1', title: 'Bienvenido al Sistema', message: 'Su cuenta ha sido configurada correctamente.', date: new Date().toISOString(), read: false, type: 'INFO', recipientId: 'u3' }
];