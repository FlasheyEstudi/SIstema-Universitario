export enum Role {
  ADMIN = 'ADMIN',
  PROFESSOR = 'PROFESSOR',
  STUDENT = 'STUDENT'
}

export interface Campus {
  id: string;
  name: string;
  location: string;
  code: string;
  logoUrl?: string; // Base64 string for PDF generation
}

export interface User {
  id: string;
  name: string;
  lastName?: string;
  email: string;
  role: Role;
  campusId: string;
  avatarUrl?: string;
  coverUrl?: string; 
  password?: string; 
  notes?: string; 
  
  // Datos Personales
  cedula?: string;
  address?: string;
  phone?: string;
  
  // Estudiantes
  carnet?: string;
  minedCode?: string;
  careerId?: string;
  
  // Profesores
  profession?: string;
}

export interface Career {
  id: string;
  name: string;
  campusId: string;
  faculty: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  campusId: string;
  credits: number;
  semester: number;
  careerId: string;
  professorId?: string;
  schedule?: string;
  room?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  term: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
  finalGrade?: number;
  // Grade Breakdown
  gradeP1?: number; // Parcial 1 (30%)
  gradeP2?: number; // Parcial 2 (30%)
  gradeExam?: number; // Examen Final (40%)
}

export interface CourseResource {
  id: string;
  courseId: string;
  title: string;
  type: 'LINK' | 'FILE';
  url: string; // Base64 or Link
  date: string;
}

export interface AttendanceRecord {
  id: string;
  courseId: string;
  studentId: string;
  date: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
}

export interface Notification {
  id: string;
  senderId?: string;
  recipientId: string; 
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'TASK';
}

export interface Scholarship {
  id: string;
  name: string;
  description: string;
  requirements: string;
  amount: number;
  active: boolean;
  campusId: string;
}

export interface ScholarshipApp {
  id: string;
  studentId: string;
  scholarshipId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
  studentName?: string;
  scholarshipName?: string;
}

export interface ScholarshipStats {
    totalBudget: number;
    activeScholarships: number;
    eligibleStudentsCount: number; 
}